// stringify an Array of loader objects
exports.stringifyLoaders = function stringifyLoaders( loaders ) {
  return loaders
    .map(
      obj =>
        obj && typeof obj === 'object' && typeof obj.loader === 'string' ?
          obj.loader + ( obj.options ? '?' + JSON.stringify( obj.options ) : '' ) :
          obj
    )
    .join( '!' )
}
