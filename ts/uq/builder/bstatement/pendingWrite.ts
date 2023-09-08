import { ExpVar, ExpField, ExpCmp, ExpEQ, convertExp, ExpVal, ExpAnd, ExpFuncDb, ExpSub, ExpParam, Statement, ExpNum, ExpNull } from "../sql";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { PendingWrite, BigInt } from "../../il";
import { EntityTable } from '../sql/statementWithFrom';

export class BPendingWrite extends BStatement {
    protected istatement: PendingWrite;
    body(sqls: Sqls) {
        let syncStats:Statement[] = [];
        let {pending, alias: pendingAlias, act, idVar, set, no, idPointer, idExp, doneIf, doneAction} = this.istatement;
        let {factory, hasUnit, unitField} = this.context;
        let {name, id, done} = pending;
        if (act === '+') {
            let vPendingId = '$pending' + no;
            let varPendingId = new ExpVar(vPendingId);
            let declare = factory.createDeclare();
            sqls.push(declare);
            let bigInt = new BigInt();
			declare.var(vPendingId, bigInt);
			let setPendingId = factory.createSet();
			sqls.push(setPendingId);
			// 2020-12-22: 现在只能整个uq服务器公用一个uid生成，容易阻塞，以后可以分开的。
			setPendingId.equ(vPendingId, new ExpFuncDb('$uq', 'uid', new ExpNull()));
            let insert = factory.createInsert();
            sqls.push(insert);
            insert.table = new EntityTable(name, hasUnit);
            let cols = insert.cols;
            cols.push({
                col: id.name,
                val: varPendingId
            });
            for (let s of set) {
                let {col, field, value} = s;
                let val = convertExp(this.context, value) as ExpVal;
                cols.push({
                    col: col,
                    val: val,
                });
                syncStats.push(this.context.buildPullTuidField(field, val));
            }
            if (hasUnit === true) {
                insert.cols.push({
                    col: unitField.name,
                    val: new ExpParam(unitField.name)
                });
            }
            if (idVar !== undefined) {
                let set = factory.createSet();
                sqls.push(set);
                set.equ(idVar + '_' + idPointer.no, varPendingId);
            }
        }
        else if (act === '-' || act === '=') {
			let table = new EntityTable(name, hasUnit, pendingAlias);
			let wheres:ExpCmp[] = [];
			if (hasUnit === true) {
				wheres.push(new ExpEQ(new ExpField(unitField.name, pendingAlias), new ExpParam(unitField.name)));
			}
			wheres.push(new ExpEQ(new ExpField(id.name, pendingAlias), convertExp(this.context, idExp) as ExpVal));

			if (set !== undefined && set.length > 0) {
                let update = factory.createUpdate();
                sqls.push(update);
                update.table = table;
                for (let s of set) {
                    let {col, field, value} = s;
                    let val = convertExp(this.context, value) as ExpVal;
                    update.cols.push({
                        col: col,
                        val: act==='-'? new ExpSub(new ExpField(col, pendingAlias), val) : val,
                    });
                }
                update.where = new ExpAnd(...wheres);
			}
			if (done === undefined || doneAction === 'del') {
				let del = factory.createDelete();
				sqls.push(del);
				del.tables = [table];
				del.from(table);
				del.where(new ExpAnd(...wheres));
			}
			else {
				let doneWheres: ExpCmp[] = [
					...wheres
				];
				if (doneIf !== undefined) {
					doneWheres.push(convertExp(this.context, doneIf) as ExpCmp);
				}
	
				let updateDone = factory.createUpdate();
				updateDone.table = table;
				let val: ExpVal;
				switch (doneAction) {
					default: val = ExpNum.num1; break;
					case 'cancel': val = new ExpNum(-1); break;
					case 'red': val = new ExpNum(-2); break;
				}
				updateDone.cols = [
					{col: done.name, val}
				]
				updateDone.where = new ExpAnd(...doneWheres);
				sqls.push(updateDone);
			}
        }
        else {
            throw new Error(act + ' impossible value!');
        }
        sqls.addStatements(syncStats);
    }
}
