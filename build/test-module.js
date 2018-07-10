const j2ref = require('../')
const assert = require('assert')
assert.deepEqual(j2ref('foo.bar').keys, ['foo', 'bar'])
console.log('tests passed')
