module.exports = {
    baseUrl: 'http://localhost:8800',
    title: 'My API',
    logo: false,
    router: 'express',
    auth: {},
    routes: [
        {
            include: ['*'],
            exclude: ['*.websocket'],
        }
    ],
    exampleLanguages: [
        'javascript',
        'bash'
    ],
    defaultGroup: 'Endpoints',
};