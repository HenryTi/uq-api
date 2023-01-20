"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbs = void 0;
const tool_1 = require("../../tool");
const my_1 = require("./my");
let dbs;
function getDbs() {
    if (dbs !== undefined)
        return dbs;
    switch (tool_1.env.sqlType) {
        default:
        case tool_1.SqlType.mssql:
            throw new Error('sqltype mssql not implemented');
        case tool_1.SqlType.mysql:
            dbs = new my_1.MyDbs();
    }
    return dbs;
}
exports.getDbs = getDbs;
//# sourceMappingURL=Dbs.js.map