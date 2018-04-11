const test = require( 'ava' )
const bundle = require( './bundle' )

process.chdir( __dirname )

const bundling = bundle( 'css-preprocessor.rgl' )

test.serial( 'css-preprocessor - css', async function ( t ) {
	const [ js, css ] = await bundling
	t.snapshot( css )
} )
