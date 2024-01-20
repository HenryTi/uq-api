"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUrlDebug = void 0;
const node_fetch_1 = require("node-fetch");
const tool_1 = require("../tool");
const urlDebugPromises = {};
async function getUrlDebug() {
    let urlDebug = `http://${tool_1.env.localhost}/`; //urlSetUqHost();
    let urlDebugPromise = urlDebugPromises[urlDebug];
    if (urlDebugPromise === true)
        return urlDebug;
    if (urlDebugPromise === false)
        return undefined;
    if (urlDebugPromise === undefined) {
        urlDebugPromise = fetchHello(urlDebug);
        urlDebugPromises[urlDebug] = urlDebugPromise;
    }
    let ret = await urlDebugPromise;
    if (ret === null) {
        urlDebugPromises[urlDebug] = false;
        return undefined;
    }
    else {
        urlDebugPromises[urlDebug] = true;
        return ret;
    }
}
exports.getUrlDebug = getUrlDebug;
async function fetchHello(url) {
    try {
        let ret = await (0, node_fetch_1.default)(url + 'hello');
        if (ret.status !== 200)
            throw 'not ok';
        let text = await ret.text();
        return url;
    }
    catch (_a) {
        return null;
    }
}
//# sourceMappingURL=getUrlDebug.js.map