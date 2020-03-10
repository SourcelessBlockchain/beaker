import { getAvailableName } from 'beaker://app-stdlib/js/fs.js'

// exported
// =

// const EXPLORER_APP = 'https://hyperdrive.network/'
// export const FIXED_FILES = [
//   makeFixedLink('.home-drive.goto', `${EXPLORER_APP}${hyperdrive.getSystemDrive().url.slice('hyper://'.length)}`, 'Home Drive'),
//   makeFixedLink('.library.goto', 'beaker://library/', 'My Library'),
// ]

export async function load () {
  var userFiles = []
  try {
    userFiles = await hyperdrive.getSystemDrive().readdir('/bookmarks', {includeStats: true})
    userFiles = userFiles.filter(file => file.stat.metadata.pinned)
    userFiles.sort((a, b) => a.name.localeCompare(b.name))
    userFiles.forEach(b => { b.path = `/bookmarks/${b.name}` })
  } catch (e) {
    console.log('Failed to load bookmarks files', e)
  }
  return userFiles
}

export async function createLink ({href, title}) {
  await beaker.bookmarks.add({href, title, pinned: true})
  // var name = await getAvailableName('/bookmarks', title, hyperdrive.getSystemDrive(), 'goto')
  // await hyperdrive.getSystemDrive().writeFile(`/bookmarks/${name}`, '', {metadata: {href, title}})
}

export async function remove (file) {
  await hyperdrive.getSystemDrive().unlink(`/bookmarks/${file.name}`)
}

// internal
// =

function makeFixedLink (name, href, title) {
  return {
    name,
    stat: {
      isDirectory: () => false,
      isFile: () => true,
      mount: undefined,
      metadata: {href, title}
    },
    isFixed: true
  }
}