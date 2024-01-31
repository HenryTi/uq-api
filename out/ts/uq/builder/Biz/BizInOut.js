"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizIOApp = exports.BBizOut = exports.BBizIn = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizIn extends BizEntity_1.BBizEntity {
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
        (0, il_1.jsonField)(vJson));
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
            if (bud.dataType !== il_1.BudDataType.arr) {
                vars.push(this.fieldFromBud(bud));
                let set = factory.createSet();
                statements.push(set);
                set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`)));
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
                let jsonTable = new statementWithFrom_1.FromJsonTable('a', varJson, `$.${arrName}[*]`, jsonColumns);
                selectJsonArr.from(jsonTable);
                selectJsonArr.lock = select_1.LockType.none;
                for (let [name, bud] of arrProps) {
                    let field = this.fieldFromBud(bud);
                    vars.push(field);
                    field.nullable = true;
                    fields.push(field);
                    cols.push({ col: name, val: new sql_1.ExpField(name, 'a') });
                    selectJsonArr.column(new sql_1.ExpField(name, 'a'));
                    jsonColumns.push({ field: this.fieldFromBud(bud), path: `$.${name}` });
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
            case il_1.BudDataType.char: return (0, il_1.charField)(name, 200);
            case il_1.BudDataType.int: return (0, il_1.intField)(name);
            case il_1.BudDataType.dec: return (0, il_1.decField)(name, 18, 6);
            case il_1.BudDataType.date: return (0, il_1.dateField)(name);
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
BBizIn.queueId = '$queueId';
class BBizOut extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const proc = this.createProcedure(`${this.context.site}.${id}`);
        this.buildProc(proc);
    }
    buildProc(proc) {
        const json = '$json', out = '$out', endPoint = '$endPoint', ioSite = '$ioSite', atom = '$atom', ioApp = '$ioApp', siteAtomApp = '$siteAtomApp', queueId = '$queueId';
        const { id, ioAppOuts } = this.bizEntity;
        const { parameters, statements } = proc;
        const { factory, site } = this.context;
        parameters.push(
        // bigIntField(ioSite),
        (0, il_1.bigIntField)(atom), 
        // bigIntField(ioApp),
        (0, il_1.jsonField)(json));
        if (ioAppOuts.length === 0)
            return;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)(consts_1.$site), (0, il_1.bigIntField)(out), (0, il_1.bigIntField)(endPoint), (0, il_1.bigIntField)(siteAtomApp), (0, il_1.bigIntField)(queueId));
        let vtTransErr = factory.createVarTable();
        statements.push(vtTransErr);
        vtTransErr.noDrop = true;
        vtTransErr.name = IOProc.transerr;
        const transErrIdField = (0, il_1.intField)('id');
        transErrIdField.autoInc = true;
        const atomField = (0, il_1.bigIntField)('atom');
        atomField.nullable = true;
        const noField = (0, il_1.charField)('no', 100);
        noField.nullable = true;
        vtTransErr.keys = [
            transErrIdField,
        ];
        vtTransErr.fields = [
            transErrIdField, (0, il_1.bigIntField)('appID'), atomField, noField,
        ];
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
                    { value: new sql_1.ExpVar(atom) },
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
        const funcAtomToNo = this.createFunction(`${this.context.site}.ATOMTONO`, new il_1.Char(100));
        new FuncAtomToNo(factory, funcAtomToNo).build();
        const funcNoToAtom = this.createFunction(`${this.context.site}.NOTOATOM`, new il_1.BigInt());
        new FuncNoToAtom(factory, funcNoToAtom).build();
        const { ins, outs } = this.bizEntity;
        for (let ioAppIn of ins) {
            const proc = this.createProcedure(`${this.context.site}.${ioAppIn.id}`);
            let ioProc = new IOProcIn(this.context, ioAppIn, proc);
            ioProc.buildProc();
        }
        for (let ioAppOut of outs) {
            const proc = this.createProcedure(`${this.context.site}.${ioAppOut.id}`);
            let ioProc = new IOProcOut(this.context, ioAppOut, proc);
            ioProc.buildProc();
        }
    }
}
exports.BBizIOApp = BBizIOApp;
class FuncTo {
    constructor(factory, func) {
        this.param = 'param';
        this.factory = factory;
        this.func = func;
    }
    build() {
        const { parameters, statements } = this.func;
        parameters.push((0, il_1.bigIntField)(FuncTo.appID), // IOApp.ID
        this.fromField());
        let declare = this.factory.createDeclare();
        statements.push(declare);
        declare.vars(this.toField());
        let ifParamNotNull = this.factory.createIf();
        statements.push(ifParamNotNull);
        ifParamNotNull.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(this.param));
        let select = this.factory.createSelect();
        ifParamNotNull.then(select);
        select.toVar = true;
        select.lock = select_1.LockType.none;
        select.col(this.toName, this.toName);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOAppAtom, false));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('appID'), new sql_1.ExpVar(FuncTo.appID)), new sql_1.ExpEQ(new sql_1.ExpField(this.fromName), new sql_1.ExpVar(this.param))));
        let iff = this.factory.createIf();
        ifParamNotNull.then(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(this.toName));
        const insertErr = this.factory.createInsert();
        iff.then(insertErr);
        insertErr.ignore = true;
        insertErr.table = new statementWithFrom_1.VarTable(IOProc.transerr);
        insertErr.cols = [
            { col: 'appID', val: new sql_1.ExpVar('appID') },
            { col: this.fromName, val: new sql_1.ExpVar(this.param) },
        ];
        let ret = this.factory.createReturn();
        statements.push(ret);
        ret.returnVar = this.toName;
    }
}
FuncTo.appID = 'appID';
class FuncNoToAtom extends FuncTo {
    constructor() {
        super(...arguments);
        this.fromName = 'no';
        this.toName = 'atom';
    }
    fromField() { return (0, il_1.charField)(this.param, 100); }
    toField() { return (0, il_1.bigIntField)(this.toName); }
}
class FuncAtomToNo extends FuncTo {
    constructor() {
        super(...arguments);
        this.fromName = 'atom';
        this.toName = 'no';
    }
    fromField() { return (0, il_1.bigIntField)(this.param); }
    toField() { return (0, il_1.charField)(this.toName, 100); }
}
class IOProc {
    constructor(context, ioAppIO, proc) {
        this.buildVal = (bud) => {
            return new sql_1.ExpFunc('JSON_VALUE', this.expJson, new sql_1.ExpStr(`$.${bud.name}`));
        };
        this.buildValInArr = (bud) => {
            const { name } = bud;
            return new sql_1.ExpField(name, IOProc.jsonTable);
        };
        this.context = context;
        this.factory = context.factory;
        this.ioAppIO = ioAppIO;
        this.proc = proc;
        this.expJson = new sql_1.ExpVar(IOProc.vJson);
    }
    transID(ioAppID, val) {
        return new sql_1.ExpFuncDb('$site', `${this.context.site}.${this.transFuncName}`, new sql_1.ExpFuncInUq('duo$id', [
            sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNull.null,
            new sql_1.ExpVar(IOProc.siteAtomApp), new sql_1.ExpNum(ioAppID.id),
        ], true), val);
    }
    buildJsonTrans() {
        const { bizIO, peers } = this.ioAppIO;
        const { props } = bizIO;
        let select = this.factory.createSelect();
        select.lock = select_1.LockType.none;
        select.column(this.buidlJsonObj(props, peers, this.buildVal));
        return select;
    }
    buidlJsonObj(props, peers, func) {
        let objParams = [];
        for (let [name, bud] of props) {
            let peer = peers[name];
            let val;
            switch (bud.dataType) {
                default:
                    val = func(bud);
                    break;
                case il_1.BudDataType.arr:
                    val = this.buidlJsonArr(name, bud.props, peer.peers);
                    break;
                case il_1.BudDataType.ID:
                    val = this.transID(peer.id, func(bud));
                    break;
            }
            let objName;
            if (peer === undefined) {
                objName = name;
            }
            else {
                const { to, name: peerName } = peer;
                objName = to !== null && to !== void 0 ? to : peerName;
            }
            objParams.push(new sql_1.ExpStr(objName), bud.dataType !== il_1.BudDataType.arr ?
                val
                :
                    this.buidlJsonArr(name, bud.props, peer.peers));
        }
        return new sql_1.ExpFunc('JSON_OBJECT', ...objParams);
    }
    buidlJsonArr(arrName, props, peers) {
        let select = this.factory.createSelect();
        select.lock = select_1.LockType.none;
        const columns = Array.from(props).map(([name, bud]) => {
            let field;
            switch (bud.dataType) {
                default:
                    debugger;
                    break;
                case il_1.BudDataType.ID:
                case il_1.BudDataType.date:
                case il_1.BudDataType.int:
                    field = (0, il_1.bigIntField)(name);
                    break;
                case il_1.BudDataType.dec:
                    field = (0, il_1.decField)(name, 24, 6);
                    break;
                case il_1.BudDataType.arr:
                    field = (0, il_1.jsonField)(name);
                    break;
                case il_1.BudDataType.char:
                case il_1.BudDataType.str:
                    field = (0, il_1.charField)(name, 400);
                    break;
            }
            let ret = {
                field,
                path: `$.${name}`,
            };
            return ret;
        });
        select.column(new sql_1.ExpFunc('JSON_ARRAYAGG', this.buidlJsonObj(props, peers, this.buildValInArr)));
        select.from(new statementWithFrom_1.FromJsonTable(IOProc.jsonTable, this.expJson, `$.${arrName}[*]`, columns));
        return new sql_1.ExpSelect(select);
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
IOProc.queueId = '$queueId';
IOProc.transerr = '$transerr';
IOProc.endPoint = '$endPoint';
const a = 'a', b = 'b';
class IOProcIn extends IOProc {
    constructor() {
        super(...arguments);
        this.transFuncName = 'NoToAtom';
    }
    buildProc() {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        parameters.push((0, il_1.bigIntField)(IOProc.queueId), (0, il_1.jsonField)(IOProc.vJson));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.jsonField)(IOProc.vRetJson), (0, il_1.bigIntField)(IOProc.siteAtomApp), (0, il_1.bigIntField)(IOProc.endPoint));
        let selectSiteAtomApp = factory.createSelect();
        statements.push(selectSiteAtomApp);
        selectSiteAtomApp.toVar = true;
        selectSiteAtomApp.col('siteAtomApp', IOProc.siteAtomApp, b);
        selectSiteAtomApp.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOQueue, false, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOEndPoint, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('endPoint', a)));
        selectSiteAtomApp.where(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpVar(IOProc.queueId)));
        let ifSiteAtomApp = factory.createIf();
        statements.push(ifSiteAtomApp);
        ifSiteAtomApp.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(IOProc.siteAtomApp));
        let set = factory.createSet();
        ifSiteAtomApp.then(set);
        set.equ(IOProc.vRetJson, new sql_1.ExpSelect(this.buildJsonTrans()));
        let stats = this.buildAfterTrans();
        ifSiteAtomApp.then(...stats);
    }
    buildAfterTrans() {
        let statements = [];
        let call = this.factory.createCall();
        statements.push(call);
        call.db = consts_1.$site;
        call.procName = `${this.context.site}.${this.ioAppIO.bizIO.id}`;
        call.params = [
            { paramType: il_1.ProcParamType.in, value: new sql_1.ExpVar(IOProc.queueId) },
            { paramType: il_1.ProcParamType.in, value: new sql_1.ExpVar(IOProc.vRetJson) },
        ];
        return statements;
    }
}
class IOProcOut extends IOProc {
    constructor() {
        super(...arguments);
        this.transFuncName = 'AtomToNo';
    }
    buildParams() {
        return [
            (0, il_1.bigIntField)(IOProc.ioSite),
            (0, il_1.bigIntField)(IOProc.atom),
            (0, il_1.jsonField)(IOProc.vJson),
        ];
    }
    buildProc() {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        parameters.push(...this.buildParams());
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.jsonField)(IOProc.vRetJson), (0, il_1.bigIntField)(IOProc.siteAtomApp), (0, il_1.bigIntField)(IOProc.ioAppIO), (0, il_1.bigIntField)(IOProc.queueId), (0, il_1.bigIntField)(IOProc.endPoint));
        let setIOAppIO = factory.createSet();
        statements.push(setIOAppIO);
        setIOAppIO.equ(IOProc.ioAppIO, new sql_1.ExpNum(this.ioAppIO.id));
        let selectSiteAtomApp = factory.createSelect();
        statements.push(selectSiteAtomApp);
        selectSiteAtomApp.toVar = true;
        selectSiteAtomApp.col('id', IOProc.siteAtomApp);
        selectSiteAtomApp.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOSiteAtomApp, false));
        selectSiteAtomApp.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('ioSiteAtom'), new sql_1.ExpFuncInUq('duo$id', [
            sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNull.null,
            new sql_1.ExpVar(IOProc.ioSite), new sql_1.ExpVar(IOProc.atom),
        ], true)), new sql_1.ExpEQ(new sql_1.ExpField('ioApp'), new sql_1.ExpNum(this.ioAppIO.ioApp.id))));
        let ifSiteAtomApp = factory.createIf();
        statements.push(ifSiteAtomApp);
        ifSiteAtomApp.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(IOProc.siteAtomApp));
        let set = factory.createSet();
        ifSiteAtomApp.then(set);
        set.equ(IOProc.vRetJson, new sql_1.ExpSelect(this.buildJsonTrans()));
        let stats = this.buildAfterTrans();
        ifSiteAtomApp.then(...stats);
    }
    buildAfterTrans() {
        let statements = [];
        const selectEndPoint = this.factory.createSelect();
        statements.push(selectEndPoint);
        selectEndPoint.toVar = true;
        selectEndPoint.col('id', IOProc.endPoint);
        selectEndPoint.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOEndPoint, false));
        selectEndPoint.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('siteAtomApp'), new sql_1.ExpVar(IOProc.siteAtomApp)), new sql_1.ExpEQ(new sql_1.ExpField('appIO'), new sql_1.ExpVar(IOProc.ioAppIO))));
        const ifEndPoint = this.factory.createIf();
        statements.push(ifEndPoint);
        ifEndPoint.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(IOProc.endPoint));
        const setQueueId = this.factory.createSet();
        ifEndPoint.then(setQueueId);
        setQueueId.equ(IOProc.queueId, new sql_1.ExpFuncInUq('IOQueue$id', [sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null, new sql_1.ExpVar(IOProc.endPoint)], true));
        const update = this.factory.createUpdate();
        ifEndPoint.then(update);
        update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOQueue, false);
        update.cols = [
            { col: 'value', val: new sql_1.ExpVar(IOProc.vRetJson) },
        ];
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(IOProc.queueId));
        const insert = this.factory.createInsert();
        ifEndPoint.then(insert);
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOInOut, false);
        insert.cols = [
            { col: 'i', val: sql_1.ExpNum.num0 },
            { col: 'x', val: new sql_1.ExpVar(IOProc.queueId) },
        ];
        return statements;
    }
}
//# sourceMappingURL=BizInOut.js.map