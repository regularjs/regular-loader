/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var htmlMinifier = require( 'html-minifier' );
var loaderUtils = require( 'loader-utils' );
var assign = require( 'object-assign' );
var compile = require( 'es6-templates' ).compile;
var url = require( 'url' );
var attrParse = require( './attributesParser' );

var hasOwn = Object.prototype.hasOwnProperty;

function randomIdent() {
	return 'xxxHTMLLINKxxx' + Math.random() + Math.random() + 'xxx';
}

function getLoaderConfig( context ) {
	var query = loaderUtils.parseQuery( context.query );
	var configKey = query.config || 'htmlLoader';
	var config = context.options && hasOwn.call( context.options, configKey ) ? context.options[ configKey ] : {};

	delete query.config;

	return assign( query, config );
}

module.exports = function ( content ) {
	if ( this.cacheable ) {
		this.cacheable();
	}
	var options = this.options.regularjs || this.options.regular || {};
	var config = getLoaderConfig( this );
	var attributes = [ 'img:src' ];
	if ( config.attrs !== undefined ) {
		if ( typeof config.attrs === 'string' ) {
			attributes = config.attrs.split( ' ' );
		} else if ( Array.isArray( config.attrs ) ) {
			attributes = config.attrs;
		} else if ( config.attrs === false ) {
			attributes = [];
		} else {
			throw new Error( 'Invalid value to config parameter attrs' );
		}
	}
	var root = config.root;
	var links = attrParse( content, function ( tag, attr ) {
		return attributes.indexOf( tag + ':' + attr ) >= 0;
	} );
	links.reverse();
	var data = {};
	content = [ content ];
	links.forEach( function ( link ) {
		if ( !loaderUtils.isUrlRequest( link.value, root ) ) {
			return;
		}

		var uri = url.parse( link.value );
		if ( uri.hash !== null && uri.hash !== undefined ) {
			uri.hash = null;
			link.value = uri.format();
			link.length = link.value.length;
		}

		var ident;
		do {
			ident = randomIdent();
		} while ( data[ ident ] );
		data[ ident ] = link.value;
		var x = content.pop();
		content.push( x.substr( link.start + link.length ) );
		content.push( ident );
		content.push( x.substr( 0, link.start ) );
	} );
	content.reverse();
	content = content.join( '' );

	if ( options.preserveWhitespace === false ) {
		content = htmlMinifier.minify( content, {
			caseSensitive: true,
			collapseWhitespace: true,
			collapseInlineTagWhitespace: true,
			preserveLineBreaks: false,
			removeTagWhitespace: false,
			keepClosingSlash: true,
			ignoreCustomFragments: [ /\{[\s\S]*?\}/ ],
			trimCustomFragments: true,
			removeAttributeQuotes: false,
		} );
	}

	if ( config.interpolate ) {
		content = compile( '`' + content + '`' ).code;
	}

	return {
		html: content,
		data: data,
		root: root
	};
};
