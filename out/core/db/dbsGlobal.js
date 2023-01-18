"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDbs = exports.dbs = void 0;
const tool_1 = require("../../tool");
const my_1 = require("./my");
function createDbs() {
    switch (tool_1.env.sqlType) {
        default:
        case tool_1.SqlType.mssql:
            throw new Error('sqltype mssql not implemented');
        case tool_1.SqlType.mysql:
            exports.dbs = new my_1.MyDbs();
    }
    return exports.dbs;
}
exports.createDbs = createDbs;
//# sourceMappingURL=dbsGlobal.js.map