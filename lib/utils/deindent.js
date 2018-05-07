/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Evan You @yyx990803
*/
const splitRE = /\r?\n/g
const emptyRE = /^\s*$/
const needFixRE = /^(\r?\n)*[\t\s]/

module.exports = function deindent( str ) {
  if ( !needFixRE.test( str ) ) {
    return str
  }
  const lines = str.split( splitRE )
  let min = Infinity
  let type, cur, c
  for ( let i = 0; i < lines.length; i++ ) {
    const line = lines[ i ]
    if ( !emptyRE.test( line ) ) {
      if ( type ) {
        cur = count( line, type )
        if ( cur < min ) {
          min = cur
        }
      } else {
        c = line.charAt( 0 )
        if ( c === ' ' || c === '\t' ) {
          type = c
          cur = count( line, type )
          if ( cur < min ) {
            min = cur
          }
        } else {
          return str
        }
      }
    }
  }
  return lines
    .map( function ( line ) {
      return line.slice( min )
    } )
    .join( '\n' )
}

function count( line, type ) {
  let i = 0
  while ( line.charAt( i ) === type ) {
    i++
  }
  return i
}
