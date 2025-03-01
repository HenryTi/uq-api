"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementFork = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const biz_statement_ID_1 = require("./biz.statement.ID");
const consts_1 = require("../../consts");
const a = 'a';
class BBizStatementFork extends biz_statement_ID_1.BBizStatementID {
    body(sqls) {
        const { fork } = this.istatement;
        if (fork !== undefined) {
            this.buildFromFork(sqls, fork);
        }
        else {
            this.buildFromForkVal(sqls);
        }
    }
    buildIdFromNo(sqls) {
        return;
    }
    buildIdFromUnique(sqls) {
        return;
    }
    buildFromFork(sqls, fork) {
        const { factory } = this.context;
        const { uniqueVals: inVals } = this.istatement;
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), undefined, this.istatement.toVar);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, a));
        let wheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('base', a), this.context.expVal(inVals[0])),
        ];
        let { keys } = fork;
        let len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { id, dataType } = key;
            let tbl, val = this.context.expVal(inVals[i + 1]);
            switch (dataType) {
                default:
                    tbl = il_1.EnumSysTable.ixInt;
                    break;
                case BizPhraseType_1.BudDataType.date:
                    tbl = il_1.EnumSysTable.ixInt;
                    val = new sql_1.ExpFunc('DATEDIFF', val, new sql_1.ExpStr('1970-01-01'));
                    break;
                case BizPhraseType_1.BudDataType.str:
                case BizPhraseType_1.BudDataType.char:
                    tbl = il_1.EnumSysTable.ixStr;
                    break;
                case BizPhraseType_1.BudDataType.dec:
                    tbl = il_1.EnumSysTable.ixDec;
                    break;
                case BizPhraseType_1.BudDataType.fork:
                    tbl = il_1.EnumSysTable.ixJson;
                    break;
            }
            let t = 't' + i;
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, t));
            select.on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(id))));
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('value', t), val));
        }
        select.where(new sql_1.ExpAnd(...wheres));
    }
    buildFromForkVal(sqls) {
        const { toVar, valFork } = this.istatement;
        const { factory, site } = this.context;
        let exp = this.context.expVal(valFork);
        let execSql = factory.createExecSql();
        execSql.no = this.istatement.no;
        sqls.push(execSql);
        execSql.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr(`CALL \`${consts_1.$site}.${site}\`.\``), new sql_1.ExpFunc('JSON_VALUE', exp, new sql_1.ExpStr('$."$"')), new sql_1.ExpStr('$f`(?,?,?,?,?)'));
        execSql.parameters = [
            new sql_1.ExpNum(site) // $site
            ,
            new sql_1.ExpVar(consts_1.$user) // $user
            ,
            sql_1.ExpNull.null // $id
            ,
            new sql_1.ExpFunc('JSON_VALUE', exp, new sql_1.ExpStr('$."$base"')) // base
            ,
            exp
        ];
        let setVal = factory.createSet();
        sqls.push(setVal);
        setVal.equ(toVar.varName(toVar.name), new sql_1.ExpAtVar('execSqlValue'));
    }
}
exports.BBizStatementFork = BBizStatementFork;
//# sourceMappingURL=biz.statement.fork.js.map