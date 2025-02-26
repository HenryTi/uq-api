import {
    EnumSysTable, BigInt, BizStatementAtom, JoinType
} from "../../../il";
import { ExpAnd, ExpEQ, ExpField, ExpFunc, ExpFuncInUq, ExpIsNull, ExpNE, ExpNull, ExpNum, ExpStr, ExpVar, Statements } from "../../sql";
import { EntityTable } from "../../sql/statementWithFrom";
import { buildSetAtomBud } from "../../tools";
import { Sqls } from "../../bstatement/sqls";
import { BBizStatementID } from "./biz.statement.ID";

const a = 'a', b = 'b';
export class BBizStatementAtom extends BBizStatementID<BizStatementAtom> {
    override body(sqls: Sqls): void {
        const { factory } = this.context;
        let memo = factory.createMemo();
        sqls.push(memo);
        memo.text = 'Biz Atom';
        const { unique, inVals, atomCase, no, toVar, ex, sets } = this.istatement;
        let inExps = inVals.map(v => this.context.expVal(v));
        if (inExps.length === 0) {
            inExps.push(new ExpFuncInUq('NO', [
                new ExpVar('$site'), new ExpStr('atom'), ExpNull.null,
            ], true));
        }
        let declare = factory.createDeclare();
        sqls.push(declare);
        const atomPhrase = 'atomPhrase_' + no;
        declare.var(atomPhrase, new BigInt());
        const varAtomPhrase = new ExpVar(atomPhrase);

        const { bizID: bizID0, condition: condition0 } = atomCase[0];
        let setAtomPhrase0 = factory.createSet();
        setAtomPhrase0.equ(atomPhrase, new ExpNum(bizID0.id));
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

        let vBase: string = 'bizatomBase_' + no;
        let varBase = new ExpVar(vBase);
        let vId: string;
        if (toVar === undefined) {
            vId = 'bizatom_' + no;
        }
        else {
            vId = toVar.varName(undefined);
        }
        declare.var(vId, new BigInt());
        declare.var(vBase, new BigInt());
        let varId = new ExpVar(vId);
        let setVarIdNull = factory.createSet();
        sqls.push(setVarIdNull);
        setVarIdNull.equ(vId, ExpNull.null);
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
        let ifIdNull = factory.createIf();
        sqls.push(ifIdNull);
        ifIdNull.cmp = new ExpIsNull(varId);
        let setId = factory.createSet();
        ifIdNull.then(setId);
        setId.equ(vId, new ExpFuncInUq('atom$id', [ExpNum.num0, ExpNum.num0, ExpNum.num1, varAtomPhrase], true));
        let updateNo = factory.createUpdate();
        ifIdNull.then(updateNo);
        updateNo.cols = [
            { col: 'no', val: new ExpFuncInUq('$no', [ExpNum.num0, new ExpStr('atom'), ExpNull.null], true) },
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

        let sqlCall = factory.createExecSql();
        sqls.push(sqlCall);
        sqlCall.no = no;
        sqlCall.sql = new ExpFunc(factory.func_concat,
            new ExpStr('CALL `$site.'), // + this.context.site + '`.`'),
            new ExpNum(this.context.site),
            new ExpStr('`.`'),
            varAtomPhrase,
            new ExpStr('u`(?)'),
        );
        sqlCall.parameters = [varId];
    }
}
