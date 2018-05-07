const path = require( 'path' )

module.exports = function ( { types: t } ) {
  return {
    visitor: {
      ExportDefaultDeclaration( path ) {
        const declaration = path.node.declaration
        if ( t.isObjectExpression( declaration ) ) {
          const componentsProperty = declaration.properties.filter( prop => {
            return t.isObjectProperty( prop ) && t.isIdentifier( prop.key ) &&
              prop.key.name === 'components'
          } )[ 0 ]

          if ( componentsProperty && t.isObjectExpression( componentsProperty.value ) ) {
            const properties = componentsProperty.value.properties
              .filter( prop => {
                return t.isObjectProperty( prop ) &&
                  t.isIdentifier( prop.key ) &&
                  t.isIdentifier( prop.value )
              } )

            const components = {}
            properties.forEach( prop => {
              const key = prop.key.name
              const value = prop.value.name
              const source = findSource( value, path.scope.bindings )

              if ( !source ) {
                throw new Error( 'cannot find source for ' + key )
              }

              components[ key ] = source
            } )

            path.hub.file.metadata.components = components
          }
        }
      },
    },
  }

  function findSource( identifierName, bindings ) {
    const binding = bindings[ identifierName ]
    if ( !binding ) {
      return
    }

    if ( t.isImportDeclaration( binding.path.parent ) ) {
      return binding.path.parent.source.value
    }
  }
}
