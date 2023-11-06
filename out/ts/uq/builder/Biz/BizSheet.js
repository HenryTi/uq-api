"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizBin = exports.BBizSheet = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
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
const i = 'i';
const x = 'x';
const value = 'value';
const amount = 'amount';
const price = 'price';
const binId = 'bin';
const pBinId = '$pBin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const tempBinTable = 'bin';
class BBizSheet extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
        const procGet = this.createProcedure(`${this.context.site}.${id}gs`); // gs = get sheet
        this.buildGetProc(procGet);
    }
    buildSubmitProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { main, details } = this.bizEntity;
        const site = '$site';
        const cId = '$id';
        parameters.push((0, il_1.bigIntField)(site), userParam, (0, il_1.idField)(cId, 'big'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)(sheetId), (0, il_1.bigIntField)(si), (0, il_1.bigIntField)(sx), (0, il_1.decField)(svalue, 18, 6), (0, il_1.decField)(samount, 18, 6), (0, il_1.decField)(sprice, 18, 6));
        // main
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bin ${main.name}`;
        let setBin = factory.createSet();
        statements.push(setBin);
        setBin.equ(binId, new sql_1.ExpVar(cId));
        let mainStatements = this.buildBinOneRow(main);
        statements.push(...mainStatements);
        // details
        declare.vars((0, il_1.bigIntField)(pendFrom), (0, il_1.bigIntField)(binId), (0, il_1.bigIntField)(pBinId));
        let len = details.length;
        for (let i = 0; i < len; i++) {
            let { bin } = details[i];
            this.buildBin(statements, bin, i + 101);
        }
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
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', a)));
        select.where(new sql_1.ExpAnd(new sql_1.ExpGT(new sql_1.ExpField('id', a), new sql_1.ExpVar(pBinId)), new sql_1.ExpEQ(new sql_1.ExpField('ext', b), new sql_1.ExpNum(entityId)), new sql_1.ExpEQ(new sql_1.ExpField('base', b), new sql_1.ExpVar('$id'))));
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
    buildGetProc(proc) {
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        parameters.push((0, il_1.bigIntField)('id'));
        const varTable = factory.createVarTable();
        statements.push(varTable);
        varTable.name = tempBinTable;
        let idField = (0, il_1.bigIntField)('id');
        varTable.keys = [idField];
        varTable.fields = [idField];
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
}
exports.BBizSheet = BBizSheet;
class BBizBin extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
        const procGet = this.createProcedure(`${this.context.site}.${id}gb`);
        this.buildGetProc(procGet);
    }
    buildSubmitProc(proc) {
        const { parameters, statements } = proc;
        const { factory, userParam, site } = this.context;
        const { act } = this.bizEntity;
        parameters.push(userParam, (0, il_1.bigIntField)('bin'));
        if (act === undefined) {
            return;
        }
        const declare = factory.createDeclare();
        statements.push(declare);
        const bigint = new il_1.BigInt();
        const decValue = new il_1.Dec(18, 6);
        declare.var(consts_1.$site, bigint);
        declare.var(s, bigint);
        declare.var(si, bigint);
        declare.var(sx, bigint);
        declare.var(svalue, decValue);
        declare.var(samount, decValue);
        declare.var(sprice, decValue);
        declare.var(pendFrom, bigint);
        declare.var(i, bigint);
        declare.var(x, bigint);
        declare.var(value, decValue);
        declare.var(amount, decValue);
        declare.var(price, decValue);
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(site));
        const a1 = 'a1';
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('id', a), binId);
        select.column(new sql_1.ExpField('i', a), i);
        select.column(new sql_1.ExpField('x', a), x);
        select.column(new sql_1.ExpField('value', a), value);
        select.column(new sql_1.ExpField('amount', a), amount);
        select.column(new sql_1.ExpField('price', a), price);
        select.column(new sql_1.ExpField('id', c), s);
        select.column(new sql_1.ExpField('i', c), si);
        select.column(new sql_1.ExpField('x', c), sx);
        select.column(new sql_1.ExpField('value', c), svalue);
        select.column(new sql_1.ExpField('price', c), sprice);
        select.column(new sql_1.ExpField('amount', c), samount);
        select.column(new sql_1.ExpField('pendFrom', d), pendFrom);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizDetail, false, a1))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a1), new sql_1.ExpField('id', a)))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('base', a1)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('base', b)))
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.binPend, false, d))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', d), new sql_1.ExpField('id', a)));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar('bin')));
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
    }
    buildGetProc(proc) {
        let showBuds = this.bizEntity.allShowBuds();
        if (showBuds === undefined) {
            proc.dropOnly = true;
            return;
        }
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(consts_1.$site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(site));
        if (showBuds !== undefined) {
            let memo = factory.createMemo();
            statements.push(memo);
            memo.text = this.bizEntity.name + ' show buds';
            statements.push(...this.buildGetShowBuds(showBuds));
        }
    }
    buildGetShowBuds(showBuds) {
        let statements = [];
        let { factory } = this.context;
        for (let i in showBuds) {
            let fieldShow = showBuds[i];
            let select = this.buildSelect(fieldShow);
            let insert = factory.createInsert();
            statements.push(insert);
            insert.table = new statementWithFrom_1.VarTableWithSchema('props');
            insert.cols = [
                { col: 'id', val: undefined },
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'owner', val: undefined },
            ];
            insert.select = select;
        }
        return statements;
    }
    buildSelect(fieldShow) {
        const { owner, items } = fieldShow;
        const { factory } = this.context;
        const select = factory.createSelect();
        select.column(new sql_1.ExpField('id', a), 'id');
        select.from(new statementWithFrom_1.VarTableWithSchema(tempBinTable, a));
        let lastT = 't0', lastField;
        let len = items.length - 1;
        let { bizEntity: lastEntity, bizBud: lastBud } = items[0];
        let { name: lastBudName } = lastBud;
        if (lastBudName === 'i' || lastBudName === 'x') {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, lastT))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', lastT), new sql_1.ExpField('id', a)));
            lastField = lastBudName;
        }
        else {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bizBin, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id', a)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false, lastT))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', lastT), new sql_1.ExpField('id', b)), new sql_1.ExpEQ(new sql_1.ExpField('x', lastT), new sql_1.ExpNum(lastBud.id))));
            lastField = 'value';
        }
        for (let i = 1; i < len; i++) {
            let { bizEntity, bizBud } = items[i];
            lastEntity = bizEntity;
            lastBud = bizBud;
            const t = 't' + i;
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.ixBudInt, false, t))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(bizBud.id))));
            lastT = t;
            lastField = 'value';
        }
        let t = 't' + len;
        let { bizEntity, bizBud } = items[len];
        let tblIxBud;
        switch (bizBud.dataType) {
            default:
                tblIxBud = il_1.EnumSysTable.ixBudInt;
                selectValue();
                break;
            case il_1.BudDataType.dec:
                tblIxBud = il_1.EnumSysTable.ixBudDec;
                selectValue();
                break;
            case il_1.BudDataType.str:
            case il_1.BudDataType.char:
                tblIxBud = il_1.EnumSysTable.ixBudStr;
                selectValue();
                break;
            case il_1.BudDataType.radio:
            case il_1.BudDataType.check:
                tblIxBud = il_1.EnumSysTable.ixBud;
                selectCheck();
                break;
        }
        function selectValue() {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxBud, false, t))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)), new sql_1.ExpEQ(new sql_1.ExpField('x', t), new sql_1.ExpNum(bizBud.id))));
            select.column(new sql_1.ExpNum(bizBud.id), 'phrase');
            select.column(new sql_1.ExpFunc('JSON_ARRAY', new sql_1.ExpField('value', t)));
        }
        function selectCheck() {
            select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblIxBud, false, t))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('i', t), new sql_1.ExpField(lastField, lastT)))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.bud, false, c))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', c), new sql_1.ExpField('x', t)));
            select.column(new sql_1.ExpField('base', c), 'phrase');
            select.column(new sql_1.ExpFunc('JSON_ARRAY', sql_1.ExpNum.num0, new sql_1.ExpField('ext', c)));
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('base', c), new sql_1.ExpNum(bizBud.id)));
        }
        let expOwner;
        if (owner === undefined) {
            expOwner = sql_1.ExpNum.num0;
        }
        else {
            expOwner = new sql_1.ExpNum(owner.id);
        }
        select.column(expOwner, 'owner');
        return select;
    }
}
exports.BBizBin = BBizBin;
//# sourceMappingURL=BizSheet.js.map