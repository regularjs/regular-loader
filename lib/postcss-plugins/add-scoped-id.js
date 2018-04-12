const postcss = require( 'postcss' )
const selectorParser = require( 'postcss-selector-parser' )

module.exports = postcss.plugin( 'add-id', function ( opts ) {
  return function ( root ) {
    root.each( function rewriteSelector( node ) {
      if ( !node.selector ) {
        // handle media queries
        if ( node.type === 'atrule' && node.name === 'media' ) {
          node.each( rewriteSelector )
        }
        return
      }
      node.selector = selectorParser( function ( selectors ) {
        selectors.each( function ( selector ) {
          let firstNode = null
          let node = null

          selector.each( function ( n, i ) {
            if ( n.type !== 'pseudo' ) {
              if ( i === 0 ) {
                firstNode = n
              }
              node = n
            }
          } )

          selector.insertAfter(
            firstNode,
            selectorParser.attribute( {
              attribute: opts.id
            } )
          )

          if ( firstNode !== node ) {
            selector.insertAfter(
              node,
              selectorParser.attribute( {
                attribute: opts.id
              } )
            )
          }
        } )
      } ).process( node.selector ).result
    } )
  }
} )
