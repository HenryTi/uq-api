import {
    EnumSysTable,
    JoinType,
    bigIntField,
    tinyIntField
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { DbContext } from "../dbContext";
import {
    ExpAnd, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpNum, ExpVal,
    Statement
} from "../sql";
import { LockType, Select } from "../sql/select";
import { EntityTable, NameTable, VarTable, VarTableWithSchema } from "../sql/statementWithFrom";

const a = 'a';
const b = 'b';
const c = 'c';
const tempIdPhraseTable = 'idphrase';
const tempPhraseBudTable = 'phrasebud';

export function buildSelectIxBuds(context: DbContext) {
    const { factory } = context;
    function funcJSON_QUOTE(expValue: ExpVal) {
        return new ExpFunc('JSON_QUOTE', expValue);
    }
    function funcCast(expValue: ExpVal) {
        return new ExpFuncCustom(factory.func_cast, expValue, new ExpDatePart('JSON'))
    }

    let memo = factory.createMemo();
    memo.text = '$ buildSelectIxBuds';
    let ret: Statement[] = [
        memo,
        buildSelectIxBud(context, funcCast, EnumSysTable.ixBudInt, BudDataType.int),
        buildInsertAtoms(context),
        buildInsertSpecs(context),
    ];

    let budTypes: [(v: ExpVal) => ExpVal, EnumSysTable, BudDataType][] = [
        [funcCast, EnumSysTable.ixBudDec, BudDataType.dec],
        [funcJSON_QUOTE, EnumSysTable.ixBudStr, BudDataType.str],
    ];
    ret.push(...budTypes.map(([func, tbl, budDataType]) => buildSelectIxBud(context, func, tbl, budDataType)));
    let memoEnd = factory.createMemo();
    memoEnd.text = '# buildSelectIxBuds';
    ret.push(memoEnd);
    return ret;
}

function buildInsertAtoms(context: DbContext) {
    const { factory } = context;
    let insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new VarTableWithSchema('atoms');
    insert.cols = [
        { col: 'id', val: undefined },
        { col: 'base', val: undefined },
        { col: 'no', val: undefined },
        { col: 'ex', val: undefined },
    ];
    let select = factory.createSelect();
    insert.select = select;
    select.distinct = true;
    select.col('id', undefined, b);
    select.col('base', undefined, b);
    select.col('no', undefined, b);
    select.col('ex', undefined, b);
    select.from(new VarTableWithSchema('props', a))
        .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
        .on(new ExpEQ(new ExpField('id', b), new ExpField('value', a)));
    return insert;
}

function buildInsertSpecs(context: DbContext) {
    const { factory } = context;
    let insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new VarTableWithSchema('specs');
    insert.cols = [
        { col: 'id', val: undefined },
        { col: 'atom', val: undefined },
    ];
    let select = factory.createSelect();
    insert.select = select;
    select.distinct = true;
    select.col('id', undefined, b);
    select.col('base', 'atom', c);
    select.from(new VarTableWithSchema('props', a))
        .join(JoinType.join, new EntityTable(EnumSysTable.spec, false, b))
        .on(new ExpEQ(new ExpField('id', b), new ExpField('value', a)))
        .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, c))
        .on(new ExpEQ(new ExpField('id', c), new ExpField('id', b)));
    return insert;
}

function buildSelectIxBud(context: DbContext, func: (expValue: ExpVal) => ExpVal, tbl: EnumSysTable, budDataType: BudDataType) {
    const { factory } = context;
    let insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new VarTableWithSchema('props');
    insert.cols = [
        { col: 'phrase', val: undefined },
        { col: 'value', val: undefined },
        { col: 'id', val: undefined },
    ];
    let select = factory.createSelect();
    insert.select = select;
    select.column(new ExpField('bud', b), 'phrase');
    select.column(func(new ExpField('value', c)), 'value');
    select.column(new ExpField('id', a), 'id');
    select.from(new VarTable(tempIdPhraseTable, a))
        .join(JoinType.join, new VarTable(tempPhraseBudTable, b))
        .on(new ExpEQ(new ExpField('phrase', b), new ExpField('phrase', a)))
        .join(JoinType.join, new EntityTable(tbl, false, c))
        .on(new ExpAnd(
            new ExpEQ(new ExpField('i', c), new ExpField('id', a)),
            new ExpEQ(new ExpField('x', c), new ExpField('bud', b)),
        ));
    select.where(new ExpEQ(new ExpField('budtype', b), new ExpNum(budDataType)));
    return insert;
}

export function buildIdPhraseTable(context: DbContext) {
    const { factory } = context;
    const varIdPhraseTable = factory.createVarTable();
    varIdPhraseTable.name = tempIdPhraseTable;
    let idField = bigIntField('id');
    const phraseField = bigIntField('phrase');
    // let typeField = tinyIntField('type');
    varIdPhraseTable.keys = [idField];
    varIdPhraseTable.fields = [idField, phraseField/*, typeField*/];
    return varIdPhraseTable;
}

export function buildPhraseBudTable(context: DbContext) {
    const { factory } = context;
    const varPhraseBudTable = factory.createVarTable();
    varPhraseBudTable.name = tempPhraseBudTable;
    const phraseParentField = bigIntField('parent');
    const budTypeField = tinyIntField('budtype');
    const budField = bigIntField('bud');
    const phraseField = bigIntField('phrase');
    varPhraseBudTable.keys = [phraseField, phraseParentField, budField];
    varPhraseBudTable.fields = [phraseField, phraseParentField, budField, budTypeField];
    return varPhraseBudTable;
}

export function buildSelectPhraseBud(context: DbContext) {
    const { factory } = context;
    const insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new VarTable(tempPhraseBudTable);
    insert.cols = [
        { col: 'phrase', val: undefined },
        { col: 'parent', val: undefined },
        { col: 'bud', val: undefined },
        { col: 'budtype', val: undefined },
    ];
    let selectAtomPhrase = factory.createSelect();
    insert.select = selectAtomPhrase;
    selectAtomPhrase.lock = LockType.none;
    let selectCTE = factory.createSelect();
    selectCTE.lock = LockType.none;
    const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0';
    selectAtomPhrase.cte = { alias: cte, recursive: true, select: selectCTE };
    selectCTE.column(new ExpField('x', s), 'phrase')
    selectCTE.column(new ExpField('i', s), 'i');
    selectCTE.column(new ExpField('x', s), 'x');
    selectCTE.from(new VarTable(tempIdPhraseTable, s0))
        .join(JoinType.left, new EntityTable(EnumSysTable.ixBizPhrase, false, s))
        .on(new ExpEQ(new ExpField('x', s), new ExpField('phrase', s0)));
    let select1 = factory.createSelect();
    select1.lock = LockType.none;
    select1.column(new ExpField('phrase', r0));
    select1.column(new ExpField('i', r));
    select1.column(new ExpField('x', r));
    select1.from(new EntityTable(EnumSysTable.ixBizPhrase, false, r))
        .join(JoinType.join, new NameTable(cte, r0))
        .on(new ExpEQ(new ExpField('i', r0), new ExpField('x', r)));
    selectCTE.unions = [select1];
    selectCTE.unionsAll = true;
    selectAtomPhrase.distinct = true;
    selectAtomPhrase.column(new ExpField('phrase', a));
    selectAtomPhrase.column(new ExpField('x', a));
    selectAtomPhrase.column(new ExpField('x', b));
    selectAtomPhrase.column(new ExpField('type', b), 'budtype');
    selectAtomPhrase.from(new NameTable(cte, a))
        .join(JoinType.join, new EntityTable(EnumSysTable.bizBudShow, false, b))
        .on(new ExpEQ(new ExpField('i', b), new ExpField('x', a)));
    return insert;
}

export function buildInsertSelectIdPhrase(context: DbContext, select: Select) {
    const { factory } = context;
    const insert = factory.createInsert();
    insert.ignore = true;
    insert.table = new VarTable(tempIdPhraseTable);
    insert.cols = [
        { col: 'id', val: undefined },
        { col: 'phrase', val: undefined },
        // { col: 'type', val: undefined },
    ];
    insert.select = select;
    select.lock = LockType.none;
    return insert;
}

/*
enum BinIType {
    atom, fork, forkAtom
}
*/
// const arrBinIType = [BinIType.atom, BinIType.fork, BinIType.forkAtom];

export function buildSelectIdPhrases(context: DbContext, buildSelectFrom: (select: Select) => void) {
    // return arrBinIType.map(v => buildSelectIdPhrase(context, v, buildSelectFrom));
    return [
        buildIDUSelectIdPhrase(context, buildSelectFrom),
        buildIDUForkSelectIdPhrase(context, buildSelectFrom),
    ]
}

function buildIDUSelectIdPhrase(context: DbContext, buildSelectFrom: (select: Select) => void) {
    const { factory } = context;
    let select = factory.createSelect();
    const insert = buildInsertSelectIdPhrase(context, select);
    const s1 = 's1', u0 = 'u0';
    buildSelectFrom(select);
    select.join(JoinType.join, new EntityTable(EnumSysTable.idu, false, u0))
        .on(new ExpEQ(new ExpField('id', u0), new ExpField('i', s1)));
    select.column(new ExpField('id', u0));
    select.column(new ExpField('base', u0));
    return insert;
}

function buildIDUForkSelectIdPhrase(context: DbContext, buildSelectFrom: (select: Select) => void) {
    const { factory } = context;
    let select = factory.createSelect();
    const insert = buildInsertSelectIdPhrase(context, select);
    const s1 = 's1', u = 'u', u1 = 'u1';
    buildSelectFrom(select);
    select.join(JoinType.join, new EntityTable(EnumSysTable.spec, false, u))
        .on(new ExpEQ(new ExpField('id', u), new ExpField('i', s1)))
        .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, u1))
        .on(new ExpEQ(new ExpField('id', u1), new ExpField('base', u)));;
    select.column(new ExpField('id', u1));
    select.column(new ExpField('base', u1));
    return insert;
}
