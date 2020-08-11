# Overview

Generate API documentation for humans from your Node.js codebase. [Here's what the output looks like](https://shalvah.me/TheCensorshipAPI/).


```eval_rst
.. admonition:: Wondering where to get started?
   
   Check out our getting started guide for your framework: `Express <guide-getting-started/express.html>`_,  `Adonis.js <guide-getting-started/adonis.html>`_.
```

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
For now, only Express 4+ and Adonis.js 4 are supported.

## Usage
Node.js 10 or higher is required.

### Express
Install with:

```sh
npm i @knuckleswtf/scribe-express
```

To generate your docs, you'll need to locate your "app file". Your app file is the file where you create your Express app. Make sure to export the `app` object from the file. Also, add this line in that file before registering your routes:

```js
require('@knuckleswtf/scribe')(app)
```

To generate your docs, run:

```sh
npx scribe generate -a <your-app-file>.js
```

## Adonis.js

Install with:

```sh
npm i @knuckleswtf/scribe-adonis
```

Then add the service provider to the `aceProviders` array in your `start/app.js`:

```js
const aceProviders = [
  '@adonisjs/lucid/providers/MigrationsProvider',
  '@knuckleswtf/scribe-adonis/providers/ScribeProvider',
]
```

To generate your docs, run the Ace command `scribe:generate`:

```bash
node ace scribe:generate
````