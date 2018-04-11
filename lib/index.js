var loaderUtils = require( 'loader-utils' )
var parse = require( './parser' )
var assign = require( 'object-assign' )
var hash = require( 'hash-sum' )
var es6Promise = require( 'es6-promise' )
var path = require( 'path' )
var stringifyLoaders = require( './helpers' ).stringifyLoaders
const saveOptions = require( './utils/options-cache' ).saveOptions

es6Promise.polyfill()

module.exports = function ( content ) {
  this.cacheable()

  var loaderContext = this

  const rawOptions = loaderUtils.getOptions( this )

  const optionsId = saveOptions( rawOptions )

  var options = rawOptions || {}

  var filePath = this.resourcePath
  var fileName = path.basename( filePath )
  var moduleId = 'data-r-' + generateId( filePath, process.cwd() )
  var rewriterInjectRE = /\b(css(-loader)?(\?[^!]+)?)(?:!|$)/
  var selectorPath = require.resolve( './selector' )

  const optionsIdOptions =
    '?' +
    JSON.stringify( {
      optionsId
    } )

  var defaultLoaders = {
    html:
      require.resolve( './precompile' ) +
      '!' +
      require.resolve( './html-loader' ) +
      optionsIdOptions,
    css: 'style-loader!css-loader',
    js:
      'babel-loader?presets[]=es2015&plugins[]=transform-runtime&comments=false'
  }
  var defaultLang = {
    template: 'html',
    style: 'css',
    script: 'js'
  }
  var rewriters = {
    style: require.resolve( './style-rewriter' ),
    template: require.resolve( './template-rewriter.js' )
  }

  if ( this.sourceMap && !this.minimize ) {
    defaultLoaders.css = 'style-loader!css-loader?sourceMap'
  }

  var loaders = assign( {}, defaultLoaders, options.loaders )

  function getSelectorString( type, index ) {
    return selectorPath + '?type=' + type + '&index=' + index + '!'
  }

  function ensureBang( loader ) {
    if ( loader.charAt( loader.length - 1 ) !== '!' ) {
      return loader + '!'
    }
    return loader
  }

  function getRewriter( type, scoped ) {
    var meta = '?id=' + moduleId + '&optionsId=' + optionsId
    switch ( type ) {
    case 'template':
      return rewriters.template + ( scoped ? meta + '&scoped=true!' : '!' )
    case 'style':
      return rewriters.style + ( scoped ? meta + '&scoped=true!' : '!' )
    default:
      return ''
    }
  }

  function getLoaderString( type, part, scoped ) {
    var lang = part.lang || defaultLang[ type ]
    var loader = loaders[ lang ]
    var rewriter = getRewriter( type, scoped )
    if ( loader !== undefined ) {
      if ( Array.isArray( loader ) ) {
        loader = stringifyLoaders( loader )
      } else if ( typeof loader === 'object' ) {
        loader = stringifyLoaders( [ loader ] )
      }

      if ( type === 'style' && rewriterInjectRE.test( loader ) ) {
        // ensure rewriter is executed before css-loader
        loader = loader.replace( rewriterInjectRE, function ( m, $1 ) {
          return ensureBang( $1 ) + rewriter
        } )
      } else if ( type === 'template' ) {
        // can not change loaders for template
        loader = rewriter + ensureBang( defaultLoaders.html )
      } else {
        loader = ensureBang( loader ) + rewriter
      }

      return ensureBang( loader )
    }
    // unknown lang, infer the loader to be used
    switch ( type ) {
    case 'template':
      return rewriter + defaultLoaders.html + '!'
    case 'style':
      return defaultLoaders.css + '!' + rewriter + lang + '-loader!'
    case 'script':
      return lang + '!'
    default:
      return ''
    }
  }

  function getRequireString( type, part, index, scoped ) {
    return loaderUtils.stringifyRequest(
      loaderContext,
      // disable all configuration loaders
      '!!' +
        // get loader string for pre-processors
        getLoaderString( type, part, scoped ) +
        // select the corresponding part from the rgl file
        getSelectorString( type, index || 0 ) +
        // the url to the actual rgl file
        filePath
    )
  }

  function getRequire( type, part, index, scoped ) {
    return 'require(' + getRequireString( type, part, index, scoped ) + ')\n'
  }

  var parts = parse( content, fileName, this.sourceMap )

  var output = 'var __regular_script__, __regular_template__;\n'

  var hasScopedStyle = false

  // require style
  parts.style.forEach( function ( style, i ) {
    if ( style.scoped ) {
      hasScopedStyle = true
    }
    output += getRequire( 'style', style, i, style.scoped )
  } )

  // require script
  var script
  if ( parts.script.length ) {
    script = parts.script[ 0 ]
    output += '__regular_script__ = ' + getRequire( 'script', script, 0 )
  }

  // require template
  var template
  if ( parts.template.length ) {
    template = parts.template[ 0 ]
    output +=
      '__regular_template__ = ' +
      getRequire( 'template', template, 0, hasScopedStyle )
  }

  // find Regular
  output += 'var Regular = require( "regularjs" );\n\n'

  output +=
    'var __rs__ = __regular_script__ || {};\n' +
    'if (__rs__.__esModule) __rs__ = __rs__["default"];\n' +
    'if (Regular.__esModule) Regular = Regular["default"];\n\n' +
    'var __Component__, __cps__;\n' +
    'if( typeof __rs__ === "object" ) {\n' +
    '	__rs__.template = __regular_template__;\n' +
    '	__Component__ = Regular.extend(__rs__);\n' +
    '	__cps__ = __rs__.components || __rs__.component;\n' +
    '	if( typeof __cps__ === "object" ) {\n' +
    '		for( var i in __cps__ ) {\n' +
    '			__Component__.component(i, __cps__[ i ]);\n' +
    '		}\n' +
    '	}\n' +
    '} else if( typeof __rs__ === "function" && ( __rs__.prototype instanceof Regular ) ) {\n' +
    '	__rs__.prototype.template = __regular_template__;\n' +
    '	__Component__ = __rs__;\n' +
    '}\n'

  output += 'module.exports = __Component__;'

  // done
  return output
}

var sepRE = /\/|\\/g
function generateId( filePath, context ) {
  var root = context.split( path.sep ).pop()
  var relativePath = path.relative( context, filePath ).replace( sepRE, '/' )
  return hash( root + '/' + relativePath )
}
