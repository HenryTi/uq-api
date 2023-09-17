"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizAtom = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizAtom extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        const { base, id } = this.bizEntity;
        if (base === undefined)
            return;
        const proc = this.createProcedure(`${id}$test`);
        this.buildTestProc(proc);
    }
    buildTestProc(proc) {
        const { parameters, statements } = proc;
        const { factory, unitField, userParam } = this.context;
        const { base, keys } = this.bizEntity;
        const cNo = 'no';
        const cAtom = 'atom';
        const cBase = 'base';
        const cKeys = 'keys';
        const cEx = 'ex';
        const id = 'id';
        const a = 'a';
        const site = '$site';
        const keysJson = 'keysJson';
        const varKeys = new sql_1.ExpVar(keysJson);
        parameters.push(unitField, userParam, (0, il_1.charField)(cAtom, 200), (0, il_1.idField)(cBase, 'big'), (0, il_1.textField)(cKeys), (0, il_1.charField)(cEx, 200));
        const declare = factory.createDeclare();
        declare.var(id, new il_1.Int());
        declare.var(site, new il_1.BigInt());
        declare.var(keysJson, new il_1.JsonDataType());
        statements.push(declare);
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpVar(unitField.name));
        const setJson = factory.createSet();
        statements.push(setJson);
        setJson.equ(keysJson, new sql_1.ExpVar(cKeys));
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.limit(sql_1.ExpNum.num1);
        select.column(new sql_1.ExpField('id', a), id);
        select.from(new statementWithFrom_1.EntityTable('atom', false, a));
        const wheres = [new sql_1.ExpEQ(new sql_1.ExpField(cBase, a), new sql_1.ExpVar(cBase))];
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const { name } = key;
            const expVal = new sql_1.ExpFunc('JSON_EXTRACT', varKeys, new sql_1.ExpStr(`$[${i}]`));
            if (name === cNo) {
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(cNo, a), expVal));
            }
            else {
                let t = 't' + i;
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable('ixbudint', false, t));
                select.on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpFuncInUq('phraseid', [new sql_1.ExpVar(site), new sql_1.ExpStr(key.phrase)], true))));
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('value', t), expVal));
            }
        }
        select.where(new sql_1.ExpAnd(...wheres));
    }
}
exports.BBizAtom = BBizAtom;
//# sourceMappingURL=BizAtom.js.map