module.exports = {
    baseUrl: "http://yourApi.dev",
    title: "API Documentation",
    logo: false,
    outputPath: 'public/docs',
    auth: {
        enabled: false,
        in: 'bearer',
        name: 'token',
        useValue: () => process.env.SCRIBE_AUTH_KEY,
        extraInfo: 'You can retrieve your token by visiting your dashboard and clicking <b>Generate API token</b>.',
    },
    routes: [
        {
            include: ['*'],
            exclude: ['*.websocket'],
            apply: {
                headers: {

                },
                responseCalls: {
                    baseUrl: "http://localhost:3000",
                    methods: ['GET'],
                    environment: {
                        // NODE_ENV: 'docs
                    }
                }
            }
        }
    ],
    exampleLanguages: [
        'javascript',
        'bash'
    ],
    defaultGroup: 'Endpoints',
    introText: `Welcome to our API documentation!

<aside>As you scroll, you'll see code examples for working with the API in different programming languages in the dark area to the right (or as part of the content on mobile), and you can switch the programming language of the examples with the tabs in the top right (or from the nav menu at the top left on mobile).</aside>`,

};