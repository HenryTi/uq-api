"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BPending = void 0;
const entity_1 = require("./entity");
class BPending extends entity_1.BEntity {
    buildTables() {
        let { name, id, done, keyFields } = this.entity;
        let table = this.context.createTable(name);
        if (id.autoInc === true)
            table.autoIncId = id;
        table.keys = keyFields;
        table.fields = this.entity.getFields();
        let indexes = this.entity.indexes;
        if (indexes !== undefined)
            table.indexes.push(...indexes);
        this.context.appObjs.tables.push(table);
    }
}
exports.BPending = BPending;
//# sourceMappingURL=pending.js.map