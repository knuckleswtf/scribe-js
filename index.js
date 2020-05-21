const fileName = process.argv[2] || 'D:\\Projects\\Temp\\whot-server\\index.js';

const app = require(fileName);
g = getExpressRoutes(app._router);
console.log(g);

// Possible (Express, exported app):
// 1. get endpoint
// 2. get url of endpoint
// 3. response calls
// 4. URL Parameters
// 5. Query/body - Scan code for req.body.X, { X } = req.body

// Potential (framework-specific)
// 1. Parameter names and types


function getExpressRoutes(router, basePath = '/') {
    const routes = router.stack.map(function (layer) {
        if (layer.route && typeof layer.route.path === 'string') {
            let methods = Object.keys(layer.route.methods);
            if (methods.length > 20)
                methods = ["ALL"];

            return {methods: methods, path: layer.route.path};
        }

        if (layer.name === 'router') {// Nested routers
            console.log(layer.regexp)
            return getExpressRoutes(layer.handle);
        }

    }).filter(route => route);

    return routes;
}