# Overview

Generate API documentation for humans from your Node.js codebase. [Here's what the output looks like](https://shalvah.me/TheCensorshipAPI/).


```eval_rst
.. admonition:: Wondering where to get started?
   
   Check out the `getting started guide <guide-getting-started.html>`_.
```

## Contents
```eval_rst
.. toctree::
   :maxdepth: 2

   guide-getting-started
   documenting/index
   generating-documentation
   config
```

## Supported frameworks
For now, only Express 4+ is supported.

## Usage
Node.js 10 or higher is required.

Install with:

```sh
npm i @knuckleswtf/scribe
```

To generate your docs, you'll need to locate your "app file". Your app file is the file where you create your Express app. Make sure to export the `app` object from the file. Also, add this line in that file before registering your routes:

```js
require('@knuckleswtf/scribe')(app)
```

Then run:

```sh
 ./node_modules/.bin/scribe generate -a <your-app-file>.js
```