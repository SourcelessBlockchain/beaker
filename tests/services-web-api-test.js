import test from 'ava'
import os from 'os'
import path from 'path'
import fs from 'fs'
import Homebase from '@beaker/homebase'
import electron from '../node_modules/electron'

import * as browserdriver from './lib/browser-driver'
import { shareDat } from './lib/dat-helpers'

const REL_ACCOUNT_API = 'https://archive.org/services/purl/purl/datprotocol/spec/pinning-service-account-api'
const REL_DATS_API = 'https://archive.org/services/purl/purl/datprotocol/spec/pinning-service-dats-api'

const LOCALHOST_PSA = {
  PSA: 1,
  description: 'Keep your Dats online!',
  title: 'My Pinning Service',
  links: [
   { href: '/v1/accounts',
     rel: 'https://archive.org/services/purl/purl/datprotocol/spec/pinning-service-account-api',
     title: 'User accounts API' },
   { href: '/v1/dats',
     rel: 'https://archive.org/services/purl/purl/datprotocol/spec/pinning-service-dats-api',
     title: 'Dat pinning API' }
  ]
}

var server
const serverUrl = 'http://localhost:8888'

const app = browserdriver.start({
  path: electron,
  args: ['../app'],
  env: {
    NODE_ENV: 'test',
    beaker_no_welcome_tab: 1,
    beaker_user_data_path: fs.mkdtempSync(os.tmpdir() + path.sep + 'beaker-test-')
  }
})
test.before(async t => {
  // setup the server
  var config = new Homebase.HomebaseConfig()
  config.canonical = {
    domain: 'test.com',
    webapi: {
      username: 'admin',
      password: 'hunter2'
    },
    ports: {
      http: 8888,
      https: 8889
    }
  }
  server = Homebase.start(config)

  await app.isReady
})
test.after.always('cleanup', async t => {
  await app.stop()
  await new Promise(r => server.close(r))
})

test('manage services', async t => {
  // add some services
  var res = await app.executeJavascript(`
    beaker.services.addService('foo.com', {
      title: 'Foo Service',
      description: 'It is foo',
      links: [{
        rel: 'http://api-spec.com/address-book',
        title: 'Foo User Listing API',
        href: '/v1/users'
      }, {
        rel: 'http://api-spec.com/clock',
        title: 'Get-current-time API',
        href: '/v1/get-time'
      }]
    })
  `)
  t.falsy(res)
  var res = await app.executeJavascript(`
    beaker.services.addService('https://bar.com', {
      title: 'Bar Service',
      description: 'It is bar'
    })
  `)
  t.falsy(res)
  var res = await app.executeJavascript(`
    beaker.services.addService('baz.com', {
      links: [{
        rel: 'a b c',
        title: 'Got links',
        href: '/href'
      }]
    })
  `)
  t.falsy(res)

  // list services
  var res = await app.executeJavascript(`
    beaker.services.listServices()
  `)
  massageServiceObj(res['foo.com'])
  massageServiceObj(res['bar.com'])
  massageServiceObj(res['baz.com'])
  t.deepEqual(res, {
    'bar.com': {
      accounts: [],
      createdAt: 'number',
      description: 'It is bar',
      hostname: 'bar.com',
      links: [],
      title: 'Bar Service'
    },
    'baz.com': {
      accounts: [],
      createdAt: 'number',
      description: '',
      hostname: 'baz.com',
      links: [
        {href: '/href', rel: 'a', title: 'Got links'},
        {href: '/href', rel: 'b', title: 'Got links'},
        {href: '/href', rel: 'c', title: 'Got links'}
      ],
      title: ''
    },
    'foo.com': {
      accounts: [],
      createdAt: 'number',
      description: 'It is foo',
      hostname: 'foo.com',
      links: [
        {
          href: '/v1/users',
          rel: 'http://api-spec.com/address-book',
          title: 'Foo User Listing API'
        },
        {
          href: '/v1/get-time',
          rel: 'http://api-spec.com/clock',
          title: 'Get-current-time API'
        }
      ],
      title: 'Foo Service'
    }
  })

  // get service
  var res = await app.executeJavascript(`
    beaker.services.getService('https://baz.com')
  `)
  massageServiceObj(res)
  t.deepEqual(res, {
    accounts: [],
    createdAt: 'number',
    description: '',
    hostname: 'baz.com',
    links: [
      {href: '/href', rel: 'a', title: 'Got links'},
      {href: '/href', rel: 'b', title: 'Got links'},
      {href: '/href', rel: 'c', title: 'Got links'}
    ],
    title: ''
  })

  // overwrite service
  var res = await app.executeJavascript(`
    beaker.services.addService('baz.com', {
      links: [{
        rel: 'c d e',
        title: 'Got links 2',
        href: '/href2'
      }]
    })
  `)
  t.falsy(res)
  var res = await app.executeJavascript(`
    beaker.services.getService('baz.com')
  `)
  massageServiceObj(res)
  t.deepEqual(res, {
    accounts: [],
    createdAt: 'number',
    description: '',
    hostname: 'baz.com',
    links: [
      {href: '/href2', rel: 'c', title: 'Got links 2'},
      {href: '/href2', rel: 'd', title: 'Got links 2'},
      {href: '/href2', rel: 'e', title: 'Got links 2'}
    ],
    title: ''
  })

  // remove service
  var res = await app.executeJavascript(`
    beaker.services.removeService('bar.com')
  `)
  t.falsy(res)
  var res = await app.executeJavascript(`
    beaker.services.getService('bar.com')
  `)
  t.falsy(res)
})

test('manage accounts', async t => {
  // add some accounts
  var res = await app.executeJavascript(`
    beaker.services.addAccount('foo.com', {username: 'alice', password: 'hunter2'})
  `)
  t.falsy(res)
  var res = await app.executeJavascript(`
    beaker.services.addAccount('foo.com', {username: 'bob', password: 'hunter2'})
  `)
  t.falsy(res)
  var res = await app.executeJavascript(`
    beaker.services.addAccount('baz.com', {username: 'alice', password: 'hunter2'})
  `)
  t.falsy(res)

  // list accounts
  var res = await app.executeJavascript(`
    beaker.services.listAccounts()
  `)
  t.deepEqual(res, [
    {hostname: 'foo.com', username: 'alice'},
    {hostname: 'foo.com', username: 'bob'},
    {hostname: 'baz.com', username: 'alice'}
  ])

  // list accounts (rel filter)
  var res = await app.executeJavascript(`
    beaker.services.listAccounts({api: 'http://api-spec.com/clock'})
  `)
  t.deepEqual(res, [
    {hostname: 'foo.com', username: 'alice'},
    {hostname: 'foo.com', username: 'bob'}
  ])

  // get account
  var res = await app.executeJavascript(`
    beaker.services.getAccount('foo.com', 'alice')
  `)
  t.deepEqual(res, {
    hostname: 'foo.com',
    username: 'alice',
    password: 'hunter2'
  })

  // get service (will now include accounts)
  var res = await app.executeJavascript(`
    beaker.services.getService('https://baz.com')
  `)
  massageServiceObj(res)
  t.deepEqual(res, {
    accounts: [
      {username: 'alice'}
    ],
    createdAt: 'number',
    description: '',
    hostname: 'baz.com',
    links: [
      {href: '/href2', rel: 'c', title: 'Got links 2'},
      {href: '/href2', rel: 'd', title: 'Got links 2'},
      {href: '/href2', rel: 'e', title: 'Got links 2'}
    ],
    title: ''
  })

  // overwrite account
  var res = await app.executeJavascript(`
    beaker.services.addAccount('foo.com', {username: 'alice', password: 'hunter3'})
  `)
  t.falsy(res)
  var res = await app.executeJavascript(`
    beaker.services.getAccount('foo.com', 'alice')
  `)
  t.deepEqual(res, {
    hostname: 'foo.com',
    username: 'alice',
    password: 'hunter3'
  })

  // remove account
  var res = await app.executeJavascript(`
    beaker.services.removeAccount('foo.com', 'alice')
  `)
  t.falsy(res)
  var res = await app.executeJavascript(`
    beaker.services.getAccount('foo.com', 'alice')
  `)
  t.falsy(res)
})

test('fetchPSADoc', async t => {
  // test valid host
  var res = await app.executeJavascript(`
    beaker.services.fetchPSADoc('localhost:8888')
  `)
  t.deepEqual(res, LOCALHOST_PSA)

  // include protocol
  var res = await app.executeJavascript(`
    beaker.services.fetchPSADoc('http://localhost:8888')
  `)
  t.deepEqual(res, LOCALHOST_PSA)

  // test invalid host
  await t.throws(app.executeJavascript(`
    beaker.services.fetchPSADoc('localhost')
  `))
})

test('login / logout / makeAPIRequest', async t => {
  // test without session
  await t.throws(app.executeJavascript(`
    beaker.services.makeAPIRequest({
      hostname: 'localhost:8888',
      api: '${REL_ACCOUNT_API}',
      path: '/account'
    })
  `))
  await t.throws(app.executeJavascript(`
    beaker.services.makeAPIRequest({
      hostname: 'localhost:8888',
      username: 'admin',
      api: '${REL_ACCOUNT_API}',
      path: '/account'
    })
  `))

  // fail login
  await t.throws(app.executeJavascript(`
    beaker.services.login('localhost:8888', 'admin', 'wrongpassword')
  `))

  // login
  var res = await app.executeJavascript(`
    beaker.services.login('localhost:8888', 'admin', 'hunter2')
  `)
  t.is(res.statusCode, 200)
  t.is(typeof res.body.sessionToken, 'string')

  // get account data
  var res = await app.executeJavascript(`
    beaker.services.makeAPIRequest({
      hostname: 'localhost:8888',
      username: 'admin',
      api: '${REL_ACCOUNT_API}',
      path: '/account'
    })
  `)
  t.is(res.body.username, 'admin')

  // logout
  var res = await app.executeJavascript(`
    beaker.services.logout('localhost:8888', 'admin')
  `)
  t.is(res.statusCode, 200)

  // test without session
  await t.throws(app.executeJavascript(`
    beaker.services.makeAPIRequest({
      hostname: 'localhost:8888',
      username: 'admin',
      api: '${REL_ACCOUNT_API}',
      path: '/account'
    })
  `))
})

test('login with stored credentials', async t => {
  // add service
  var res = await app.executeJavascript(`
    beaker.services.addService('localhost:8888', ${JSON.stringify(LOCALHOST_PSA)})
  `)
  t.falsy(res)

  // add account
  var res = await app.executeJavascript(`
    beaker.services.addAccount('localhost:8888', {username: 'admin', password: 'hunter2'})
  `)
  t.falsy(res)

  // get account data (no prior login)
  var res = await app.executeJavascript(`
    beaker.services.makeAPIRequest({
      hostname: 'localhost:8888',
      username: 'admin',
      api: '${REL_ACCOUNT_API}',
      path: '/account'
    })
  `)
  t.is(res.body.username, 'admin')
})

function massageServiceObj (service) {
  if (!service) return
  service.createdAt = typeof service.createdAt
  service.links.sort((a, b) => a.rel.localeCompare(b.rel))
}
