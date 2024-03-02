"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizAtom = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizAtom extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures;
        const { id, uniques } = this.bizEntity;
        if (uniques !== undefined) {
            const budUniques = new Map();
            for (let uq of uniques) {
                const { keys, no } = uq;
                function addBudUniques(bud) {
                    let bu = budUniques.get(bud);
                    if (bu === undefined) {
                        bu = [uq];
                        budUniques.set(bud, bu);
                    }
                    else
                        bu.push(uq);
                }
                for (let key of keys)
                    addBudUniques(key);
                addBudUniques(no);
            }
            for (let [bud, unique] of budUniques) {
                const procUnqiue = this.createProcedure(`${this.context.site}.${bud.id}bu`);
                this.buildBudUniqueProc(procUnqiue, bud, unique);
            }
            // const procUnqiue = this.createProcedure(`${this.context.site}.${id}u`);
            // this.buildUniqueProc(procUnqiue);
        }
    }
    buildBudUniqueProc(proc, bud, uniqueArr) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        //const cBase = '$base';
        const cId = '$id';
        const a = 'a';
        //const site = '$site';
        //const budPhrase = '$budPhrase';
        let varBudPhrase = new sql_1.ExpNum(bud.id);
        let varAtomPhrase = new sql_1.ExpNum(this.bizEntity.id);
        parameters.push(
        //bigIntField(site),
        (0, il_1.bigIntField)(cId));
        const declare = factory.createDeclare();
        statements.push(declare);
        function buildUnique(unique) {
            const { name, keys, no } = unique;
            let vKey = `${name}_key`;
            let vNo = `${name}_no`;
            let vI = `${name}_i`;
            declare.var(vKey, new il_1.BigInt());
            declare.var(vNo, new il_1.Char(400));
            declare.var(vI, new il_1.BigInt());
            let noNullCmp;
            let valKey;
            if (keys.length > 0) {
                let setKey = factory.createSet();
                statements.push(setKey);
                let selectKey = factory.createSelect();
                selectKey.col('value');
                selectKey.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false));
                selectKey.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpNum(keys[0].id))));
                setKey.equ(vKey, new sql_1.ExpSelect(selectKey));
                noNullCmp = new sql_1.ExpAnd(new sql_1.ExpIsNotNull(new sql_1.ExpVar(vKey)), new sql_1.ExpIsNotNull(new sql_1.ExpVar(vNo)));
                valKey = new sql_1.ExpFuncInUq('bud$id', [
                    sql_1.ExpNull.null, sql_1.ExpNull.null, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                    varAtomPhrase, new sql_1.ExpVar(vKey)
                ], true);
            }
            else {
                noNullCmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(vNo));
                valKey = varAtomPhrase;
            }
            let setNo = factory.createSet();
            statements.push(setNo);
            let selectNO = factory.createSelect();
            selectNO.col('value');
            selectNO.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudStr, false));
            selectNO.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpNum(no.id))));
            setNo.equ(vNo, new sql_1.ExpSelect(selectNO));
            let ifNoNull = factory.createIf();
            statements.push(ifNoNull);
            ifNoNull.cmp = noNullCmp;
            let setI = factory.createSet();
            ifNoNull.then(setI);
            setI.equ(vI, valKey);
            let del = factory.createDelete();
            ifNoNull.then(del);
            del.tables = [a];
            del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false, a));
            del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), new sql_1.ExpVar(vI)), new sql_1.ExpOr(new sql_1.ExpEQ(new sql_1.ExpField('atom', a), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('x', a), new sql_1.ExpVar(vNo)))));
            let insert = factory.createInsert();
            ifNoNull.then(insert);
            insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false);
            insert.ignore = true;
            insert.cols = [
                { col: 'i', val: new sql_1.ExpVar(vI) },
                { col: 'x', val: new sql_1.ExpVar(vNo) },
                { col: 'atom', val: new sql_1.ExpVar(cId) },
            ];
        }
        for (let unique of uniqueArr) {
            buildUnique(unique);
        }
    }
    buildUniqueProc(proc) {
        const { uniques } = this.bizEntity;
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const cBase = '$base';
        const cId = '$id';
        const site = '$site';
        const budPhrase = '$budPhrase';
        parameters.push((0, il_1.bigIntField)(site), (0, il_1.bigIntField)(cId), (0, il_1.bigIntField)(cBase), (0, il_1.bigIntField)(budPhrase));
        const declare = factory.createDeclare();
        statements.push(declare);
        function buildUnique(unique) {
            const { name, keys, no } = unique;
            let vKey = `${name}_key`;
            let vNo = `${name}_no`;
            let vI = `${name}_i`;
            declare.var(vKey, new il_1.BigInt());
            declare.var(vNo, new il_1.Char(400));
            declare.var(vI, new il_1.BigInt());
            let noNullCmp;
            let valKey;
            let ifUnique = factory.createIf();
            let varBudPhrase = new sql_1.ExpVar(budPhrase);
            let inArr = [varBudPhrase, ...keys.map(v => new sql_1.ExpNum(v.id)), new sql_1.ExpNum(no.id)];
            ifUnique.cmp = new sql_1.ExpOr(new sql_1.ExpIsNull(varBudPhrase), new sql_1.ExpIn(...inArr));
            if (keys.length > 0) {
                let setKey = factory.createSet();
                ifUnique.then(setKey);
                let selectKey = factory.createSelect();
                selectKey.col('value');
                selectKey.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false));
                selectKey.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpNum(keys[0].id))));
                setKey.equ(vKey, new sql_1.ExpSelect(selectKey));
                noNullCmp = new sql_1.ExpAnd(new sql_1.ExpIsNotNull(new sql_1.ExpVar(vKey)), new sql_1.ExpIsNotNull(new sql_1.ExpVar(vNo)));
                valKey = new sql_1.ExpFuncInUq('bud$id', [
                    sql_1.ExpNull.null, sql_1.ExpNull.null, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                    new sql_1.ExpVar(cBase), new sql_1.ExpVar(vKey)
                ], true);
            }
            else {
                noNullCmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(vNo));
                valKey = new sql_1.ExpVar(cBase);
            }
            let setNo = factory.createSet();
            ifUnique.then(setNo);
            let selectNO = factory.createSelect();
            selectNO.col('value');
            selectNO.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudStr, false));
            selectNO.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpNum(no.id))));
            setNo.equ(vNo, new sql_1.ExpSelect(selectNO));
            let ifNoNull = factory.createIf();
            ifUnique.then(ifNoNull);
            ifNoNull.cmp = noNullCmp;
            let setI = factory.createSet();
            ifNoNull.then(setI);
            setI.equ(vI, valKey);
            let upsert = factory.createUpsert();
            ifNoNull.then(upsert);
            upsert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false);
            upsert.keys = [
                { col: 'i', val: new sql_1.ExpVar(vI) },
                { col: 'x', val: new sql_1.ExpVar(vNo) },
            ];
            upsert.cols = [
                { col: 'atom', val: new sql_1.ExpVar(cId) },
            ];
            return ifUnique;
        }
        for (let unique of uniques) {
            let ret = buildUnique(unique);
            statements.push(ret);
        }
    }
}
exports.BBizAtom = BBizAtom;
//# sourceMappingURL=BizAtom.js.map