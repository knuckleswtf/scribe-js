"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fileName = process.argv[2] || 'D:\\Projects\\Temp\\whot-server\\index.js';
const app = require(fileName);
const getRoutes = require("./route_extractors/express");
const g = getRoutes(app);
console.log(g);
// Possible (Express, exported app):
// 1. get endpoint
// 2. get url of endpoint
// 3. response calls
// 4. URL Parameters
// 5. Query/body - Scan code for req.body.X, { X } = req.body
// NB - handle sub-apps
// Potential (framework-specific)
// 1. Parameter names and types (from validation)
//# sourceMappingURL=index.js.map