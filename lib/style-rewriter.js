const postcss = require( 'postcss' )
const loaderUtils = require( 'loader-utils' )
const addScopedId = require( './postcss-plugins/add-scoped-id' )
const loadOptions = require( './utils/options-cache' ).loadOptions

const hasOwn = Object.prototype.hasOwnProperty

function isObject( val ) {
  return val && typeof val === 'object'
}

module.exports = function ( content, map ) {
  const cb = this.async()

  const query = loaderUtils.getOptions( this ) || {}
  const options = loadOptions( query.optionsId )

  const postcssOptions = options.postcss

  // postcss plugins
  let plugins
  if ( Array.isArray( postcssOptions ) ) {
    plugins = postcssOptions
  } else if ( typeof postcssOptions === 'function' ) {
    plugins = postcssOptions.call( this, this )
  } else if ( isObject( postcssOptions ) && postcssOptions.plugins ) {
    plugins = postcssOptions.plugins
  }
  plugins = plugins ? plugins.slice() : [] // make sure to copy it

  // scoped css
  if ( query.scoped ) {
    plugins.push(
      addScopedId( {
        id: query.id
      } )
    )
  }

  // postcss options, for source maps
  const file = this.resourcePath
  const opts = {
    from: file,
    to: file,
    map: false
  }
  if (
    this.sourceMap &&
    !this.minimize &&
    options.cssSourceMap !== false &&
    process.env.NODE_ENV !== 'production' &&
    !( isObject( postcssOptions ) && postcssOptions.options && postcssOptions.map )
  ) {
    opts.map = {
      inline: false,
      annotation: false,
      prev: map
    }
  }

  // postcss options from configuration
  if ( isObject( postcssOptions ) && postcssOptions.options ) {
    for ( const option in postcssOptions.options ) {
      if ( !hasOwn.call( opts, option ) ) {
        opts[ option ] = postcssOptions.options[ option ]
      }
    }
  }

  postcss( plugins )
    .process( content )
    .then( function ( result ) {
      // const map = result.map && result.map.toJSON()
      cb( null, result.css, map )
    } )
    .catch( function ( e ) {
      console.log( e )
      cb( e )
    } )
}
