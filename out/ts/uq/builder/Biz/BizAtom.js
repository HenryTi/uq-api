"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizAtom = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizBud_1 = require("./BizBud");
const BizEntity_1 = require("./BizEntity");
const cId = '$id';
const a = 'a', b = 'b';
class BBizAtom extends BizEntity_1.BBizEntity {
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures;
            const { id, uniques } = this.bizEntity;
            const procTitlePrime = this.createSiteEntityProcedure('tp');
            this.buildProcTitlePrime(procTitlePrime);
            const procGet = this.createSiteEntityProcedure('ag');
            this.buildProcGet(procGet);
            const funcId = this.createSiteEntityFunction(new il_1.BigInt(), 'new');
            this.buildFuncNew(funcId);
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
                    const procBudUnqiue = this.createSiteProcedure(bud.id, 'bu');
                    this.buildBudUniqueProc(procBudUnqiue, uniqueArr);
                }
            }
            let uniquesAll = this.bizEntity.getUniques();
            if (uniquesAll.length > 0) {
                const procUnqiue = this.createSiteEntityProcedure('u');
                this.buildUniqueProc(procUnqiue, uniquesAll);
            }
        });
    }
    buildUniqueProc(proc, uniquesAll) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const cId = '$id';
        parameters.push((0, il_1.bigIntField)(cId));
        const declare = factory.createDeclare();
        statements.push(declare);
        for (let unique of uniquesAll) {
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
            const dupTable = 'duptable';
            let ifDupTableExists = factory.createIf();
            ifNotDup.else(ifDupTableExists);
            ifDupTableExists.cmp = new sql_1.ExpTableExists(new sql_1.ExpStr(this.context.dbName), new sql_1.ExpStr('_' + dupTable));
            let insertDup = factory.createInsert();
            ifDupTableExists.then(insertDup);
            insertDup.ignore = true;
            insertDup.table = new sql_1.SqlVarTable(dupTable);
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
                    case BizPhraseType_1.BudDataType.radio:
                        selectKey.column(new sql_1.ExpField('ext', b), vKeyI);
                        selectKey.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ix, false, a))
                            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
                            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('x', a)));
                        selectKey.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('base', b), new sql_1.ExpNum(key.id))));
                        break;
                    default:
                        selectKey.col('value', vKeyI);
                        selectKey.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixInt, false));
                        selectKey.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpVar(cId)), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpNum(key.id))));
                        break;
                }
                noNullCmpAnds.push(new sql_1.ExpIsNotNull(new sql_1.ExpVar(vKeyI)));
            }
            let setKey = factory.createSet();
            keyStatements.push(setKey);
            setKey.equ(vKey, varUniquePhrase);
            for (let i = 0; i < len; i++) {
                let setKeyi = factory.createSet();
                keyStatements.push(setKeyi);
                setKeyi.equ(vKey, new sql_1.ExpFuncInUq('bud$id', [
                    sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
                    new sql_1.ExpVar(vKey), new sql_1.ExpVar(vKey + i),
                ], true));
            }
            noNullCmp = new sql_1.ExpAnd(...noNullCmpAnds);
            valKey = new sql_1.ExpVar(vKey);
        }
        else {
            noNullCmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(vNo));
            valKey = varUniquePhrase;
        }
        let setNo = factory.createSet();
        statements.push(setNo);
        let selectNO = factory.createSelect();
        selectNO.col('value');
        selectNO.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixStr, false));
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
    buildProcTitlePrime(procTitlePrime) {
        let buds = this.bizEntity.getTitlePrimeBuds();
        let { statements, parameters } = procTitlePrime;
        const atomId = 'atomId';
        parameters.push((0, il_1.idField)('atomId', 'big'));
        let { factory } = this.context;
        for (let bud of buds) {
            // let select = this.buildBudSelect(bud);
            const expPhrase = new sql_1.ExpNum(bud.id);
            let select = BizBud_1.BBizBud.createBBizBud(this.context, bud).buildBudSelectWithIdCol(expPhrase, new sql_1.ExpVar(atomId));
            let insert = factory.createInsert();
            statements.push(insert);
            insert.ignore = true;
            insert.table = new statementWithFrom_1.VarTableWithSchema('props');
            insert.cols = [
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'id', val: undefined },
            ];
            insert.select = select;
        }
    }
    buildFuncNew(proc) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push((0, il_1.bigIntField)('$site'));
        parameters.push((0, il_1.charField)('no', 100));
        parameters.push((0, il_1.bigIntField)('base'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var('id', new il_1.BigInt());
        declare.var('root', new il_1.BigInt());
        const setId = factory.createSet();
        statements.push(setId);
        const selectEntity = factory.createSelect();
        setId.equ('id', new sql_1.ExpFuncInUq('$idnu', [new sql_1.ExpSelect(selectEntity)], true));
        selectEntity.col('id');
        selectEntity.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.entity, false));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('atom')));
        const ifNoNull = factory.createIf();
        statements.push(ifNoNull);
        ifNoNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('no'));
        const setNo = factory.createSet();
        ifNoNull.then(setNo);
        setNo.equ('no', new sql_1.ExpFuncInUq('$no', [new sql_1.ExpVar('$site'), new sql_1.ExpStr('atom'), sql_1.ExpNull.null], true));
        const selectRoot = factory.createSelect();
        statements.push(selectRoot);
        selectRoot.toVar = true;
        const cte = 'cte';
        const selectCte = factory.createSelect();
        selectCte.col('i');
        selectCte.col('x');
        selectCte.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixPhrase, false));
        selectCte.where(new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpVar('base')));
        selectCte.unionsAll = true;
        const selectCteR = factory.createSelect();
        selectCte.unions = [
            selectCteR,
        ];
        selectCteR.col('i', undefined, a);
        selectCteR.col('x', undefined, a);
        selectCteR.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixPhrase, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.NameTable(cte))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('x', a), new sql_1.ExpField('i', cte)));
        selectRoot.cte = {
            alias: cte,
            recursive: true,
            select: selectCte,
        };
        selectRoot.col('x', 'root');
        selectRoot.from(new statementWithFrom_1.NameTable(cte));
        selectRoot.where(new sql_1.ExpEQ(new sql_1.ExpField('i'), sql_1.ExpNum.num0));
        const upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false);
        upsert.cols = [
            { col: 'base', val: new sql_1.ExpVar('root') },
            { col: 'no', val: new sql_1.ExpVar('no') },
        ];
        upsert.keys = [{ col: 'id', val: new sql_1.ExpVar('id') }];
        const upsertIDU = factory.createUpsert();
        statements.push(upsertIDU);
        upsertIDU.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false);
        upsertIDU.cols = [{ col: 'base', val: new sql_1.ExpVar('base') }];
        upsertIDU.keys = [{ col: 'id', val: new sql_1.ExpVar('id') }];
        const ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'id';
    }
    buildProcGet(proc) {
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push((0, il_1.bigIntField)('id'));
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = 'get atom ' + this.bizEntity.name;
        const varTable = factory.createVarTable();
        statements.push(varTable);
        varTable.name = 'arrProps';
        const phraseField = (0, il_1.charField)('phrase', 200);
        const valueField = (0, il_1.charField)('value', 200);
        varTable.keys = [phraseField];
        varTable.fields = [phraseField, valueField];
        const varId = new sql_1.ExpVar('id');
        this.bizEntity.forEachBud(bud => {
            const insert = factory.createInsert();
            +statements.push(insert);
            insert.ignore = true;
            insert.table = new statementWithFrom_1.VarTableWithSchema(varTable.name);
            insert.cols = [
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
            ];
            const expPhrase = new sql_1.ExpStr(bud.name);
            insert.select = BizBud_1.BBizBud.createBBizBud(this.context, bud).buildBudSelectWithoutIdCol(expPhrase, varId);
        });
    }
}
exports.BBizAtom = BBizAtom;
//# sourceMappingURL=BizAtom.js.map