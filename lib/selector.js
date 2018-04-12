const parse = require( './parser' )
const loaderUtils = require( 'loader-utils' )
const path = require( 'path' )

module.exports = function ( content ) {
  const query = loaderUtils.parseQuery( this.query )
  const filename = path.basename( this.resourcePath )
  const parts = parse( content, filename, this.sourceMap )
  const part = parts[ query.type ][ query.index ]
  this.callback( null, part.content, part.map )
}
