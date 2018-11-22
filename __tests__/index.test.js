const test = require( 'ava' )
const rm = require( 'rimraf' )
const path = require( 'path' )
const bundle = require( './bundle' )

test.before( () => {
	rm.sync( path.resolve( __dirname, 'dist' ) )
	process.chdir( __dirname )
} )

test.serial( 'basic', async t => {
	t.snapshot( await bundle( 'basic.rgl' ) )
} )

test.serial( 'css-preprocessor', async t => {
	t.snapshot( await bundle( 'css-preprocessor.rgl' ) )
} )

test.serial( 'multiple-css', async t => {
	t.snapshot( await bundle( 'multiple-css.rgl' ) )
} )

test.serial( 'preserve-whitespace', async t => {
	t.snapshot( await bundle( 'preserve-whitespace.rgl' ) )
} )

test.serial( 'scoped-css', async t => {
	t.snapshot( await bundle( 'scoped-css.rgl' ) )
} )

test.serial( 'deep-selectors', async t => {
	t.snapshot( await bundle( 'deep-selectors.rgl' ) )
} )
