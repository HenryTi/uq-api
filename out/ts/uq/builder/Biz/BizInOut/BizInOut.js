"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizIOApp = exports.BBizOut = exports.BBizIn = void 0;
const il_1 = require("../../../il");
const bstatement_1 = require("../../bstatement");
const consts_1 = require("../../consts");
const sql_1 = require("../../sql");
const select_1 = require("../../sql/select");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const BizEntity_1 = require("../BizEntity");
const FuncTo_1 = require("./FuncTo");
const IOStatementBuilder_1 = require("./IOStatementBuilder");
const JsonTrans_1 = require("./JsonTrans");
const a = 'a', b = 'b', c = 'c';
class BBizInOut extends BizEntity_1.BBizEntity {
}
class BBizIn extends BBizInOut {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }
    buildSubmitProc(proc) {
        const vJson = '$json';
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const { act, props } = this.bizEntity;
        let varJson = new sql_1.ExpVar(vJson);
        parameters.push((0, il_1.bigIntField)(BBizIn.queueId), // IO queue id
        (0, il_1.bigIntField)(BBizIn.inSite), (0, il_1.jsonField)(vJson));
        const declare = factory.createDeclare();
        statements.push(declare);
        let vars = [
            (0, il_1.bigIntField)(consts_1.$site),
            (0, il_1.bigIntField)('$id'),
            (0, il_1.bigIntField)('$rowId'),
        ];
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(this.context.site));
        for (let [name, bud] of props) {
            const { dataType } = bud;
            if (dataType !== il_1.BudDataType.arr) {
                vars.push(this.fieldFromBud(bud));
                let set = factory.createSet();
                statements.push(set);
                let expVal = new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`));
                /*
                应该不需要，日期已经转换了bigint
                if (dataType === BudDataType.date) {
                    expVal = new ExpFuncCustom(factory.func_dateadd,
                        new ExpDatePart('day'),
                        expVal,
                        new ExpStr('1970-01-01')
                    );
                }
                */
                set.equ(name, expVal);
            }
            else {
                let { name: arrName, props: arrProps } = bud;
                let varTable = factory.createVarTable();
                statements.push(varTable);
                varTable.name = arrName;
                let idField = (0, il_1.intField)('$id');
                idField.autoInc = true;
                varTable.keys = [idField];
                varTable.fields = [idField];
                const { fields } = varTable;
                let insertArr = factory.createInsert();
                statements.push(insertArr);
                insertArr.table = new sql_1.SqlVarTable(arrName);
                insertArr.cols = [];
                const { cols } = insertArr;
                let selectJsonArr = factory.createSelect();
                insertArr.select = selectJsonArr;
                let jsonColumns = [];
                let jsonTable = new statementWithFrom_1.FromJsonTable('a', varJson, `$."${arrName}"[*]`, jsonColumns);
                selectJsonArr.from(jsonTable);
                selectJsonArr.lock = select_1.LockType.none;
                for (let [name, bud] of arrProps) {
                    let field = this.fieldFromBud(bud);
                    vars.push(field);
                    field.nullable = true;
                    fields.push(field);
                    cols.push({ col: name, val: new sql_1.ExpField(name, 'a') });
                    selectJsonArr.column(new sql_1.ExpField(name, 'a'));
                    jsonColumns.push({ field: this.fieldFromBud(bud), path: `$."${name}"` });
                }
            }
        }
        declare.vars(...vars);
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
        this.buildDone(statements);
    }
    fieldFromBud(bud) {
        const { name } = bud;
        switch (bud.dataType) {
            default:
                debugger;
                return;
            case il_1.BudDataType.ID:
            case il_1.BudDataType.int: return (0, il_1.bigIntField)(name);
            case il_1.BudDataType.char: return (0, il_1.charField)(name, 200);
            case il_1.BudDataType.dec: return (0, il_1.decField)(name, 18, 6);
            // case BudDataType.date: return dateField(name);
            case il_1.BudDataType.date: return (0, il_1.bigIntField)(name);
        }
    }
    buildDone(statements) {
        const { factory } = this.context;
        const updateQueue = factory.createUpdate();
        statements.push(updateQueue);
        updateQueue.cols = [
            { col: 'done', val: sql_1.ExpNum.num1 },
        ];
        updateQueue.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOQueue, false);
        updateQueue.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(BBizIn.queueId));
        const delInOut = factory.createDelete();
        statements.push(delInOut);
        delInOut.tables = ['a'];
        delInOut.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOInOut, false, 'a'));
        delInOut.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), sql_1.ExpNum.num1), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpVar(BBizIn.queueId))));
    }
}
exports.BBizIn = BBizIn;
// BizIn 的数据，ID和Date都已经转换成了bigint
BBizIn.queueId = '$queueId';
BBizIn.inSite = '$inSite';
class BBizOut extends BBizInOut {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const proc = this.createProcedure(`${this.context.site}.${id}`);
        this.buildProc(proc);
    }
    buildProc(proc) {
        const json = '$json', out = '$out', endPoint = '$endPoint', siteAtomApp = '$siteAtomApp', queueId = '$queueId';
        const { id, ioAppOuts } = this.bizEntity;
        const { parameters, statements } = proc;
        const { factory, site } = this.context;
        parameters.push((0, il_1.jsonField)(json));
        if (ioAppOuts.length === 0)
            return;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)(consts_1.$site), (0, il_1.bigIntField)(out), (0, il_1.bigIntField)(endPoint), (0, il_1.bigIntField)(siteAtomApp), (0, il_1.bigIntField)(queueId));
        let ioStatementBuilder = new IOStatementBuilder_1.IOStatementBuilder(factory);
        statements.push(ioStatementBuilder.transErrorTable());
        statements.push(ioStatementBuilder.transErrTruncate());
        statements.push(ioStatementBuilder.transErrorJsonInit());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(this.context.site));
        const setOut = factory.createSet();
        statements.push(setOut);
        setOut.equ(out, new sql_1.ExpNum(id));
        for (let ioAppOut of ioAppOuts) {
            const { ioApp } = ioAppOut;
            for (let ioSite of ioApp.ioSites) {
                let memo = factory.createMemo();
                statements.push(memo);
                memo.text = `IOSite: ${ioSite.getJName()} IOApp: ${ioApp.getJName()} Out: ${ioAppOut.bizIO.getJName()}`;
                let call = factory.createCall();
                statements.push(call);
                call.db = '$site';
                call.procName = `${site}.${ioAppOut.id}`;
                call.params = [
                    { value: new sql_1.ExpNum(ioSite.id) },
                    { value: new sql_1.ExpVar(json) },
                ];
            }
        }
    }
}
exports.BBizOut = BBizOut;
class BBizIOApp extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { factory } = this.context;
        const funcAtomToNo = this.createFunction(`${this.context.site}.${toNO}`, new il_1.Char(100));
        (new FuncTo_1.FuncAtomToNo(factory, funcAtomToNo)).build();
        const funcNoToAtom = this.createFunction(`${this.context.site}.${fromNO}`, new il_1.BigInt());
        (new FuncTo_1.FuncNoToAtom(factory, funcNoToAtom)).build();
        const objConnect = {};
        const { id, connect, ins, outs, IDs } = this.bizEntity;
        objConnect.type = connect.type;
        for (let ioAppID of IDs) {
            this.buildUniqueFunc(ioAppID);
        }
        for (let ioAppIn of ins) {
            const proc = this.createProcedure(`${this.context.site}.${ioAppIn.id}`);
            let ioProc = new IOProcIn(this.context, ioAppIn, proc);
            ioProc.buildProc();
        }
        let objOuts = {};
        for (let ioAppOut of outs) {
            const proc = this.createProcedure(`${this.context.site}.${ioAppOut.id}`);
            let ioProc = new IOProcOut(this.context, ioAppOut, proc);
            ioProc.buildProc();
            objOuts[ioAppOut.name] = ioAppOut.to;
        }
        objConnect.outs = objOuts;
        this.context.sqls.push(`
            INSERT INTO \`${this.context.dbName}\`.ioapp (id, connect) 
                VALUES (${id}, '${JSON.stringify(objConnect)}')
                ON DUPLICATE KEY UPDATE connect=VALUES(connect);
        `);
    }
    buildUniqueFunc(ioAppID) {
        const { unique } = ioAppID;
        if (unique === undefined)
            return;
        const { factory, site } = this.context;
        const { id } = ioAppID;
        const funcUniqueToNo = this.createFunction(`${site}.${id}.${toNO}`, new il_1.Char(100));
        new FuncTo_1.FuncUniqueToNo(factory, funcUniqueToNo, ioAppID).build();
        const funcUniqueFromNo = this.createFunction(`${site}.${id}.${fromNO}`, new il_1.BigInt());
        new FuncTo_1.FuncUniqueFromNo(factory, funcUniqueFromNo, ioAppID).build();
    }
}
exports.BBizIOApp = BBizIOApp;
const toNO = 'TONO';
const fromNO = 'FROMNO';
class IOProc {
    constructor(context, ioAppIO, proc) {
        this.context = context;
        this.factory = context.factory;
        this.ioAppIO = ioAppIO;
        this.proc = proc;
        this.expJson = new sql_1.ExpVar(IOProc.vJson);
    }
    buildJsonTrans() {
        const { bizIO, peers } = this.ioAppIO;
        const { props } = bizIO;
        let select = this.factory.createSelect();
        select.lock = select_1.LockType.none;
        let jsonTrans = new JsonTrans_1.JsonTrans(this, peers);
        const jo = jsonTrans.build();
        select.column(jo);
        return select;
    }
}
IOProc.atom = '$atom';
IOProc.appID = '$appID';
IOProc.ioSite = '$ioSite';
IOProc.ioAppIO = '$ioAppIO';
IOProc.vJson = '$json';
IOProc.vRetJson = '$retJson';
IOProc.jsonTable = 't';
IOProc.siteAtomApp = '$siteAtomApp';
IOProc.pSiteAtomApp = '$pSiteAtomApp';
IOProc.queueId = '$queueId';
IOProc.otherSite = '$otherSite';
IOProc.endPoint = '$endPoint';
IOProc.vDone = '$done';
class IOProcIn extends IOProc {
    constructor() {
        super(...arguments);
        this.transFuncName = fromNO;
    }
    buildProc() {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        parameters.push((0, il_1.bigIntField)(IOProc.queueId), (0, il_1.bigIntField)(IOProc.otherSite), (0, il_1.jsonField)(IOProc.vJson));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.jsonField)(IOProc.vRetJson), (0, il_1.bigIntField)(IOProc.siteAtomApp), (0, il_1.bigIntField)(IOProc.endPoint), (0, il_1.bigIntField)(IOProc.ioAppIO));
        let ioStatementBuilder = new IOStatementBuilder_1.IOStatementBuilder(factory);
        statements.push(ioStatementBuilder.transErrorTable());
        statements.push(ioStatementBuilder.transErrTruncate());
        statements.push(ioStatementBuilder.transErrorJsonInit());
        let selectSiteAtomApp = factory.createSelect();
        statements.push(selectSiteAtomApp);
        selectSiteAtomApp.toVar = true;
        selectSiteAtomApp.col('i', IOProc.siteAtomApp, b);
        selectSiteAtomApp.col('x', IOProc.ioAppIO, b);
        selectSiteAtomApp.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOQueue, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.duo, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('endPoint', a)));
        selectSiteAtomApp.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar(IOProc.queueId)));
        let ifSiteAtomApp = factory.createIf();
        statements.push(ifSiteAtomApp);
        ifSiteAtomApp.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(IOProc.siteAtomApp));
        let set = factory.createSet();
        ifSiteAtomApp.then(set);
        set.equ(IOProc.vRetJson, new sql_1.ExpSelect(this.buildJsonTrans()));
        ifSiteAtomApp.then(ioStatementBuilder.transErrMerge());
        let ifTransErr = factory.createIf();
        ifSiteAtomApp.then(ifTransErr);
        let selectTransErrCount = ioStatementBuilder.transErrCount();
        ifTransErr.cmp = new sql_1.ExpGT(new sql_1.ExpSelect(selectTransErrCount), sql_1.ExpNum.num0);
        ifTransErr.then();
        let insertIODone = ioStatementBuilder.insertIOError(1);
        ifTransErr.then(...insertIODone);
        let delInOut = factory.createDelete();
        ifTransErr.then(delInOut);
        delInOut.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOInOut, false, a));
        delInOut.tables = [a];
        delInOut.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), sql_1.ExpNum.num1), new sql_1.ExpEQ(new sql_1.ExpField('x', a), new sql_1.ExpVar(IOProc.queueId))));
        let delError = factory.createDelete();
        ifTransErr.else(delError);
        delError.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOError, false, a));
        delError.tables = [a];
        delError.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(IOProc.queueId)));
        ioStatementBuilder.transSelect();
        let stats = this.buildAfterTrans();
        ifTransErr.else(...stats);
    }
    buildAfterTrans() {
        let statements = [];
        let call = this.factory.createCall();
        statements.push(call);
        call.db = consts_1.$site;
        call.procName = `${this.context.site}.${this.ioAppIO.bizIO.id}`;
        call.params = [
            { paramType: il_1.ProcParamType.in, value: new sql_1.ExpVar(IOProc.queueId) },
            { paramType: il_1.ProcParamType.in, value: new sql_1.ExpVar(IOProc.otherSite) },
            { paramType: il_1.ProcParamType.in, value: new sql_1.ExpVar(IOProc.vRetJson) },
        ];
        return statements;
    }
}
class IOProcOut extends IOProc {
    constructor() {
        super(...arguments);
        this.transFuncName = toNO;
    }
    buildParams() {
        return [
            (0, il_1.bigIntField)(IOProc.ioSite),
            (0, il_1.jsonField)(IOProc.vJson),
        ];
    }
    buildProc() {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        parameters.push(...this.buildParams());
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.jsonField)(IOProc.vRetJson), (0, il_1.bigIntField)(IOProc.siteAtomApp), (0, il_1.bigIntField)(IOProc.pSiteAtomApp), (0, il_1.bigIntField)(IOProc.ioAppIO), (0, il_1.bigIntField)(IOProc.queueId), (0, il_1.bigIntField)(IOProc.endPoint), (0, il_1.tinyIntField)(IOProc.vDone));
        let setIOAppIO = factory.createSet();
        statements.push(setIOAppIO);
        setIOAppIO.equ(IOProc.ioAppIO, new sql_1.ExpNum(this.ioAppIO.id));
        let setP0 = factory.createSet();
        statements.push(setP0);
        setP0.equ(IOProc.pSiteAtomApp, sql_1.ExpNum.num0);
        let loop = factory.createWhile();
        statements.push(loop);
        loop.no = 99;
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
        let setSiteAtomAppNull = factory.createSet();
        loop.statements.add(setSiteAtomAppNull);
        setSiteAtomAppNull.equ(IOProc.siteAtomApp, sql_1.ExpNull.null);
        let ioStatementBuilder = new IOStatementBuilder_1.IOStatementBuilder(factory);
        let truncateTransErr = ioStatementBuilder.transErrTruncate();
        loop.statements.add(truncateTransErr);
        let selectSiteAtomApp = factory.createSelect();
        loop.statements.add(selectSiteAtomApp);
        selectSiteAtomApp.toVar = true;
        selectSiteAtomApp.col('id', IOProc.siteAtomApp, a);
        selectSiteAtomApp.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOSiteAtomApp, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.duo, false, b))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('ioSiteAtom', a), new sql_1.ExpField('id', b)), new sql_1.ExpEQ(new sql_1.ExpField('i', b), new sql_1.ExpVar(IOProc.ioSite))))
            .join(il_1.JoinType.join, new statementWithFrom_1.VarTable('$' + this.ioAppIO.bizIO.id + '$TO', c))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('x', b), new sql_1.ExpField('to', c)));
        selectSiteAtomApp.where(new sql_1.ExpAnd(new sql_1.ExpGT(new sql_1.ExpField('id', a), new sql_1.ExpVar(IOProc.pSiteAtomApp)), new sql_1.ExpEQ(new sql_1.ExpField('ioApp', a), new sql_1.ExpNum(this.ioAppIO.ioApp.id))));
        selectSiteAtomApp.order(new sql_1.ExpField('id', a), 'asc');
        selectSiteAtomApp.limit(sql_1.ExpNum.num1);
        let iffSiteAtomAppNull = factory.createIf();
        loop.statements.add(iffSiteAtomAppNull);
        iffSiteAtomAppNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(IOProc.siteAtomApp));
        let leave = factory.createBreak();
        iffSiteAtomAppNull.then(leave);
        leave.no = loop.no;
        let setP = factory.createSet();
        iffSiteAtomAppNull.else(setP);
        setP.equ(IOProc.pSiteAtomApp, new sql_1.ExpVar(IOProc.siteAtomApp));
        let set = factory.createSet();
        loop.statements.add(set);
        set.equ(IOProc.vRetJson, new sql_1.ExpSelect(this.buildJsonTrans()));
        let stats = this.buildAfterTrans();
        loop.statements.add(...stats);
    }
    buildAfterTrans() {
        let statements = [];
        const selectEndPoint = this.factory.createSelect();
        statements.push(selectEndPoint);
        selectEndPoint.toVar = true;
        selectEndPoint.col('id', IOProc.endPoint);
        selectEndPoint.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.duo, false));
        selectEndPoint.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpVar(IOProc.siteAtomApp)), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpVar(IOProc.ioAppIO))));
        const ifEndPoint = this.factory.createIf();
        statements.push(ifEndPoint);
        ifEndPoint.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(IOProc.endPoint));
        const setQueueId = this.factory.createSet();
        ifEndPoint.then(setQueueId);
        setQueueId.equ(IOProc.queueId, new sql_1.ExpFuncInUq('IOQueue$id', [sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null, new sql_1.ExpVar(IOProc.endPoint)], true));
        let ioStatementBuilder = new IOStatementBuilder_1.IOStatementBuilder(this.factory);
        ifEndPoint.then(ioStatementBuilder.transErrMerge());
        let ifTransErr = this.factory.createIf();
        ifEndPoint.then(ifTransErr);
        let selectTransErrCount = ioStatementBuilder.transErrCount();
        ifTransErr.cmp = new sql_1.ExpGT(new sql_1.ExpSelect(selectTransErrCount), sql_1.ExpNum.num0);
        let setDoneErrID = this.factory.createSet();
        ifTransErr.then(setDoneErrID);
        setDoneErrID.equ(IOProc.vDone, new sql_1.ExpNum(31)); // EnumQueueDoneType.errorID
        let insertIODone = ioStatementBuilder.insertIOError(0);
        ifTransErr.then(...insertIODone);
        let setDonePending = this.factory.createSet();
        ifTransErr.else(setDonePending);
        setDonePending.equ(IOProc.vDone, new sql_1.ExpNum(0)); // EnumQueueDoneType.pending
        const insert = this.factory.createInsert();
        ifTransErr.else(insert);
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOInOut, false);
        insert.cols = [
            { col: 'i', val: sql_1.ExpNum.num0 },
            { col: 'x', val: new sql_1.ExpVar(IOProc.queueId) },
        ];
        const update = this.factory.createUpdate();
        ifEndPoint.then(update);
        update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOQueue, false);
        update.cols = [
            { col: 'value', val: new sql_1.ExpVar(IOProc.vRetJson) },
            { col: 'done', val: new sql_1.ExpVar(IOProc.vDone) },
        ];
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(IOProc.queueId));
        return statements;
    }
}
//# sourceMappingURL=BizInOut.js.map