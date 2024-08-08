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
exports.BBizSheet = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const sqlBuilder_1 = require("../sql/sqlBuilder");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
const sheetId = 'sheet';
const s = 's';
const si = 'si';
const sx = 'sx';
const svalue = 'svalue';
const samount = 'samount';
const sprice = 'sprice';
const pendFrom = 'pend';
const binId = 'bin';
const pBinId = '$pBin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const tempBinTable = 'bin';
const tempITable = 'bini';
const tempIdPhraseTable = 'idphrase';
const tempPhraseBudTable = 'phrasebud';
const siteAtomApp = '$siteAtomApp';
var BinIType;
(function (BinIType) {
    BinIType[BinIType["atom"] = 0] = "atom";
    BinIType[BinIType["fork"] = 1] = "fork";
    BinIType[BinIType["forkAtom"] = 2] = "forkAtom";
})(BinIType || (BinIType = {}));
class BBizSheet extends BizEntity_1.BBizEntity {
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures.call(this);
            const { id } = this.bizEntity;
            const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
            this.buildSubmitProc(procSubmit);
            const procGet = this.createProcedure(`${this.context.site}.${id}gs`); // gs = get sheet
            this.buildGetProc(procGet);
        });
    }
    buildSubmitProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { main, details, outs } = this.bizEntity;
        const site = '$site';
        const cId = '$id';
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.idField)(cId, 'big'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)(sheetId), (0, il_1.bigIntField)(si), (0, il_1.bigIntField)(sx), (0, il_1.decField)(svalue, 18, 6), (0, il_1.decField)(samount, 18, 6), (0, il_1.decField)(sprice, 18, 6), (0, il_1.bigIntField)(siteAtomApp));
        for (let i in outs) {
            let out = outs[i];
            this.buildOutInit(statements, out);
        }
        // main
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bin ${main.name}`;
        let setBin = factory.createSet();
        statements.push(setBin);
        setBin.equ(binId, new sql_1.ExpVar(cId));
        // sheet main 界面编辑的时候，value，amount，price 保存到 ixBudDec 里面了。现在转到bin表上
        this.saveMainVPA(statements);
        let mainStatements = this.buildBinOneRow(main);
        statements.push(...mainStatements);
        // details
        declare.vars((0, il_1.bigIntField)(pendFrom), (0, il_1.bigIntField)(binId), (0, il_1.bigIntField)(pBinId));
        let len = details.length;
        for (let i = 0; i < len; i++) {
            let { bin } = details[i];
            this.buildBin(statements, bin, i + 101);
        }
        for (let i in outs) {
            let out = outs[i];
            this.buildOut(statements, out);
        }
    }
    saveMainVPA(statements) {
        const { value, price, amount } = this.bizEntity.main;
        const { factory } = this.context;
        let update = factory.createUpdate();
        const { cols } = update;
        let varBinId = new sql_1.ExpVar(binId);
        function setVal(bud) {
            if (bud === undefined)
                return;
            let select = factory.createSelect();
            select.lock = select_1.LockType.none;
            select.col('value');
            select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudDec, false));
            select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), varBinId), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpNum(bud.id))));
            cols.push({ col: bud.name, val: new sql_1.ExpSelect(select) });
        }
        setVal(value);
        setVal(price);
        setVal(amount);
        if (cols.length === 0)
            return;
        update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false);
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varBinId);
        statements.push(update);
    }
    buildBin(statements, bin, statementNo) {
        const { id: entityId, name } = bin;
        const { factory } = this.context;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bin ${name}`;
        const setPBinId0 = factory.createSet();
        statements.push(setPBinId0);
        setPBinId0.equ(pBinId, sql_1.ExpNum.num0);
        const loop = factory.createWhile();
        loop.no = statementNo;
        statements.push(loop);
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
        const select = factory.createSelect();
        loop.statements.add(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), binId);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizDetail, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('id', a)));
        select.where(new sql_1.ExpAnd(new sql_1.ExpGT(new sql_1.ExpField('id', a), new sql_1.ExpVar(pBinId)), new sql_1.ExpEQ(new sql_1.ExpField('ext', b), new sql_1.ExpNum(entityId)), new sql_1.ExpEQ(new sql_1.ExpField('base', b), new sql_1.ExpVar('$id')), new sql_1.ExpIsNotNull(new sql_1.ExpField('value', c))));
        select.order(new sql_1.ExpField('id', a), 'asc');
        select.limit(sql_1.ExpNum.num1);
        const iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(binId));
        const exit = factory.createBreak();
        iffExit.then(exit);
        exit.no = statementNo;
        let binOneRow = this.buildBinOneRow(bin);
        loop.statements.add(...binOneRow);
        const setPBin = factory.createSet();
        loop.statements.add(setPBin);
        setPBin.equ(pBinId, new sql_1.ExpVar(binId));
        const setBinNull = factory.createSet();
        loop.statements.add(setBinNull);
        setBinNull.equ(binId, sql_1.ExpVal.null);
    }
    buildBinOneRow(bin) {
        const statements = [];
        const { act, id: entityId } = bin;
        const { factory, site, dbName } = this.context;
        if (act !== undefined) {
            const call = factory.createCall();
            statements.push(call);
            call.db = '$site';
            call.procName = `${site}.${entityId}`;
            call.params = [
                { value: new sql_1.ExpVar(sqlBuilder_1.userParamName) },
                { value: new sql_1.ExpVar(binId) },
            ];
        }
        const delBinPend = factory.createDelete();
        statements.push(delBinPend);
        delBinPend.tables = [a];
        delBinPend.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.binPend, false, a));
        delBinPend.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar(binId)));
        return statements;
    }
    // 这个应该是之前试验的老版本，现在应该不用了。
    // 直接在uq GetSheet里面实现了。
    buildGetProc(proc) {
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        parameters.push((0, il_1.bigIntField)('id'));
        const varBinTable = factory.createVarTable();
        statements.push(varBinTable);
        varBinTable.name = tempBinTable;
        let idField = (0, il_1.bigIntField)('id');
        varBinTable.keys = [idField];
        varBinTable.fields = [idField];
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(consts_1.$site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(site));
        let { main, details } = this.bizEntity;
        this.buildCallBin(statements, main, 'main');
        for (let detail of details) {
            const { bin } = detail;
            this.buildCallBin(statements, bin, 'details');
        }
        const arrBinIType = [BinIType.atom, BinIType.fork, BinIType.forkAtom];
        let typeField = (0, il_1.tinyIntField)('type');
        const varIdPhraseTable = factory.createVarTable();
        statements.push(varIdPhraseTable);
        varIdPhraseTable.name = tempIdPhraseTable;
        const phraseField = (0, il_1.bigIntField)('phrase');
        const budField = (0, il_1.bigIntField)('bud');
        varIdPhraseTable.keys = [idField];
        varIdPhraseTable.fields = [idField, phraseField, typeField];
        statements.push(...arrBinIType.map(v => this.buildSelectIdPhrase(v)));
        const varPhraseBudTable = factory.createVarTable();
        statements.push(varPhraseBudTable);
        varPhraseBudTable.name = tempPhraseBudTable;
        const phraseParentField = (0, il_1.bigIntField)('parent');
        varPhraseBudTable.keys = [phraseField, phraseParentField, budField];
        varPhraseBudTable.fields = [phraseField, phraseParentField, budField];
        statements.push(this.buildSelectPhraseBud());
        const varITable = factory.createVarTable();
        statements.push(varITable);
        varITable.name = tempITable;
        varITable.keys = [idField, budField];
        varITable.fields = [idField, budField, typeField];
        statements.push(...arrBinIType.map(v => this.buildSelectShowBuds(v)));
        const expValue = new sql_1.ExpField('value', b);
        function funcJSON_QUOTE() {
            return new sql_1.ExpFunc('JSON_QUOTE', expValue);
        }
        function funcCast() {
            return new sql_1.ExpFuncCustom(factory.func_cast, expValue, new sql_1.ExpDatePart('JSON'));
        }
        let budTypes = [
            [funcCast, il_1.EnumSysTable.ixBudInt, BizPhraseType_1.BudDataType.int],
            [funcCast, il_1.EnumSysTable.ixBudDec, BizPhraseType_1.BudDataType.dec],
            [funcJSON_QUOTE, il_1.EnumSysTable.ixBudStr, BizPhraseType_1.BudDataType.str],
        ];
        statements.push(...budTypes.map(([func, tbl, budDataType]) => this.buildSelectIxBud(func, tbl, budDataType)));
    }
    buildSelectPhraseBud() {
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable(tempPhraseBudTable);
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'parent', val: undefined },
            { col: 'bud', val: undefined },
        ];
        let selectAtomPhrase = factory.createSelect();
        insert.select = selectAtomPhrase;
        selectAtomPhrase.lock = select_1.LockType.none;
        let selectCTE = factory.createSelect();
        selectCTE.lock = select_1.LockType.none;
        const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
        selectAtomPhrase.cte = { alias: cte, recursive: true, select: selectCTE };
        selectCTE.column(new sql_1.ExpField('phrase', s0));
        selectCTE.column(new sql_1.ExpField('i', s));
        selectCTE.column(new sql_1.ExpField('x', s));
        selectCTE.from(new statementWithFrom_1.VarTable(tempIdPhraseTable, s0))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBizPhrase, false, s))
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
        selectAtomPhrase.from(new statementWithFrom_1.NameTable(cte, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBudShow, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('phrase', a)));
        return insert;
    }
    buildSelectIdPhrase(binIType) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable(tempIdPhraseTable);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'type', val: undefined },
        ];
        const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
        let select = factory.createSelect();
        insert.select = select;
        select.lock = select_1.LockType.none;
        select.from(new statementWithFrom_1.VarTable('bin', s0))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, s1))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', s1), new sql_1.ExpField('id', s0)));
        switch (binIType) {
            case BinIType.atom:
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, t))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', t), new sql_1.ExpField('i', s1)));
                select.column(new sql_1.ExpField('id', t));
                select.column(new sql_1.ExpField('base', t));
                select.column(new sql_1.ExpNum(BinIType.atom));
                break;
            case BinIType.fork:
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, u))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u), new sql_1.ExpField('i', s1)))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, u0))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u0), new sql_1.ExpField('base', u)));
                select.column(new sql_1.ExpField('id', u));
                select.column(new sql_1.ExpField('ext', u0));
                select.column(new sql_1.ExpNum(BinIType.fork));
                break;
            case BinIType.forkAtom:
                select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, u))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u), new sql_1.ExpField('i', s1)))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, u0))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u0), new sql_1.ExpField('base', u)))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, u1))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u1), new sql_1.ExpField('base', u0)));
                ;
                select.column(new sql_1.ExpField('id', u1));
                select.column(new sql_1.ExpField('base', u1));
                select.column(new sql_1.ExpNum(BinIType.atom));
                break;
        }
        return insert;
    }
    buildSelectIxBud(func, tbl, budDataType) {
        const { factory } = this.context;
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
        select.column(new sql_1.ExpField('bud', a), 'phrase');
        select.column(func(), 'value');
        select.column(new sql_1.ExpField('bud', a), 'id');
        select.from(new statementWithFrom_1.VarTable(tempITable, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tbl, false, b))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', b), new sql_1.ExpField('bud', a))));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('type', a), new sql_1.ExpNum(budDataType)));
        return insert;
    }
    buildSelectShowBuds(binIType) {
        const { factory } = this.context;
        let insert = this.buildInsertITable();
        let select = factory.createSelect();
        insert.select = select;
        select.lock = select_1.LockType.none;
        let selectI = this.buildSelectI(binIType);
        select.column(new sql_1.ExpField('i', b), 'id');
        select.column(new sql_1.ExpField('x', b), 'bud');
        select.column(new sql_1.ExpField('type', b), 'type');
        select.from(new select_1.SelectTable(selectI, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBudShow, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('x', a)));
        return insert;
    }
    buildSelectI(binIType) {
        const { factory } = this.context;
        let selectAtomPhrase = factory.createSelect();
        selectAtomPhrase.lock = select_1.LockType.none;
        let selectCTE = factory.createSelect();
        selectCTE.lock = select_1.LockType.none;
        const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
        selectAtomPhrase.cte = { alias: cte, recursive: true, select: selectCTE };
        selectCTE.column(new sql_1.ExpField('i', s));
        selectCTE.column(new sql_1.ExpField('x', s));
        selectCTE.from(new statementWithFrom_1.VarTable('bin', s0))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, s1))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', s1), new sql_1.ExpField('id', s0)));
        let tField;
        switch (binIType) {
            case BinIType.atom:
                selectCTE.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, t))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', t), new sql_1.ExpField('i', s1)));
                tField = new sql_1.ExpField('base', t);
                break;
            case BinIType.fork:
                selectCTE.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, u))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u), new sql_1.ExpField('i', s1)))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, u0))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u0), new sql_1.ExpField('base', u)));
                tField = new sql_1.ExpField('ext', u0);
                break;
            case BinIType.forkAtom:
                selectCTE.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.spec, false, u))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u), new sql_1.ExpField('i', s1)))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, u0))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u0), new sql_1.ExpField('base', u)))
                    .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.atom, false, u1))
                    .on(new sql_1.ExpEQ(new sql_1.ExpField('id', u1), new sql_1.ExpField('base', u0)));
                ;
                tField = new sql_1.ExpField('base', u1);
                break;
        }
        selectCTE.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBizPhrase, false, s))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('x', s), tField));
        let select1 = factory.createSelect();
        select1.lock = select_1.LockType.none;
        select1.column(new sql_1.ExpField('i', r));
        select1.column(new sql_1.ExpField('x', r));
        select1.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBizPhrase, false, r))
            .join(il_1.JoinType.join, new statementWithFrom_1.NameTable(cte, r0))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('i', r0), new sql_1.ExpField('x', r)));
        selectCTE.unions = [select1];
        selectCTE.unionsAll = true;
        selectAtomPhrase.distinct = true;
        selectAtomPhrase.column(new sql_1.ExpField('x'));
        selectAtomPhrase.from(new statementWithFrom_1.NameTable(cte));
        return selectAtomPhrase;
    }
    buildInsertITable() {
        let insert = this.context.factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTableWithSchema(tempITable);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'bud', val: undefined },
            { col: 'type', val: undefined },
        ];
        return insert;
    }
    buildCallBin(statements, bizBin, tbl) {
        let { factory } = this.context;
        let vProc = 'proc_' + bizBin.id;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var(vProc, new il_1.Char(200));
        let setVProc = factory.createSet();
        statements.push(setVProc);
        setVProc.equ(vProc, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar(consts_1.$site), new sql_1.ExpStr('.'), new sql_1.ExpNum(bizBin.id), new sql_1.ExpStr('gb')));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpRoutineExists(new sql_1.ExpStr(consts_1.$site), new sql_1.ExpVar(vProc));
        let truncate = factory.createTruncate();
        iff.then(truncate);
        truncate.table = new statementWithFrom_1.VarTableWithSchema(tempBinTable);
        let insertBins = factory.createInsert();
        iff.then(insertBins);
        insertBins.table = truncate.table;
        insertBins.cols = [{ col: 'id', val: undefined }];
        let selectBins = factory.createSelect();
        insertBins.select = selectBins;
        selectBins.col('id');
        selectBins.from(new statementWithFrom_1.VarTableWithSchema(tbl));
        let execSql = factory.createExecSql();
        iff.then(execSql);
        execSql.no = bizBin.id;
        execSql.sql = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('CALL `' + consts_1.$site + '`.`'), new sql_1.ExpVar(vProc), new sql_1.ExpStr('`()'));
    }
    buildOutInit(statements, out) {
        const varName = '$' + out.varName;
        const { factory } = this.context;
        let tblTo = factory.createVarTable();
        statements.push(tblTo);
        tblTo.name = varName + '$TO';
        let fieldTo = (0, il_1.bigIntField)('to');
        tblTo.fields = [fieldTo];
        tblTo.keys = [fieldTo];
        let set = factory.createSet();
        statements.push(set);
        let params = [];
        for (let [, bud] of out.out.props) {
            const { dataType, name } = bud;
            if (dataType !== BizPhraseType_1.BudDataType.arr)
                continue;
            params.push(new sql_1.ExpStr(name), new sql_1.ExpFunc('JSON_ARRAY'));
        }
        set.isAtVar = true;
        set.equ(varName, new sql_1.ExpFunc('JSON_OBJECT', ...params));
    }
    buildOut(statements, out) {
        const { factory } = this.context;
        const { varName, out: bizOut } = out;
        const vName = '$' + varName;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `call PROC to write OUT @${vName} ${bizOut.getJName()}`;
        const call = factory.createCall();
        statements.push(call);
        call.db = '$site';
        call.procName = `${this.context.site}.${bizOut.id}`;
        call.params.push({
            paramType: il_1.ProcParamType.in,
            value: new sql_1.ExpAtVar(vName),
        });
    }
}
exports.BBizSheet = BBizSheet;
//# sourceMappingURL=BizSheet.js.map