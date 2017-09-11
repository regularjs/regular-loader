# regular-loader

[![build status][build-status-image]][build-status-url]
[![npm package][npm-package-image]][npm-package-url]
[![license][license-image]][license-url]

> webpack loader for [regularjs](https://github.com/regularjs/regular)

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

index.js

```js
import App from './app.rgl';
new App().$inject( document.body );
```

app.rgl

```html
<style>
	html {
		background-color: #F2F2F2;
	}
</style>

<style lang="mcss" scoped>
	.outter {
		.inner {
			color: #000;
		}
	}
</style>

<template>
	<div class="outter">
		<div class="inner">RegularJs is Awesome <Button text="get started"></Button></div>
	</div>
</template>

<script>
	import Button from './button.rgl';

	// export options here
	export default {
		// shorthand for registering components in current component scope
		components: {
			'Button': Button,
		}
	}
</script>
```

button.rgl

```html
<template>
	<button>{ text }</button>
</template>

<script>
	import Regular from 'regularjs';

	// or export component constructor here
	export default Regular.extend({
		// ...
	});
</script>
```

Try it out!

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
