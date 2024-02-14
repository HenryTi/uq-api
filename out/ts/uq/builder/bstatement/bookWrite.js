"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBookWrite = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const sqlBuilder_1 = require("../sql/sqlBuilder");
class BBookWrite extends bstatement_1.BStatement {
    body(sqls) {
        if (this.istatement.book.type === 'map') {
            this.buildMapWrite(sqls);
        }
        else {
            this.buildBookWrite(sqls);
        }
    }
    buildMapWrite(sqls) {
        let { factory } = this.context;
        let { book, set, at, no } = this.istatement;
        let map = book;
        let { name, keys, fields, from, isOpen } = map; // 引用的map，只写keys，其它字段从源导入
        let { hasUnit, unitField } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        // 在at中，有*号，则是update，否则upsert
        let hasStar = false;
        function varName(n) { return '_$' + no + '_' + n; }
        let declareAndSet = (f, val) => {
            let vName = varName(f.name);
            declare.var(vName, f.dataType);
            let set = factory.createSet();
            sqls.push(set);
            set.equ(vName, val);
            sqls.push(this.context.buildPullTuidField(f, val));
        };
        for (let i = 0; i < keys.length; i++) {
            let keyVal = at[i];
            if (keyVal) {
                declareAndSet(keys[i], (0, sql_1.convertExp)(this.context, keyVal));
            }
            else {
                hasStar = true;
            }
        }
        for (let ws of set) {
            let { col, field, value } = ws;
            declareAndSet(field, (0, sql_1.convertExp)(this.context, value));
        }
        let cols = [];
        for (let ws of set) {
            let { col } = ws;
            let val = new sql_1.ExpVar(varName(col));
            let { equ } = ws;
            cols.push({ col, val, setEqu: equ });
        }
        let ats = [];
        let len = at.length;
        let f0 = keys[0];
        let f0n = f0.name;
        ats.push({
            col: f0n,
            val: new sql_1.ExpVar(varName(f0n))
        });
        for (let i = 1; i < len; i++) {
            if (!at[i])
                continue;
            let f = keys[i];
            let fn = f.name;
            ats.push({
                col: fn,
                val: new sql_1.ExpVar(varName(fn))
            });
        }
        if (hasStar === true) {
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new sql_1.SqlEntityTable(map, undefined, hasUnit);
            update.cols = cols;
            let wheres = [];
            for (let at of ats) {
                if (at === undefined)
                    continue;
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(at.col), at.val));
            }
            if (hasUnit === true) {
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(sqlBuilder_1.unitFieldName), new sql_1.ExpVar(sqlBuilder_1.unitFieldName)));
            }
            update.where = new sql_1.ExpAnd(...wheres);
        }
        else {
            let upsert = factory.createInsert();
            sqls.push(upsert);
            upsert.table = new sql_1.SqlEntityTable(map, undefined, hasUnit);
            upsert.cols = cols;
            upsert.keys = ats;
            if (hasUnit === true) {
                ats.push({
                    col: sqlBuilder_1.unitFieldName,
                    val: new sql_1.ExpVar(sqlBuilder_1.unitFieldName),
                });
            }
        }
        if (isOpen === true) {
            let key = new sql_1.ExpFunc(factory.func_concat_ws, new sql_1.ExpStr('\\t'), ...ats.map(v => v.val));
            let mq = this.context.buildModifyQueue(map, key);
            if (mq)
                sqls.push(...mq);
        }
    }
    buildBookWrite(sqls) {
        let { factory } = this.context;
        let { book, set, at, no } = this.istatement;
        let { keys } = book;
        let { hasUnit, unitField } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        let vOrder = '_order_' + no;
        let varOrder = new sql_1.ExpVar(vOrder);
        declare.var(vOrder, new il_1.Int());
        let upsert = factory.createInsert();
        sqls.push(upsert);
        if (book.type === 'tablevar') {
            upsert.table = new sql_1.SqlVarTable(book.name);
        }
        else {
            upsert.table = new sql_1.SqlEntityTable(book, undefined, hasUnit);
        }
        let cols = [];
        for (let ws of set) {
            let { col, field, value } = ws;
            let val = (0, sql_1.convertExp)(this.context, value);
            let { equ } = ws;
            cols.push({ col: col, val: val, setEqu: equ });
            sqls.push(this.context.buildPullTuidField(field, val));
        }
        upsert.cols = cols;
        let ats = [];
        if (hasUnit === true && upsert.table.hasUnit) {
            ats.push({
                col: sqlBuilder_1.unitFieldName,
                val: new sql_1.ExpVar(sqlBuilder_1.unitFieldName),
            });
        }
        let len = at.length;
        let f0 = keys[0];
        let a0 = at[0];
        let key0Exp = (0, sql_1.convertExp)(this.context, a0);
        ats.push({
            col: f0.name,
            val: key0Exp
        });
        sqls.push(this.context.buildPullTuidField(f0, key0Exp));
        for (let i = 1; i < len; i++) {
            let f = keys[i];
            let a = at[i];
            let val = (0, sql_1.convertExp)(this.context, a);
            ats.push({
                col: f.name,
                val: val
            });
            sqls.push(this.context.buildPullTuidField(f, val));
        }
        upsert.keys = ats;
    }
}
exports.BBookWrite = BBookWrite;
//# sourceMappingURL=bookWrite.js.map