# regular-loader

[![build status][build-status-image]][build-status-url]
[![npm package][npm-package-image]][npm-package-url]
[![license][license-image]][license-url]

Here is a simple example using regular-loader [check it out](https://github.com/fengzilong/regular-loader-example)

## Installation

```bash
$ npm i regular-loader -D
```

## Usage

webpack.config.js

```js
var ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

module.exports = {
	// ...
	entry: './index.js',
	module: {
		loaders: [
			{
				test: /\.rgl$/,
				loader: 'regular'
			}
		]
	},
	regular: {
		loaders: {
			css: ExtractTextPlugin.extract( 'css' ),
			mcss: ExtractTextPlugin.extract( 'css!mcss' )
		}
	},
	plugins: [
		// ...
		new ExtractTextPlugin( 'app.css' )
	]
};
```

## Related

- [regularjs](https://github.com/regularjs/regular)

## Thanks

- [vue-loader](https://github.com/vuejs/vue-loader)

[build-status-image]: https://img.shields.io/circleci/project/regularjs/regular-loader/master.svg?style=flat-square
[build-status-url]: https://circleci.com/gh/regularjs/regular-loader

[npm-package-image]: https://img.shields.io/npm/v/regular-loader.svg?style=flat-square
[npm-package-url]: https://www.npmjs.org/package/regular-loader

[license-image]: https://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]: LICENSE
