"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSqlFactory = void 0;
const tool_1 = require("../../tool");
const my_1 = require("./my");
function createSqlFactory(props) {
    switch (tool_1.env.sqlType) {
        default: throw new Error('sql type other than mysql is not implemented');
        case tool_1.SqlType.mysql: return new my_1.MySqlFactory(props);
    }
}
exports.createSqlFactory = createSqlFactory;
//# sourceMappingURL=createSqlFactory.js.map