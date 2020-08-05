# Configuration
Here's a rundown of what's available in the `.scribe.config.js` file. 

```eval_rst
.. Tip:: If you aren't sure what an option does, it's best to leave it set to the default.
```

## Output settings

### `outputPath`
Output folder. The HTML documentation, assets and Postman collection will be generated to this folder. Source Markdown will be in `/docs`. Default: `public/docs`.

### `baseUrl`
The base URL to be used in examples.

### `introText`
The text to place in the "Introduction" section. Markdown and HTML are supported.

### `title`
The HTML `<title>` for the generated documentation, and the name of the generated Postman collection.

### `logo`
Path to an image file to use as your logo in the generated docs. This will be used as the value of the src attribute for the `<img>` tag, so make sure it points to a public URL or path accessible from your web server. For best results, the image width should be 230px. Set this to `false` if you're not using a logo. Default: `false`.

```eval_rst
.. Note:: This path will be used as-is in the HTML doc, so make sure it's publicly accessible.
```

### `defaultGroup`
When [documenting your api](documenting/index.html), you use `@group` annotations to group API endpoints. Endpoints which do not have a group annotation will be grouped under the `defaultGroup`. Defaults to `"Endpoints"`.

### `exampleLanguages`
For each endpoint, an example request is shown in each of the languages specified in this array. Currently only `bash`, and `javascript` are supported. Default: `["bash", "javascript"]` 
 
### `postman`
Along with the HTML docs, Scribe can automatically generate a Postman collection for your endpoints. This section is where you can configure or disable that.

The collection will be created in `<outputPath>/collection.json`.

- `enabled`: Whether to generate a Postman API collection. Default: `true`

- `description`: The description for the generated Postman collection.

- `auth`: The custom data to use for Postman's "auth" section. See the schema docs at [https://schema.getpostman.com/json/collection/v2.1.0/collection.json](https://schema.getpostman.com/json/collection/v2.1.0/collection.json).

## Extraction settings
### `auth`
Authentication information about your API. This information will be used:
- to derive the text in the "Authentication" section in the generated docs
- to add the auth headers/query parameters/body parameters to the docs and example requests
- to set the auth headers/query parameters/body parameters for response calls

Here are the available settings:
- `enabled`: Set this to `true` if your API requires authentication. Default: `false`.

- `in`: Where is the auth value meant to be sent in a request? Options:
  - `query` (for a query parameter)
  - `body` (for a body parameter)
  - `basic` (for HTTP Basic auth via an Authorization header)
  - `bearer`(for HTTP Bearer auth via an Authorization header)
  - `header` (for auth via a custom header)

- `name`: The name of the parameter (eg `token`, `key`, `apiKey`) or header (eg `Authorization`, `Api-Key`). When `in` is set to `bearer` or `basic`, this value will be ignored, and the header used will be `Authorization`.

- `useValue` [coming soon]: The value of the parameter to be used by Scribe to authenticate response calls. You can also specify a function that will be called during the response call to provide the authentication value.  This will **not** be included in the generated documentation. If this value is null or a function that returns null, Scribe will use a random value.

- `extraInfo`: Any extra authentication-related info for your users. For instance, you can describe how to find or generate their auth credentials. Markdown and HTML are supported. This will be included in the `Authentication` section.

### `routes`
The `routes` section is an array of items describing what routes in your application that should be included in the generated documentation.

Each item in the `routes` array is a _route group_, an array containing rules defining what routes belong in that group, and what settings to apply to them.

 - `include`: A list of patterns (route paths) which should be included in this group, *even if they do not match the rules in the `match` section*.

- `exclude`: A list of patterns (route names or paths) which should be excluded from this group, *even if they match the rules in the `match` section*.

For instance, supposing our routes are set up like this:

```js
app.get('/users', getUsers);
app.get('/users/{id}', getUserById);
app.get('ping', () => 'pong');
app.get('/admin', launchAdminApp);
```

If we want to match all routes but exclude the `/admin` route, we could use this configuration:

```
routes: {
    include: ['*'],
    exclude: ['/admin'],
}
```

Or this:

```
routes: {
    include: ['/users/*', '/ping'],
    exclude: [],
}
```

```eval_rst
.. Tip:: You can use :code:`*` as a wildcard in :code:`domains, :code:`prefixes`, :code:`include` and :code:`exclude`. For instance, :code:`'exclude' => ['users/*']` will exclude all routes with URLs starting with 'users/'.
```

- `apply`: The `apply` section of the route group is where you specify any additional settings to be applied to those routes when generating documentation. There are a number of settings you can tweak here:

  - `headers` [coming soon]: Any headers you specify here will be added to the headers shown in the example requests in your documentation. They will also be included in response calls. Headers are specified as key => value strings.

  - `responseCalls`: These are the settings that will be applied when making ["response calls"](documenting-endpoint-responses.html#generating-responses-automatically-via-response-calls). 

```eval_rst
.. Tip:: By splitting your routes into groups, you can apply different settings to different routes.
```

### `fakerSeed` [coming soon]
When generating example requests, Scribe uses the `faker` package to generate random values. If you would like the package to generate the same example values for parameters on each run, set this to any number (eg. 1234).

```eval_rst
.. Tip:: Alternatively, you can set example values for parameters when `documenting them <documenting.html>`_.
```
