import { setup as setupWebAPIs } from '../../bg/web-apis/fg.js'
import { setup as setupPrompt } from './prompt'
import { setup as setupExecuteJavascript } from './execute-javascript'
import setupExitFullScreenHackfix from './exit-full-screen-hackfix'
// import readableStreamAsyncIteratorPolyfill from './readable-stream-async-iterator-polyfill'
import windowOpenCloseHackfix from './window-open-close-hackfix'
import resizeHackfix from './resize-hackfix'
// import './read-page-metadata' DISABLED wasnt working effectively -prf


// HACKS
setupExitFullScreenHackfix()
// readableStreamAsyncIteratorPolyfill()
windowOpenCloseHackfix()
resizeHackfix()

setupWebAPIs()
setupPrompt()
setupExecuteJavascript()
