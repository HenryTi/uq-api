"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOStatementBuilder = void 0;
const il_1 = require("../../../il");
const sql_1 = require("../../sql");
const select_1 = require("../../sql/select");
const statementWithFrom_1 = require("../../sql/statementWithFrom");
const transErr = 'transerr';
const a = 'a', b = 'b', c = 'c';
const ioAppIO = '$ioAppIO';
const siteAtomApp = '$siteAtomApp';
const queueId = '$queueId';
const pSiteAtomApp = '$pSiteAtomApp';
const vJson = '$json';
const vRetJson = '$retJson';
const jsonTable = 't';
const otherSite = '$otherSite';
const endPoint = '$endPoint';
const vDone = '$done';
const atom = '$atom';
const appID = '$appID';
const ioSite = '$ioSite';
class IOStatementBuilder {
    constructor(factory) {
        this.factory = factory;
    }
    transErrorTable() {
        let vtTransErr = this.factory.createVarTable();
        vtTransErr.noDrop = true;
        vtTransErr.name = IOStatementBuilder.transerr;
        const transErrIdField = (0, il_1.intField)('id');
        transErrIdField.autoInc = true;
        const appIDField = (0, il_1.bigIntField)('appID');
        appIDField.nullable = true;
        const atomField = (0, il_1.bigIntField)('atom');
        atomField.nullable = true;
        const noField = (0, il_1.charField)('no', 100);
        noField.nullable = true;
        vtTransErr.keys = [
            transErrIdField,
        ];
        vtTransErr.fields = [
            transErrIdField, appIDField, atomField, noField,
        ];
        let indexAppIDAtom = new il_1.Index('appID_atom', true);
        indexAppIDAtom.fields.push(appIDField, atomField);
        let indexAppIDNo = new il_1.Index('appID_no', true);
        indexAppIDNo.fields.push(appIDField, noField);
        vtTransErr.indexes = [indexAppIDAtom, indexAppIDNo];
        return vtTransErr;
    }
    transErrorJsonInit() {
        let initTranErr = this.factory.createSet();
        initTranErr.isAtVar = true;
        initTranErr.equ(transErr, new sql_1.ExpFunc('JSON_ARRAY'));
        return initTranErr;
    }
    transErrorInsert(varAppID, fromField, fromVar) {
        const insertErr = this.factory.createInsert();
        insertErr.ignore = true;
        insertErr.table = new statementWithFrom_1.VarTable(IOStatementBuilder.transerr);
        insertErr.cols = [
            { col: 'appID', val: varAppID },
            { col: fromField, val: new sql_1.ExpVar(fromVar) },
        ];
        return insertErr;
    }
    transErrorAppend(varAppID, fromField, fromVar) {
        const setAppend = this.factory.createSet();
        setAppend.isAtVar = true;
        setAppend.equ(transErr, new sql_1.ExpFunc('JSON_ARRAY_APPEND', new sql_1.ExpAtVar(transErr), new sql_1.ExpStr('$'), new sql_1.ExpFunc('JSON_OBJECT', new sql_1.ExpStr('appID'), varAppID, new sql_1.ExpStr(fromField), new sql_1.ExpVar(fromVar))));
        return setAppend;
    }
    transErrTruncate() {
        let truncateTransErr = this.factory.createTruncate();
        truncateTransErr.table = new statementWithFrom_1.VarTable(IOStatementBuilder.transerr);
        return truncateTransErr;
    }
    transErrMerge() {
        let insert = this.factory.createInsert();
        let tblTransErr = new statementWithFrom_1.VarTable(IOStatementBuilder.transerr);
        insert.table = tblTransErr;
        const cols = insert.cols = [
            { col: 'appID', val: undefined },
            { col: 'atom', val: undefined },
            { col: 'no', val: undefined },
        ];
        let select = this.factory.createSelect();
        insert.select = select;
        let jsonColumns = [
            { field: (0, il_1.bigIntField)('appID'), path: `$.appID` },
            { field: (0, il_1.bigIntField)('atom'), path: `$.atom` },
            { field: (0, il_1.charField)('no', 100), path: `$.no` },
        ];
        let jsonTable = new statementWithFrom_1.FromJsonTable('a', new sql_1.ExpAtVar(transErr), `$[*]`, jsonColumns);
        cols.forEach(v => select.col(v.col));
        select.from(jsonTable);
        select.lock = select_1.LockType.none;
        return insert;
    }
    transErrCount() {
        let tblTransErr = new statementWithFrom_1.VarTable(IOStatementBuilder.transerr, a);
        let selectTransErrCount = this.factory.createSelect();
        selectTransErrCount.from(tblTransErr);
        selectTransErrCount.column(new sql_1.ExpFunc(this.factory.func_count, new sql_1.ExpStar()));
        selectTransErrCount.limit(sql_1.ExpNum.num1);
        return selectTransErrCount;
    }
    transSelect() {
        let tblTransErr = new statementWithFrom_1.VarTable(IOStatementBuilder.transerr, a);
        let selectTranErr = this.factory.createSelect();
        selectTranErr.from(tblTransErr)
            .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.duo, false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('appID', a)));
        selectTranErr.column(new sql_1.ExpFunc('JSON_ARRAYAGG', new sql_1.ExpFunc('JSON_OBJECT', 
        // new ExpStr('siteAtomApp'), new ExpField('i', b),
        new sql_1.ExpStr('ID'), new sql_1.ExpField('x', b), new sql_1.ExpStr('atom'), new sql_1.ExpField('atom', a), new sql_1.ExpStr('no'), new sql_1.ExpField('no', a))), 'v');
        return selectTranErr;
    }
    insertIOError(inOut) {
        let varQueueId = new sql_1.ExpVar(queueId);
        let select = this.factory.createSelect();
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOError, false));
        select.col('id');
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), varQueueId));
        let selectTranErr = this.transSelect();
        let iff = this.factory.createIf();
        iff.cmp = new sql_1.ExpExists(select);
        let update = this.factory.createUpdate();
        iff.then(update);
        update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOError, false);
        update.cols = [
            { col: 'result', val: new sql_1.ExpSelect(selectTranErr) },
            { col: 'times', val: new sql_1.ExpAdd(new sql_1.ExpField('times'), sql_1.ExpNum.num1) },
        ];
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), varQueueId);
        let insertIOError = this.factory.createInsert();
        iff.else(insertIOError);
        insertIOError.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOError, false);
        insertIOError.cols = [
            { col: 'id', val: varQueueId },
            { col: 'siteAtomApp', val: new sql_1.ExpVar(siteAtomApp) },
            { col: 'appIO', val: new sql_1.ExpVar(ioAppIO) },
            { col: 'result', val: new sql_1.ExpSelect(selectTranErr) },
            { col: 'inout', val: new sql_1.ExpNum(inOut) },
        ];
        return [iff];
    }
}
exports.IOStatementBuilder = IOStatementBuilder;
IOStatementBuilder.transerr = '$transerr';
//# sourceMappingURL=IOStatementBuilder.js.map