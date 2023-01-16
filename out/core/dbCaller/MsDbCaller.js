"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsDbCaller = void 0;
const builder_1 = require("./builder");
const dbCaller_1 = require("./dbCaller");
class MsDbCaller extends dbCaller_1.DbCaller {
    constructor(dbName, dbConfig) {
        super(dbName);
    }
    createBuilder() { return new builder_1.MsBuilder(this.dbName, this.hasUnit, this.twProfix); }
    loadTwProfix() { return; }
    execQueueAct() { return; }
    removeAllScheduleEvents() { return; }
    createProcObjs(db) { return; }
    reset() { }
    ;
    sql(sql, params) { return; }
    sqlProc(db, procName, procSql) { return; }
    buildProc(db, procName, procSql, isFunc) { return; }
    buildRealProcFrom$ProcTable(db, proc) { return; }
    sqlDropProc(db, procName, isFunc) { return; }
    call(db, proc, params) { return; }
    callEx(db, proc, params) { return; }
    buildTuidAutoId(db) { return; }
    tableFromProc(db, proc, params) { return; }
    tablesFromProc(db, proc, params) { return; }
    buildDatabase(db) { return; }
    createDatabase(db) { return; }
    existsDatabase(db) { return; }
    setDebugJobs() { return; }
    saveTextId(text) { return; }
    uqDbs() { return; }
    createResDb(resDbName) { return; }
    create$UqDb() { return; }
    isExistsProcInDb(proc) { return false; }
    createProcInDb(db, proc) { return; }
    getEvents(db) { return; }
}
exports.MsDbCaller = MsDbCaller;
//# sourceMappingURL=MsDbCaller.js.map