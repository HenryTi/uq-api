"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BHistoryWrite = void 0;
const sql_1 = require("../sql");
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
class BHistoryWrite extends bstatement_1.BStatement {
    head(sqls) { }
    body(sqls) {
        let syncStats = [];
        let factory = this.context.factory;
        let { no, history, set, inSheet, date: valDate } = this.istatement;
        let { hasUnit, unitField } = this.context;
        let { date, sheetType, sheet, row, user } = history;
        let declare = factory.createDeclare();
        sqls.push(declare);
        let vHistoryDate = '$historydate_' + no;
        declare.var(vHistoryDate, new il_1.DateTime(6));
        let expDate;
        let varDate = new sql_1.ExpVar('$date');
        if (valDate !== undefined) {
            /*
            let setDate = factory.createSet();
            sqls.push(setDate);
            setDate.equ('$historyDate', convertExp(this.context, valDate) as ExpVal);
            */
            expDate = new sql_1.ExpFunc('LEAST', expDate, (0, sql_1.convertExp)(this.context, valDate));
        }
        else {
            expDate = varDate;
        }
        let select = factory.createSelect();
        select.column(new sql_1.ExpFunc(factory.func_max, new sql_1.ExpField('date')));
        select.from(new statementWithFrom_1.EntityTable(history.name, hasUnit));
        select.where(new sql_1.ExpGE(new sql_1.ExpField('date'), varDate));
        select.lock = select_1.LockType.update;
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
        let expHistoryDate = new sql_1.ExpFunc('greatest', varDate, new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpFuncCustom(factory.func_dateadd, new sql_1.ExpKey('microsecond'), sql_1.ExpNum.num1, new sql_1.ExpSelect(select)), new sql_1.ExpFunc(factory.func_from_unixtime, sql_1.ExpNum.num0)));
        let setHistoryDate = factory.createSet();
        sqls.push(setHistoryDate);
        setHistoryDate.equ(vHistoryDate, expHistoryDate);
        let insert = factory.createInsert();
        sqls.push(insert);
        insert.table = new sql_1.SqlEntityTable(history, undefined, hasUnit);
        let cols = insert.cols = [];
        if (hasUnit === true)
            cols.push({ col: unitField.name, val: new sql_1.ExpVar(unitField.name) });
        for (let s of set) {
            let { col, field, value } = s;
            let val = (0, sql_1.convertExp)(this.context, value);
            cols.push({ col: col, val: val });
            syncStats.push(this.context.buildPullTuidField(field, val));
        }
        cols.push({ col: date.name, val: new sql_1.ExpVar(vHistoryDate) });
        if (sheet !== undefined && inSheet === true) {
            cols.push({ col: sheetType.name, val: new sql_1.ExpVar('$sheetType') });
            cols.push({ col: sheet.name, val: new sql_1.ExpVar('$id') });
            cols.push({ col: row.name, val: new sql_1.ExpVar('$row') });
        }
        if (user !== undefined) {
            cols.push({ col: user.name, val: new sql_1.ExpVar('$user') });
        }
        sqls.addStatements(syncStats);
    }
}
exports.BHistoryWrite = BHistoryWrite;
//# sourceMappingURL=historyWrite.js.map