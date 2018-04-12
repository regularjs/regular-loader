/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
const htmlMinifier = require( 'html-minifier' )
const loaderUtils = require( 'loader-utils' )
const compile = require( 'es6-templates' ).compile
const url = require( 'url' )
const attrParse = require( './attributesParser' )
const loadOptions = require( '../utils/options-cache' ).loadOptions

const hasOwn = Object.prototype.hasOwnProperty

function randomIdent() {
  return 'xxxHTMLLINKxxx' + Math.random() + Math.random() + 'xxx'
}

function getLoaderConfig( context ) {
  const query = loaderUtils.getOptions( context ) || {}
  const configKey = query.config || 'htmlLoader'
  const config =
    context.options && hasOwn.call( context.options, configKey ) ?
      context.options[ configKey ] :
      {}

  delete query.config

  return Object.assign( query, config )
}

module.exports = function ( content ) {
  const config = getLoaderConfig( this )
  const options = loadOptions( config.optionsId )
  let attributes = [ 'img:src' ]
  if ( config.attrs !== undefined ) {
    if ( typeof config.attrs === 'string' ) {
      attributes = config.attrs.split( ' ' )
    } else if ( Array.isArray( config.attrs ) ) {
      attributes = config.attrs
    } else if ( config.attrs === false ) {
      attributes = []
    } else {
      throw new Error( 'Invalid value to config parameter attrs' )
    }
  }
  const root = config.root
  const links = attrParse( content, function ( tag, attr ) {
    return attributes.indexOf( tag + ':' + attr ) >= 0
  } )
  links.reverse()
  const data = {}
  content = [ content ]
  links.forEach( function ( link ) {
    if ( !loaderUtils.isUrlRequest( link.value, root ) ) {
      return
    }

    const uri = url.parse( link.value )
    if ( uri.hash !== null && uri.hash !== undefined ) {
      uri.hash = null
      link.value = uri.format()
      link.length = link.value.length
    }

    let ident
    do {
      ident = randomIdent()
    } while ( data[ ident ] )
    data[ ident ] = link.value
    const x = content.pop()
    content.push( x.substr( link.start + link.length ) )
    content.push( ident )
    content.push( x.substr( 0, link.start ) )
  } )
  content.reverse()
  content = content.join( '' )

  if ( options.preserveWhitespace === false ) {
    content = htmlMinifier.minify( content, {
      caseSensitive: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      preserveLineBreaks: false,
      removeTagWhitespace: false,
      keepClosingSlash: true,
      ignoreCustomFragments: [ /\{[\s\S]*?\}/ ],
      trimCustomFragments: true,
      removeAttributeQuotes: false
    } )
  }

  if ( config.interpolate ) {
    content = compile( '`' + content + '`' ).code
  }

  return {
    html: content,
    data: data,
    root: root
  }
}
