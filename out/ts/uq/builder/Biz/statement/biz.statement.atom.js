"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementAtom = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const tools_1 = require("../../tools");
const biz_statement_ID_1 = require("./biz.statement.ID");
const a = 'a', b = 'b';
class BBizStatementAtom extends biz_statement_ID_1.BBizStatementID {
    body(sqls) {
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Atom';
        const { unique, inVals, atomCase, no, toVar, ex, sets } = this.istatement;
        let inExps = inVals.map(v => this.context.expVal(v));
        if (inExps.length === 0) {
            inExps.push(new sql_1.ExpFuncInUq('NO', [
                new sql_1.ExpVar('$site'), new sql_1.ExpStr('atom'), sql_1.ExpNull.null,
            ], true));
        }
        let declare = factory.createDeclare();
        sqls.push(declare);
        const atomPhrase = 'atomPhrase_' + no;
        declare.var(atomPhrase, new il_1.BigInt());
        const varAtomPhrase = new sql_1.ExpVar(atomPhrase);
        const { bizID: bizID0, condition: condition0 } = atomCase[0];
        let setAtomPhrase0 = factory.createSet();
        setAtomPhrase0.equ(atomPhrase, new sql_1.ExpNum(bizID0.id));
        let len = atomCase.length;
        if (len === 1) {
            sqls.push(setAtomPhrase0);
        }
        else {
            let ifCase = factory.createIf();
            sqls.push(ifCase);
            ifCase.cmp = this.context.expCmp(condition0);
            ifCase.then(setAtomPhrase0);
            for (let i = 1; i < len; i++) {
                let { bizID, condition } = atomCase[i];
                let statements = new sql_1.Statements();
                let setAtomPhrase = factory.createSet();
                statements.statements.push(setAtomPhrase);
                setAtomPhrase.equ(atomPhrase, new sql_1.ExpNum(bizID.id));
                if (condition !== undefined) {
                    ifCase.elseIf(this.context.expCmp(condition), statements);
                }
                else {
                    ifCase.else(...statements.statements);
                }
            }
        }
        let vBase = 'bizatomBase_' + no;
        let varBase = new sql_1.ExpVar(vBase);
        let vId;
        if (toVar === undefined) {
            vId = 'bizatom_' + no;
        }
        else {
            vId = toVar.varName(undefined);
        }
        declare.var(vId, new il_1.BigInt());
        declare.var(vBase, new il_1.BigInt());
        let varId = new sql_1.ExpVar(vId);
        let setVarIdNull = factory.createSet();
        sqls.push(setVarIdNull);
        setVarIdNull.equ(vId, sql_1.ExpNull.null);
        let select = factory.createSelect();
        sqls.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), vId);
        select.column(new sql_1.ExpField('base', a), vBase);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, a));
        if (unique === undefined) {
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('no', a), inExps[0]));
        }
        else {
            let len = inExps.length;
            let expKey = new sql_1.ExpFuncInUq('bud$id', [
                sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num_1,
                new sql_1.ExpNum(unique.id), inExps[0]
            ], true);
            for (let i = 1; i < len - 1; i++) {
                expKey = new sql_1.ExpFuncInUq('bud$id', [
                    sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num_1,
                    expKey, inExps[i]
                ], true);
            }
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('atom', b), new sql_1.ExpField('id', a)));
            select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', b), expKey), new sql_1.ExpEQ(new sql_1.ExpField('x', b), inExps[len - 1])));
        }
        let ifIdNull = factory.createIf();
        sqls.push(ifIdNull);
        ifIdNull.cmp = new sql_1.ExpIsNull(varId);
        let setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(vId, new sql_1.ExpFuncInUq('atom$id', [sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, varAtomPhrase], true));
        let updateNo = factory.createUpdate();
        ifIdNull.then(updateNo);
        updateNo.cols = [
            { col: 'no', val: new sql_1.ExpFuncInUq('$no', [sql_1.ExpNum.num0, new sql_1.ExpStr('atom'), sql_1.ExpNull.null], true) },
        ];
        updateNo.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false);
        updateNo.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varId);
        let ifBaseChange = factory.createIf();
        ifIdNull.else(ifBaseChange);
        ifBaseChange.cmp = new sql_1.ExpNE(varAtomPhrase, varBase);
        let updateBase = factory.createUpdate();
        ifBaseChange.then(updateBase);
        updateBase.cols = [{ col: 'base', val: varAtomPhrase }];
        updateBase.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false);
        updateBase.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varId);
        let updateEx = factory.createUpdate();
        sqls.push(updateEx);
        updateEx.cols = [{
                col: 'ex', val: this.context.expVal(ex)
            }];
        updateEx.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false);
        updateEx.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varId);
        for (let [bud, val] of sets) {
            let valExp = this.context.expVal(val);
            let statements = (0, tools_1.buildSetAtomBud)(this.context, bud, varId, valExp, no);
            sqls.push(...statements);
        }
        let sqlCall = factory.createExecSql();
        sqls.push(sqlCall);
        sqlCall.no = no;
        sqlCall.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('CALL `$site.'), // + this.context.site + '`.`'),
        new sql_1.ExpNum(this.context.site), new sql_1.ExpStr('`.`'), varAtomPhrase, new sql_1.ExpStr('u`(?)'));
        sqlCall.parameters = [varId];
    }
}
exports.BBizStatementAtom = BBizStatementAtom;
//# sourceMappingURL=biz.statement.atom.js.map