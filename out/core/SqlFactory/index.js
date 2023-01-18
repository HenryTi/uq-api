"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlBuilder = exports.SqlFactory = exports.createSqlFactory = void 0;
const tool_1 = require("../../tool");
const MySqlFactory_1 = require("./MySqlFactory");
const SqlFactory_1 = require("./SqlFactory");
Object.defineProperty(exports, "SqlFactory", { enumerable: true, get: function () { return SqlFactory_1.SqlFactory; } });
function createSqlFactory(props) {
    switch (props.sqlType) {
        default: throw new Error('sql type other than mysql is not implemented');
        case tool_1.SqlType.mysql: return new MySqlFactory_1.MySqlFactory(props);
    }
}
exports.createSqlFactory = createSqlFactory;
var SqlBuilder_1 = require("./SqlBuilder");
Object.defineProperty(exports, "SqlBuilder", { enumerable: true, get: function () { return SqlBuilder_1.SqlBuilder; } });
//# sourceMappingURL=index.js.map