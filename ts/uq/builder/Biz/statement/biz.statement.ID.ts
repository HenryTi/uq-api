import {
    BigInt,
    BizID,
    BizStatementID
} from "../../../il";
import { BStatement } from "../../bstatement/bstatement";
import { Sqls } from "../../bstatement/sqls";
import { ExpNum, ExpVal, ExpVar, Statements } from "../../sql";
import { buildSetAtomBud } from "../../tools";

export abstract class BBizStatementID<I extends BizID, T extends BizStatementID<I>> extends BStatement<T> {
    protected vId: string;
    protected vBase: string;
    protected varId: ExpVar;
    protected varBase: ExpVar;

    protected buildExpId(sqls: Sqls): ExpVal {
        const { idVal } = this.istatement;
        if (idVal !== undefined) {
            return this.context.expVal(idVal);
        }
    }
    protected abstract buildIdFromNo(sqls: Sqls): ExpVal;
    protected abstract buildIdFromUnique(sqls: Sqls): ExpVal;

    protected buildSetBase(sqls: Sqls) {
        const { no, entityCase } = this.istatement;
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        this.vBase = 'base_' + no;
        declare.var(this.vBase, new BigInt());
        this.varBase = new ExpVar(this.vBase);
        const { bizID: bizID0, condition: condition0, uniqueName, uniqueVals, } = entityCase[0];
        let setAtomPhrase0 = factory.createSet();
        setAtomPhrase0.equ(this.vBase, new ExpNum(bizID0.id));
        let len = entityCase.length;
        if (len === 1) {
            sqls.push(setAtomPhrase0);
            this.buildIdFromUnique(sqls,)
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
                setAtomPhrase.equ(this.vBase, new ExpNum(bizID.id));
                if (condition !== undefined) {
                    ifCase.elseIf(this.context.expCmp(condition), statements);
                }
                else {
                    ifCase.else(...statements.statements);
                }
            }
        }
    }

    protected buildSetId(sqls: Sqls) {
        const { no, idVal, } = this.istatement;
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        this.vId = 'id_' + no;
        this.varId = new ExpVar(this.vId);
        declare.var(this.vId, new BigInt());
        let expId: ExpVal = this.buildExpId(sqls);
        if (expId === undefined) {
            expId = this.buildIdFromNo(sqls);
        }
        if (expId === undefined) {
            expId = this.buildIdFromUnique(sqls);
        }
        const setId = factory.createSet();
        setId.equ(this.vId, expId);
    }

    protected buildSetVals(sqls: Sqls) {
        const { no, sets } = this.istatement;
        for (let [bud, val] of sets) {
            let valExp = this.context.expVal(val);
            let statements = buildSetAtomBud(this.context, bud, this.varId, valExp, no);
            sqls.push(...statements);
        }
    }
}
