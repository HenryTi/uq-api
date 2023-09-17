"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsSqlBuilder = exports.MsProcedure = exports.MsTable = exports.MsFactory = void 0;
const factory_1 = require("../factory");
const table_1 = require("../table");
const procedure_1 = require("../procedure");
const sqlBuilder_1 = require("../sqlBuilder");
class MsFactory extends factory_1.Factory {
    constructor() {
        super(...arguments);
        this.func_charindex = 'CHARINDEX';
        this.func_ascii = 'ASCII';
        this.func_length = 'LEN';
        this.func_substr = 'SUBSTR';
        this.func_now = 'GETDATE';
        this.func_lastinsertid = 'SCOPE_IDENTITY';
        this.func_datepart = 'DATEPART';
        this.func_concat = 'CONCAT';
        this.func_concat_ws = 'CONCAT_WS';
        this.func_year = 'YEAR';
        this.func_month = 'MONTH';
        this.func_day = 'DAY';
        this.func_weekday = 'WEEKDAY';
        this.func_ifnull = 'ISNULL';
        this.func_if = 'IF';
        this.func_greatest = 'MAX';
        this.func_adddate = 'DATEADD';
        this.func_count = 'COUNT';
        this.func_max = 'MAX';
        this.func_min = 'MIN';
        this.func_from_unixtime = 'FROM_UNIXTIME';
        this.func_substring_index = 'SUBSTRING_INDEX';
        this.func_hex = "HEX";
        this.func_unhex = "UNHEX";
        this.func_abs = 'ABS';
    }
    createTable(dbName, name) {
        return new MsTable(dbName, name);
    }
    createProcedure(dbName, name, isCore = false) {
        return new MsProcedure(this.dbContext, dbName, name, isCore);
    }
    createFunction(dbName, name, returnType) {
        return new MsProcedure(this.dbContext, dbName, name, true, returnType);
    }
    createSqlBuilder() {
        return new MsSqlBuilder(this);
    }
    createDeclare() { return; }
    createSet() { return; }
    createIf() { return; }
    createWhile() { return; }
    createUpdate() { return; }
    createInsert() { return; }
    createInsertOnDuplicate() { return; }
    createUpsert() { return; }
    createSelect() { return; }
    createLog() { return; }
    createCall() { return; }
    createDelete() { return; }
    createTruncate() { return; }
    createVarTable() { return; }
    createForTable(isInProc) { return; } // isInProc：是不是在存储过程里面
    createBreak() { return; }
    createContinue() { return; }
    createReturn() { return; }
    createReturnBegin() { return; }
    createReturnEnd() { return; }
    createLeaveProc() { return; }
    createMemo() { return; }
    createExecSql() { return; }
    createPrepare() { return; }
    createExecutePrepare() { return; }
    createDeallocatePrepare() { return; }
    createSetTableSeed() { return; }
    createGetTableSeed() { return; }
    createTransaction() { return; }
    createCommit() { return; }
    createRollBack() { return; }
    createInline() { return; }
    createSignal() { return; }
    createSleep() { return; }
    createBlockBegin() { return; }
    createBlockEnd() { return; }
    createSetUTCTimezone() { return; }
    getDatePart(part) {
        return part;
    }
    //func_week = "WEEK";
    //func_yearweek = "YEARWEEK";
    //func_str_to_date = "STR_TO_DATE";
    func_group_concat(sb, params) { throw 'func_group_concat'; }
    ;
    func_unix_timestamp(sb, params) { throw 'func_unix_timestamp'; }
    func_utc_timestamp(sb, params) { throw 'func_unix_timestamp'; }
    func_current_timestamp(sb) { throw 'current_timestamp'; }
    func_dateadd(sb, params) { throw 'func_dateadd'; }
    lPad(exp, num, char) { return; }
    func_cast(sb, params) { return; }
    //proc_fresh_open(db:string):string {return}
    func_unittimezone(sb) { return; }
    func_timezone(sb) { return; }
    func_bizmonth(sb) { return; }
    func_bizdate(sb) { return; }
    func_bizmonthid(sb, params) { return; }
    func_bizyearid(sb, params) { return; }
}
exports.MsFactory = MsFactory;
class MsTable extends table_1.Table {
    update(sb) { }
    createUpdater(dbConfig) { return; }
    start(sb) { }
    end(sb) { }
    field(sb, field) { }
    primaryKey(sb, keys) { }
    index(sb, index) { }
}
exports.MsTable = MsTable;
class MsProcedure extends procedure_1.Procedure {
    get dbProcName() { return this.name; }
    createUpdater() {
        return;
    }
    buildDrop(sb) {
    }
    start(sb) {
    }
    end(sb) {
    }
    param(sb, p) { sb.append(p.name); }
    declareStart(sb) {
        sb.append('DECLARE ');
    }
    declareVar(sb, v) {
        sb.var(v.name).space();
        v.dataType.sql(sb);
    }
    declareEnd(sb) {
        sb.ln();
    }
    afterDeclare(sb, tab) {
    }
}
exports.MsProcedure = MsProcedure;
class MsSqlBuilder extends sqlBuilder_1.SqlBuilder {
    var$unit() { return this; }
    var$user() { return this; }
    func(func, params) {
    }
}
exports.MsSqlBuilder = MsSqlBuilder;
//# sourceMappingURL=sqlMs.js.map