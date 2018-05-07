const parse = require( './parse' )
const loaderUtils = require( 'loader-utils' )
const path = require( 'path' )

module.exports = function ( content ) {
  const query = loaderUtils.getOptions( this )
  const type = query.type
  const index = query.index
  const filename = path.basename( this.resourcePath )
  const parts = parse( content, filename, this.sourceMap )

  if ( type === 'template' ) {
    // template 比较特殊，需要同时拿到template和script来解析依赖的组件路径
    const template = parts[ 'template' ][ 0 ]
    const script = parts[ 'script' ][ 0 ]
    this.callback( null, { template, script } )
  } else {
    const part = parts[ type ][ index ]
    this.callback( null, part.content, part.map )
  }
}
