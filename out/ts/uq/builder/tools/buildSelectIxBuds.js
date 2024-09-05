"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSelectIdPhrases = exports.buildInsertSelectIdPhrase = exports.buildSelectPhraseBud = exports.buildPhraseBudTable = exports.buildIdPhraseTable = exports.buildSelectIxBuds = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const a = 'a';
const b = 'b';
const c = 'c';
const tempIdPhraseTable = 'idphrase';
const tempPhraseBudTable = 'phrasebud';
function buildSelectIxBuds(context) {
    const { factory } = context;
    function funcJSON_QUOTE(expValue) {
        return new sql_1.ExpFunc('JSON_QUOTE', expValue);
    }
    function funcCast(expValue) {
        return new sql_1.ExpFuncCustom(factory.func_cast, expValue, new sql_1.ExpDatePart('JSON'));
    }
    function funcJson(expValue) {
        return expValue;
    }
    let budTypes = [
        [funcCast, il_1.EnumSysTable.ixBudInt, BizPhraseType_1.BudDataType.int],
        [funcCast, il_1.EnumSysTable.ixBudDec, BizPhraseType_1.BudDataType.dec],
        [funcJSON_QUOTE, il_1.EnumSysTable.ixBudStr, BizPhraseType_1.BudDataType.str],
    ];
    return budTypes.map(([func, tbl, budDataType]) => buildSelectIxBud(context, func, tbl, budDataType));
}
exports.buildSelectIxBuds = buildSelectIxBuds;
function buildSelectIxBud(context, func, tbl, budDataType) {
    const { factory } = context;
    let insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new statementWithFrom_1.VarTableWithSchema('props');
    insert.cols = [
        { col: 'phrase', val: undefined },
        { col: 'value', val: undefined },
        { col: 'id', val: undefined },
    ];
    let select = factory.createSelect();
    insert.select = select;
    select.column(new sql_1.ExpField('bud', b), 'phrase');
    select.column(func(new sql_1.ExpField('value', c)), 'value');
    select.column(new sql_1.ExpField('id', a), 'id');
    select.from(new statementWithFrom_1.VarTable(tempIdPhraseTable, a))
        .join(il_1.JoinType.join, new statementWithFrom_1.VarTable(tempPhraseBudTable, b))
        .on(new sql_1.ExpEQ(new sql_1.ExpField('phrase', b), new sql_1.ExpField('phrase', a)))
        .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, c))
        .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', c), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', c), new sql_1.ExpField('bud', b))));
    select.where(new sql_1.ExpEQ(new sql_1.ExpField('budtype', b), new sql_1.ExpNum(budDataType)));
    return insert;
}
function buildIdPhraseTable(context) {
    const { factory } = context;
    const varIdPhraseTable = factory.createVarTable();
    varIdPhraseTable.name = tempIdPhraseTable;
    let idField = (0, il_1.bigIntField)('id');
    const phraseField = (0, il_1.bigIntField)('phrase');
    // let typeField = tinyIntField('type');
    varIdPhraseTable.keys = [idField];
    varIdPhraseTable.fields = [idField, phraseField /*, typeField*/];
    return varIdPhraseTable;
}
exports.buildIdPhraseTable = buildIdPhraseTable;
function buildPhraseBudTable(context) {
    const { factory } = context;
    const varPhraseBudTable = factory.createVarTable();
    varPhraseBudTable.name = tempPhraseBudTable;
    const phraseParentField = (0, il_1.bigIntField)('parent');
    const budTypeField = (0, il_1.tinyIntField)('budtype');
    const budField = (0, il_1.bigIntField)('bud');
    const phraseField = (0, il_1.bigIntField)('phrase');
    varPhraseBudTable.keys = [phraseField, phraseParentField, budField];
    varPhraseBudTable.fields = [phraseField, phraseParentField, budField, budTypeField];
    return varPhraseBudTable;
}
exports.buildPhraseBudTable = buildPhraseBudTable;
function buildSelectPhraseBud(context) {
    const { factory } = context;
    const insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new statementWithFrom_1.VarTable(tempPhraseBudTable);
    insert.cols = [
        { col: 'phrase', val: undefined },
        { col: 'parent', val: undefined },
        { col: 'bud', val: undefined },
        { col: 'budtype', val: undefined },
    ];
    let selectAtomPhrase = factory.createSelect();
    insert.select = selectAtomPhrase;
    selectAtomPhrase.lock = select_1.LockType.none;
    let selectCTE = factory.createSelect();
    selectCTE.lock = select_1.LockType.none;
    const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
    selectAtomPhrase.cte = { alias: cte, recursive: true, select: selectCTE };
    selectCTE.column(new sql_1.ExpField('x', s), 'phrase');
    selectCTE.column(new sql_1.ExpField('i', s), 'i');
    selectCTE.column(new sql_1.ExpField('x', s), 'x');
    selectCTE.from(new statementWithFrom_1.VarTable(tempIdPhraseTable, s0))
        .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBizPhrase, false, s))
        .on(new sql_1.ExpEQ(new sql_1.ExpField('x', s), new sql_1.ExpField('phrase', s0)));
    let select1 = factory.createSelect();
    select1.lock = select_1.LockType.none;
    select1.column(new sql_1.ExpField('phrase', r0));
    select1.column(new sql_1.ExpField('i', r));
    select1.column(new sql_1.ExpField('x', r));
    select1.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBizPhrase, false, r))
        .join(il_1.JoinType.join, new statementWithFrom_1.NameTable(cte, r0))
        .on(new sql_1.ExpEQ(new sql_1.ExpField('i', r0), new sql_1.ExpField('x', r)));
    selectCTE.unions = [select1];
    selectCTE.unionsAll = true;
    selectAtomPhrase.distinct = true;
    selectAtomPhrase.column(new sql_1.ExpField('phrase', a));
    selectAtomPhrase.column(new sql_1.ExpField('x', a));
    selectAtomPhrase.column(new sql_1.ExpField('x', b));
    selectAtomPhrase.column(new sql_1.ExpField('type', b), 'budtype');
    selectAtomPhrase.from(new statementWithFrom_1.NameTable(cte, a))
        .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBudShow, false, b))
        .on(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('x', a)));
    return insert;
}
exports.buildSelectPhraseBud = buildSelectPhraseBud;
function buildInsertSelectIdPhrase(context, select) {
    const { factory } = context;
    const insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new statementWithFrom_1.VarTable(tempIdPhraseTable);
    insert.cols = [
        { col: 'id', val: undefined },
        { col: 'phrase', val: undefined },
        // { col: 'type', val: undefined },
    ];
    insert.select = select;
    select.lock = select_1.LockType.none;
    return insert;
}
exports.buildInsertSelectIdPhrase = buildInsertSelectIdPhrase;
var BinIType;
(function (BinIType) {
    BinIType[BinIType["atom"] = 0] = "atom";
    BinIType[BinIType["fork"] = 1] = "fork";
    BinIType[BinIType["forkAtom"] = 2] = "forkAtom";
})(BinIType || (BinIType = {}));
const arrBinIType = [BinIType.atom, BinIType.fork, BinIType.forkAtom];
function buildSelectIdPhrases(context, buildSelectFrom) {
    return arrBinIType.map(v => buildSelectIdPhrase(context, v, buildSelectFrom));
}
exports.buildSelectIdPhrases = buildSelectIdPhrases;
function buildSelectIdPhrase(context, binIType, buildSelectFrom) {
    const { factory } = context;
    let select = factory.createSelect();
    const insert = buildInsertSelectIdPhrase(context, select);
    const s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
    buildSelectFrom(select);
    switch (binIType) {
        case BinIType.atom:
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, t))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', t), new sql_1.ExpField('i', s1)));
            select.column(new sql_1.ExpField('id', t));
            select.column(new sql_1.ExpField('base', t));
            // select.column(new ExpNum(BinIType.atom));
            break;
        case BinIType.fork:
            // select.join(JoinType.join, new EntityTable(EnumSysTable.spec, false, u))
            // .on(new ExpEQ(new ExpField('id', u), new ExpField('i', s1)))
            // .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, u0))
            // .on(new ExpEQ(new ExpField('id', u0), new ExpField('base', u)));
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.idu, false, u0))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u0), new sql_1.ExpField('i', s1)));
            select.column(new sql_1.ExpField('id', u0));
            select.column(new sql_1.ExpField('base', u0));
            // select.column(new ExpNum(BinIType.fork));
            break;
        case BinIType.forkAtom:
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, u))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u), new sql_1.ExpField('i', s1)))
                // .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, u0))
                // .on(new ExpEQ(new ExpField('id', u0), new ExpField('base', u)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, u1))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u1), new sql_1.ExpField('base', u)));
            ;
            select.column(new sql_1.ExpField('id', u1));
            select.column(new sql_1.ExpField('base', u1));
            // select.column(new ExpNum(BinIType.atom));
            break;
    }
    return insert;
}
//# sourceMappingURL=buildSelectIxBuds.js.map