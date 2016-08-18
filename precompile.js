var Regular = require('regularjs');

module.exports = function( content ) {
	this.cacheable();

	var compiled = Regular.parse( content, {
		stringify: true
	} );

	return compiled;
}
