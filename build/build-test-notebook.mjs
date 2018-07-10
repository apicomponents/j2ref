import jsdom from 'jsdom'
import fetch from 'node-fetch'
const DOM = new jsdom.JSDOM(``, { pretendToBeVisual: true })
global.window = DOM.window
global.document = DOM.window.document
global.requestAnimationFrame = DOM.window.requestAnimationFrame.bind(DOM.window)
global.fetch = fetch
import notebookRuntime from '@observablehq/notebook-runtime'
import notebook from '../notebook'
import fs from 'fs'

const {Runtime, Library} = notebookRuntime
const library = new Library()
const md = (strs, ...vars) => { let s = ''; for (let i=0; i < strs.length; i++) { s += strs[i] + (vars[i] || '') }; return s }
const notebookModule = notebook.modules[Object.keys(notebook.modules)[0]]
const testVarNames = notebookModule.variables.filter(({name}) => (name && name.startsWith('test'))).map(({name}) => name)
notebookModule.variables.push({name: 'md', value: () => md})
const debug = process.env.DEBUG == '1'
let failedTests = 0
let passedTests = 0
let fulfilledSuites = 0
process.exitCode = 1
Runtime.load(notebook, library, variable => {
  return {
    pending: () => {
      debug && console.log(`loading ${variable.name}`)
    },
    fulfilled: value => {
      debug && console.log(`loaded ${variable.name}:`, value)
      if (testVarNames.includes(variable.name)) {
        let re = /^([^|]*)\|.*\|(true|false)$/mg
        let m
        while (m = re.exec(value)) {
          const [name, result] = [m[1], m[2] == 'true']
          if (result) {
            passedTests++;
          } else {
            failedTests++;
          }
          console.log(`${variable.name} - ${name} - ${result ? 'PASS' : 'FAIL'}`)
        }
        fulfilledSuites++
        if (fulfilledSuites == testVarNames.length) {
          if (failedTests == 0) {
            process.exitCode = 0
          }
          console.log(`${passedTests} passed, ${failedTests} failed`)
        }
      } else if (variable.name == 'j2ref') {
        fs.writeFileSync('index.js', `module.exports = ${value.toString().trim()}\n`)
      }
    },
    rejected: err => {
      console.error(`error loading ${variable.name}:`, err)
      console.error(err.trace)
    }
  };
});
