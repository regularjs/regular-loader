const path = require( 'path' )
const webpack = require( 'webpack' )
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' )
const FriendlyErrorsWebpackPlugin = require( 'friendly-errors-webpack-plugin' )
const fs = require( 'fs-extra' )
const regularLoader = require( '../lib' )

function cwd( ...segs ) {
	return path.resolve( __dirname, ...segs )
}

function bundle( entry, options = {} ) {
	const basename = path.basename( entry, '.rgl' )

	const config = {
		entry: cwd( `fixtures/${ entry }` ),
		output: {
			path: cwd( 'dist' ),
			filename: `${ basename }.js`
		},
		module: {
			rules: [{
				test: /\.rgl$/,
				use: {
					loader: require.resolve( '../lib' ),
					options: Object.assign( {
						extractCSS: true
					}, options )
				},
			}]
		},
		plugins: [
			new ExtractTextPlugin( `${ basename }.css` ),
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
					return '!! file not exist !!'
				} ),
				fs.pathExists( cssfile ).then( exists => {
					if ( exists ) return fs.readFile( cssfile )
					return '!! file not exist !!'
				} ),
			] ).then( function ( files ) {
				resolve( [ files[ 0 ].toString(), files[ 1 ].toString() ] )
			}, reject )
		} )
	} )
}

module.exports = bundle
