"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
class Table {
    async build(x) {
        let { name } = x;
        let sql = `CREATE TABLE IF NOT EXISTS ${name}.${this.name.toLowerCase()}(${this.body});`;
        x.sql(sql);
    }
}
exports.Table = Table;
//# sourceMappingURL=Table.js.map