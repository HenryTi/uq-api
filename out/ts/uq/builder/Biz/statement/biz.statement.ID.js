"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizStatementID = void 0;
const il_1 = require("../../../il");
const bstatement_1 = require("../../bstatement/bstatement");
const sql_1 = require("../../sql");
const tools_1 = require("../../tools");
class BBizStatementID extends bstatement_1.BStatement {
    buildExpId(sqls) {
        const { idVal } = this.istatement;
        if (idVal !== undefined) {
            return this.context.expVal(idVal);
        }
    }
    buildSetBase(sqls) {
        const { no, entityCase } = this.istatement;
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        this.vBase = 'base_' + no;
        declare.var(this.vBase, new il_1.BigInt());
        this.varBase = new sql_1.ExpVar(this.vBase);
        const { bizID: bizID0, condition: condition0, uniqueName, uniqueVals, } = entityCase[0];
        let setAtomPhrase0 = factory.createSet();
        setAtomPhrase0.equ(this.vBase, new sql_1.ExpNum(bizID0.id));
        let len = entityCase.length;
        if (len === 1) {
            sqls.push(setAtomPhrase0);
            this.buildIdFromUnique(sqls);
        }
        else {
            let ifCase = factory.createIf();
            sqls.push(ifCase);
            ifCase.cmp = this.context.expCmp(condition0);
            ifCase.then(setAtomPhrase0);
            for (let i = 1; i < len; i++) {
                let { bizID, condition } = entityCase[i];
                let statements = new sql_1.Statements();
                let setAtomPhrase = factory.createSet();
                statements.statements.push(setAtomPhrase);
                setAtomPhrase.equ(this.vBase, new sql_1.ExpNum(bizID.id));
                if (condition !== undefined) {
                    ifCase.elseIf(this.context.expCmp(condition), statements);
                }
                else {
                    ifCase.else(...statements.statements);
                }
            }
        }
    }
    buildSetId(sqls) {
        const { no, idVal, } = this.istatement;
        const { factory } = this.context;
        const declare = factory.createDeclare();
        sqls.push(declare);
        this.vId = 'id_' + no;
        this.varId = new sql_1.ExpVar(this.vId);
        declare.var(this.vId, new il_1.BigInt());
        let expId = this.buildExpId(sqls);
        if (expId === undefined) {
            expId = this.buildIdFromNo(sqls);
        }
        if (expId === undefined) {
            expId = this.buildIdFromUnique(sqls);
        }
        const setId = factory.createSet();
        setId.equ(this.vId, expId);
    }
    buildSetVals(sqls) {
        const { no, sets } = this.istatement;
        for (let [bud, val] of sets) {
            let valExp = this.context.expVal(val);
            let statements = (0, tools_1.buildSetAtomBud)(this.context, bud, this.varId, valExp, no);
            sqls.push(...statements);
        }
    }
}
exports.BBizStatementID = BBizStatementID;
//# sourceMappingURL=biz.statement.ID.js.map