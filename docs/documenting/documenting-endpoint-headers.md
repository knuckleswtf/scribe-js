# Documenting headers for endpoints [coming soon]

To specify headers to be added to your endpoints, use the `apply.headers` section of the route group in `.scribe.config.js`. For instance, if you have this config:

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
