"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizSheet = void 0;
const il_1 = require("../../il");
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
const binId = 'bin';
const pBinId = '$pBin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const tempBinTable = 'bin';
const siteAtomApp = '$siteAtomApp';
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
    buildOutInit(statements, out) {
        const varName = '$' + out.varName;
        const { factory } = this.context;
        let set = factory.createSet();
        statements.push(set);
        let params = [];
        for (let [, bud] of out.ioAppOut.bizIO.props) {
            const { dataType, name } = bud;
            if (dataType !== il_1.BudDataType.arr)
                continue;
            params.push(new sql_1.ExpStr(name), new sql_1.ExpFunc('JSON_ARRAY'));
        }
        set.isAtVar = true;
        set.equ(varName, new sql_1.ExpFunc('JSON_OBJECT', ...params));
    }
    buildOut(statements, out) {
        const { factory } = this.context;
        const { varName, ioSite, ioApp, ioAppOut } = out;
        const vName = '$' + varName;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `call PROC to write OUT @${vName} ${ioAppOut.getJName()}`;
        let selectSiteAtomApp = factory.createSelect();
        statements.push(selectSiteAtomApp);
        selectSiteAtomApp.toVar = true;
        selectSiteAtomApp.col('id', siteAtomApp);
        selectSiteAtomApp.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOSiteAtomApp, false));
        selectSiteAtomApp.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('ioSiteAtom'), new sql_1.ExpFuncInUq('duo$id', [
            sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNull.null,
            new sql_1.ExpNum(ioSite.id), new sql_1.ExpAtVar(vName + '$to'),
        ], true)), new sql_1.ExpEQ(new sql_1.ExpField('ioApp'), new sql_1.ExpNum(ioApp.id))));
        const proc = factory.createCall();
        statements.push(proc);
        proc.db = '$site';
        proc.procName = `${this.context.site}.${ioAppOut.id}`;
        proc.params.push(
        /*
        {
            paramType: ProcParamType.in,
            value: new ExpNum(ioSite.id),
        },
        {
            paramType: ProcParamType.in,
            value: new ExpAtVar(vName + '$to'),
        },
        {
            paramType: ProcParamType.in,
            value: new ExpNum(ioApp.id),
        },
        */
        {
            paramType: il_1.ProcParamType.in,
            value: new sql_1.ExpVar(siteAtomApp),
        }, {
            paramType: il_1.ProcParamType.in,
            value: new sql_1.ExpAtVar(vName),
        });
    }
}
exports.BBizSheet = BBizSheet;
//# sourceMappingURL=BizSheet.js.map