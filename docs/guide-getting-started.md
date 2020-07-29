# Getting Started

## Set up the package
First, install the package:

```bash
npm i @knuckleswtf/scribe
```

Next, create your config file:

```bash
 ./node_modules/.bin/scribe init
```

This will create a `.scribe.config.js` file in your project directory. Cool.

## Configuration and initialisation
Almost ready! Just a few things...

Two things you need to know:
- **Your "app file"** is the file where you create your Express app. and attach routes. Usually an `index.js` or `app.js`.
- **Your server file** is the file where you actually start your server (usually by calling `app.listen()`). Sometimes it's the same as your app file, sometimes is's a different file (like `bin/www`).

Got that? Cool. Here are the key things to do:

- Make sure to export the `app` object from the app file.

```js
module.exports = app;
```

- Add this line in your app file. Make sure it's paced before your routes are registered:

```js
require('@knuckleswtf/scribe')(app)
```

Lastly, take a peek at your config file (`.scribe.config.js`).

## Do a test run
Now, let's do a test run. Run the command to generate your docs.

```bash
 ./node_modules/.bin/scribe generate -a <your-app-file>.js -s <your-server-file>
```

```eval_rst
   .. Note:: Scribe needs your app file to extract information about your routes. It needs your server file to try to start your app for `response calls <documenting-endpoint-responses.html#generating-responses-automatically-via-response-calls>`_  (if it isn't already running). If your app file is the same as your server file (your app file also starts your HTTP server), you can omit the :code:`-s <your-server-file>`
```


Visit your newly generated docs. Find the `docs/index.html` file in your `public/` folder and open it in your browser.

There's also a Postman collection generated for you by default. You can get it by visiting `public/docs/collection.json` for `static` type, and `<your-app>/docs.json` for `laravel` type.

Great! You've seen what Scribe can do. Now, let's refine our docs to match what we want.

## Add general information about your API
First, let's add some general info about the API. Here are some things you can customise with Scribe:
- The introductory text
- Authentication information
- Languages for the example requests
- A logo to show in your docs.

For details, check out [Documenting API information](documenting-api-information.html).

## Choose your routes
Next up, decide what routes you want to document. This is configured in the `routes` key of `.scribe.config.js`. By default, Scribe will try to document all of your routes, so if you're okay with that, you can leave it at that.

If you'd like to exclude some routes, there are two ways:

- In the docblock for the endpoint, add this tag: `@hideFromAPIDocumentation`.

- The second way is by setting your `routes` config. Here's what it looks like:

```js

    routes: [
        {
            include: ['*'],
            exclude: ['*.websocket'],
            apply: {
                headers: {
                },
                responseCalls: {
                    methods: ['GET'],
                }
            }
        }
    ],
```

With Scribe, you split up your routes into route groups. Each entry in the `routes` array is a single group. The main purpose of these groups is so you can apply different settings to multiple endpoints in one go. For instance, for some routes, you'd like an `Api-Version` header to be added to some routes, but not others, you can easily configure that here. You can also configure [response calls](documenting-endpoint-responses.html#generating-responses-automatically-via-response-calls) in here.

By default, all your routes are in a single group, and we recommend leaving them like that. You can split your routes later if you realise you need to. 

[Here's the full documentation on configuring routes](config.html#routes).

## Add information to your routes
Scribe tries to figure out information about your routes, but it needs more help from you to go far. Here's some information you can enrich:
- Groups (you can group your endpoints by domain eg "User management", "Order information")
- URL parameters
- Request Headers
- Body parameters
- Query parameters
- Example responses
- Fields in the response

Check out how to do this in the guide on [Documenting your API](documenting.html).

## Generate and publish
After making changes as needed, you can run `scribe generate` as many times as you want.

When you're happy with how your documentation looks, you're good to go. You can add the generated documentation to your version control and deploy as normal, and your users will be able to access it as you've configured.
