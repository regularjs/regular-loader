# regular-loader

[![build status][build-status-image]][build-status-url]
[![npm package][npm-package-image]][npm-package-url]
[![npm package next][npm-package-image-next]][npm-package-url]
[![license][license-image]][license-url]

## Installation

```bash
# for webpack 2/3/4
npm i regular-loader@^1.0.0 -D
```

```bash
# for webpack 1
npm i regular-loader@^0.1.5 -D
```

## Example

### For webpack 2/3

webpack.config.js

```js
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

module.exports = {
    // ...
    module: {
      rules: [{
        test: /\.rgl$/,
        use: {
          loader: 'regular-loader',
          options: {
            extractCSS: true
          }
        },
      }]
    },
    plugins: [
      new ExtractTextPlugin( 'app.css' )
    ]
};
```

### For webpack 4

webpack.config.js

```js
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

module.exports = {
    // ...
    module: {
      rules: [{
        test: /\.rgl$/,
        use: {
          loader: 'regular-loader',
          options: {
            extractCSS: true
          }
        },
      }]
    },
    plugins: [
      new MiniCssExtractPlugin( {
          filename: 'app.css',
      } )
    ]
};
```

## Related

- [regularjs](https://github.com/regularjs/regular)

## Thanks

- [vue-loader](https://github.com/vuejs/vue-loader)

[build-status-image]: https://img.shields.io/circleci/project/regularjs/regular-loader/1.x-release.svg?style=for-the-badge
[build-status-url]: https://circleci.com/gh/regularjs/regular-loader

[npm-package-image]: https://img.shields.io/npm/v/regular-loader.svg?style=for-the-badge
[npm-package-url]: https://www.npmjs.org/package/regular-loader

[npm-package-image-next]: https://img.shields.io/npm/v/regular-loader/next.svg?style=for-the-badge

[license-image]: https://img.shields.io/badge/license-MIT-000000.svg?style=for-the-badge
[license-url]: LICENSE
