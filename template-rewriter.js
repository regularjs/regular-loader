var loaderUtils = require('loader-utils');

// type if -> consequent && alternate
// type list -> body
// type element -> children

function walk( tree, fn ) {
	tree.forEach(function( v ) {
		if( v.type === 'element' ) {
			fn( v );
			if( v.children ) {
				walk( v.children, fn );
			}
		} else if( v.type === 'if' ) {
			walk( v.alternate, fn );
			walk( v.consequent, fn );
		} else if( v.type === 'list' ) {
			walk( v.body, fn );
		}
	})
}

module.exports = function( content ) {
	this.cacheable();

	var query = loaderUtils.parseQuery( this.query );
	var id = query.id;
	var scoped = query.scoped;

	var tree = [];
	try {
		tree = JSON.parse( content );
	} catch( e ) {}

	if( scoped ) {
		walk( tree, function( node ) {
			node.attrs.push({
				type: 'attribute',
				name: id,
				value: ''
			});
		} );
	}

	// previous loaders didn't add module.exports for template, handle it here
	return 'module.exports = ' + JSON.stringify( tree );
};
