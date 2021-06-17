# Getting Started with Scribe for Restify

## Install and configure
First, install the package:

```bash
npm i @knuckleswtf/scribe-restify
```

Next, create your config file:

```bash
npx scribe init
```

This will ask you a few questions and create a `.scribe.config.js` file in your project directory. There are a few other useful settings you should change in that file, but we'll leave them as is for now.

## Initialise
Almost ready!

One more thing: you need to locate **your "server file"** — the file where you set up and start your Restify server. Usually an `index.js` or `server.js`.

Add this line in your server file, at the top, before you require restify:

```js
require('@knuckleswtf/scribe-restify')()
```

```eval_rst
.. Tip:: You can leave this line in permanently. When you run your app normally (eg with npm start or node), this line does nothing.
```

## Do a test run
Now let's do a test run. Run the command to generate your docs.

```bash
npx scribe generate -s <your-server-file>
```

Visit your newly generated docs. Find the `docs/index.html` file in your `public/` folder and open it in your browser.

```eval_rst
.. Tip:: Your docs are always accessible by opening the public/docs/index.html file on your machine. However, when deployed, you'll probably want to pass it through your Restify app. To do that, you can either set up your own routing or use the `serveStatic plugin <http://restify.com/docs/plugins-api/#servestatic>`_.
```

There's also a Postman collection generated for you. You can get it by visiting `public/docs/collection.json`. The link will also be added to the sidebar of the webpage.
              
If you'd like an OpenAPI (Swagger) spec, Scribe can do that too. Set `openapi.enabled` in your config to `true`, then run the `generate` command. You can get the generated spec by visiting `public/docs/openapi.yaml`. The link will also be added to the sidebar of the webpage.

Great! You've seen what Scribe can do. Now, let's refine our docs to match what we want.

## Add general information about your API
Here are some things you can customise with Scribe:
- The introductory text
- Authentication information
- Languages for the example requests
- A logo to show in your docs.

For details, check out [Documenting API information](documenting/documenting-api-information.html).

## Filter your routes
You might also want to decide what routes you want to document. By default, Scribe will try to document all of your routes (except websocket routes), so if you're okay with that, you can leave it at that.

If you'd like to exclude some routes, there are two ways:

- In the docblock for the route declaration, add this tag: `@hideFromApiDocs`.

```eval_rst
.. Note:: For Restify routes, the docblock containing info for Scribe needs to be on the route declaration, not the function declaration. For instance:

  .. code:: javascript

     class UserController {
       /**
        * This won't work.
        * @hideFromApiDocs
        */
       createUser(req, res) {
       }   
     }
     
     /**
      * This will work.
      * @hideFromApiDocs
      */
     server.post('/users', UserController.createUser)

```

- Set the `routes` key in your `.scribe.config.js`. Here's what it looks like:

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

## Add more information to your routes
Scribe tries to figure out information about your routes, but it needs more help from you to go far. Here's some information you can enrich:
- Groups (you can group your endpoints by domain eg "User management", "Order information")
- URL parameters
- Request Headers
- Body parameters
- Query parameters
- Example responses
- Fields in the response

Check out how to do this in the guide on [Documenting your API](documenting/).

## Generate and publish
After making changes as needed, you can run `scribe generate` as many times as you want.

When you're happy with how your documentation looks, you're good to go. You can add the generated documentation to your version control and deploy as normal, and your users will be able to access it as you've configured.
