const test = require( 'ava' )
const bundle = require( './bundle' )

process.chdir( __dirname )

const bundling = bundle( 'preserve-whitespace.rgl', {
	preserveWhitespace: false
} )

test.serial( 'preserveWhitespace - js', async function ( t ) {
	const [ js, css ] = await bundling
	t.snapshot( js )
} )
