"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDbNameFromReq = void 0;
const core_1 = require("../core");
function buildDbNameFromReq(req) {
    let { params, baseUrl } = req;
    let { db } = params;
    const test = '/test/';
    let p = baseUrl.indexOf('/test/');
    if (p >= 0) {
        p += test.length;
        if (baseUrl.substring(p, p + db.length) === db) {
            db += core_1.consts.$test;
        }
    }
    return db;
}
exports.buildDbNameFromReq = buildDbNameFromReq;
//# sourceMappingURL=buildDbNameFromReq.js.map