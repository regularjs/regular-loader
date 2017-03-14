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
		tree = JSON.parse( content.compiled );
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

	var root = content.root;
	var data = content.data;

	// use `module.exports` to export
	return 'module.exports = ' + JSON.stringify( tree ).replace(/"(xxxHTMLLINKxxx[0-9\.]+xxx)"/g, function(total, match) {
		if(!data[match]) return total;
		return 'require(\'' + loaderUtils.urlToRequest(data[match], root) + '\')';
	});
};
