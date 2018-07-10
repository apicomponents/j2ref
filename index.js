module.exports = function j2ref(str, startIndex = 0, matchStart = true) {
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
