const path = require( 'path' )
const url = require( 'url' )
const loaderUtils = require( 'loader-utils' )
const nanoid = require( 'nanoid' )
const htmlMinifier = require( 'html-minifier' )
const hash = require( 'hash-sum' )
const babel = require( 'babel-core' )
const componentsPlugin = require( './plugins/components' )
// const compile = require( '../../../mpregular-template-compiler' )
const compile = require( 'mpregular-template-compiler' )
const resolveSource = require( '../utils/resolve-source' )
const loadOptions = require( '../utils/options-cache' ).loadOptions

const slotCache = Object.create( null )
slotCache.imports = []
slotCache.slots = []

module.exports = function ( { template, script } ) {
  const cb = this.async()
  let content = template.content
  const query = loaderUtils.getOptions( this ) || {}
  const options = loadOptions( query.optionsId )

  const id = query.id
  const scoped = query.scoped

  if ( options.preserveWhitespace === false ) {
    content = removeWhitespace( content )
  }

  const compilerOptions = {}

  const scriptAst = babel.transform( script.content, {
    extends: path.resolve( process.cwd(), '.babelrc' ),
    plugins: [ componentsPlugin ]
  } )

  const components = scriptAst.metadata.components || {}

  const tmp = {}

  Promise.all(
    Object.keys( components ).map( key => {
      const source = components[ key ]
      return resolveSource.call( this, source )
        .then( ( resolved ) => {
          const filename = path.basename( source ).replace( /\.\w+$/g, '' )
          const relativePath = path.relative( process.cwd(), resolved )
            .replace( /\.\w+$/g, '' )
          const name = `${ filename }$${ hash( relativePath ) }`
          tmp[ key ] = {
            name: name,
            src: name
          }
        } )
    } )
  ).then( () => {
    // extract component wxml
    // parse template to wxml, and put it to /components folder
    const filepath = this.resourcePath
    const relativePath = path.relative( process.cwd(), filepath )
      .replace( /\.\w+$/g, '' )
    const filename = path.basename( filepath )
      .replace( /\.\w+$/g, '' ) // remove ext

    compilerOptions.name = `${ filename }$${ hash( relativePath ) }`
    compilerOptions.components = tmp

    if ( scoped ) {
      compilerOptions.moduleId = id
    }

    const { ast, wxml, expressions, slots, imports } = compile( content, compilerOptions )

    this.emitFile( `components/${ filename }$${ hash( relativePath ) }.wxml`, wxml )

    imports.split( '\n' ).forEach( v => {
      if ( !~slotCache.imports.indexOf( v ) ) {
        slotCache.imports.push( v )
      }
    } )
    slotCache.slots.push( slots || '' )

    const slotsContent = slotCache.imports.join( '\n' ) + '\n' + slotCache.slots.join( '\n' ) +
      `\n<template name="defaultSlot"></template>`

    this.emitFile( `components/slots.wxml`, slotsContent )

    // use `module.exports` to export
    const transformedAstStr = transformAst( ast, {
      transformToRequire: {
        img: 'src'
      }
    } )

    const transformedExpressionsStr = transformExpressions( expressions )

    cb(
      null,
      `module.exports = {
        ast: ${ transformedAstStr },
        expressions: ${ transformedExpressionsStr }
      }`
    )
  } ).catch( e => cb( e ) )
}

function transformExpressions( expressions ) {
  const get = expressions.get || {}
  const set = expressions.set || {}

  let str = `{
    get: {`

  each( get, ( fn, body ) => {
    str = str + '"' + body + '":' + fn.toString() + ',\n'
  } )

  str = str + `},
    set: {`

  each( set, ( fn, body ) => {
    str = str + '"' + body + '":' + fn.toString() + ',\n'
  } )

  str = str + `}
    }`

  return str
}

function each( obj, fn ) {
  Object.keys( obj ).forEach( key => {
    const value = obj[ key ]
    fn( value, key )
  } )
}

function getEntryKey() {
  const entry = this.options.entry
  const resourcePath = this.resourcePath
  return Object.keys( entry ).filter( key => resourcePath === entry[ key ] )[ 0 ]
}

// transform and stringify
function transformAst( ast, options = {} ) {
  const transformToRequire = options.transformToRequire || {}
  const map = {}

  // find all img:src
  walkElement( ast, function ( node ) {
    const attrName = transformToRequire[ node.tag ]

    // matched
    if ( attrName ) {
      node.attrs
        .filter( attr => attr.name === attrName )
        .forEach( attr => {
          if ( !loaderUtils.isUrlRequest( attr.value, process.cwd() ) ) {
            return
          }

          // remove hash
          const uri = url.parse( attr.value )
          if ( uri.hash !== null && uri.hash !== undefined ) {
            uri.hash = null
            attr.value = uri.format()
          }

          // use string to make ast stringify-able
          const id = `_o_O_${ nanoid() }_O_o_`
          map[ id ] = attr.value
          attr.value = id
        } )
    }
  } )

  return JSON.stringify( ast ).replace( /"(_o_O_[A-Za-z0-9_~]+_O_o_)"/g, function ( total, $1 ) {
    if ( !map[ $1 ] ) {
      return total
    }

    return 'require(\'' + loaderUtils.urlToRequest( map[ $1 ], process.cwd() ) + '\')'
  } )
}

// type if -> consequent && alternate
// type list -> body
// type element -> children

function walkElement( tree, fn ) {
  tree.forEach( function ( v ) {
    if ( v.type === 'element' ) {
      fn( v )
      if ( v.children ) {
        walkElement( v.children, fn )
      }
    } else if ( v.type === 'if' ) {
      walkElement( v.alternate, fn )
      walkElement( v.consequent, fn )
    } else if ( v.type === 'list' ) {
      walkElement( v.body, fn )
    }
  } )
}

function removeWhitespace( content ) {
  return htmlMinifier.minify( content, {
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
