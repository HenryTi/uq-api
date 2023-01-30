"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlFactory = void 0;
class SqlFactory {
    constructor(props) {
        let { getTableSchema, dbUq, hasUnit } = props;
        this.getTableSchema = getTableSchema;
        this.hasUnit = hasUnit;
        const { name, twProfix } = dbUq;
        this.dbName = name;
        this.twProfix = twProfix;
    }
}
exports.SqlFactory = SqlFactory;
//# sourceMappingURL=SqlFactory.js.map