"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BPendingWrite = void 0;
const sql_1 = require("../sql");
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const statementWithFrom_1 = require("../sql/statementWithFrom");
class BPendingWrite extends bstatement_1.BStatement {
    body(sqls) {
        let syncStats = [];
        let { pending, alias: pendingAlias, act, idVar, set, no, idPointer, idExp, doneIf, doneAction } = this.istatement;
        let { factory, hasUnit, unitField } = this.context;
        let { name, id, done } = pending;
        if (act === '+') {
            let vPendingId = '$pending' + no;
            let varPendingId = new sql_1.ExpVar(vPendingId);
            let declare = factory.createDeclare();
            sqls.push(declare);
            let bigInt = new il_1.BigInt();
            declare.var(vPendingId, bigInt);
            let setPendingId = factory.createSet();
            sqls.push(setPendingId);
            // 2020-12-22: 现在只能整个uq服务器公用一个uid生成，容易阻塞，以后可以分开的。
            setPendingId.equ(vPendingId, new sql_1.ExpFuncDb('$uq', 'uid', new sql_1.ExpNull()));
            let insert = factory.createInsert();
            sqls.push(insert);
            insert.table = new statementWithFrom_1.EntityTable(name, hasUnit);
            let cols = insert.cols;
            cols.push({
                col: id.name,
                val: varPendingId
            });
            for (let s of set) {
                let { col, field, value } = s;
                let val = (0, sql_1.convertExp)(this.context, value);
                cols.push({
                    col: col,
                    val: val,
                });
                syncStats.push(this.context.buildPullTuidField(field, val));
            }
            if (hasUnit === true) {
                insert.cols.push({
                    col: unitField.name,
                    val: new sql_1.ExpParam(unitField.name)
                });
            }
            if (idVar !== undefined) {
                let set = factory.createSet();
                sqls.push(set);
                set.equ(idVar + '_' + idPointer.no, varPendingId);
            }
        }
        else if (act === '-' || act === '=') {
            let table = new statementWithFrom_1.EntityTable(name, hasUnit, pendingAlias);
            let wheres = [];
            if (hasUnit === true) {
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitField.name, pendingAlias), new sql_1.ExpParam(unitField.name)));
            }
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(id.name, pendingAlias), (0, sql_1.convertExp)(this.context, idExp)));
            if (set !== undefined && set.length > 0) {
                let update = factory.createUpdate();
                sqls.push(update);
                update.table = table;
                for (let s of set) {
                    let { col, field, value } = s;
                    let val = (0, sql_1.convertExp)(this.context, value);
                    update.cols.push({
                        col: col,
                        val: act === '-' ? new sql_1.ExpSub(new sql_1.ExpField(col, pendingAlias), val) : val,
                    });
                }
                update.where = new sql_1.ExpAnd(...wheres);
            }
            if (done === undefined || doneAction === 'del') {
                let del = factory.createDelete();
                sqls.push(del);
                del.tables = [table];
                del.from(table);
                del.where(new sql_1.ExpAnd(...wheres));
            }
            else {
                let doneWheres = [
                    ...wheres
                ];
                if (doneIf !== undefined) {
                    doneWheres.push((0, sql_1.convertExp)(this.context, doneIf));
                }
                let updateDone = factory.createUpdate();
                updateDone.table = table;
                let val;
                switch (doneAction) {
                    default:
                        val = sql_1.ExpNum.num1;
                        break;
                    case 'cancel':
                        val = new sql_1.ExpNum(-1);
                        break;
                    case 'red':
                        val = new sql_1.ExpNum(-2);
                        break;
                }
                updateDone.cols = [
                    { col: done.name, val }
                ];
                updateDone.where = new sql_1.ExpAnd(...doneWheres);
                sqls.push(updateDone);
            }
        }
        else {
            throw new Error(act + ' impossible value!');
        }
        sqls.addStatements(syncStats);
    }
}
exports.BPendingWrite = BPendingWrite;
//# sourceMappingURL=pendingWrite.js.map