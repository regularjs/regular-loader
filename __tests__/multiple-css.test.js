const test = require( 'ava' )
const bundle = require( './bundle' )

process.chdir( __dirname )

const bundling = bundle( 'multiple-css.rgl' )

test.serial( 'multiple-css - css', async function ( t ) {
	const [ js, css ] = await bundling
	t.snapshot( css )
} )
