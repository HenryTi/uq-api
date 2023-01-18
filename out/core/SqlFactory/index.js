"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSqlFactory = void 0;
const tool_1 = require("tool");
const MySqlFactory_1 = require("./MySqlFactory");
function createSqlFactory(sqlType, dbName, hasUnit, twProfix) {
    switch (sqlType) {
        default: throw new Error('sql type other than mysql is not implemented');
        case tool_1.SqlType.mysql: return new MySqlFactory_1.MySqlFactory(dbName, hasUnit, twProfix);
    }
}
exports.createSqlFactory = createSqlFactory;
//# sourceMappingURL=index.js.map