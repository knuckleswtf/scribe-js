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
