const path = require( 'path' )
const babelon = require( 'babelon' )
const generate = require( 'babel-generator' ).default

module.exports = function ( { types: t } ) {
  return {
      visitor: {
        ExportDefaultDeclaration( path ) {
          path.node.declaration.properties.filter( prop => {
            if (
              t.isObjectProperty( prop ) &&
              t.isIdentifier( prop.key, { name: 'config' } )
            ) {
              const code = generate( prop.value ).code

              path.hub.file.metadata.mpConfig = {
                code: code,
                node: prop.value,
                value: babelon.eval( code )
              }
            }
          } )

          path.remove()
        },
      },
    }
}
