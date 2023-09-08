"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableUpdater = exports.Table = void 0;
const il_1 = require("../../il");
class Table {
    constructor(dbName, tblName) {
        this.tab = 0;
        this.hasUnit = true;
        this.isMinuteId = false; // ID id is defined as minute
        this.indexes = [];
        this.dbName = dbName;
        this.name = tblName;
    }
    buildIdIndex() {
        let keysLen = this.keys.length;
        if (this.autoIncId !== undefined &&
            (keysLen > 1 || keysLen === 1 && this.hasUnit === true)) {
            //sb.comma().n().tab(tab);
            let autoIdIndex = new il_1.Index('$id_ix', true);
            autoIdIndex.global = true;
            autoIdIndex.fields = [this.autoIncId];
            this.indexes.push(autoIdIndex);
        }
    }
    isKey(field) {
        return this.keys !== undefined && this.keys.find(k => k === field) !== undefined;
    }
    update(sb) {
        this.start(sb);
        let first = true;
        let tab = this.tab + 1;
        let unit = sb.unit;
        let hasUnit = this.hasUnit === true && unit !== undefined;
        if (hasUnit === true) {
            first = false;
            sb.tab(tab);
            this.field(sb, unit);
        }
        for (let f of this.fields) {
            if (f === undefined)
                continue;
            if (first === true)
                first = false;
            else
                sb.comma().n();
            sb.tab(tab);
            this.field(sb, f);
        }
        if (this.keys !== undefined && this.keys.length > 0) {
            if (first === true)
                first = false;
            else
                sb.comma().n();
            sb.tab(tab);
            this.primaryKey(sb, this.keys);
        }
        else {
            debugger;
            throw 'every table should define keys';
        }
        if (this.indexes !== undefined) {
            for (let index of this.indexes) {
                if (index.fields.length === 0)
                    continue;
                if (first === true)
                    first = false;
                else
                    sb.comma().n();
                sb.tab(tab);
                this.index(sb, index);
            }
        }
        sb.n();
        this.end(sb);
    }
}
exports.Table = Table;
class TableUpdater {
    constructor(context, /*runner: UqBuildApi, */ table) {
        this.context = context;
        // this.runner = runner;
        this.table = table;
        // 原来的 ID IX 只有 const 才能有初始值。现在都可以定义初值。
        // const 有 $valid 字段，为了在生成存储过程的时候区别，在这里取值
        this.field$valid = table.fields.find(v => (v === null || v === void 0 ? void 0 : v.name) === '$valid');
    }
}
exports.TableUpdater = TableUpdater;
//# sourceMappingURL=table.js.map