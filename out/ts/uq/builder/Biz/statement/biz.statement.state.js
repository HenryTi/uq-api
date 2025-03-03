"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementState = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const bstatement_1 = require("../../bstatement/bstatement");
const select_1 = require("../../sql/select");
const a = 'a', b = 'b';
class BBizStatementState extends bstatement_1.BStatement {
    // 可以发送sheet主表，也可以是Detail
    body(sqls) {
        const { context } = this;
        const { factory, varSite, varUser } = context;
        const { to, no, bizStatement: { bizAct: { binState: { sheetState: { sheet } } } } } = this.istatement;
        const declare = factory.createDeclare();
        sqls.push(declare);
        const vCur = 'cur_' + no;
        const varCur = new sql_1.ExpVar(vCur);
        const vStates = 'states_' + no;
        const varStates = new sql_1.ExpVar(vStates);
        declare.var(vCur, new il_1.BigInt());
        declare.var(vStates, new il_1.JsonDataType());
        const memo = factory.createMemo();
        sqls.push(memo);
        let toText;
        if (to === undefined) {
            debugger;
            toText = '';
        }
        else if (typeof to === 'number') {
            toText = il_1.EnumStateTo[to].toUpperCase();
        }
        else {
            toText = to.name;
        }
        memo.text = 'Biz State ' + toText;
        const tblIxState = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixState, false);
        const varSheet = new sql_1.ExpVar('$sheet');
        const budStates = sheet.props.get('$states');
        const varStatesId = new sql_1.ExpNum(budStates.id);
        let selectCur = factory.createSelect();
        sqls.push(selectCur);
        selectCur.toVar = true;
        selectCur.col('x', vCur);
        selectCur.from(tblIxState);
        selectCur.where(new sql_1.ExpEQ(new sql_1.ExpField('i'), varSheet));
        let tblIxJson = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixJson, false);
        let ifCur = factory.createIf();
        sqls.push(ifCur);
        ifCur.cmp = new sql_1.ExpIsNotNull(varCur);
        let selectStates = factory.createSelect();
        ifCur.then(selectStates);
        selectStates.toVar = true;
        selectStates.col('value', vStates);
        selectStates.from(tblIxJson);
        selectStates.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), varSheet), new sql_1.ExpEQ(new sql_1.ExpField('x'), varStatesId)));
        let ifStates = factory.createIf();
        ifCur.then(ifStates);
        ifStates.cmp = new sql_1.ExpIsNull(varStates);
        let insertStates = factory.createInsert();
        ifStates.then(insertStates);
        insertStates.table = tblIxJson;
        insertStates.cols = [
            { col: 'i', val: varSheet },
            { col: 'x', val: varStatesId },
            { col: 'value', val: new sql_1.ExpFunc('JSON_ARRARY', varCur) },
        ];
        let updateStates = factory.createUpdate();
        ifStates.else(updateStates);
        updateStates.table = tblIxJson;
        updateStates.cols = [
            {
                col: 'value',
                val: new sql_1.ExpFunc('JSON_ARRAY_APPEND', new sql_1.ExpField('value'), new sql_1.ExpStr('$'), varCur)
            }
        ];
        updateStates.where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), varSheet), new sql_1.ExpEQ(new sql_1.ExpField('x'), varStatesId));
        let del = factory.createDelete();
        ifCur.then(del);
        del.tables = [a];
        del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixState, false, a));
        del.where(new sql_1.ExpEQ(new sql_1.ExpField('i', a), varSheet));
        function insertTo(toId) {
            insertToCols(varSheet, new sql_1.ExpNum(toId));
        }
        function insertToCols(iVal, xVal) {
            let insert = factory.createInsert();
            sqls.push(insert);
            insert.table = tblIxState;
            insert.cols = [
                { col: 'i', val: iVal },
                { col: 'x', val: xVal },
            ];
        }
        if (typeof to === 'number') {
            switch (to) {
                default:
                    debugger;
                    break;
                case il_1.EnumStateTo.start:
                    let selectMe = factory.createSelect();
                    insertToCols(new sql_1.ExpSelect(selectMe), varSheet);
                    selectMe.col('operator');
                    selectMe.lock = select_1.LockType.none;
                    selectMe.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.sheet, false));
                    selectMe.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), varSheet));
                    break;
                case il_1.EnumStateTo.end:
                    insertTo(sheet.id);
                    break;
                case il_1.EnumStateTo.back:
                    debugger;
                    break;
            }
        }
        else {
            insertTo(to.id);
        }
    }
}
exports.BBizStatementState = BBizStatementState;
//# sourceMappingURL=biz.statement.state.js.map