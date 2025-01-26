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
const tools_1 = require("../tools");
// import { buildIdPhraseTable, buildInsertSelectIdPhrase, buildPhraseBudTable, buildSelectIdPhrases, buildSelectIxBuds, buildSelectPhraseBud } from "../tools";
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
const siteAtomApp = '$siteAtomApp';
class BBizSheet extends BizEntity_1.BBizEntity {
    buildProcedures() {
        const _super = Object.create(null, {
            buildProcedures: { get: () => super.buildProcedures }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.buildProcedures.call(this);
            const procSubmit = this.createSiteEntityProcedure();
            this.buildSubmitProc(procSubmit);
            const procGet = this.createSiteEntityProcedure('gs'); // gs = get sheet
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
        // sheet main 界面编辑的时候，value，amount，price 保存到 ixDec 里面了。现在转到bin表上
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
            select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixDec, false));
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
        /*
        select.from(new EntityTable(EnumSysTable.bizDetail, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('id', a)));
        select.where(new ExpAnd(
            new ExpGT(new ExpField('id', a), new ExpVar(pBinId)),
            new ExpEQ(new ExpField('ext', b), new ExpNum(entityId)),
            new ExpEQ(new ExpField('base', b), new ExpVar('$id')),
            new ExpIsNotNull(new ExpField('value', c)),
        ));
        */
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, a));
        select.where(new sql_1.ExpAnd(new sql_1.ExpGT(new sql_1.ExpField('id', a), new sql_1.ExpVar(pBinId)), new sql_1.ExpEQ(new sql_1.ExpField('base', a), new sql_1.ExpNum(entityId)), new sql_1.ExpEQ(new sql_1.ExpField('sheet', a), new sql_1.ExpVar('$id')), new sql_1.ExpNE(new sql_1.ExpField('id', a), new sql_1.ExpField('sheet', a)), new sql_1.ExpIsNotNull(new sql_1.ExpField('value', a))));
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
            call.db = `${consts_1.$site}.${site}`;
            call.procName = `${entityId}`;
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
        // const varIdPhraseTable = buildIdPhraseTable(this.context);
        // statements.push(varIdPhraseTable);
        function buildSelectFrom(select) {
            const s0 = 's0', s1 = 's1';
            select.from(new statementWithFrom_1.VarTable('bin', s0))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, s1))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', s1), new sql_1.ExpField('id', s0)));
        }
        // statements.push(...buildSelectIdPhrases(this.context, buildSelectFrom));
        /*
        const varPhraseBudTable = buildPhraseBudTable(this.context); // factory.createVarTable();
        statements.push(varPhraseBudTable);
        statements.push(buildSelectPhraseBud(this.context));
        */
        const idBuds = [];
        this.collectIdBuds(main, idBuds);
        this.buildInsertIdTable(statements, main, 'main');
        for (let detail of details) {
            const { bin } = detail;
            this.collectIdBuds(bin, idBuds);
            this.buildInsertIdTable(statements, bin, 'details');
        }
        this.buildInsertIdTableBuds(statements, idBuds);
        let expValue = new sql_1.ExpField('value', 'b');
        let expCast = new sql_1.ExpFuncCustom(factory.func_cast, expValue, new sql_1.ExpDatePart('JSON'));
        this.buildGetScalarProps(statements, il_1.EnumSysTable.ixInt, expCast);
        // statements.push(...buildSelectIxBuds(this.context));
        this.buildGetProps(statements);
        this.buildGetBinProps(statements);
    }
    collectIdBuds(bizBin, idBuds) {
        let { props, i, x } = bizBin;
        for (let [, value] of props) {
            if (value === i || value === x)
                continue;
            if (value.dataType === BizPhraseType_1.BudDataType.atom)
                idBuds.push(value);
        }
    }
    buildInsertIdTable(statements, bizBin, tbl) {
        const { i, x } = bizBin;
        if (i !== undefined)
            statements.push(this.buildInsertIdTableIX(i, tbl));
        if (x !== undefined)
            statements.push(this.buildInsertIdTableIX(x, tbl));
    }
    buildInsertIdTableBuds(statements, idBuds) {
        if (idBuds.length === 0)
            return;
        const expId = new sql_1.ExpField('value', b);
        function buildFrom(select) {
            let expX = new sql_1.ExpField('x', b);
            let expXEqu = idBuds.length === 1 ?
                new sql_1.ExpEQ(expX, new sql_1.ExpNum(idBuds[0].id))
                :
                    new sql_1.ExpIn(expX, ...(idBuds.map(v => new sql_1.ExpNum(v.id))));
            select.from(new statementWithFrom_1.VarTable('bin', a))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixInt, false, b))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('id', a)), expXEqu));
        }
        let insert = (0, tools_1.buildInsertIdTable)(this.context, expId, false, buildFrom);
        /*
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'seed', val: undefined },
            { col: 'show', val: undefined },
        ];
        insert.ignore = true;
        insert.table = new VarTable('idtable');
        const select = factory.createSelect();
        insert.select = select;
        select.col('id', undefined, c);
        select.col('base', 'phrase', c);
        select.col('seed', undefined, c);
        select.column(ExpNum.num1, 'show');
        let expX = new ExpField('x', b);
        let expXEqu: ExpCmp = idBuds.length === 1 ?
            new ExpEQ(expX, new ExpNum(idBuds[0].id))
            :
            new ExpIn(expX, ...(idBuds.map(v => new ExpNum(v.id))));
        select.from(new VarTable('bin', a))
            .join(JoinType.join, new EntityTable(EnumSysTable.ixInt, false, b))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('i', b), new ExpField('id', a)),
                expXEqu
            ))
            .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('value', b)));
        */
        statements.push(insert);
    }
    buildInsertIdTableIX(ix, tbl) {
        const expId = new sql_1.ExpField(ix.name, a);
        function buildFrom(select) {
            select.from(new statementWithFrom_1.VarTable(tbl, a));
        }
        let insert = (0, tools_1.buildInsertIdTable)(this.context, expId, true, buildFrom);
        /*
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'seed', val: undefined },
            { col: 'show', val: undefined },
        ];
        insert.ignore = true;
        insert.table = new VarTable('idtable');
        const select = factory.createSelect();
        insert.select = select;
        select.col('id', undefined, b);
        select.col('base', 'phrase', b);
        select.col('seed', undefined, b);
        select.column(ExpNum.num1, 'show');
        select.from(new VarTable(tbl, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.idu, false, b))
            .on(new ExpEQ(new ExpField(ix.name, a), new ExpField('id', b)));
        */
        return insert;
    }
    buildGetProps(statements) {
        const { factory } = this.context;
        let expValue = new sql_1.ExpField('value', 'b');
        let expCast = new sql_1.ExpFuncCustom(factory.func_cast, expValue, new sql_1.ExpDatePart('JSON'));
        let expJSONQUOTE = new sql_1.ExpFunc('JSON_QUOTE', expValue);
        this.buildGetScalarProps(statements, il_1.EnumSysTable.ixDec, expCast);
        this.buildGetScalarProps(statements, il_1.EnumSysTable.ixStr, expJSONQUOTE);
        this.buildGetScalarProps(statements, il_1.EnumSysTable.ixJson, expValue);
    }
    buildGetScalarProps(statements, sysTable, expValue) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'bud', val: undefined },
            { col: 'value', val: undefined },
        ];
        const select = factory.createSelect();
        insert.select = select;
        select.column(new sql_1.ExpField('id', a));
        select.column(new sql_1.ExpField('x', b));
        select.column(expValue);
        select.from(new statementWithFrom_1.VarTable('bin', a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(sysTable, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('i', b)));
    }
    buildGetBinProps(statements) {
        const { main, details } = this.bizEntity;
        main.forEachBud(v => this.buildBinBud(statements, 'main', v));
        for (let detail of details)
            detail.bin.forEachBud(v => this.buildBinBud(statements, 'details', v));
    }
    buildBinBud(statements, tbl, bud) {
        if (bud.dataType !== BizPhraseType_1.BudDataType.bin)
            return;
        const { factory } = this.context;
        const binBud = bud;
        const { showBuds, sysBuds, sysNO } = binBud;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bud ${binBud.getJName()} bin ${binBud.bin.getJName()}`;
        for (let sysBud of sysBuds) {
            this.buildBinSysProp(statements, tbl, bud, sysBud);
        }
        if (sysNO === undefined) {
            this.buildBinSysProp(statements, tbl, bud, il_1.EnumSysBud.sheetNo);
        }
        for (let [bud0, bud1] of showBuds) {
            if (bud0 === undefined) {
                this.buildBinProp(statements, tbl, bud, bud1, true);
            }
            else {
                this.buildBinProp(statements, tbl, bud, bud0, false);
            }
        }
    }
    buildBinSysProp(statements, tbl, binBud, sysBud) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'bud', val: undefined },
            { col: 'value', val: undefined },
        ];
        const select = factory.createSelect();
        insert.select = select;
        select.column(new sql_1.ExpField('value', b), 'id');
        select.column(new sql_1.ExpNum(sysBud), 'bud');
        let valueCol;
        switch (sysBud) {
            default:
                debugger;
                break;
            case il_1.EnumSysBud.id:
                valueCol = 'id';
                break;
            case il_1.EnumSysBud.sheetDate:
                valueCol = 'id';
                break;
            case il_1.EnumSysBud.sheetNo:
                valueCol = 'no';
                break;
            case il_1.EnumSysBud.sheetOperator:
                valueCol = 'operator';
                break;
        }
        select.column(new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpField(valueCol, c), new sql_1.ExpDatePart('json')), 'value');
        select.from(new statementWithFrom_1.VarTable(tbl, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixInt, false, b))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', b), new sql_1.ExpNum(binBud.id))));
        let expId = new sql_1.ExpField('value', b);
        if (tbl === 'details') {
            const t0 = 't0', t1 = 't1';
            /*
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizDetail, false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expId))
                .join(JoinType.join, new EntityTable('bud', false, t1))
                .on(new ExpEQ(new ExpField('id', t1), new ExpField('base', t0)));
            expId = new ExpField('base', t1);
            */
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, t0))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', t0), expId));
            expId = new sql_1.ExpField('sheet', t0);
        }
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizSheet, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), expId));
    }
    buildBinProp(statements, tbl, binBud, bud, upMain) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'bud', val: undefined },
            { col: 'value', val: undefined },
        ];
        const select = factory.createSelect();
        insert.select = select;
        const expValue = new sql_1.ExpField('value', c);
        let tblIxName, colValue = new sql_1.ExpFuncCustom(factory.func_cast, expValue, new sql_1.ExpDatePart('json'));
        switch (bud.dataType) {
            default:
                tblIxName = il_1.EnumSysTable.ixInt;
                break;
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                tblIxName = il_1.EnumSysTable.ixStr;
                colValue = new sql_1.ExpFunc('JSON_QUOTE', expValue);
                break;
            case BizPhraseType_1.BudDataType.dec:
                tblIxName = il_1.EnumSysTable.ixDec;
                break;
        }
        let expBin = new sql_1.ExpField('value', b);
        select.column(expBin, 'id');
        select.column(new sql_1.ExpField('x', c), 'phrase');
        select.column(colValue, 'value');
        select.from(new statementWithFrom_1.VarTable(tbl, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixInt, false, b))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('x', b), new sql_1.ExpNum(binBud.id))));
        if (upMain === true) {
            const t0 = 't0', t1 = 't1';
            /*
            select.join(JoinType.join, new EntityTable('detail', false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expBin))
                .join(JoinType.join, new EntityTable('bud', false, t1))
                .on(new ExpEQ(new ExpField('id', t1), new ExpField('base', t0)));
            */
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, t1))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', t1), expBin));
            expBin = new sql_1.ExpField('sheet', t1);
        }
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxName, false, c))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', c), expBin), new sql_1.ExpEQ(new sql_1.ExpField('x', c), new sql_1.ExpNum(bud.id))));
    }
    buildCallBin(statements, bizBin, tbl) {
        let { factory } = this.context;
        let insertBins = factory.createInsert();
        statements.push(insertBins);
        insertBins.table = new statementWithFrom_1.VarTableWithSchema(tempBinTable);
        insertBins.cols = [{ col: 'id', val: undefined }];
        let selectBins = factory.createSelect();
        insertBins.select = selectBins;
        selectBins.col('id');
        selectBins.from(new statementWithFrom_1.VarTableWithSchema(tbl));
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
        call.db = `${consts_1.$site}.${this.context.site}`;
        call.procName = `${bizOut.id}`;
        call.params.push({
            paramType: il_1.ProcParamType.in,
            value: new sql_1.ExpAtVar(vName),
        });
    }
}
exports.BBizSheet = BBizSheet;
//# sourceMappingURL=BizSheet.js.map