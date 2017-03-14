var parse = require( './parser' )
var loaderUtils = require( 'loader-utils' )
var path = require('path')

module.exports = function( content ) {
	this.cacheable()
	var query = loaderUtils.parseQuery( this.query )
	var filename = path.basename( this.resourcePath )
	var parts = parse( content, filename, this.sourceMap )
	var part = parts[query.type][query.index]
	this.callback( null, part.content, part.map )
}
