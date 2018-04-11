/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Evan You
*/

const fs = require( 'fs' )
const path = require( 'path' )
const hash = require( 'hash-sum' )

const optionsToId = new Map()
const idToOptions = new Map()

exports.saveOptions = options => {
  if ( optionsToId.has( options ) ) {
    return optionsToId.get( options )
  }

  const threadMode = options && options.threadMode
  const serialized = threadMode ? serialize( options ) : null
  const id = serialized ? hash( serialized ) : String( idToOptions.size )

  idToOptions.set( id, options || {} )
  optionsToId.set( options, id )

  if ( options && serialized ) {
    const fsidToOptionsPath = getidToOptionsPath( id )
    if ( !fs.existsSync( fsidToOptionsPath ) ) {
      fs.writeFileSync( fsidToOptionsPath, serialized )
    }
  }

  return id
}

exports.loadOptions = id => {
  const res = idToOptions.get( id )
  if ( res ) {
    return res
  }
  const fsidToOptionsPath = getidToOptionsPath( id )
  if ( fs.existsSync( fsidToOptionsPath ) ) {
    return JSON.parse( fs.readFileSync( fsidToOptionsPath, 'utf-8' ) )
  }
  return {}
}

function serialize( options ) {
  let res
  try {
    res = JSON.stringify( options )
  } catch ( e ) {
    throw new Error( `options must be JSON serializable in thread mode.` )
  }
  return res
}

function getidToOptionsPath( id ) {
  return path.resolve( __dirname, `.options-cache-${ id }` )
}
