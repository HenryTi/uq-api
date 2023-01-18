"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlFactory = void 0;
class SqlFactory {
    constructor(props) {
        let { getTableSchema, dbName, hasUnit, twProfix } = props;
        this.getTableSchema = getTableSchema;
        this.dbName = dbName;
        this.hasUnit = hasUnit;
        this.twProfix = twProfix;
    }
}
exports.SqlFactory = SqlFactory;
//# sourceMappingURL=SqlFactory.js.map