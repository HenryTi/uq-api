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
        const { no, bizID } = this.istatement;
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        this.vBase = 'base_' + no;
        declare.var(this.vBase, new BigInt());
        this.varBase = new ExpVar(this.vBase);
        // const { bizID: bizID0, condition: condition0, uniqueName, uniqueVals, } = entityCase[0];
        let setAtomPhrase = factory.createSet();
        setAtomPhrase.equ(this.vBase, new ExpNum(bizID.id));
        sqls.push(setAtomPhrase);
        this.buildIdFromUnique(sqls);
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
        if (expId !== undefined) {
            const setId = factory.createSet();
            sqls.push(setId);
            setId.equ(this.vId, expId);
        }
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
