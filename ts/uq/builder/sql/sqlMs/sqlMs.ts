import { Factory } from '../factory';
import { Table, TableUpdater } from '../table';
import { Procedure, ProcedureUpdater } from '../procedure';
import { SqlBuilder } from '../sqlBuilder';
import * as stat from '../statement';
import { Select } from '../select';
import { ExpVal } from '../exp';
import { DataType, Field, Index } from '../../../il';
import { DeleteStatement, TruncateStatement } from '../deleteStatement';

export class MsFactory extends Factory {
    createTable(dbName: string, name: string): Table {
        return new MsTable(dbName, name);
    }
    createProcedure(dbName: string, name: string, isCore: boolean = false): Procedure {
        return new MsProcedure(this.dbContext, dbName, name, isCore);
    }
    createFunction(dbName: string, name: string, returnType: DataType): Procedure {
        return new MsProcedure(this.dbContext, dbName, name, true, returnType);
    }
    createSqlBuilder(): SqlBuilder {
        return new MsSqlBuilder(this);
    }

    createDeclare(): stat.Declare { return; }
    createSet(): stat.Set { return; }
    createIf(): stat.If { return; }
    createWhile(): stat.While { return; }
    createUpdate(): stat.Update { return; }
    createInsert(): stat.Insert { return; }
    createInsertOnDuplicate(): stat.InsertOnDuplicate { return; }
    createUpsert(): stat.Upsert { return; }
    createSelect(): Select { return; }
    createLog(): stat.Log { return; }
    createCall(): stat.Call { return; }
    createDelete(): DeleteStatement { return; }
    createTruncate(): TruncateStatement { return; }
    createVarTable(): stat.VarTable { return; }
    createForTable(isInProc: boolean): stat.ForTable { return; }  // isInProc：是不是在存储过程里面
    createBreak(): stat.Break { return; }
    createContinue(): stat.Continue { return; }
    createReturn(): stat.Return { return }
    createReturnBegin(): stat.ReturnBegin { return }
    createReturnEnd(): stat.ReturnEnd { return }
    createLeaveProc(): stat.LeaveProc { return; }
    createMemo(): stat.Memo { return; }
    createExecSql(): stat.ExecSql { return; }
    createPrepare(): stat.Prepare { return; }
    createExecutePrepare(): stat.ExecutePrepare { return; }
    createDeallocatePrepare(): stat.DeallocatePrepare { return; }
    createSetTableSeed(): stat.SetTableSeed { return; }
    createGetTableSeed(): stat.GetTableSeed { return; }
    createTransaction(): stat.Transaction { return; }
    createCommit(): stat.Commit { return; }
    createRollBack(): stat.RollBack { return; }
    createInline(): stat.Inline { return; }
    createSignal(): stat.Singal { return; }
    createSleep(): stat.Sleep { return; }
    createBlockBegin(): stat.BlockBegin { return; }
    createBlockEnd(): stat.BlockEnd { return; }
    createSetUTCTimezone(): stat.SetUTCTimezone { return; }

    getDatePart(part: string): string {
        return part;
    }

    func_charindex = 'CHARINDEX';
    func_ascii = 'ASCII';
    func_length = 'LEN';
    func_substr = 'SUBSTR';
    func_now = 'GETDATE';
    func_lastinsertid = 'SCOPE_IDENTITY';
    func_datepart = 'DATEPART';
    func_concat = 'CONCAT';
    func_concat_ws = 'CONCAT_WS';
    func_year = 'YEAR';
    func_month = 'MONTH';
    func_day = 'DAY';
    func_weekday = 'WEEKDAY';
    func_ifnull = 'ISNULL';
    func_if = 'IF';
    func_greatest = 'MAX';
    func_adddate = 'DATEADD';
    func_count = 'COUNT';
    func_max = 'MAX';
    func_min = 'MIN';
    func_from_unixtime = 'FROM_UNIXTIME';
    func_substring_index = 'SUBSTRING_INDEX';
    func_hex = "HEX";
    func_unhex = "UNHEX";
    //func_week = "WEEK";
    //func_yearweek = "YEARWEEK";
    //func_str_to_date = "STR_TO_DATE";
    func_group_concat(sb: SqlBuilder, params: ExpVal[]) { throw 'func_group_concat' };
    func_unix_timestamp(sb: SqlBuilder, params: ExpVal[]) { throw 'func_unix_timestamp' }
    func_utc_timestamp(sb: SqlBuilder, params: ExpVal[]) { throw 'func_unix_timestamp' }
    func_current_timestamp(sb: SqlBuilder) { throw 'current_timestamp' }
    func_dateadd(sb: SqlBuilder, params: ExpVal[]) { throw 'func_dateadd' }
    lPad(exp: ExpVal, num: ExpVal, char: ExpVal): ExpVal { return; }
    func_cast(sb: SqlBuilder, params: ExpVal[]): void { return; }

    //proc_fresh_open(db:string):string {return}
    func_unittimezone(sb: SqlBuilder) { return; }
    func_timezone(sb: SqlBuilder) { return; }
    func_bizmonth(sb: SqlBuilder): void { return; }
    func_bizdate(sb: SqlBuilder): void { return; }
    func_bizmonthid(sb: SqlBuilder, params: ExpVal[]): void { return; }
    func_bizyearid(sb: SqlBuilder, params: ExpVal[]): void { return; }
    func_abs = 'ABS';
}

export class MsTable extends Table {
    update(sb: SqlBuilder) { }
    protected createUpdater(dbConfig: any): TableUpdater { return }
    protected start(sb: SqlBuilder) { }
    protected end(sb: SqlBuilder) { }
    protected field(sb: SqlBuilder, field: Field) { }
    protected primaryKey(sb: SqlBuilder, keys: Field[]) { }
    protected index(sb: SqlBuilder, index: Index) { }
}

export class MsProcedure extends Procedure {
    get dbProcName() { return this.name; }
    protected createUpdater(): ProcedureUpdater {
        return;
    }
    protected buildDrop(sb: SqlBuilder): void {
    }
    protected start(sb: SqlBuilder) {
    }
    protected end(sb: SqlBuilder) {
    }
    protected param(sb: SqlBuilder, p: Field) { sb.append(p.name); }
    // protected returnPuts(sb: SqlBuilder, tab: number, puts: { [put: string]: boolean }) { }
    protected declareStart(sb: SqlBuilder) {
        sb.append('DECLARE ');
    }
    protected declareVar(sb: SqlBuilder, v: Field) {
        sb.var(v.name).space();
        v.dataType.sql(sb);
    }
    protected declareEnd(sb: SqlBuilder) {
        sb.ln();
    }
    protected afterDeclare(sb: SqlBuilder, tab: number) {
    }
}

export class MsSqlBuilder extends SqlBuilder {
    var$unit(): SqlBuilder { return this; }
    var$user(): SqlBuilder { return this; }
    func(func: string, params: ExpVal[]) {

    }
}
