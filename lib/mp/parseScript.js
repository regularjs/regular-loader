const hash = require( 'hash-sum' )
const path = require( 'path' )
const babel = require( 'babel-core' )
const resolveSource = require( '../utils/resolve-source' )
const extractConfigPlugin = require( './plugins/extract-config' )
const rootComponentPlugin = require( './plugins/root-component' )
const templates = require( './templates' )

module.exports = function ( { content, entryKey, resourcePath, emitFile } ) {
  const isAppEntry = entryKey === 'app'

  const ast = babel.transform( content, {
    extends: path.resolve( process.cwd(), '.babelrc' ),
    plugins: [ extractConfigPlugin, rootComponentPlugin ]
  } )

  // extract config
  const mpConfig = ast.metadata.mpConfig && ast.metadata.mpConfig.value
  if ( mpConfig ) {
    emitFile( `${ entryKey }.json`, JSON.stringify( mpConfig, 0, 2 ) )
  }

  // extract js
  emitFile(
    `${ entryKey }.js`,
    templates.js( {
      entryKey: entryKey
    } )
  )

  // extract css
  emitFile(
    `${ entryKey }.wxss`,
    templates.css( {
      entryKey: entryKey
    } )
  )

  // extract wxml
  const rootComponent = ast.metadata.rootComponent
  resolveSource.call( this, rootComponent ).then( resolved => {
    const relativePath = path.relative(
      process.cwd(),
      resolved
    ).replace( /\.\w+$/g, '' )
    const filename = path.basename( rootComponent )
      .replace( /\.\w+$/g, '' ) // remove ext

    emitFile(
      `${ entryKey }.wxml`,
      templates.wxml( {
        dependency: `${ filename }$${ hash( relativePath ) }`,
        entryKey: entryKey
      } )
    )
  } ).catch( e => console.log( e ) )
}
