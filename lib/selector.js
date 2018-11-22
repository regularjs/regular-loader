const parse = require( './parser' )
const loaderUtils = require( 'loader-utils' )
const path = require( 'path' )

module.exports = function ( content ) {
  const options = loaderUtils.getOptions( this )
  const filename = path.basename( this.resourcePath )
  const parts = parse( content, filename, this.sourceMap )
  const part = parts[ options.type ][ options.index ]
  this.callback( null, part.content, part.map )
}
