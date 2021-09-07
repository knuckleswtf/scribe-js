module.exports = {

    theme: 'default',

    /*
     * The docs, Postman collection and OpenAPI spec will be generated to this folder.
     */
    outputPath: 'public/docs',

    /*
     * The base URL displayed in the docs.
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

    tryItOut: {
        /**
         * Add a Try It Out button to your endpoints so consumers can test endpoints right from their browser.
         * Don't forget to enable CORS headers for your endpoints.
         */
        enabled: true,

        /**
         * The base URL for the API tester to use (for example, you can set this to your staging URL).
         * Leave as null to use the same URL displayed in the docs.
         */
        baseUrl: null,
    },

    /*
     * How is your API authenticated? This information will be used in the displayed docs, generated examples and response calls.
     */
    auth: {
        /*
         * Set this to true if any endpoints in your API uses authentication.
         */
        enabled: false,
        /*
         * Set this to true if your API should be authenticated by default.
         * You can then use @unauthenticated or @authenticated on individual endpoints to change their status.
         */
        default: false,
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
         * The value of the auth parameter (in your auth section above) to be used by Scribe to authenticate response calls.
         * If this value is null, Scribe will use a random value. If you don't have authenticated endpoints, don't worry about this.
         */
        useValue: () => process.env.SCRIBE_AUTH_KEY,
        /*
         * Placeholder your users will see for the auth parameter in the example requests.
         * Set this to null if you want Scribe to use a random value as placeholder instead.
         */
        placeholder: '{YOUR_AUTH_KEY}',
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
                     * The base URL Scribe will make requests to. This should be the URL (+ port) you run on localhost.
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

                    bodyParams: {},
                    queryParams: {},
                    fileParams: {},
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
        // Override specific fields in the generated collection. Lodash set() notation is supported.
        overrides: {
            // 'info.version': '2.0.0',
        }
    },

    /*
     * Generate an OpenAPI spec in addition to HTML docs.
     * The spec file will be generated to {outputPath}/openapi.yaml.
     * Specification schema: https://swagger.io/specification/
     */
    openapi: {
        enabled: false,
        // Override specific fields in the generated spec. Lodash set() notation is supported.
        overrides: {
            // 'info.version': '2.0.0',
        }
    },

    /*
     * Example requests for each endpoint will be shown in each of these languages.
     * Supported options are: bash, javascript
     */
    exampleLanguages: [
        'bash',
        'javascript',
    ],

    /*
     * Name for the group of endpoints which do not have a @group set.
     */
    defaultGroup: 'Endpoints',

    /*
     * Text to place in the "Introduction" section. Markdown and HTML are supported.
     */
    introText: `This documentation aims to provide all the information you need to work with our API.

<aside>As you scroll, you'll see code examples for working with the API in different programming languages in the dark area to the right (or as part of the content on mobile).
You can switch the language used with the tabs at the top right (or from the nav menu at the top left on mobile).</aside>`,

    /*
     * If you would like the package to generate the same example values for parameters on each run,
     * set this to any number (eg. 1234)
     */
    fakerSeed: null,
};