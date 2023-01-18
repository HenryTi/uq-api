"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsDbCaller = void 0;
// import { MsBuilder } from '../builder';
const dbCaller_1 = require("../dbCaller");
class MsDbCaller extends dbCaller_1.DbCaller {
    constructor(dbName, dbConfig) {
        super(dbName);
    }
    // protected createBuilder() { return new MsBuilder(this.dbName, this.hasUnit, this.twProfix); }
    loadTwProfix() { return; }
    execQueueAct() { return; }
    removeAllScheduleEvents() { return; }
    createProcObjs(db) { return; }
    reset() { }
    ;
    sql(sql, params) { return; }
    sqlProc(procName, procSql) { return; }
    buildProc(procName, procSql, isFunc) { return; }
    buildRealProcFrom$ProcTable(proc) { return; }
    sqlDropProc(procName, isFunc) { return; }
    call(proc, params) { return; }
    callEx(proc, params) { return; }
    buildTuidAutoId() { return; }
    tableFromProc(proc, params) { return; }
    tablesFromProc(proc, params) { return; }
    buildDatabase() { return; }
    createDatabase() { return; }
    existsDatabase() { return; }
    setDebugJobs() { return; }
    saveTextId(text) { return; }
    uqDbs() { return; }
    isExistsProc(proc) { return false; }
    createProc(proc) { return; }
    getEvents(db) { return; }
}
exports.MsDbCaller = MsDbCaller;
//# sourceMappingURL=MsDbCaller.js.map