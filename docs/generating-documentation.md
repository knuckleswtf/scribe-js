# Generating Documentation

To generate your API documentation, use the `scribe generate` command.

```sh
 ./node_modules/.bin/scribe generate -a <your-app-file> -s <your-server-file>
```
- **Your "app file"** is the file where you create your Express app and attach routes. Usually an `index.js` or `app.js`.
  - Make sure to export the `app` object from the app file.
    ```js
    module.exports = app;
    ```
  - Add this line in your app file. Make sure it's placed before your routes are registered:
    ```js
    require('@knuckleswtf/scribe')(app)
    ```
- **Your server file** is the file where you actually start your server (usually by calling `app.listen()`). Sometimes it's the same as your app file, sometimes is's a different file (like `bin/www`).


Running this command will:
- extract information about your API and endpoints from your app file
- start your app using `node your-server-fie` (if you supplied one with ` -s <your-server-file>`) in order to extract possible responses
- generate documentation about your endpoints as a series of Markdown files
- pass these Markdown files to [Pastel](https://github.com/knuckleswtf/pastel-js), which wraps the Markdown files in a HTML, CSS and JavaScript template. 

## Viewing the generated docs
To access your generated docs, find the `index.html` file in your `outputPath` folder (by default, `public/docs`) and open that in your browser.

## Postman collection generation [coming soon]
By default, a Postman collection file which you can import into API clients like Postman or Insomnia is generated alongside your docs. You can view it by visiting `public/docs/collection.json`. This link will also be added to the sidebar of your docs.

You can configure Postman collection generation in the `postman` section of your `.scribe.config.js` file.

- To turn it off, set the `postman.enabled` config option to false.

- The name of the Postman collection will be the value of the `title` key (in the root config, not the `postman` object).

- You can add descriptions and auth information for the collection in the `postman.description` and `postman.auth` keys. 

## Skipping the extraction phase [coming soon]
If you've modified the generated Markdown, and you only want Scribe to transform it to the normal HTML output, you  can use the `--no-extraction` flag. Scribe will skip extracting data from your routes and go straight to the writing phase, where it converts your Markdown to HTML or Blade. See [Advanced Customization](customization.html).

## Overwriting your changes to the Markdown [coming soon]
If you've modified the generated Markdown manually, but you'd like to discard your changes and re-generate based on the data Scribe extracts from your routes, you can pass the `--force` flag.

## Further customization  [coming soon]
Sometimes you need to modify the documentation after it has been generated. See [the guide on customization](customization.html) for help on doing that.
