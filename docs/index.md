# Overview

Generate API documentation for humans from your Node.js codebase. [Here's what the output looks like](https://shalvah.me/tweetr-api/).

There's a [Laravel version](https://github.com/knuckleswtf/scribe), too!

```eval_rst
.. admonition:: Wondering where to start?
   
   Check out our getting started guide for your framework: `Adonis.js 4 <guide-getting-started/adonis.html>`_, `Express <guide-getting-started/express.html>`_, and `Restify <guide-getting-started/restify.html>`_,.
```

```eval_rst
.. Tip:: 👋 Scribe helps you generate docs automatically, but if you really want to make friendly, maintainable and testable API docs, there's a few more things you need to know. So I made `a course <https://apidocsfordevs.com?utm_source=scribe-js-docs&utm_medium=referral&utm_campaign=none>`_ for you.
```

## Features
- Pretty HTML documentation page, with included code samples and friendly text
- Included "Try It Out" button so users can test endpoints right from their browser
- Markdown source files that can be edited to modify docs
- Safely calls API endpoints to generate sample responses, with authentication and other custom configuration supported
- Supports Postman collection and OpenAPI (Swagger) spec generation

## Contents
```eval_rst
.. toctree::
   :maxdepth: 2

   guide-getting-started/index
   documenting/index
   generating-documentation
   config
   customization
```

## Supported frameworks
Currently, only Adonis.js 4, Express 4+ and Restify 8+ are supported.

## Usage
Node.js 12.4.0 or higher is required.

### Adonis.js

Install with:

```sh
npm i @knuckleswtf/scribe-adonis
```

Then add the service provider to the `aceProviders` array in your `start/app.js`:

```js
const aceProviders = [
  '@adonisjs/lucid/providers/MigrationsProvider',
  '@knuckleswtf/scribe-adonis/providers/ScribeProvider', // <-- Add this
]
```

To generate your docs, run the Ace command `scribe:generate`:

```bash
node ace scribe:generate
```

See the [Getting Started Guide](./guide-getting-started/adonis.html) for more.

### Express
Install with:

```sh
npm i @knuckleswtf/scribe-express
```

To generate your docs, you'll need to locate your "app file". Then pass the path to Scribe:

```sh
npx scribe generate -a <your-app-file>.js
```

See the [Getting Started Guide](./guide-getting-started/express.html) for more.

### Restify
Install with:

```sh
npm i @knuckleswtf/scribe-restify
```

To generate your docs, you'll need to locate your "server file". Your server file is the file where you set up and start your Restify server. Then pass the path to Scribe:

```sh
npx scribe generate -s <your-server-file>.js
```

See the [Getting Started Guide](./guide-getting-started/restify.html) for more.
