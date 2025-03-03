"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementAtom = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const biz_statement_ID_1 = require("./biz.statement.ID");
const a = 'a', b = 'b';
class BBizStatementAtom extends biz_statement_ID_1.BBizStatementID {
    body(sqls) {
        this.buildSetBase(sqls);
        this.buildSetId(sqls);
        this.buildSetVals(sqls);
        this.buildSetEx(sqls);
        /*
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Atom';
        const { entityCase, no, toVar, ex, sets } = this.istatement;
        let declare = factory.createDeclare();
        sqls.push(declare);
        let vId: string;
        if (toVar === undefined) {
            vId = 'bizatom_' + no;
        }
        else {
            vId = toVar.varName(undefined);
        }
        declare.var(vId, new BigInt());
        const varId = new ExpVar(vId);
        const atomPhrase = 'atomPhrase_' + no;
        declare.var(atomPhrase, new BigInt());
        // declare.var(atomNo, new Char(100));

        if (inExps.length === 0) {
            let setNo = factory.createSet();
            sqls.push(setNo);
            setNo.equ(atomNo, new ExpFuncInUq('$NO', [
                new ExpVar('$site'), new ExpStr('atom'), ExpNull.null,
            ], true));
        }

        const varAtomPhrase = new ExpVar(atomPhrase);
        const { bizID: bizID0, condition: condition0 } = entityCase[0];
        let setAtomPhrase0 = factory.createSet();
        setAtomPhrase0.equ(atomPhrase, new ExpNum(bizID0.id));
        let len = entityCase.length;
        if (len === 1) {
            sqls.push(setAtomPhrase0);
        }
        else {
            let ifCase = factory.createIf();
            sqls.push(ifCase);
            ifCase.cmp = this.context.expCmp(condition0);
            ifCase.then(setAtomPhrase0);
            for (let i = 1; i < len; i++) {
                let { bizID, condition } = entityCase[i];
                let statements = new Statements();
                let setAtomPhrase = factory.createSet();
                statements.statements.push(setAtomPhrase);
                setAtomPhrase.equ(atomPhrase, new ExpNum(bizID.id));
                if (condition !== undefined) {
                    ifCase.elseIf(this.context.expCmp(condition), statements);
                }
                else {
                    ifCase.else(...statements.statements);
                }
            }
        }

        let sqlNew = factory.createExecSql();
        sqls.push(sqlNew);
        sqlNew.no = no;
        sqlNew.sql = new ExpFunc(factory.func_concat,
            new ExpStr(`SET ${vId}=\`$site.`),
            new ExpNum(this.context.site),
            new ExpStr('`.`'),
            varAtomPhrase,
            new ExpStr('id`(?,?)'),
        );
        let varNo: ExpVal = ExpNull.null;
        if (unique === unique && inExps.length > 0) {
            varNo = inExps[0];
        }
        sqlNew.parameters = [varNo, varAtomPhrase];

        let vBase: string = 'bizatomBase_' + no;
        let varBase = new ExpVar(vBase);
        declare.var(vBase, new BigInt());
        let varId = new ExpVar(vId);
        let setVarIdNull = factory.createSet();
        sqls.push(setVarIdNull);
        setVarIdNull.equ(vId, ExpNull.null);
        if (inVals.length > 0) {
            let select = factory.createSelect();
            sqls.push(select);
            select.toVar = true;
            select.column(new ExpField('id', a), vId);
            select.column(new ExpField('base', a), vBase);
            select.from(new EntityTable(EnumSysTable.atom, false, a));
            if (unique === undefined) {
                select.where(new ExpEQ(new ExpField('no', a), inExps[0]));
            }
            else {
                let len = inExps.length;
                let expKey = new ExpFuncInUq('bud$id', [
                    ExpNum.num0, ExpNum.num0, ExpNum.num0, ExpNum.num_1
                    , new ExpNum(unique.id), inExps[0]
                ], true);
        
                for (let i = 1; i < len - 1; i++) {
                    expKey = new ExpFuncInUq('bud$id', [
                        ExpNum.num0, ExpNum.num0, ExpNum.num0, ExpNum.num_1
                        , expKey, inExps[i]
                    ], true);
                }
                select.join(JoinType.join, new EntityTable(EnumSysTable.atomUnique, false, b))
                    .on(new ExpEQ(new ExpField('atom', b), new ExpField('id', a)));
                select.where(new ExpAnd(
                    new ExpEQ(new ExpField('i', b), expKey),
                    new ExpEQ(new ExpField('x', b), inExps[len - 1]),
                ));
            }
        }
        let ifIdNull = factory.createIf();
        sqls.push(ifIdNull);
        ifIdNull.cmp = new ExpIsNull(varId);
        let setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(vId, new ExpFuncInUq('atom$id', [ExpNum.num0, ExpNum.num0, ExpNum.num1, varAtomPhrase], true));
        let updateNo = factory.createUpdate();
        ifIdNull.then(updateNo);
        updateNo.cols = [
            { col: 'no', val: new ExpFuncInUq('$no', [new ExpVar('$site'), new ExpStr('atom'), ExpNull.null], true) },
        ];
        updateNo.table = new EntityTable(EnumSysTable.atom, false);
        updateNo.where = new ExpEQ(new ExpField('id'), varId);
        
        let ifBaseChange = factory.createIf();
        ifIdNull.else(ifBaseChange);
        ifBaseChange.cmp = new ExpNE(varAtomPhrase, varBase);
        let updateBase = factory.createUpdate();
        ifBaseChange.then(updateBase);
        updateBase.cols = [{ col: 'base', val: varAtomPhrase }];
        updateBase.table = new EntityTable(EnumSysTable.atom, false);
        updateBase.where = new ExpEQ(new ExpField('id'), varId);

        let updateEx = factory.createUpdate();
        sqls.push(updateEx);
        updateEx.cols = [{
            col: 'ex', val: this.context.expVal(ex)
        }];
        updateEx.table = new EntityTable(EnumSysTable.atom, false);
        updateEx.where = new ExpEQ(new ExpField('id'), varId);

        for (let [bud, val] of sets) {
            let valExp = this.context.expVal(val);
            let statements = buildSetAtomBud(this.context, bud, varId, valExp, no);
            sqls.push(...statements);
        }

        if (unique !== undefined) {
            let sqlCall = factory.createExecSql();
            sqls.push(sqlCall);
            sqlCall.no = no;
            sqlCall.sql = new ExpFunc(factory.func_concat,
                new ExpStr('CALL `$site.'),
                new ExpNum(this.context.site),
                new ExpStr('`.`'),
                varAtomPhrase,
                new ExpStr('u`(?)'),
            );
            sqlCall.parameters = [varId];
        }
        */
    }
    buildIdFromNo(sqls) {
        const { no, noVal } = this.istatement;
        if (noVal === undefined)
            return;
        const { factory, varSite } = this.context;
        const varBase = new sql_1.ExpVar(this.vBase);
        let sqlNew = factory.createExecSql();
        sqls.push(sqlNew);
        sqlNew.no = no;
        sqlNew.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr(`SET @${this.vId}=\`$site.`), new sql_1.ExpNum(this.context.site), new sql_1.ExpStr('`.`'), varBase, new sql_1.ExpStr('new`(?,?,?)'));
        let varNo = sql_1.ExpNull.null;
        if (noVal !== null) {
            varNo = this.context.expVal(noVal);
        }
        sqlNew.parameters = [varSite, varNo, varBase];
        // let setId = factory.createSet();
        // sqls.push(setId);
        // setId.equ(this.vId, new ExpAtVar(this.vId));
        return new sql_1.ExpAtVar(this.vId);
    }
    buildIdFromUnique(sqls) {
        return;
    }
    buildSetEx(sqls) {
        const { ex } = this.istatement;
        const { factory } = this.context;
        let updateEx = factory.createUpdate();
        sqls.push(updateEx);
        updateEx.cols = [{
                col: 'ex', val: this.context.expVal(ex)
            }];
        updateEx.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false);
        updateEx.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), this.varId);
    }
}
exports.BBizStatementAtom = BBizStatementAtom;
//# sourceMappingURL=biz.statement.atom.js.map