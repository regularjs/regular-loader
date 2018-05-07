const postcss = require( 'postcss' )
const loaderUtils = require( 'loader-utils' )
const addScopedClass = require( './plugins/add-scoped-class' )
const loadOptions = require( '../utils/options-cache' ).loadOptions
const loadPostcssConfig = require( './load-postcss-config' )

module.exports = function ( content, map ) {
  const cb = this.async()

  const query = loaderUtils.getOptions( this ) || {}
  const options = loadOptions( query.optionsId )

  const inlineOptions = options.postcss

  loadPostcssConfig( this, inlineOptions )
    .then( config => {
      const plugins = config.plugins
      const options = Object.assign(
        {
          to: this.resourcePath,
          from: this.resourcePath,
          map: false
        },
        config.options
      )

      // scoped css
      if ( query.scoped ) {
        plugins.push( addScopedClass( { id: query.id } ) )
      }

      // sourcemap
      if ( query.sourceMap && !options.map ) {
        options.map = {
          inline: false,
          annotation: false,
          prev: map
        }
      }

      postcss( plugins )
        .process( content, options )
        .then( result => {
          if ( result.messages ) {
            result.messages.forEach( ( { type, file } ) => {
              if ( type === 'dependency' ) {
                this.addDependency( file )
              }
            } )
          }
          const map = result.map && result.map.toJSON()
          cb( null, result.css, map )
          return null // silence bluebird warning
        } )
        .catch( e => {
          console.error( e )
          cb( e )
        } )
    } )
}
