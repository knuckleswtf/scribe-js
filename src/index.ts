const fileName = process.argv[2] || 'D:\\Projects\\Temp\\whot-server\\index.js';

const app = require(fileName);
import getRoutes = require('./get_routes/express');
import extractResponses = require('./extract_info/responses/express');
const g = getRoutes(app);

(async () => {
    console.log(await extractResponses(g[g.length - 2], fileName));
    g.forEach(endpoint => {
    });
})();

// Possible (Express, exported app):
// 1. get endpoint
// 2. get url of endpoint
// 3. response calls
// 4. URL Parameters
// 5. Query/body - Scan code for req.body.X, { X } = req.body
// NB - handle sub-apps

// Potential (framework-specific)
// 1. Parameter names and types (from validation)

