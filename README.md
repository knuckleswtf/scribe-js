<h1 align="center">Scribe for Node.js</h1>

<p align="center">
  <img src="logo-scribe.png"><br>
</p>

Automatically generate API documentation for humans from your Node.js codebase. [Here's what the output looks like](https://shalvah.me/tweetr-api/). There's a [Laravel version](https://github.com/knuckleswtf/scribe), too!

[![npm version](https://badge.fury.io/js/%40knuckleswtf%2Fscribe.svg)](https://badge.fury.io/js/%40knuckleswtf%2Fscribe)
[![npm](https://img.shields.io/npm/dt/@knuckleswtf/scribe)](https://www.npmjs.com/package/@knuckleswtf/scribe)
[![Build Status](https://travis-ci.com/knuckleswtf/scribe-js.svg?branch=master)](https://travis-ci.com/knuckleswtf/scribe-js)

> 👋 Scribe helps you generate docs automatically, but if you really want to make friendly, maintainable and testable API docs, there's a few more things you need to know. So I made [a course](https://apidocsfordevs.com?utm_source=scribe-js&utm_medium=referral&utm_campaign=none) for you.

## Features
- Pretty HTML documentation page, with included code samples and friendly text
- Included "Try It Out" button so users can test endpoints right from their browser
- Markdown source files that can be edited to modify docs
- Safely calls API endpoints to generate sample responses, with authentication and other custom configuration supported
- Supports Postman collection and OpenAPI (Swagger) spec generation

## Installation
Node.js 12.4.0 or higher is required.

Supported frameworks:
- Adonis.js 4
- Express 4
- Restify 8

```bash
# For Adonis.js
npm i @knuckleswtf/scribe-adonis

# For Express
npm i @knuckleswtf/scribe-express

# For Restify
npm i @knuckleswtf/scribe-restify
```

## Documentation
View the docs at [scribe.knuckles.wtf/nodejs](https://scribe.knuckles.wtf/nodejs).