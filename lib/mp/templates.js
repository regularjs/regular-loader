exports.js = function ( { entryKey } = {} ) {
  return `
require('${ getPrefixPath( entryKey ) }static/js/vendor')
require('${ getPrefixPath( entryKey ) }static/js/${ entryKey }')
  `.trim()
}

exports.css = function ( { entryKey } = {} ) {
  return `
@import "${ getPrefixPath( entryKey ) }static/css/${ entryKey }.wxss";
  `.trim()
}

exports.wxml = function ( { dependency, entryKey } ) {
  return `
<import src="${ getPrefixPath( entryKey ) }components/${ dependency }" /><template is="${ dependency }" data="{{ ...$root['0'], $root }}"/>
  `.trim()
}

function getPrefixPath( entryKey ) {
  const times = entryKey.split( '/' ).length - 1
  return times > 0
    ? repeat( '../', times )
    : './'
}

function repeat( str, len ) {
  let result = ''

  while ( len-- ) {
    result = result + str
  }

  return result
}
