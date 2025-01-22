import {
    ExpVar, ExpField, ExpGE, convertExp, ExpVal, ExpNum
    , ExpSelect, ExpFunc, ExpKey, SqlEntityTable, ColVal, Statement, ExpFuncCustom
} from "../sql";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { DateTime, HistoryWrite } from "../../il";
import { LockType } from "../sql/select";
import { EntityTable } from '../sql/statementWithFrom';

export class BHistoryWrite extends BStatement<HistoryWrite> {
    override head(sqls: Sqls): void { }

    override body(sqls: Sqls) {
        let syncStats: Statement[] = [];
        let factory = this.context.factory;
        let { no, history, set, inSheet, date: valDate } = this.istatement;
        let { hasUnit, unitField } = this.context;
        let { date, sheetType, sheet, row, user } = history;

        let declare = factory.createDeclare();
        sqls.push(declare);
        let vHistoryDate = '$historydate_' + no;
        declare.var(vHistoryDate, new DateTime(6));

        let expDate: ExpVal;
        let varDate = new ExpVar('$date');
        if (valDate !== undefined) {
            /*
            let setDate = factory.createSet();
            sqls.push(setDate);
            setDate.equ('$historyDate', convertExp(this.context, valDate) as ExpVal);
            */
            expDate = new ExpFunc('LEAST', expDate, convertExp(this.context, valDate) as ExpVal);
        }
        else {
            expDate = varDate;
        }

        let select = factory.createSelect();
        select.column(new ExpFunc(factory.func_max, new ExpField('date')));
        select.from(new EntityTable(history.name, hasUnit));
        select.where(new ExpGE(new ExpField('date'), varDate));
        select.lock = LockType.update;
        /*
        let loop = factory.createWhile();
        sqls.push(loop);
        loop.no = this.istatement.no;
        loop.cmp = new ExpExists(select);
        let addDate = factory.createSet();
        loop.statements.add(addDate);
        addDate.equ('$historyDate', 
            new ExpFuncCustom(factory.func_dateadd, 
                new ExpKey('microsecond'), ExpVal.num1, new ExpVar('$historyDate')));
        */

        let expHistoryDate = new ExpFunc('greatest', varDate,
            new ExpFunc(factory.func_ifnull,
                new ExpFuncCustom(factory.func_dateadd,
                    new ExpKey('microsecond'), ExpNum.num1, new ExpSelect(select)
                ),
                new ExpFunc(factory.func_from_unixtime, ExpNum.num0),
            )
        );
        let setHistoryDate = factory.createSet();
        sqls.push(setHistoryDate);
        setHistoryDate.equ(vHistoryDate, expHistoryDate);

        let insert = factory.createInsert();
        sqls.push(insert);
        insert.table = new SqlEntityTable(history, undefined, hasUnit);
        let cols: ColVal[] = insert.cols = [];
        if (hasUnit === true)
            cols.push({ col: unitField.name, val: new ExpVar(unitField.name) });
        for (let s of set) {
            let { col, field, value } = s;
            let val = convertExp(this.context, value) as ExpVal;
            cols.push({ col: col, val: val });
            syncStats.push(this.context.buildPullTuidField(field, val));
        }
        cols.push({ col: date.name, val: new ExpVar(vHistoryDate) });
        if (sheet !== undefined && inSheet === true) {
            cols.push({ col: sheetType.name, val: new ExpVar('$sheetType') });
            cols.push({ col: sheet.name, val: new ExpVar('$id') });
            cols.push({ col: row.name, val: new ExpVar('$row') });
        }
        if (user !== undefined) {
            cols.push({ col: user.name, val: new ExpVar('$user') });
        }
        sqls.addStatements(syncStats);
    }
}

