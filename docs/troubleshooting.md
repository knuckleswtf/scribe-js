# Troubleshooting and Debugging

```eval_rst
.. attention:: These docs are for Scribe for JS v1, which is no longer maintained. See `scribe.knuckles.wtf/nodejs <http://scribe.knuckles.wtf/nodejs>`_ for Scribe for JS v2.
```

This page contains a few tips to help you figure out what's wrong when Scribe seems to be malfunctioning.

## Update your version
First off, try updating your installed Scribe version. Maybe your problem is due to a bug we've fixed in a newer release. You can see a list of releases and major changes on [the changelog](https://github.com/knuckleswtf/scribe-js/blob/master/CHANGELOG.md).
- To find the exact installed version, run `npm list @knuckleswtf/scribe`
- To update to the latest version, run `npm update @knuckleswtf/scribe`.
- To update to a specific version (example: 2.0.1), run `npm install @knuckleswtf/scribe@2.0.1`.

## Use `--verbose`
By default, Scribe will try to keep going until it processes all routes and generates your docs. If it encounters any problems while processing a route (such as a missing `@responseFile` or some invalid configuration leading to an exception being thrown), it will output a warning and the exception message, then move on to the next route.

You can turn on debug messages and full stack traces with the `--verbose` flag:

```shell
npx scribe generate -a app.js --verbose
```
# Troubleshooting and Debugging
This page contains a few tips to help you figure out what's wrong when Scribe seems to be malfunctioning.

## Increase the verbosity
By default, Scribe will try to keep going until it processes all routes and generates your docs. If it encounters any problems while processing a route (such as a missing `@responseFile`, or some invalid configuration leading to an exception being thrown), it will output a warning and the exception message, then move on to the next route.

If you need to see the full stack trace, you can run the command again with the `--verbose` flag. This will also output debug messages (such as the path Scribe takes in instantiating a model).

## Turn on debug mode for your app
Sometimes you may see a 500 `null` response shown in the generated examples. This is usually because an error occured within your application during a response call. The quickest way to debug this is by setting `app.debug` to `true` in your `responseCalls.config` section in your `.scribe.config.js` file. Alternatively, you can set `APP_DEBUG=true` in your `.env.docs` file and run the command with `--env docs`.  

## Try clearing any cached config
Sometimes Laravel caches config files, and this may lead to Scribe failing with an error about a null `DocumentationConfig`. To fix this, clear the config cache by running `php artisan config:clear`.

## Make sure you aren't matching `web` routes
Routes defined in Laravel's web.php typically have the `web` middleware, leading to strange behaviour, so make sure that you've correctly specified the routes to be matched in your config file. See [this Github issue](https://github.com/knuckleswtf/scribe/issues/47).

## Try clearing previously generated docs
Sometimes you may run into conflicts if you switch from one output type to another. While we try to prevent this happening, we don't guarantee it. In such cases, please try clearing the old docs generated from your previous run (`laravel` would be in `resources/docs` and `storage/docs`, `static` would be in `public/docs`) and then running again.

## Be sure you're accessing your docs correctly
For `laravel` type docs, you should always start your server and visit /docs (or wherever you set as your `docs_url`). For `static` type, you should always open the `index,html` file diretly (located in `public/docs` or wherever you set as your `output_path`).