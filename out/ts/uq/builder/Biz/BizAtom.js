"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizAtom = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
const cId = '$id';
const a = 'a', b = 'b';
class BBizAtom extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures;
        const { id, uniques } = this.bizEntity;
        if (uniques !== undefined) {
            const budUniques = new Map();
            for (let uq of uniques) {
                const { keys, no } = uq;
                if (uq.name === 'no')
                    continue;
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
            for (let [bud, uniqueArr] of budUniques) {
                const procBudUnqiue = this.createProcedure(`${this.context.site}.${bud.id}bu`);
                this.buildBudUniqueProc(procBudUnqiue, uniqueArr);
            }
            const procUnqiue = this.createProcedure(`${this.context.site}.${id}u`);
            this.buildUniqueProc(procUnqiue);
        }
    }
    buildUniqueProc(proc) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const cId = '$id';
        parameters.push((0, il_1.bigIntField)(cId));
        const declare = factory.createDeclare();
        statements.push(declare);
        const { uniques } = this.bizEntity;
        for (let unique of uniques) {
            const { id: unqiueId, name } = unique;
            if (name === 'no') {
                statements.push(...this.buildUniqueNO(unique));
                continue;
            }
            let vNo = `${name}_no`;
            let vI = `${name}_i`;
            let ifNotDup = factory.createIf();
            let selectExists = factory.createSelect();
            ifNotDup.cmp = new sql_1.ExpNot(new sql_1.ExpExists(selectExists));
            selectExists.col('i', a, a);
            selectExists.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false, a));
            selectExists.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), new sql_1.ExpVar(vI)), new sql_1.ExpEQ(new sql_1.ExpField('x', a), new sql_1.ExpVar(vNo)), new sql_1.ExpNE(new sql_1.ExpField('atom', a), new sql_1.ExpVar(cId))));
            let insertDup = factory.createInsert();
            ifNotDup.else(insertDup);
            insertDup.ignore = true;
            insertDup.table = new sql_1.SqlVarTable('duptable');
            insertDup.cols = [
                { col: 'unique', val: new sql_1.ExpNum(unqiueId) },
                { col: 'i', val: new sql_1.ExpVar(vI) },
                { col: 'x', val: new sql_1.ExpVar(vNo) },
                { col: 'atom', val: new sql_1.ExpVar(cId) },
            ];
            statements.push(...this.buildUnique(unique, ifNotDup));
        }
    }
    buildBudUniqueProc(proc, uniqueArr) {
        const { parameters, statements } = proc;
        parameters.push((0, il_1.bigIntField)(cId));
        const { factory } = this.context;
        for (let unique of uniqueArr) {
            let ifNotDup = factory.createIf();
            ifNotDup.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
            statements.push(...this.buildUnique(unique, ifNotDup));
        }
    }
    buildUnique(unique, ifNotDup) {
        let statements = [];
        const { name } = unique;
        const { id, keys, no } = unique;
        const { factory } = this.context;
        let vNo = `${name}_no`;
        let vI = `${name}_i`;
        let varUniquePhrase = new sql_1.ExpNum(id);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var(vNo, new il_1.Char(400));
        declare.var(vI, new il_1.BigInt());
        let noNullCmp;
        let valKey;
        let len = keys.length;
        let keyStatements = [];
        if (len > 0) {
            const noNullCmpAnds = [new sql_1.ExpIsNotNull(new sql_1.ExpVar(vNo))];
            const vKey = `${name}_key`;
            declare.var(vKey, new il_1.BigInt());
            for (let i = 0; i < len; i++) {
                let key = keys[i];
                let vKeyI = vKey + i;
                declare.var(vKeyI, new il_1.BigInt());
                let selectKey = factory.createSelect();
                statements.push(selectKey);
                selectKey.toVar = true;
                switch (key.dataType) {
                    case il_1.BudDataType.radio:
                        selectKey.column(new sql_1.ExpField('ext', b), vKeyI);
                        selectKey.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBud, false, a))
                            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
                            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('x', a)));
                        selectKey.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('base', b), new sql_1.ExpNum(key.id))));
                        break;
                    default:
                        selectKey.col('value', vKeyI);
                        selectKey.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false));
                        selectKey.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpNum(key.id))));
                        break;
                }
                noNullCmpAnds.push(new sql_1.ExpIsNotNull(new sql_1.ExpVar(vKeyI)));
            }
            let setKey0 = factory.createSet();
            keyStatements.push(setKey0);
            setKey0.equ(vKey, new sql_1.ExpVar(vKey + 0));
            for (let i = 1; i < len; i++) {
                let setKeyi = factory.createSet();
                keyStatements.push(setKeyi);
                setKeyi.equ(vKey, new sql_1.ExpFuncInUq('duo$id', [
                    sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                    new sql_1.ExpVar(vKey), new sql_1.ExpVar(vKey + i),
                ], true));
            }
            noNullCmp = new sql_1.ExpAnd(...noNullCmpAnds);
            valKey = new sql_1.ExpFuncInUq('bud$id', [
                sql_1.ExpNull.null, sql_1.ExpNull.null, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                varUniquePhrase, new sql_1.ExpVar(vKey)
            ], true);
        }
        else {
            noNullCmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(vNo));
            valKey = varUniquePhrase;
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
        ifNoNull.then(...keyStatements);
        let setI = factory.createSet();
        ifNoNull.then(setI);
        setI.equ(vI, valKey);
        ifNoNull.then(ifNotDup);
        let del = factory.createDelete();
        ifNotDup.then(del);
        del.tables = [a];
        del.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false, a));
        del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), new sql_1.ExpVar(vI)), new sql_1.ExpOr(new sql_1.ExpEQ(new sql_1.ExpField('atom', a), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('x', a), new sql_1.ExpVar(vNo)))));
        let insert = factory.createInsert();
        ifNotDup.then(insert);
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false);
        insert.ignore = true;
        insert.cols = [
            { col: 'i', val: new sql_1.ExpVar(vI) },
            { col: 'x', val: new sql_1.ExpVar(vNo) },
            { col: 'atom', val: new sql_1.ExpVar(cId) },
        ];
        return statements;
    }
    buildUniqueNO(unique) {
        const { factory } = this.context;
        let statements = [];
        let selectNo = factory.createSelect();
        selectNo.lock = select_1.LockType.none;
        selectNo.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false));
        selectNo.col('no');
        selectNo.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(cId)));
        let insert = factory.createInsert();
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atomUnique, false);
        insert.ignore = true;
        insert.cols = [
            { col: 'i', val: new sql_1.ExpNum(unique.id) },
            { col: 'x', val: new sql_1.ExpSelect(selectNo) },
            { col: 'atom', val: new sql_1.ExpVar(cId) },
        ];
        statements.push(insert);
        return statements;
    }
}
exports.BBizAtom = BBizAtom;
//# sourceMappingURL=BizAtom.js.map