import test from 'ava'
import path from 'path'
import webpack from 'webpack'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin'
import rm from 'rimraf'
import fs from 'fs-extra'
import regularLoader from '../lib'

function cwd( ...segs ) {
	return path.resolve( __dirname, ...segs )
}

function bundle( entry, options = {} ) {
	const basename = path.basename( entry, '.rgl' )

	const extractStyle = new ExtractTextPlugin( `${ basename }.css` )

	const config = {
		entry: cwd( `fixtures/${ entry }` ),
		output: {
			path: cwd( 'dist' ),
			filename: `${ basename }.js`
		},
		module: {
			loaders: [
				{
					test: /\.rgl$/,
					loader: require.resolve( '../lib' ),
					exclude: /node_modules/
				},
				{
					test: /\.js$/,
					loader: 'babel',
					exclude: /node_modules/
				}
			]
		},
		resolve: {
			extensions: [ '', '.js', '.rgl' ]
		},
		regular: Object.assign( {
			loaders: {
				css: extractStyle.extract( 'css' ),
				less: extractStyle.extract( 'css!less' ),
				mcss: extractStyle.extract( 'css!mcss' ),
			}
		}, options ),
		plugins: [
			extractStyle,
			new FriendlyErrorsWebpackPlugin( { clearConsole: false } ),
		]
	}

	const compiler = webpack( config )

	return new Promise( function ( resolve, reject ) {
		compiler.run( function ( err, stats ) {
			if ( err ) {
				console.log( err );
				return reject( err )
			}

			const jsonStats = stats.toJson()

			if ( jsonStats.errors.length > 0 ) {
				console.log( jsonStats.errors );
				return reject()
			}

			if ( jsonStats.warnings.length > 0 ) {
				console.log( jsonStats.warnings );
			}

			const jsfile = cwd( `dist/${ basename }.js` )
			const cssfile = cwd( `dist/${ basename }.css` )

			Promise.all( [
				fs.pathExists( jsfile ).then( exists => {
					if ( exists ) return fs.readFile( jsfile )
					return ''
				} ),
				fs.pathExists( cssfile ).then( exists => {
					if ( exists ) return fs.readFile( cssfile )
					return ''
				} ),
			] ).then( function ( files ) {
				resolve( [ files[ 0 ].toString(), files[ 1 ].toString() ] )
			}, reject )
		} )
	} )
}

const prevCwd = process.cwd()

test.before( () => {
	process.chdir( __dirname )
} )

test.after( () => {
	// rm.sync( path.resolve( __dirname, 'dist' ) )
	process.chdir( prevCwd )
} )

test( 'basic', async function( t ) {
	const [ js, css ] = await bundle( 'basic.rgl' )
	t.snapshot( [ js, css ] )
} )

test( 'scoped-style', async function ( t ) {
	const [ js, css ] = await bundle( 'scoped-css.rgl' )
	t.snapshot( [ js, css ] )
} )

test( 'css-preprocessor', async function ( t ) {
	const [ js, css ] = await bundle( 'css-preprocessor.rgl' )
	t.snapshot( [ js, css ] )
} )

test( 'multiple-css', async function ( t ) {
	const [ js, css ] = await bundle( 'multiple-css.rgl' )
	t.snapshot( [ js, css ] )
} )

test( 'preserveWhitespace', async function ( t ) {
	const [ js, css ] = await bundle( 'preserve-whitespace.rgl', {
		preserveWhitespace: false
	} )
	t.snapshot( [ js, css ] )
} )
