"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementSheet = void 0;
const il_1 = require("../../../il");
const consts_1 = require("../../consts");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const tools_1 = require("../../tools");
const bstatement_1 = require("../../bstatement/bstatement");
class BBizStatementSheet extends bstatement_1.BStatement {
    body(sqls) {
        const { detail } = this.istatement;
        if (detail === undefined)
            this.buildMain(sqls);
        else
            this.buildDetail(sqls);
    }
    buildMain(sqls) {
        const { factory } = this.context;
        const { useSheet } = this.istatement;
        const { sheet } = useSheet;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Sheet ' + sheet.getJName();
        const setId = factory.createSet();
        sqls.push(setId);
        let idVarName = useSheet.varName;
        let idParams = [
            new sql_1.ExpVar(consts_1.$site),
            sql_1.ExpNum.num0,
            sql_1.ExpNum.num1,
            sql_1.ExpNull.null,
            new sql_1.ExpNum(sheet.id),
            new sql_1.ExpFuncInUq('$no', [new sql_1.ExpVar(consts_1.$site), new sql_1.ExpStr('sheet'), sql_1.ExpNull.null], true),
        ];
        setId.equ(idVarName, new sql_1.ExpFuncInUq('sheet$id', idParams, true));
        sqls.push(...this.createUpdate(idVarName));
    }
    buildDetail(sqls) {
        const { factory } = this.context;
        let idVarName = 'detail$id';
        const declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars((0, il_1.bigIntField)(idVarName));
        const { useSheet, bin } = this.istatement;
        const { varName, sheet } = useSheet;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = `Biz Detail ${bin.getJName()} OF Sheet ${sheet.getJName()}`;
        const setBinId = factory.createSet();
        sqls.push(setBinId);
        let idParams = [
            new sql_1.ExpVar(consts_1.$site),
            sql_1.ExpNum.num0,
            sql_1.ExpNum.num1,
            sql_1.ExpNull.null,
            new sql_1.ExpFuncInUq('bud$id', [
                new sql_1.ExpVar(consts_1.$site), sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                new sql_1.ExpVar(varName), new sql_1.ExpNum(bin.id)
            ], true),
        ];
        setBinId.equ(idVarName, new sql_1.ExpFuncInUq('detail$id', idParams, true));
        sqls.push(...this.createUpdate(idVarName));
    }
    createUpdate(idVarName) {
        const { factory } = this.context;
        const varId = new sql_1.ExpVar(idVarName);
        const insert = factory.createInsert();
        const { fields, buds, bin } = this.istatement;
        const { cols } = insert;
        const { props } = bin;
        cols.push({ col: 'id', val: varId });
        for (let i in fields) {
            cols.push({ col: i, val: this.context.expVal(fields[i]) });
        }
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false);
        let ret = [insert];
        for (let i in buds) {
            let val = buds[i];
            let bud = props.get(i);
            let memo = factory.createMemo();
            ret.push(memo);
            memo.text = bud.getJName();
            let expVal = this.context.expVal(val);
            ret.push(...(0, tools_1.buildSetSheetBud)(this.context, bud, varId, expVal));
        }
        return ret;
    }
}
exports.BBizStatementSheet = BBizStatementSheet;
//# sourceMappingURL=biz.statement.sheet.js.map