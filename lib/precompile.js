var Regular = require( 'regularjs' );

module.exports = function ( content ) {
	this.cacheable();

	var compiled = Regular.parse( content.html, {
		stringify: true
	} );

	return {
		compiled: compiled,
		data: content.data,
		root: content.root
	};
};
