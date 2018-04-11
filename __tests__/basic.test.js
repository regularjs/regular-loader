const test = require( 'ava' )
const bundle = require( './bundle' )

process.chdir( __dirname )

const bundling = bundle( 'basic.rgl' )

test.serial( 'basic - js', async function( t ) {
	const [ js, css ] = await bundling
	t.snapshot( js )
} )

test.serial( 'basic - css', async function( t ) {
	const [ js, css ] = await bundling
	t.snapshot( css )
} )
