"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BHistoryBase = void 0;
const entity_1 = require("./entity");
class BHistoryBase extends entity_1.BEntity {
    buildTables() {
        let table = this.context.createTable(this.entity.name);
        table.keys = this.entity.getKeys();
        table.fields = this.entity.getFields();
        let indexes = this.entity.indexes;
        if (indexes !== undefined)
            table.indexes.push(...indexes);
        this.context.appObjs.tables.push(table);
    }
}
exports.BHistoryBase = BHistoryBase;
//# sourceMappingURL=historyBase.js.map