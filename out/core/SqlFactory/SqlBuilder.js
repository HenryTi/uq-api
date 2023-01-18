"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlBuilder = void 0;
class SqlBuilder {
    constructor(sqlFactory) {
        this.sqlFactory = sqlFactory;
        let { dbName, twProfix } = sqlFactory;
        this.dbName = dbName;
        this.hasUnit = false; // hasUnit; ID, IDX, IX表，都没有$unit字段，所以当hasUnit=false处理
        this.twProfix = twProfix;
    }
}
exports.SqlBuilder = SqlBuilder;
//# sourceMappingURL=SqlBuilder.js.map