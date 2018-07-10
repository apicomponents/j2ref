// URL: https://beta.observablehq.com/@benatkin/building-an-npm-module-with-observable
// Title: Building an NPM module with Observable
// Author: Benjamin Atkin (@benatkin)
// Version: 430
// Runtime version: 1

const m0 = {
  id: "0db8579722ad9e16@430",
  variables: [
    {
      inputs: ["md"],
      value: (function(md){return(
md`# Building an NPM module with Observable

I'm writing an npm module that reads a subset of JavaScript expressions to refer to a nested variable. It's similar to [jsonpointer](https://tools.ietf.org/html/rfc6901). Here are some examples:

j2ref|jsonpointer|keys
-|-|-
\`location.city\`|\`/location/city\`|\`["location", "city"]\`
\`pets[3].name\`|\`/pets/3/name\`|\`["pets", 3, "name"]\`
\`$['Outer Space'].url\`|\`/$/Outer Space/url\`|\`["$", "Outer Space", "url"]\`

Note that the first value must be a valid identifier. I chose not to allow the expression to start with brackets so it's limited to valid JavaScript expressions. It is up to the caller of the library to normalize explicit references to the root (\`$\`.

## How this is going to work

Observable notebooks can be downloaded using the *Download code* link in the dot menu next to the Publish button, and can be run using the open source [observable-runtime](https://github.com/observablehq/notebook-runtime) library. This can be used in a build script to grab the code for the library, and in a CI build when pushing the code to GitHub. I plan to use comments to specify which code will be placed in the library. It will also generate a tiny test that will be run separately to make sure the code exporting worked.

The CI will check for errors from Observable blocks and failures or caught errors in the test output.

I'm implementing this as I go, but I'm basing it on [a PHP implementation I already wrote](https://github.com/apicomponents/jules-php/blob/master/jules.php#L13).

## Matching a quoted string

Matching a quoted string, with escaped quotes inside, takes a bit of regex trickery. It first needs to capture the opening quote. Second, it needs to capture this zero or more times: *a backslash plus the escaped character, or a non-escaped character that is neither a backslash nor a quote*. Third and finally, it needs to capture the closing quote. A separate pattern is needed for single quotes and double quotes.

The expression to capture a backslash plus an escaped character is \`[\\\\].\` or \`\\\\.\`:`
)})
    },
    {
      inputs: ["md"],
      value: (function(md)
{
  const q = s => '`' + JSON.stringify(s) + '`'
  const bq = s => { const j = JSON.stringify(s); return '`'+j.substr(1, j.length - 2).replace(/\\"/, '"')+'`' }
  const match = (re, s) => { const m = re.exec(s); return m && m[0] }
  let re1 = /[\\]./
  let re2 = /\\./
  const headers = ['input', bq('/[\\]./'), bq('/\\./')];
  let mkd = headers.join('|') + "\n" + headers.map(s => '-').join('|') + "\n";
  ['abc\\\'123', "abc\\\"123", "abc"].forEach(s => {
    mkd += [q(s), q(match(re1, s)), q(match(re2, s))].join('|') + "\n"
  })
  return md`${mkd}`
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`The expression to capture a character that's not a backslash or a quote is \`[^\\\\']\` for single quotes and \`[^\\\\"]\` for double quotes (*q*, *bq*, and *match* have been defined at the bottom of the file):`
)})
    },
    {
      inputs: ["bq","q","match","md"],
      value: (function(bq,q,match,md)
{
  const tbl = (...header) => { return header.join('|') + "\n" + header.map(s => '-').join('|') + "\n" }
  const mkd = tbl('input', bq("/[^\\']/"), bq('/[^\\"]/')) +
        ["a", "\\", "'", '"'].map(s => [q(s), q(match(/[^\\']/, s)), q(match(/[^\\"]/, s))].join('|')).join("\n")
  return md`${mkd}`
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`Between the quotes, we need 0 or more of either of the backslash plus the escaped character, or the non-escaped characters other than a backslash or a quote. To specify either of these two, we use a non-capturing group (\`(?:)\`) with alternation (\`|\`). To this we add a \`*\`. Piecing this together, we get \`/(?:\\\\.|[^\\\\'])*/\` and \`/(?:\\\\.|[^\\\\"])*/\`. Adding the begin and end quotes and a capturing group, we get \`/'((?:\\\\.|[^\\\\'])*)'/\` and \`/"((?:\\\\.|[^\\\\"])*)"/\`.

These will be alternated: \`/'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"/\`. These two capture groups, alas, are numbered 1 and 2, because JavaScript doesn't support the branch reset group. When they aren't matched they'll be undefined, so finding the proper match is as simple as \`match[1] || match[2]\`.

Now for some examples, this time providing a pass/fail for the CI to pick up on:`
)})
    },
    {
      name: "quotedStrRe",
      value: (function(){return(
/'((?:\\.|[^\\'])*)'|"((?:\\.|[^\\"])*)"/
)})
    },
    {
      name: "testQSR",
      inputs: ["tbl","quotedStrRe","q","md"],
      value: (function(tbl,quotedStrRe,q,md)
{
  const [header, ...examples] = [
    ['description', 'input', 'expected'],
    ['unquoted', 'test', undefined],
    ['single', "'test'", 'test'],
    ['double', '"test"', 'test'],
    ['single escaped', "'a \\'b\\' c'", "a \\'b\\' c"],
    ['double escaped', '"a \\"b\\" c"', 'a \\"b\\" c'],
    ['single esc + extra', "--'a \\'b\\' c'--", "a \\'b\\' c"],
    ['double esc + extra', '--"a \\"b\\" c"--', 'a \\"b\\" c']
  ]
  let mkd = tbl(header[0], header[1], 'match[0][0]', 'match[1] or match[2]', 'pass')
  mkd += examples.map(([description, input, expected]) => {
    const match = quotedStrRe.exec(input)
    const result = match && (match[1] || match[2])
    const cols = [
      description,
      q(input),
      q(match && match[0][0]),
      q(result),
      result == expected
    ]
    return cols.join('|')
  }).join("\n")
  return md`${mkd}`
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`Some quote regexes out there use \`"[\\\S\\\s]"\` instead of \`"."\`. For these references I've chosen to disallow multiline strings, so \`"."\` can be used. For matching any JavaScript string literal, capturing newlines would be needed. JavaScript supports multiline strings with single and double quotes, but the backquotes introduced after es6 are preferred, because multiline strings with single and double quotes require a backslash at the end of the line (which is why they were rarely used).`
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`## Capturing data inside a quoted string with JSON.parse

The data captured between the quotes is a JSON string, without the quotes, except for a single-quoted string that contains unescaped double quotes, such as \`'"hello"'\`. The unescaped double quotes must be escaped before surrounding it with double quotes and calling \`JSON.parse()\` on it. To tell if it's single quoted, the first character of the overall match should be used (\`match[0][0]\` from the table above).

First, the regex to add escapes to unescaped single strings:`
)})
    },
    {
      inputs: ["tbl","q","md"],
      value: (function(tbl,q,md)
{
  let mkd = tbl('description', 'input', 'json string', 'parsed')
  const s1 = '"hello"'
  const s2 = '\\"hello\\"'
  const jsonString = s => s.replace(/\\?"/g, '\\"')
  const parsed = s => JSON.parse(`"${jsonString(s)}"`)
  mkd += `unescaped|${q(s1)}|${q(jsonString(s1))}|${q(parsed(s1))}\n`
  mkd += `escaped|${q(s2)}|${q(jsonString(s2))}|${q(parsed(s2))}\n`
  return md`${mkd}`
}
)
    },
    {
      name: "escDblQuotes",
      value: (function(){return(
s => s.replace(/\\?"/g, '\\"')
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`After fiddling with this, and thinking it through, I found that replacing an escaped double quote or an unescaped double quote with an escaped double quote does the trick. It relies on the default greediness of regular expressions to grab the escape plus the quote rather than jumping past the escape character and grabbing only the quote.

To make a function that matches a quoted string inside a string, and returns the data, I take and process the match data before passing it onto \`JSON.parse\`. While writing this I realize I can include the quotes in the capture, and only fix up the single quoted strings, and leave the double quoted strings as they are.

I also noticed while working through this that in the single quoted strings, escaped single quotes should be replaced with just the single quotes - that is, replace with \`\\'\` with \`'\`. This is straightforward: \`s.replace(/\\\\'/, "'")\``
)})
    },
    {
      name: "getString",
      value: (function(){return(
s => {
  const match = /'(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"/.exec(s)
  let m = match && match[0]
  if (m && m[0] === "'") {
    m = `"${m.substr(1, m.length - 2).replace(/\\?"/g, '\\"').replace(/\\'/g, "'")}"`
  }
  return m
}
)})
    },
    {
      name: "testGS",
      inputs: ["tbl","getString","q","md"],
      value: (function(tbl,getString,q,md)
{
  const [header, ...examples] = [
    ['description', 'input', 'expected'],
    ['unquoted', 'test', undefined],
    ['single', "'test'", 'test'],
    ['double', '"test"', 'test'],
    ['single escaped', "'a \\'b\\' c'", "a 'b' c"],
    ['double escaped', '"a \\"b\\" c"', 'a "b" c'],
    ['`"` in `\'`', "'a \"b\" c'", 'a "b" c'],
    ['`\'` in `"`', '"a \'b\' c"', "a 'b' c"],
    ['`"` in `\'` + extra', "--'a \"b\" c'--", 'a "b" c'],
    ['`\'` in `"` + extra', '--"a \'b\' c"--', "a 'b' c"]
  ]
  let mkd = tbl(header[0], header[1], 'json', 'parsed', 'pass')
  mkd += examples.map(([description, input, expected]) => {
    const result = getString(input)
    let parsed
    try {
      parsed = JSON.parse(result)
    } catch (e) {
      // leave undefined
    }
    const cols = [
      description,
      q(input),
      q(result),
      parsed ? q(parsed) : '*error*',
      parsed == expected
    ]
    return cols.join('|')
  }).join("\n")
  return md`${mkd}`
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`## Capturing a sequence of keys

There are four types of keys: an initial identifier, a dot reference, a number bracket reference, and a string bracket reference.

Because this library provides the option to fall back to using quotes for keys, it can use a simplified definition of identifiers (testing that the index of the match equals \`0\`):`
)})
    },
    {
      name: "identRe",
      value: (function(){return(
/[$_A-Za-z][$_A-Za-z0-9]*/
)})
    },
    {
      inputs: ["tbl","identRe","q","md"],
      value: (function(tbl,identRe,q,md)
{
  const [header, ...examples] = [
    ['input', 'expected'],
    ['$test', '$test'],
    ['"foo"', undefined],
    ['1test', undefined],
    ['test1', 'test1'],
    ['foo[', 'foo']
  ]
  let mkd = tbl(header[0], 'output', 'pass')
  mkd += examples.map(([input, expected]) => {
    const match = identRe.exec(input)
    const result = match.index == 0 ? match[0] : undefined
    return [q(input), q(result), result == expected].join('|')
  }).join("\n")
  return md`${mkd}`
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`A dot reference is a dot followed by an identifier. The brackets need to be escaped, and to allow for whitespace surrounding the string or number inside them. The number is a positive integer, matched with \`\\d+\`. These are alternated with a pipe character, and the full value is captured. Whitespace is another option:`
)})
    },
    {
      value: (function()
{
  const a = { foo: { bar: 'baz' }}
  const b = { foo: ['baz'] }
  return [a .foo .bar, a ['foo'] ['bar'], b ['foo'] [0]]
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`These captures will be done in a loop of calls to exec on the regex. It will need to check that nothing goes between captures (whitespace is already accounted for). Here's the regex to capture a single one of the keys following the initial identifier, and some examples:`
)})
    },
    {
      name: "singleKeyRe",
      value: (function(){return(
/\[\s*('(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"|\d+)\s*\]|\.([$_A-Za-z][$_A-Za-z0-9]*)|\s+/
)})
    },
    {
      name: "readSingleKey",
      inputs: ["singleKeyRe"],
      value: (function(singleKeyRe){return(
s => {
  const match = singleKeyRe.exec(s)
  if (match && match.index == 0) {
    let m = match[1] || match[2]
    if (match[0][0] === '[') {
      if (m[0] === "'") {
        m = `"${m.substr(1, m.length - 2).replace(/\\?"/g, '\\"').replace(/\\'/g, "'")}"`
      }
      try {
        m = JSON.parse(m)
      } catch (e) {
        m = undefined
      }
    }
    return m
  }
}
)})
    },
    {
      name: "testRSK",
      inputs: ["tbl","readSingleKey","q","md"],
      value: (function(tbl,readSingleKey,q,md)
{
  const [header, ...examples] = [
    ['description', 'input', 'expected'],
    ['str unquoted', '[test]', undefined],
    ['str single', "['test']", 'test'],
    ['str double', '["test"]', 'test'],
    ['str single escaped', "['a [\\'b\\'] c']", "a ['b'] c"],
    ['str double escaped', '["a [\\"b\\"] c"]', 'a ["b"] c'],
    ['str `"` in `\'`', "['a \"b\" c']", 'a "b" c'],
    ['str `\'` in `"`', '["a \'b\' c"]', "a 'b' c"],
    ['num', '[3]', 3],
    ['num', '[  3 ]', 3],
    ['identifier', '.foo', 'foo'],
    ['ident w/ num', '.bar1', 'bar1'],
    ['bad ident start w/ num', '  .1bar', undefined]
  ]
  let mkd = tbl(header[0], header[1], 'key', 'pass')
  mkd += examples.map(([description, input, expected]) => {
    const key = readSingleKey(input)
    const cols = [
      description,
      q(input),
      q(key),
      key == expected
    ]
    return cols.join('|')
  }).join("\n")
  return md`${mkd}`
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`In JavaScript a regular expression with the \`g\` flag can be executed in a loop, to return multiple matches. It keeps track of where it is using the \`lastIndex\` property. To check if the matches are consecutive, in each loop the index can be compared to the index in the last match plus the length of the last match:`
)})
    },
    {
      name: "readKeys",
      value: (function(){return(
s => {
  const re = /\[\s*('(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"|\d+)\s*\]|\.([$_A-Za-z][$_A-Za-z0-9]*)|\s+/g
  let nextIndex = 0
  let keys = []
  let match
  while (match = re.exec(s)) {
    if (match.index !== nextIndex) {
      break
    }
    
    let m = match[1] || match[2]
    if (match[0][0] === '[') {
      if (m[0] === "'") {
        m = `"${m.substr(1, m.length - 2).replace(/\\?"/g, '\\"').replace(/\\'/g, "'")}"`
      }
      try {
        m = JSON.parse(m)
      } catch (e) {
        m = undefined
      }
    }
    if (m && match[0][0] === '.' || match[0][0] === '[') {
      keys.push(m)
    }
    
    nextIndex = match.index + match[0].length
  }
  return keys
}
)})
    },
    {
      name: "testReadKeys",
      inputs: ["tbl","readKeys","q","md"],
      value: (function(tbl,readKeys,q,md)
{
  const [header, ...examples] = [
    ['description', 'input', 'expected'],
    ['str unquoted', '[test]', []],
    ['str single', ".foo['test']", ['foo', 'test']],
    ['str double', '["test"].foo', ['test', 'foo']],
    ['str single escaped', ".x['a [\\'b\\'] c']", ['x', "a ['b'] c"]],
    ['str double escaped', '["a [\\"b\\"] c"].x', ['a ["b"] c', 'x']],
    ['str `"` in `\'`', "['a \"b\" c']", ['a "b" c']],
    ['str `\'` in `"`', '["a \'b\' c"]', ["a 'b' c"]],
    ['num', '[3][1]', [3, 1]],
    ['num', '.w.x[3].y', ['w', 'x', 3, 'y']],
    ['identifier', '.foo', ['foo']],
    ['ident w/ num', '.bar1', ['bar1']],
    ['bad ident start w/ num', '  .1bar', []]
  ]
  let mkd = tbl(header[0], header[1], 'keys', 'pass')
  const isEqual = (a1, a2) => {
    if (a1.length !== a2.length) {
      return false
    }
    for (let i=0; i < a1.length; i++) {
      if (a1[i] !== a2[i]) {
        return false
      }
    }
    return true
  }
  mkd += examples.map(([description, input, expected]) => {
    const keys = readKeys(input)
    const cols = [
      description,
      q(input),
      q(keys),
      isEqual(keys, expected)
    ]
    return cols.join('|')
  }).join("\n")
  return md`${mkd}`
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`## A full implementation

This should be enough to get to work on a full implementation.

To build a scanner component that can be used in different situations, some options and additional returned data is needed. One is to specify a starting point (default \`0\`). The \`lastIndex\` property is readable and writable, so rather than use a substring, the \`lastIndex\` will be set to the starting index. Another is to specify that it must start at the starting index (default \`true\`). For o return the index at which the match was found. The return value will have the starting index and the matched text, so a parser using this can skip over the value.

The input will have three positional parameters, \`str\`, \`startIndex\`, and \`matchStart\`. The return value will be a JavaScript object with _keys_, _index_, and _matched_.

The implementation will take the \`readKeys\` method and expand it to set \`lastIndex\` and read an identifier before it matches following keys, track the index of the start and end of the matched string, and return the index and use \`substr\` to return the matched string. Finally, it needs a name. I've chosen *j2ref*, short for JavaScript/JSON reference, since it differs from [jsonpointer](https://tools.ietf.org/html/rfc6901) in that it uses JavaScript syntax rather than URL syntax.`
)})
    },
    {
      name: "j2ref",
      value: (function(){return(
function j2ref(str, startIndex = 0, matchStart = true) {
  const identRe = /\s*([$_A-Za-z][$_A-Za-z0-9]*)/g
  if (startIndex !== 0) {
    identRe.lastIndex = startIndex
  }
  let identMatch = identRe.exec(str)
  if (! (identMatch && identMatch[0])) {
    return
  }
  if (matchStart && identMatch.index !== startIndex) {
    return
  }
  
  const re = /\[\s*('(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"|\d+)\s*\]|\.([$_A-Za-z][$_A-Za-z0-9]*)|\s+/g
  let nextIndex = identMatch.index + identMatch[0].length
  re.lastIndex = nextIndex
  let keys = [identMatch[1]]
  let match
  while (match = re.exec(str)) {
    if (match.index !== nextIndex) {
      break
    }
    
    let m = match[1] || match[2]
    if (match[0][0] === '[') {
      if (m[0] === "'") {
        m = `"${m.substr(1, m.length - 2).replace(/\\?"/g, '\\"').replace(/\\'/g, "'")}"`
      }
      try {
        m = JSON.parse(m)
      } catch (e) {
        m = undefined
      }
    }
    if (m && match[0][0] === '.' || match[0][0] === '[') {
      keys.push(m)
    }
    
    nextIndex = match.index + match[0].length
  }
  return {
    keys,
    index: identMatch.index,
    matched: str.substr(identMatch.index, nextIndex - identMatch.index)
  }
}
)})
    },
    {
      name: "testFull",
      inputs: ["tbl","q","j2ref","md"],
      value: (function(tbl,q,j2ref,md)
{
  const [header, ...examples] = [
    ['description', 'input<br>startIndex, matchStart', 'expected'],
    ['str unquoted', '[test]', undefined],
    ['str unquoted', 'foo[test]', ['foo']],
    ['str single', "foo['test']", ['foo', 'test']],
    ['str double', '$["test"].foo xtra', ['$', 'test', 'foo']],
    ['str single escaped', "$.x['a [\\'b\\'] c']", ['$', 'x', "a ['b'] c"]],
    ['str double escaped', 'q1["a [\\"b\\"] c"].x', ['q1', 'a ["b"] c', 'x']],
    ['str `"` in `\'`', "$['a \"b\" c']", ['$', 'a "b" c']],
    ['str `\'` in `"`', '$["a \'b\' c"]', ['$', "a 'b' c"]],
    ['num', '$[3][1] xtra', ['$', 3, 1]],
    ['num', '$.w.x[3].y xtra', ['$', 'w', 'x', 3, 'y']],
    ['identifier', 'foo', ['foo']],
    ['ident w/ num', 'bar1', ['bar1']],
    ['bad ident start w/ num', '  1bar', undefined]
  ]
  let mkd = tbl(header[0], header[1], 'keys<br>index, matched', 'pass')
  const isEqual = (a1, a2) => {
    if (!(Array.isArray(a1) && Array.isArray(a2))) {
      return a1 === a2
    }
    if (!(a1.length == a2.length)) {
      return false
    }
    for (let i=0; i < a1.length; i++) {
      if (a1[i] !== a2[i]) {
        return false
      }
    }
    return true
  }
  mkd += examples.map(([description, input, expected]) => {
    const cols = [
      description,
      `${q(input)}<br>${q(0)}, ${q(true)}`,
      q(undefined),
      q(undefined)
    ]
    try {
      const result = j2ref(input)
      if (result) {
        const {keys, index, matched} = result
        cols[2] = `${q(keys)}<br>${q(index)}, ${q(matched)}`
      }
      cols[3] = isEqual(result && result.keys, expected)
    } catch (err) {
      cols[2] = `*err:* ${q(err.toString())}<br>${q(err.stack.toString().substr(0, 100))}`
      cols[3] = false
    }
    return cols.join('|')
  }).join("\n")
  return md`${mkd}`
}
)
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`# Releasing 1.0.0: NPM and Travis CI

All of the above has been done within Observable. There could be more tests, and more bugs which I know are there, squashed, but I want to publish it and work on an adjacent project for a bit before coming back and tightening it up. Also, I want this initial post to be self-contained, but going forward I'd like to extract some tooling to make it easier to develop CI-tested NPM modules with Observable.

To avoid the [*0.x escape clause*](https://twitter.com/izs/status/494980349944819713) I'll publish it as *1.0.0*.

First I create a GitHub repo and clone it locally. Git warns about cloning an empty repository, but it creates the directory and sets up the remote, which is excellent. After that I run \`npm init -y\` and change the license to MIT. NPM adds the git repo to it. Then I run \`npm install @observablehq/notebook-runtime jsdom node-fetch --save-dev\` so I can read the notebook. Finally I click *Download code* from the dot menu next to the publish button, grab the URL, stick the notebook ID in an \`observable\` custom property in \`package.json\`, put the API key from the key query param in an \`OBSERVABLE_KEY\` environment variable, and make a little script for downloading it:`
)})
    },
    {
      inputs: ["jsSrc"],
      value: (function(jsSrc){return(
jsSrc(`// build/download-notebook.mjs
import {get} from 'https'
import {createWriteStream} from 'fs'
import pkg from '../package.json'
const observableId = pkg.observable

async function downloadNotebook() {
  return new Promise((resolve, reject) => {
    // https://stackoverflow.com/a/17676794/3461
    if (!observableId) {
      throw new Error('an \`observable\` property must be defined in package.json with the ID of the observablehq.com notebook')
    }

    const observableApiKey = process.env.OBSERVABLE_KEY
    if (! observableApiKey) {
      throw new Error('OBSERVABLE_KEY environment variable is missing')
    }

    const f = createWriteStream('notebook.mjs')
    const url = \`https://api.observablehq.com/d/\${observableId}.js?key=\${observableApiKey}\`
    const req = get(url, res => {
      res.pipe(f)
      f.on('finish', () => { f.close(resolve) })
    })
    req.on('error', (e) => { throw e })
  })
}
downloadNotebook().then(() => null).catch(err => console.error(err))`)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`This is run with:

\`\`\`
node --experimental-modules build/download-notebook.mjs
\`\`\`

It downloads the latest since sharing/resharing the notebook.

With the notebook downloaded, I move onto reading the notebook, running it, and checking the test output. observable-runtime is designed to run in a browser, but I got it to work with [jsdom](https://github.com/jsdom/jsdom). Here's the code:`
)})
    },
    {
      inputs: ["jsSrc"],
      value: (function(jsSrc){return(
jsSrc(`// build/build-test-notebook.mjs
import jsdom from 'jsdom'
import fetch from 'node-fetch'
const DOM = new jsdom.JSDOM(\`\`, { pretendToBeVisual: true })
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
      debug && console.log(\`loading \${variable.name}\`)
    },
    fulfilled: value => {
      debug && console.log(\`loaded \${variable.name}:\`, value)
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
          console.log(\`\${name} - \${result ? 'PASS' : 'FAIL'}\`)
          }
          console.log(\`\${name} - \${result ? 'PASS' : 'FAIL'}\`)
        }
        fulfilledSuites++
        if (fulfilledSuites == testVarNames.length) {
          if (failedTests == 0) {
            process.exitCode = 0
          }
          console.log(\`\${passedTests} passed, \${failedTests} failed\`)
        }
      } else if (variable.name == 'j2ref') {
        fs.writeFileSync('index.js', \`module.exports = \${value.toString().trim()}\n\`)
      }
    },
    rejected: err => {
      console.error(\`error loading \${variable.name}:\`, err)
      console.error(err.trace)
    }
  };
});`)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`The creation of the module file, \`index.js\` is hardcoded for now. It would be better if it used comments or metadata for it.

I added a tiny script to make sure it is extracted properly:`
)})
    },
    {
      inputs: ["jsSrc"],
      value: (function(jsSrc){return(
jsSrc(`// build/test-module.js
const j2ref = require('../')
const assert = require('assert')
assert.deepEqual(j2ref('foo.bar').keys, ['foo', 'bar'])
console.log('tests passed')`)
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`I added it to \`package.json\`:

\`\`\` json
{
  "name": "j2ref",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "download-notebook": "node --experimental-modules build/download-notebook.mjs",
    "build-test-notebook": "node --experimental-modules build/build-test-notebook.mjs",
    "test-module": "node build/test-module.js",
    "test": "npm run build-test-notebook && npm run test-module"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/apicomponents/j2ref.git"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/apicomponents/j2ref/issues"
  },
  "homepage": "https://github.com/apicomponents/j2ref#readme",
  "devDependencies": {
    "@observablehq/notebook-runtime": "^1.2.3",
    "jsdom": "^11.11.0",
    "node-fetch": "^2.1.2"
  },
  "observable": "0db8579722ad9e16"
}
\`\`\``
)})
    },
    {
      inputs: ["md"],
      value: (function(md){return(
md`I can now run \`npm test\` and it passes, and more importantly, if I make a change to either test file, it fails with a nonzero exit code.

## Wrapping it up, onto the next step

I add a \`.travis.yml\`, commit and push the code, add a README with a travis badge, and publish the code to GitHub, and once it passes, publish the code to npm:

- [GitHub Repo](https://github.com/apicomponents/j2ref)
- [travis.yml](https://github.com/apicomponents/j2ref/blob/master/.travis.yml)
- [travis build](https://travis-ci.com/apicomponents/jules-php)
- [npm module](https://www.npmjs.com/package/j2ref)

Having gone through this, I have some ideas on things to build to improve the workflow:

- an Observable view for testing (use viewof to get at the results)
- a module making it convenient to run observable-runtime in node
- a module for extracting code and tests to files

Thanks for reading!`
)})
    },
    {
      name: "jsSrc",
      inputs: ["md"],
      value: (function(md){return(
src => md`\`\`\` javascript
${src}
\`\`\``
)})
    },
    {
      name: "q",
      value: (function(){return(
s => '`' + JSON.stringify(s) + '`'
)})
    },
    {
      name: "bq",
      value: (function(){return(
s => { const j = JSON.stringify(s); return '`'+j.substr(1, j.length - 2).replace(/\\"/, '"')+'`' }
)})
    },
    {
      name: "match",
      value: (function(){return(
(re, s) => { const m = re.exec(s); return m && m[0] }
)})
    },
    {
      name: "tbl",
      value: (function(){return(
(...header) => { return header.join('|') + "\n" + header.map(s => '-').join('|') + "\n" }
)})
    }
  ]
};

const notebook = {
  id: "0db8579722ad9e16@430",
  modules: [m0]
};

export default notebook;
