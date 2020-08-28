module.exports = {
    /*
     * The base URL to be used in examples.
     */
    baseUrl: "http://yourApi.dev",

    /*
     * The HTML <title> for the generated documentation, and the name of the generated Postman collection and OpenAPI spec.
     */
    title: "API Documentation",
    description: '',

    /*
     * Custom logo path. This will be used as the value of the src attribute for the <img> tag,
     * so make sure it points to a public URL or path accessible from your web server. For best results, the image width should be 230px.
     * Set this to false to not use a logo.
     */
    logo: false,

    /*
     * HTML documentation, assets and Postman collection will be generated to this folder.
     * Source Markdown will still be in docs/.
     */
    outputPath: 'public/docs',

    /*
     * How is your API authenticated? This information will be used in the displayed docs, generated examples and response calls.
     */
    auth: {
        /*
         * Set this to true if your API is authenticated.
         */
        enabled: false,
        /*
         * Where is the auth value meant to be sent in a request?
         * Options: query, body, query_or_body, basic, bearer, header (for custom header)
         */
        in: 'bearer',
        /*
         * The name of the parameter (eg token, key, apiKey) or header (eg Authorization, Api-Key).
         */
        name: 'token',
        /*
         * Any extra authentication-related info for your users. For instance, you can describe how to find or generate their auth credentials.
         * Markdown and HTML are supported.
         */
        extraInfo: 'You can retrieve your token by visiting your dashboard and clicking <b>Generate API token</b>.',
    },

    /*
     * The routes for which documentation should be generated.
     * Each group contains rules defining which routes should be included ('include' and 'exclude' sections)
     * and settings which should be applied to them ('apply' section).
     */
    routes: [
        {
            /*
             * Include any routes whose paths match this pattern (use * as a wildcard to match any characters). Example: '/api/*.*'.
             */
            include: ['*'],
            /*
             * Exclude any routes whose paths match this pattern (use * as a wildcard to match any characters). Example: '/admin/*.*'.
             */
            exclude: ['*.websocket'],
            apply: {
                /*
                 * Specify headers to be added to the example requests
                 */
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                /*
                 * If no @response declarations are found for the route,
                 * we'll try to get a sample response by attempting an API call.
                 * Configure the settings for the API call here.
                 */
                responseCalls: {
                    /*
                     * The base URL to use when making requests. This should be the URL (+ port) you run on localhost.
                     */
                    baseUrl: "http://localhost:3000",
                    /*
                     * API calls will be made only for routes in this group matching these HTTP methods (GET, POST, etc).
                     * List the methods here or use '*' to mean all methods. Leave empty to disable API calls.
                     */
                    methods: ['GET'],
                    /*
                     * Environment variables which should be set for the API call.
                     * This is a good place to ensure that notifications, emails and other external services
                     *  are not triggered during the documentation API calls.
                     * You can also create a `.env.docs` file instead.
                     */
                    env: {
                        // NODE_ENV: 'docs'
                    },
                    /*
                     * The value of the auth parameter (in your auth section above) to be used by Scribe to authenticate response calls.
                     * If this value is null, Scribe will use a random value. If you don't have authenticated endpoints, don't worry about this.
                     */
                    auth: () => process.env.SCRIBE_AUTH_KEY,
                }
            }
        }
    ],

    /*
     * Generate a Postman collection in addition to HTML docs.
     * The collection will be generated to {outputPath}/collection.json.
     * Collection schema: https://schema.getpostman.com/json/collection/v2.1.0/collection.json
     */
    postman: {
        enabled: true,
        // Override specific fields in the generated Postman collection. Lodash set() notation is supported.
        overrides: {
            // 'info.version': '2.0.0',
        }
    },

    /*
     * Example requests for each endpoint will be shown in each of these languages.
     * Supported options are: bash, javascript
     */
    exampleLanguages: [
        'javascript',
        'bash'
    ],

    /*
     * Name for the group of endpoints which do not have a @group set.
     */
    defaultGroup: 'Endpoints',

    /*
     * Text to place in the "Introduction" section. Markdown and HTML are supported.
     */
    introText: `Welcome to our API documentation!

<aside>As you scroll, you'll see code examples for working with the API in different programming languages in the dark area to the right (or as part of the content on mobile), and you can switch the programming language of the examples with the tabs in the top right (or from the nav menu at the top left on mobile).</aside>`,

};