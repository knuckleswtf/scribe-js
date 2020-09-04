# Adding general information about your API

## Authentication information
You can add authentication information for your API using the `auth` section in `.scribe.config.js`. 

```eval_rst
.. Important:: Scribe uses your specified authentication information in three places:

   - Generating an "Authentication" section in your docs
   - Adding authentication parameters to your example requests (only for endpoints marked as :code:`@authenticated`)
   - Adding the necessary auth parameters with the specified value to response calls (only for endpoints marked as :code:`@authenticated`)
```

Here's how you'd configure auth with a query parameter named `apiKey`:

```js
module.exports = {
    // ...
    auth: {
        enabled: true,
        in: 'query',
        name: 'apiKey',
        useValue: () => process.env.SCRIBE_API_KEY,
        extraInfo: 'You can retrieve your key by going to settings and clicking <b>Generate API key</b>.',
    },
    // ...
};
```

If `apiKey` were to be a body parameter, the config would be same. Just set `in` to `'body'`.

Here's an example with a bearer token (also applies to basic auth, if you change `in` to `'basic'`):


```js
module.exports = {
    // ...
    auth: {
        enabled: true,
        in: 'bearer',
        name: 'hahaha', // <--- This value is ignored for bearer and basic auth
        useValue: () => process.env.SCRIBE_API_KEY,
        extraInfo: 'You can retrieve your token by visiting your dashboard and clicking <b>Generate API token</b>.',
    },
    // ...
};
```

And here's an example with a custom header:



```js
module.exports = {
    // ...
    auth: {
        enabled: true,
        in: 'header',
        name:  'Api-Key', // <--- The name of the header
        useValue: () => process.env.SCRIBE_API_KEY,
        extraInfo: 'You can retrieve your token by visiting your dashboard and clicking <b>Generate API token</b>.',
    },
    // ...
};
```

You can set whatever you want as the `extraInfo`. A good idea would be to tell your users where to get their auth key.

The `useValue` field is only used by Scribe for response calls. It won't be included in the generated output or examples. You can specify a hardcoded value or a function that will be called during the response call.

For more information, see the [reference documentation on the auth section](config.html#auth).

## Introductory text
The `introText` key in `.scribe.config.js` is where you can set the text shown to readers in the "Introduction" section. If your text is too long to be put in a config file, you can create a `prepend.md` containing the intro text and put it in the `resources/docs` folder.

## Title
You can set the HTML `<title>` for the generated documentation, and the name of the generated Postman collection by setting the `title` key in `.scribe.config.js`. If you leave it as null, Scribe will infer it from the value of `config('app.name')`.

## Logo
Maybe you've got a pretty logo for your API or company, and you'd like to display that on your documentation page. No worries! To add a logo, set the `logo` key in `.scribe.config.js` to the path of the logo.  Here are your options:

- To point to an image on an external public URL, set `logo` to that URL.
- To point to an image in your codebase, set `logo` to the path of the image. This path will be used as-is in the HTML doc.
- To disable the logo, set `logo` to false.
