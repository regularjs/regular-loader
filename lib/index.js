const loaderUtils = require( 'loader-utils' )
const parse = require( './parse' )
const hash = require( 'hash-sum' )
const path = require( 'path' )
const stringifyLoaders = require( './helpers' ).stringifyLoaders
const saveOptions = require( './utils/options-cache' ).saveOptions
const tryRequire = require( './utils/try-require' )
const mp = require( './mp' )

module.exports = function ( content ) {
  const loaderContext = this

  const rawOptions = loaderUtils.getOptions( this )
  const options = rawOptions || {}

  // use mp to compile script before babel-loader
  if ( options.checkEntry ) {
    const entryKey = getEntryKey.call( this )

    if ( entryKey ) {
      mp.parseScript.call( this, {
        content,
        entryKey,
        resourcePath: this.resourcePath,
        emitFile: this.emitFile,
      } )
    }

    function getEntryKey() {
      const entry = this.options.entry
      const resourcePath = this.resourcePath
      return Object.keys( entry ).filter( key => resourcePath === entry[ key ] )[ 0 ]
    }

    return content
  }

  const optionsId = saveOptions( rawOptions )

  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const needCssSourceMap = (
    !isProduction &&
    this.sourceMap &&
    options.cssSourceMap !== false
  )

  const filePath = this.resourcePath
  const fileName = path.basename( filePath )
  const moduleId = 'r-' + generateId( filePath, process.cwd() )
  const rewriterInjectRE = /\b(css(-loader)?(\?[^!]+)?)(?:!|$)/
  const selectorPath = require.resolve( './selector' )
  const hasBabel = Boolean( tryRequire( 'babel-loader' ) )

  const cssLoaderOptions = getCssLoaderOptions( needCssSourceMap, isProduction )

  const defaultLoaders = {
    html: '',
    css: options.extractCSS ?
      getCSSExtractLoader( null, options, cssLoaderOptions ) :
      'style-loader!css-loader' + cssLoaderOptions,
    js: hasBabel ? 'babel-loader' : ''
  }
  const defaultLang = {
    template: 'html',
    style: 'css',
    script: 'js'
  }
  const rewriters = {
    style: require.resolve( './style' ),
    template: require.resolve( './template' )
  }

  if ( this.sourceMap && !this.minimize ) {
    defaultLoaders.css = 'style-loader!css-loader?sourceMap'
  }

  const loaders = Object.assign( {}, defaultLoaders, options.loaders )

  function getSelectorString( type, index ) {
    return selectorPath + '?' +
      JSON.stringify( {
        type: type,
        index: index
      } ) + '!'
  }

  // sass => sass-loader
  // sass-loader => sass-loader
  // sass?indentedSyntax!css => sass-loader?indentedSyntax!css-loader
  function ensureLoader( lang ) {
    return lang
      .split( '!' )
      .map( loader =>
        loader.replace(
          /^([\w-]+)(\?.*)?/,
          ( _, name, query ) =>
            ( /-loader$/.test( name ) ? name : name + '-loader' ) + ( query || '' )
        )
      )
      .join( '!' )
  }

  function ensureBang( loader ) {
    if ( loader.charAt( loader.length - 1 ) !== '!' ) {
      return loader + '!'
    }
    return loader
  }

  function getCSSExtractLoader( lang, options, cssLoaderOptions ) {
    let extractor
    const op = options.extractCSS
    // extractCSS option is an instance of ExtractTextPlugin
    if ( typeof op.extract === 'function' ) {
      extractor = op
    } else {
      extractor = tryRequire( 'extract-text-webpack-plugin' )
      if ( !extractor ) {
        throw new Error(
          '[regular-loader] extractCSS: true requires extract-text-webpack-plugin ' +
          'as a peer dependency.'
        )
      }
    }
    const langLoader = lang ? ensureBang( ensureLoader( lang ) ) : ''
    return extractor.extract( {
      use: 'css-loader' + cssLoaderOptions + '!' + langLoader,
      fallback: 'style-loader'
    } )
  }

  function getCssLoaderOptions( needCssSourceMap, isProduction ) {
    let cssLoaderOptions = ''

    if ( needCssSourceMap ) {
      cssLoaderOptions += '?sourceMap'
    }
    if ( isProduction ) {
      cssLoaderOptions += ( cssLoaderOptions ? '&' : '?' ) + 'minimize'
    }

    return cssLoaderOptions
  }

  function getRewriter( type, scoped ) {
    const meta = '?id=' + moduleId + '&optionsId=' + optionsId

    switch ( type ) {
    case 'template':
      return rewriters.template + meta + ( scoped ? '&scoped=true!' : '!' )
    case 'style':
      return rewriters.style + meta + ( scoped ? '&scoped=true!' : '!' )
    default:
      return ''
    }
  }

  function getLoaderString( type, part, scoped ) {
    const lang = part.lang || defaultLang[ type ]
    const rewriter = getRewriter( type, scoped )

    let loader = options.extractCSS && type === 'style' ?
        loaders[ lang ] || getCSSExtractLoader( lang, options, cssLoaderOptions ) :
        loaders[ lang ]

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
        loader = rewriter
      } else {
        loader = ensureBang( loader ) + rewriter
      }

      return ensureBang( loader )
    }
    // unknown lang, infer the loader to be used
    switch ( type ) {
    case 'template':
      return rewriter
    case 'style':
      return (
          defaultLoaders.css + '!' + rewriter + ensureBang( ensureLoader( lang ) )
      )
    case 'script':
      return ensureBang( ensureLoader( lang ) )
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

  const parts = parse( content, fileName, this.sourceMap )

  let output = 'var __regular_script__, __regular_template__;\n'

  let hasScopedStyle = false

  // require style
  parts.style.forEach( function ( style, i ) {
    if ( style.scoped ) {
      hasScopedStyle = true
    }
    output += getRequire( 'style', style, i, style.scoped )
  } )

  // require script
  let script
  if ( parts.script.length ) {
    script = parts.script[ 0 ]
    output += '__regular_script__ = ' + getRequire( 'script', script, 0 )
  }

  // require template
  let template
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
    '	__rs__.template = __regular_template__.ast;\n' +
    '	__rs__.expressions = __regular_template__.expressions;\n' +
    '	__Component__ = Regular.extend(__rs__);\n' +
    '	__cps__ = __rs__.components || __rs__.component;\n' +
    '	if( typeof __cps__ === "object" ) {\n' +
    '		for( var i in __cps__ ) {\n' +
    '			__Component__.component(i, __cps__[ i ]);\n' +
    '		}\n' +
    '	}\n' +
    '} else if( typeof __rs__ === "function" && ( __rs__.prototype instanceof Regular ) ) {\n' +
    '	__rs__.prototype.template = __regular_template__.ast;\n' +
    '	__rs__.prototype.expressions = __regular_template__.expressions;\n' +
    '	__Component__ = __rs__;\n' +
    '}\n'

  output += 'module.exports = __Component__;'

  // done
  return output
}

const sepRE = /\/|\\/g
function generateId( filePath, context ) {
  const root = context.split( path.sep ).pop()
  const relativePath = path.relative( context, filePath ).replace( sepRE, '/' )
  return hash( root + '/' + relativePath )
}
