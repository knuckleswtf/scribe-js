# Documenting query and URL parameters for an endpoint

```eval_rst
.. attention:: These docs are for Scribe for JS v1, which is no longer maintained. See `scribe.knuckles.wtf/nodejs <http://scribe.knuckles.wtf/nodejs>`_ for Scribe for JS v2.
```

## Specifying query parameters
To describe query parameters for your endpoint, use the `@queryParam` annotation on the method handling it.

The `@queryParam` annotation takes the type of the parameter (optional), its name, an optional "required" label, and a description.

Here's an example:

```js
/**
 * @queryParam sort Field to sort by. Defaults to 'id'.
 * @queryParam fields required Comma-separated fields to include in the response
 * @queryParam filters[published_at] Filter by date published.
 * @queryParam filters[title] Filter by title.
 */
app.get('posts', (req, res) => {
});
```

The query parameters will be included in the generated documentation text and example requests:

![](../images/endpoint-queryparams-1.png)

![](../images/endpoint-queryparams-2.png)

## Specifying example values
By default, Scribe will generate a random value for each parameter, to be used in the example requests and response calls. If you'd like to use a specific example value, you can do so by adding `Example: your-example-here` to the end of your description.

```eval_rst
.. Tip:: You can exclude a particular parameter from the generated examples by ending with `No-example` instead. The parameter will still be included in the text of the documentation, but it won't be included in response calls or shown in the example requests.
```

For instance:

```js
/**
 * @queryParam sort Field to sort by. Defaults to 'id'. Example: published_at
 * @queryParam fields required Comma-separated fields to include in the response. Example: title,published_at,id
 * @queryParam filters[published_at] Filter by date published. No-example
 * @queryParam filters[title] Filter by title. No-example
*/
```

![](../images/endpoint-queryparams-3.png)

## Describing URL parameters
To describe parameters in the URL, use the `@urlParam` annotation. For instance, if you defined your Express route like this:

```js
app.get('/posts/:id/:lang?', (req, res) => {
});
```

you can use this annotation to describe the `id` and `lang` parameters as shown below. The annotation takes the name of the parameter, an optional "required" label, and then its description. Like with `@queryParams`, a random value will be generated, but you can specify the value to be used in examples and response calls using the `Example: ` syntax.

```js
/**
 * @urlParam {int} id required The ID of the post.
 * @urlParam {string} lang The language. Example: en
 */

app.get('posts/:id/:lang?', (req, res) => {
});
```

![](../images/endpoint-urlparams-1.png)

```eval_rst
.. Note:: If you want Scribe to omit an optional parameter (`lang` in our example) in requests and response calls, specify :code:`No-example` for the parameter.
```

```js
/**
 * @urlParam {int} id required The ID of the post.
 * @urlParam {string} lang The language. No-example
 */
app.get('posts/:id/:lang?', (req, res) => {
});
```

![](../images/endpoint-urlparams-2.png)
