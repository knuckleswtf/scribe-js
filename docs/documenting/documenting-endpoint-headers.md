# Documenting headers for endpoints

```eval_rst
.. attention:: These docs are for Scribe for JS v1, which is no longer maintained. See `scribe.knuckles.wtf/nodejs <http://scribe.knuckles.wtf/nodejs>`_ for Scribe for JS v2.
```

To specify headers to be added to your endpoints, you can use the `apply.headers` section of the route group in `.scribe.config.js`. For instance, if you have this config:

```js
  routes: {
    include: ['v2/*'],
    exclude: [],
    apply: {
      headers: {
        'Api-Version': 'v2',
      }
    }
  }
```

All endpoints that start with `v2/` will have the header `Api-Version: v2` included in their example requests and response calls.

Alternatively, you can use the `@header` doc block tag, in the format `@header <name> <optional example>`:

```js
/**
 * @header X-Api-Version v1
 */

```
