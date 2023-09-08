import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { BookWrite, Int, Map, Field } from "../../il";
import { ExpVar, ExpFunc, ExpField, ExpEQ, convertExp, ExpVal, ExpAnd, SqlEntityTable, ColVal, ExpCmp, ExpStr, SqlVarTable } from "../sql";
import { unitFieldName } from "../sql/sqlBuilder";

export class BBookWrite extends BStatement {
    protected istatement: BookWrite;
    body(sqls: Sqls) {
        if (this.istatement.book.type === 'map') {
            this.buildMapWrite(sqls);
        }
        else {
            this.buildBookWrite(sqls);
        }
    }

    private buildMapWrite(sqls: Sqls) {
        let { factory } = this.context;
        let { book, set, at, no } = this.istatement;
        let map = (book as unknown) as Map;
        let { name, keys, fields, from, isOpen } = map; // 引用的map，只写keys，其它字段从源导入
        let { hasUnit, unitField } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);

        // 在at中，有*号，则是update，否则upsert
        let hasStar: boolean = false;

        function varName(n: string) { return '_$' + no + '_' + n }
        let declareAndSet = (f: Field, val: ExpVal) => {
            let vName = varName(f.name);
            declare.var(vName, f.dataType);
            let set = factory.createSet();
            sqls.push(set);
            set.equ(vName, val);
            sqls.push(this.context.buildPullTuidField(f, val));
        }
        for (let i = 0; i < keys.length; i++) {
            let keyVal = at[i];
            if (keyVal) {
                declareAndSet(keys[i], convertExp(this.context, keyVal) as ExpVal);
            }
            else {
                hasStar = true;
            }
        }
        for (let ws of set) {
            let { col, field, value } = ws;
            declareAndSet(field, convertExp(this.context, value) as ExpVal);
        }

        let cols: ColVal[] = [];
        for (let ws of set) {
            let { col } = ws;
            let val: ExpVal = new ExpVar(varName(col));
            let { equ } = ws;
            cols.push({ col, val, setEqu: equ });
        }
        let ats: ColVal[] = [];
        let len = at.length;
        let f0 = keys[0];
        let f0n = f0.name;
        ats.push({
            col: f0n,
            val: new ExpVar(varName(f0n))
        });
        for (let i = 1; i < len; i++) {
            if (!at[i]) continue;
            let f = keys[i];
            let fn = f.name;
            ats.push({
                col: fn,
                val: new ExpVar(varName(fn))
            });
        }

        if (hasStar === true) {
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new SqlEntityTable(map, undefined, hasUnit);
            update.cols = cols;
            let wheres: ExpCmp[] = [];
            for (let at of ats) {
                if (at === undefined) continue;
                wheres.push(new ExpEQ(
                    new ExpField(at.col),
                    at.val
                ))
            }
            if (hasUnit === true) {
                wheres.push(new ExpEQ(
                    new ExpField(unitFieldName),
                    new ExpVar(unitFieldName)
                ));
            }
            update.where = new ExpAnd(...wheres);
        }
        else {
            let upsert = factory.createUpsert();
            sqls.push(upsert);
            upsert.table = new SqlEntityTable(map, undefined, hasUnit);
            upsert.cols = cols;
            upsert.keys = ats;
            if (hasUnit === true) {
                ats.push({
                    col: unitFieldName,
                    val: new ExpVar(unitFieldName),
                });
            }
        }

        if (isOpen === true) {
            let key = new ExpFunc(factory.func_concat_ws, new ExpStr('\\t'), ...ats.map(v => v.val));
            let mq = this.context.buildModifyQueue(map, key);
            if (mq) sqls.push(...mq);
        }
    }

    private buildBookWrite(sqls: Sqls) {
        let { factory } = this.context;
        let { book, set, at, no } = this.istatement;
        let { keys } = book;
        let { hasUnit, unitField } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        let vOrder = '_order_' + no;
        let varOrder = new ExpVar(vOrder);
        declare.var(vOrder, new Int());

        let upsert = factory.createUpsert();
        sqls.push(upsert);
        if (book.type === 'tablevar') {
            upsert.table = new SqlVarTable(book.name);
        }
        else {
            upsert.table = new SqlEntityTable(book, undefined, hasUnit);
        }
        let cols: ColVal[] = [];
        for (let ws of set) {
            let { col, field, value } = ws;
            let val: ExpVal = convertExp(this.context, value) as ExpVal;
            let { equ } = ws;
            cols.push({ col: col, val: val, setEqu: equ });
            sqls.push(this.context.buildPullTuidField(field, val));
        }
        upsert.cols = cols;
        let ats: ColVal[] = [];
        if (hasUnit === true && upsert.table.hasUnit) {
            ats.push({
                col: unitFieldName,
                val: new ExpVar(unitFieldName),
            });
        }
        let len = at.length;
        let f0 = keys[0];
        let a0 = at[0];
        let key0Exp = convertExp(this.context, a0) as ExpVal;
        ats.push({
            col: f0.name,
            val: key0Exp
        });
        sqls.push(this.context.buildPullTuidField(f0, key0Exp));
        for (let i = 1; i < len; i++) {
            let f = keys[i];
            let a = at[i];
            let val = convertExp(this.context, a) as ExpVal;
            ats.push({
                col: f.name,
                val: val
            });
            sqls.push(this.context.buildPullTuidField(f, val));
        }
        upsert.keys = ats;
    }
}
