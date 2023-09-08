import { Table } from './table';
import { Procedure } from './procedure';
import { SqlBuilder } from './sqlBuilder';
import { ExpVal, ExpCmp } from './exp';
import { Select } from './select';
import * as stat from './statement';
import { DeleteStatement, TruncateStatement } from './deleteStatement';
import { DbContext } from '../dbContext';
import { DataType } from '../../il';

export abstract class Factory {
    readonly dbContext: DbContext;
    constructor(dbContext: DbContext) {
        this.dbContext = dbContext;
    }

    abstract createTable(dbName: string, tblName: string): Table;
    abstract createProcedure(dbName: string, procName: string, isCore: boolean): Procedure;
    abstract createFunction(dbName: string, procName: string, returnType: DataType): Procedure;
    abstract createSqlBuilder(): SqlBuilder;

    abstract createDeclare(): stat.Declare;
    abstract createSet(): stat.Set;
    abstract createIf(): stat.If;
    abstract createWhile(): stat.While;
    abstract createUpdate(): stat.Update;
    abstract createInsertOnDuplicate(): stat.InsertOnDuplicate;
    abstract createInsert(): stat.Insert;
    abstract createUpsert(): stat.Upsert;
    abstract createSelect(): Select;
    abstract createLog(): stat.Log;
    abstract createCall(): stat.Call;
    abstract createDelete(): DeleteStatement;
    abstract createTruncate(): TruncateStatement;
    abstract createVarTable(): stat.VarTable;
    abstract createForTable(isInProc: boolean): stat.ForTable;  // isInProc：是不是在存储过程里面
    abstract createBreak(): stat.Break;
    abstract createContinue(): stat.Continue;
    abstract createReturn(): stat.Return;
    abstract createReturnBegin(): stat.ReturnBegin;
    abstract createReturnEnd(): stat.ReturnEnd;
    abstract createLeaveProc(): stat.LeaveProc;
    abstract createMemo(): stat.Memo;
    abstract createExecSql(): stat.ExecSql;
    abstract createPrepare(): stat.Prepare;
    abstract createExecutePrepare(): stat.ExecutePrepare;
    abstract createDeallocatePrepare(): stat.DeallocatePrepare;

    abstract createSetTableSeed(): stat.SetTableSeed;
    abstract createGetTableSeed(): stat.GetTableSeed;
    abstract createTransaction(): stat.Transaction;
    abstract createCommit(): stat.Commit;
    abstract createRollBack(): stat.RollBack;
    abstract createInline(): stat.Inline;
    abstract createSignal(): stat.Singal;
    abstract createSleep(): stat.Sleep;
    abstract createBlockBegin(): stat.BlockBegin;
    abstract createBlockEnd(): stat.BlockEnd;
    abstract createSetUTCTimezone(): stat.SetUTCTimezone;

    abstract getDatePart(part: string): string;

    func_charindex: string;
    func_ascii: string;
    func_length: string;
    func_substr: string;
    func_now: string;
    func_lastinsertid: string;
    func_datepart: string;
    func_concat: string;
    func_concat_ws: string;
    func_date: string;
    func_utcdate: string;
    func_year: string;
    func_month: string;
    func_day: string;
    func_weekday: string;
    func_ifnull: string;
    func_if: string;
    func_greatest: string;
    func_adddate: string;
    //func_dateadd:string;
    func_timestampdiff: string;
    func_rowCount: string;
    func_count: string;
    func_sum: string = 'sum';
    func_max: string;
    func_min: string;
    func_from_unixtime: string;
    func_substring_index: string;
    func_hex: string;
    func_unhex: string;
    //func_week:string;
    //func_yearweek:string;
    //func_str_to_date:string;
    abstract func_group_concat(sb: SqlBuilder, params: ExpVal[]): void;
    abstract func_unix_timestamp(sb: SqlBuilder, params: ExpVal[]): void;
    abstract func_utc_timestamp(sb: SqlBuilder, params: ExpVal[]): void;
    abstract func_current_timestamp(sb: SqlBuilder): void;
    abstract func_dateadd(sb: SqlBuilder, params: ExpVal[]): void;
    abstract lPad(exp: ExpVal, num: ExpVal, char: ExpVal): ExpVal;
    abstract func_cast(sb: SqlBuilder, params: ExpVal[]): void;

    func_abs: string;

    func_idtext: string;
    func_textid: string;

    func_minuteddfromdate: string;

    abstract func_unittimezone(sb: SqlBuilder): void;
    abstract func_timezone(sb: SqlBuilder): void;
    abstract func_bizmonth(sb: SqlBuilder): void;
    abstract func_bizdate(sb: SqlBuilder): void;
    abstract func_bizmonthid(sb: SqlBuilder, params: ExpVal[]): void;
    abstract func_bizyearid(sb: SqlBuilder, params: ExpVal[]): void;
}
