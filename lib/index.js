const loaderUtils = require( 'loader-utils' )
const parse = require( './parser' )
const hash = require( 'hash-sum' )
const path = require( 'path' )
const stringifyLoaders = require( './helpers' ).stringifyLoaders
const saveOptions = require( './utils/options-cache' ).saveOptions
const tryRequire = require( './utils/try-require' )

module.exports = function ( content ) {
  const webpackPackage = tryRequire('webpack/package.json')
  if (!webpackPackage) {
    throw new Error(
      '[regular-loader] need install webpack in local. \n' +
      'You can install by running the following: \n' +
      'npm install webpack --save-dev'
    )
  }
  const webpackVersion = webpackPackage.version;
  const loaderContext = this

  const rawOptions = loaderUtils.getOptions( this )
  const optionsId = saveOptions( rawOptions )
  const options = rawOptions || {}

  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const needCssSourceMap = (
    !isProduction &&
    this.sourceMap &&
    options.cssSourceMap !== false
  )

  const filePath = this.resourcePath
  const fileName = path.basename( filePath )
  const moduleId = 'data-r-' + generateId( filePath, process.cwd() )
  const rewriterInjectRE = /\b(css(-loader)?(\?[^!]+)?)(?:!|$)/
  const selectorPath = require.resolve( './selector' )
  const hasBabel = Boolean( tryRequire( 'babel-loader' ) )

  const cssLoaderOptions = getCssLoaderOptions( needCssSourceMap, isProduction )

  const optionsIdOptions =
    '?' +
    JSON.stringify( {
      optionsId
    } )

  const defaultLoaders = {
    html:
      require.resolve( './precompile' ) +
      '!' +
      require.resolve( './html-loader' ) +
      optionsIdOptions,
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
    style: require.resolve( './style-rewriter' ),
    template: require.resolve( './template-rewriter.js' )
  }

  if ( this.sourceMap && !this.minimize ) {
    defaultLoaders.css = 'style-loader!css-loader?sourceMap'
  }

  const loaders = Object.assign( {}, defaultLoaders, options.loaders )

  function getSelectorString( type, index ) {
    return selectorPath + '?type=' + type + '&index=' + index + '!'
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
    let extractor, loaderOptions
    const op = options.extractCSS
    const langLoader = lang ? ensureBang( ensureLoader( lang ) ) : ''
    // extractCSS option is an instance of ExtractTextPlugin
    if (+webpackVersion.split('.')[0] >= 4) {
      extractor = tryRequire( 'mini-css-extract-plugin' )
      if ( !extractor ) {
        throw new Error(
          '[regular-loader] extractCSS: true requires mini-css-extract-plugin ' +
          'as a peer dependency.'
        )
      }
      loaderOptions = [ extractor.loader, 'css-loader' + cssLoaderOptions ].concat( lang ? ensureLoader( lang ).split( '!' ) : [])
    } else {
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
      loaderOptions = extractor.extract( {
        use: 'css-loader' + cssLoaderOptions + '!' + langLoader,
        fallback: 'style-loader'
      } )
    }

    return loaderOptions
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
      return rewriters.template + ( scoped ? meta + '&scoped=true!' : '!' )
    case 'style':
      return rewriters.style + ( scoped ? meta + '&scoped=true!' : '!' )
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

const sepRE = /\/|\\/g
function generateId( filePath, context ) {
  const root = context.split( path.sep ).pop()
  const relativePath = path.relative( context, filePath ).replace( sepRE, '/' )
  return hash( root + '/' + relativePath )
}
