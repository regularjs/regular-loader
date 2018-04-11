const test = require( 'ava' )
const bundle = require( './bundle' )

process.chdir( __dirname )

const bundling = bundle( 'scoped-css.rgl' )

test.serial( 'scoped-css - js', async function ( t ) {
	const [ js, css ] = await bundling
	t.snapshot( js )
} )

test.serial( 'scoped-css - css', async function ( t ) {
	const [ js, css ] = await bundling
	t.snapshot( css )
} )
