"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
const config = require("config");
(async function () {
    let port = config.get('local-port');
    let url = `http://localhost:${port}/hello`;
    let resp = await (0, node_fetch_1.default)(url);
    let ret = await resp.text();
    console.log(ret);
    process.exit(999);
})();
//# sourceMappingURL=start-fetch-bus.js.map