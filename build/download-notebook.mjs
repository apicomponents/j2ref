import {get} from 'https'
import {createWriteStream} from 'fs'
import pkg from '../package.json'
const observableUrl = pkg.observable

async function downloadNotebook() {
  return new Promise((resolve, reject) => {
    // https://stackoverflow.com/a/17676794/3461
    if (!observableUrl) {
      throw new Error('an `observable` property must be defined in package.json with the API URL of the observablehq.com notebook (without the query string)')
    }

    const observableApiKey = process.env.OBSERVABLE_KEY
    if (! observableApiKey) {
      throw new Error('OBSERVABLE_KEY environment variable is missing')
    }

    const f = createWriteStream('notebook.mjs')
    const url = `${observableUrl}?key=${observableApiKey}`
    const req = get(url, res => {
      res.pipe(f)
      f.on('finish', () => { f.close(resolve) })
    })
    req.on('error', (e) => { throw e })
  })
}
downloadNotebook().then(() => null).catch(err => console.error(err))
