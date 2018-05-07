module.exports = function ( { types: t } ) {
  return {
    visitor: {
      Identifier( path ) {
        const is$inject = path.isIdentifier( { name: '$inject' } )
        const isMemberExpression = t.isMemberExpression( path.parentPath )
        const isCallExpression = t.isCallExpression( path.parentPath.parentPath )

        if ( is$inject && isMemberExpression && isCallExpression ) {
          if ( t.isIdentifier( path.parentPath.node.object ) ) {
            const identifier = path.parentPath.node.object
            const identifierName = identifier.name

            // console.log( identifierName )

            const declaration = path.scope.bindings[ identifierName ]
            if ( t.isVariableDeclarator( declaration.path.node ) ) {
              const node = declaration.path.node
              if ( t.isIdentifier( node.init.callee ) ) {
                const ctorName = node.init.callee.name

                // console.log( ctorName )

                const declaration = path.scope.bindings[ ctorName ]
                const isImportDefaultSpecifier = t.isImportDefaultSpecifier( declaration.path.node )
                const isImportDeclaration = t.isImportDeclaration( declaration.path.parent )
                const isStringLiteral = t.isStringLiteral( declaration.path.parent.source )
                if ( isImportDefaultSpecifier && isImportDeclaration && isStringLiteral ) {
                  path.hub.file.metadata.rootComponent = declaration.path.parent.source.value
                }
              }
            }
          }
        }
      }
    }
  }
}
