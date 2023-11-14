"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetUTCTimezone = exports.BlockEnd = exports.BlockBegin = exports.Sleep = exports.Signal = exports.Inline = exports.RollBack = exports.Commit = exports.Transaction = exports.GetTableSeed = exports.SetTableSeed = exports.DeallocatePrepare = exports.ExecutePrepare = exports.Prepare = exports.ExecSql = exports.Memo = exports.Continue = exports.Break = exports.ReturnEnd = exports.ReturnBegin = exports.Return = exports.LeaveProc = exports.MyFactory = void 0;
const il_1 = require("../../../il");
const deleteStatement_1 = require("../deleteStatement");
const table_1 = require("./table");
const procedure_1 = require("./procedure");
const sqlBuilder_1 = require("../sqlBuilder");
const factory_1 = require("../factory");
const stat = require("../statement");
const exp_1 = require("../exp");
const myWithFromBuilder_1 = require("./myWithFromBuilder");
const mySqlBuilder_1 = require("./mySqlBuilder");
const mySelect_1 = require("./mySelect");
function nop(sb, tab) {
    sb.tab(tab).append('SET _$user=_$user;').n();
}
const DateParts = {
    year: 'year',
    yy: 'year',
    yyyy: 'year',
    quarter: 'quarter',
    qq: 'quarter',
    q: 'quarter',
    month: 'month',
    mm: 'month',
    m: 'month',
    //dayofyear: '',"dy", "y", 
    day: 'day',
    dd: 'day',
    d: 'day',
    week: 'week',
    wk: 'week',
    //ww: , "weekday", "dw", "w", 
    hour: 'hour',
    hh: 'hour',
    minute: 'minut',
    mi: 'minut',
    //"n", 
    second: 'second',
    ss: 'second',
    s: 'second',
    millisecond: 'microsecond',
    ms: 'microsecond',
    microsecond: 'microsecond'
};
class MyFactory extends factory_1.Factory {
    constructor() {
        super(...arguments);
        this.func_charindex = 'LOCATE';
        this.func_ascii = 'ASCII';
        this.func_length = 'CHAR_LENGTH';
        this.func_substr = 'SUBSTR';
        //func_now = 'UTC_TIMESTAMP'; now <> utc_timestamp
        this.func_now = 'NOW';
        this.func_lastinsertid = 'LAST_INSERT_ID';
        this.func_datepart = 'DATE';
        this.func_concat = 'CONCAT';
        this.func_concat_ws = 'CONCAT_WS';
        this.func_date = 'DATE';
        this.func_utcdate = 'UTCDATE';
        this.func_year = 'YEAR';
        this.func_month = 'MONTH';
        this.func_day = 'DAY';
        this.func_weekday = 'WEEKDAY';
        this.func_ifnull = 'IFNULL';
        this.func_if = 'IF';
        this.func_greatest = 'GREATEST';
        this.func_adddate = 'DATEADD';
        this.func_timestampdiff = 'TIMESTAMPDIFF';
        this.func_rowCount = 'ROW_COUNT';
        this.func_rand = 'RAND';
        //funcDateTimeFromNum = 'FROM_UNIXTIME';
        this.func_count = 'COUNT';
        this.func_max = 'MAX';
        this.func_min = 'MIN';
        this.func_from_unixtime = 'FROM_UNIXTIME';
        this.func_substring_index = 'SUBSTRING_INDEX';
        this.func_hex = "HEX";
        this.func_unhex = "UNHEX";
        this.func_abs = 'ABS';
        this.func_idtext = '$idtext';
        this.func_textid = '$textid';
        this.func_minuteidfromdate = '$minute_id_from_date';
        this.func_minuteiddate = '$minute_id_date';
        this.func_minuteidtime = '$minute_id_time';
        this.func_minuteidmonth = '$minute_id_month';
        this.func_minuteidperiod = '$minute_id_period';
        this.func_uminutedate = '$uminute_date';
        this.func_uminutetime = '$uminute_time';
        this.func_uminutestamp = '$uminute_stamp';
        this.func_uminute = '$uminute_from_time';
    }
    createTable(dbName, name) {
        let tbl = new table_1.MyTable(dbName, name);
        tbl.hasUnit = this.dbContext.hasUnit;
        return tbl;
    }
    createProcedure(dbName, name, isCore = false) {
        return new procedure_1.MyProcedure(this.dbContext, dbName, name, isCore);
    }
    createFunction(dbName, name, returnType) {
        return new procedure_1.MyProcedure(this.dbContext, dbName, name, true, returnType);
    }
    createSqlBuilder() { return new mySqlBuilder_1.MySqlBuilder(this); }
    createClientBuilder() { return new sqlBuilder_1.ClientBuilder(this); }
    createDeclare() { return new Declare; }
    createSet() { return new Set; }
    createIf() { return new If; }
    createWhile() { return new While; }
    createUpdate() { return new Update; }
    createInsert() { return new Insert; }
    createInsertOnDuplicate() { return new InsertOnDuplicate; }
    createUpsert() { return new Upsert; }
    createSelect() { return new mySelect_1.MySelect; }
    createLog() { return new MyLog; }
    createCall() { return new Call; }
    createDelete() { return new Delete; }
    createTruncate() { return new Truncate(); }
    createVarTable() { return new VarTable; }
    createForTable(isInProc) { return new ForTable(isInProc); }
    createBreak() { return new Break; }
    createContinue() { return new Continue; }
    createReturn() { return new Return(); }
    createReturnBegin() { return new ReturnBegin; }
    createReturnEnd() { return new ReturnEnd; }
    createLeaveProc() { return new LeaveProc; }
    createMemo() { return new Memo; }
    createExecSql() { return new ExecSql(); }
    createPrepare() { return new Prepare(); }
    createExecutePrepare() { return new ExecutePrepare(); }
    createDeallocatePrepare() { return new DeallocatePrepare(); }
    createSetTableSeed() { return new SetTableSeed; }
    createGetTableSeed() { return new GetTableSeed; }
    createTransaction() { return new Transaction; }
    createCommit() { return new Commit; }
    createRollBack() { return new RollBack; }
    createInline() { return new Inline; }
    createSignal() { return new Signal; }
    createSleep() { return new Sleep(); }
    createBlockBegin() { return new BlockBegin(); }
    createBlockEnd() { return new BlockEnd(); }
    createSetUTCTimezone() { return new SetUTCTimezone(); }
    getDatePart(part) {
        return DateParts[part];
    }
    //func_week = "WEEK";
    //func_yearweek = "YEARWEEK";
    //func_str_to_date = "STR_TO_DATE";
    func_group_concat(sb, params) {
        sb.append('GROUP_CONCAT').l().exp(params[0]);
        if (params[1] !== undefined) {
            sb.append(' SEPARATOR ').exp(params[1]);
        }
        sb.r();
    }
    ;
    func_unix_timestamp(sb, params) {
        sb.append('UNIX_TIMESTAMP').l();
        if (params.length > 0) {
            //sb.append('CONVERT_TZ').l().sepStart();
            for (let p of params) {
                sb.exp(p);
                break;
            }
            ;
            //sb.sepEnd().comma().append("'+00:00'").comma().append('@@global.time_zone').r();
        }
        sb.r();
        //sb.func('UNIX_TIMESTAMP', params);
        //@@global.time_zone
    }
    ;
    func_utc_timestamp(sb, params) { sb.append('UTC_TIMESTAMP').l().r(); }
    func_current_timestamp(sb) { sb.append('CURRENT_TIMESTAMP').l().r(); }
    func_dateadd(sb, params) {
        sb.append('ADDDATE').l()
            .exp(params[2]).comma().append('interval ')
            .exp(params[1]).space().exp(params[0]).r();
    }
    lPad(exp, num, char) {
        return new exp_1.ExpFunc('LPAD', exp, num, char);
    }
    ;
    func_cast(sb, params) {
        sb.append('CAST').l().exp(params[0]).append(' AS ').exp(params[1]).r();
    }
    func_unittimezone(sb) { sb.dbName().dot().append(sb.twProfix + '$timezone(_$unit, null)'); }
    func_timezone(sb) { sb.dbName().dot().append(sb.twProfix + '$timezone(_$unit, _$user)'); }
    func_bizmonth(sb) { sb.dbName().dot().append(sb.twProfix + '$biz_month_offset(_$unit)'); }
    func_bizdate(sb) { sb.dbName().dot().append(sb.twProfix + '$biz_date_offset(_$unit)'); }
    func_bizmonthid(sb, params) {
        sb.dbName().dot().append(sb.twProfix + '$biz_month_id(').exp(params[0]).comma().exp(params[1]).r();
    }
    func_bizyearid(sb, params) {
        sb.dbName().dot().append(sb.twProfix + '$biz_year_id(').exp(params[0]).comma().exp(params[1]).r();
    }
    func_me(sb) {
        sb.dbName().dot().append('$me(_$site, _$user)');
    }
}
exports.MyFactory = MyFactory;
class Declare extends stat.Declare {
}
class Set extends stat.Set {
    to(sb, tab) {
        sb.tab(tab).append('SET ');
        if (this.isAtVar === true) {
            sb.append('@').append(this.var);
        }
        else {
            sb.var(this.var);
        }
        sb.append('=').exp(this.exp).ln();
    }
}
class Call extends stat.Call {
    to(sb, tab) {
        sb.tab(tab).append('CALL ');
        if (this.db)
            sb.fld(this.db).dot();
        if (this.procName !== undefined) {
            sb.fld(this.procName);
        }
        else {
            sb.exp(this.procNameExp);
        }
        sb.l();
        let first = true;
        for (let p of this.params) {
            if (first === false)
                sb.comma();
            else
                first = false;
            const { paramType, value } = p;
            switch (paramType) {
                case il_1.ProcParamType.out:
                    sb.append('OUT ');
                    break;
                case il_1.ProcParamType.inout:
                    sb.append('INOUT ');
                    break;
            }
            sb.exp(value);
        }
        sb.r().ln();
    }
}
class If extends stat.If {
    nop(sb, tab) { nop(sb, tab); }
    start(sb, tab) {
        sb.tab(tab).append('IF ').exp(this.cmp).append(' THEN').n();
    }
    elsePart(sb, tab) {
        sb.tab(tab).append('ELSE').n();
    }
    elseIfPart(sb, tab, elseIf) {
        sb.tab(tab).append('ELSEIF ').exp(elseIf.cmp).append(' THEN').n();
    }
    end(sb, tab) {
        sb.tab(tab).append('END IF;').n();
    }
}
class While extends stat.While {
    start(sb, tab) {
        sb.tab(tab).append('__loop_' + this.no + ': WHILE ').exp(this.cmp).append(' DO').n();
    }
    end(sb, tab) {
        sb.tab(tab).append('END WHILE; -- ').append('__loop_' + this.no).n();
    }
}
class Update extends stat.Update {
    to(sb, tab) {
        sb.tab(tab).append('UPDATE ');
        let singleTableAlias; // 仅仅为了兼容以前的代码设置的。之前的Update，只支持一个表。
        if (Array.isArray(this.table) === true) {
            let first = true;
            for (let table of this.table) {
                if (first === true) {
                    first = false;
                }
                else {
                    sb.comma();
                }
                table.to(sb);
            }
        }
        else {
            this.table.to(sb);
            singleTableAlias = this.table.alias;
        }
        sb.nAuto().append('SET ').sepStart();
        for (let cv of this.cols) {
            let { col, setEqu, val, alias } = cv;
            sb.sep();
            function appendAlias() {
                if (singleTableAlias !== undefined) {
                    sb.append(singleTableAlias).append('.');
                }
                else if (alias !== undefined) {
                    sb.append(alias).append('.');
                }
            }
            appendAlias();
            sb.fld(col).append('=');
            switch (setEqu) {
                default:
                    sb.exp(val);
                    break;
                case il_1.SetEqu.add:
                    sb.append('ifnull(');
                    appendAlias();
                    sb.fld(col).append(',0)+').append('ifnull(').exp(val).comma().append('0').r();
                    break;
                case il_1.SetEqu.sub:
                    sb.append('ifnull(');
                    appendAlias();
                    sb.fld(col).append(',0)-').append('ifnull(').exp(val).comma().append('0').r();
                    break;
            }
        }
        sb.sepEnd();
        if (this.where !== undefined)
            sb.nAuto().append('WHERE ').exp(this.where);
        sb.ln();
    }
}
class Insert extends stat.Insert {
    to(sb, tab) {
        sb.tab(tab).append('INSERT ');
        if (this.ignore === true)
            sb.append('IGNORE ');
        sb.append('INTO ');
        this.table.to(sb);
        sb.space().l().sepStart();
        for (let cv of this.cols) {
            sb.sep().fld(cv.col);
        }
        sb.sepEnd().r().nAuto();
        if (this.select !== undefined) {
            this.select.to(sb, 0);
        }
        else {
            sb.append('VALUES (').sepStart();
            for (let cv of this.cols) {
                sb.pushFieldValue0(true);
                sb.sep().exp(cv.val);
                sb.popFieldValue0();
            }
            sb.sepEnd().r();
        }
        sb.ln();
    }
}
class Upsert extends stat.Upsert {
    to(sb, tab) {
        // Insert on Duplicate 不成立。必须列出所有字段
        if (this.select !== undefined) {
            this.buildInsertOnDuplicate(sb, tab);
        }
        else {
            this.buildUpdateInsert(sb, tab);
        }
    }
    buildInsertIgnore(sb, tab) {
        sb.tab(tab).append('INSERT IGNORE INTO ');
        this.table.to(sb);
        sb.space().l().sepStart();
        for (let cv of this.cols) {
            sb.sep().fld(cv.col);
        }
        for (let cv of this.keys) {
            sb.sep().fld(cv.col);
        }
        sb.sepEnd().r().nAuto();
        if (this.select !== undefined) {
            this.select.to(sb, 0);
        }
        else {
            sb.append('VALUES (').sepStart();
            for (let cv of this.cols) {
                let { val, setEqu } = cv;
                sb.pushFieldValue0(true);
                sb.sep();
                switch (setEqu) {
                    case il_1.SetEqu.sub:
                        sb.append('-');
                    // break; 这个break是刻意去掉的。要顺序执行到下面add
                    case il_1.SetEqu.add:
                        sb.append('ifnull(').exp(val).comma().append('0').r();
                        break;
                    default:
                        sb.exp(val);
                        break;
                }
                sb.popFieldValue0();
            }
            for (let cv of this.keys) {
                sb.sep().exp(cv.val);
            }
            sb.sepEnd().r();
        }
        sb.ln();
    }
    buildUpdateInsert(sb, tab) {
        if (this.cols.length === 0) {
            this.buildInsertIgnore(sb, tab);
            return;
        }
        sb.tab(tab).append('UPDATE ');
        this.table.to(sb);
        sb.append(' SET ');
        sb.sepStart();
        for (let cv of this.cols) {
            let { col, val, setEqu } = cv;
            sb.sep().fld(col).append('=');
            switch (setEqu) {
                default:
                    sb.exp(val);
                    break;
                case il_1.SetEqu.add:
                    sb.append('ifnull(').fld(col).append(',0)+').append('ifnull(').exp(val).comma().append('0').r();
                    break;
                case il_1.SetEqu.sub:
                    sb.append('ifnull(').fld(col).append(',0)-').append('ifnull(').exp(val).comma().append('0').r();
                    break;
            }
        }
        sb.sepEnd();
        sb.append(' WHERE ');
        sb.sepStart(' AND ');
        for (let cv of this.keys) {
            let { col, val } = cv;
            sb.sep().fld(col).append('=').exp(val);
        }
        sb.sepEnd();
        sb.ln();
        sb.tab(tab).append('IF row_count()=0 THEN').n();
        this.buildInsertIgnore(sb, tab);
        sb.tab(tab).append('END IF').ln();
    }
    buildInsertOnDuplicate(sb, tab) {
        sb.tab(tab).append('INSERT INTO ');
        this.table.to(sb);
        sb.space().l().sepStart();
        for (let cv of this.cols) {
            sb.sep().fld(cv.col);
        }
        for (let cv of this.keys) {
            sb.sep().fld(cv.col);
        }
        sb.sepEnd().r().nAuto();
        if (this.select !== undefined) {
            this.select.to(sb, 0);
        }
        else {
            sb.append('VALUES (').sepStart();
            for (let cv of this.cols) {
                sb.pushFieldValue0(true);
                sb.sep().exp(cv.val);
                sb.popFieldValue0();
            }
            for (let cv of this.keys) {
                sb.pushFieldValue0(true);
                sb.sep().exp(cv.val);
                sb.popFieldValue0();
            }
            sb.sepEnd().r();
        }
        sb.nAuto().append('ON DUPLICATE KEY UPDATE ');
        if (this.cols.length === 0) {
            let { col, val } = this.keys[0];
            sb.fld(col).append('=VALUES(').fld(col).r();
        }
        else {
            sb.sepStart();
            for (let cv of this.cols) {
                let { col, val, setEqu } = cv;
                sb.sep().fld(col).append('=');
                switch (setEqu) {
                    case il_1.SetEqu.add:
                        sb.append('ifnull(').fld(col).comma().append('0').r();
                        sb.append('+');
                        break;
                    case il_1.SetEqu.sub:
                        sb.append('ifnull(').fld(col).comma().append('0').r();
                        sb.append('-');
                        break;
                    case il_1.SetEqu.equ:
                        break;
                }
                sb.append('VALUES(').fld(col).r();
            }
            sb.sepEnd();
        }
        sb.ln();
    }
}
class InsertOnDuplicate extends stat.InsertOnDuplicate {
    to(sb, tab) {
        sb.tab(tab).append('INSERT INTO ');
        this.table.to(sb);
        sb.space().l().sepStart();
        for (let cv of this.cols) {
            sb.sep().fld(cv.col);
        }
        for (let cv of this.keys) {
            sb.sep().fld(cv.col);
        }
        sb.sepEnd().r().nAuto();
        sb.append('VALUES (').sepStart();
        for (let cv of this.cols) {
            sb.pushFieldValue0(true);
            sb.sep().exp(cv.val);
            sb.popFieldValue0();
        }
        for (let cv of this.keys) {
            sb.pushFieldValue0(true);
            sb.sep().exp(cv.val);
            sb.popFieldValue0();
        }
        sb.sepEnd().r();
        sb.nAuto().append('ON DUPLICATE KEY UPDATE ');
        sb.sepStart();
        for (let cv of this.cols) {
            let { col, update } = cv;
            sb.sep().fld(col).append('=');
            if (update) {
                sb.exp(update);
            }
            else {
                sb.append('VALUES(').fld(col).r();
            }
        }
        sb.sepEnd();
        sb.ln();
    }
}
class MyDeleteBuilder extends myWithFromBuilder_1.MyWithFromBuilder {
}
class Delete extends deleteStatement_1.DeleteStatement {
    createWithFromBuilder() { return new MyDeleteBuilder; }
    to(sb, tab) {
        sb.tab(tab).append('DELETE ');
        if (this.tables === undefined) {
            throw new Error('DELETE tables should not be undefined');
        }
        this.tables.forEach(v => {
            if (typeof v === 'string') {
                sb.append(v);
            }
            else {
                let { alias } = v;
                if (alias) {
                    sb.append(alias);
                }
                else {
                    v.to(sb);
                }
                sb.sep();
            }
        });
        if (this.withFromBuilder.hasFrom === false) {
            sb.append(' FROM ');
            sb.sepStart(',');
            this.tables.forEach(v => {
                if (typeof v === 'string')
                    sb.append(v);
                else
                    v.to(sb);
                sb.sep();
            });
            sb.sepEnd();
        }
        sb.space();
        this.withFromBuilder.buildFrom(sb, tab);
        this.withFromBuilder.buildWhereTo(sb, tab);
        sb.ln();
    }
}
class Truncate extends deleteStatement_1.TruncateStatement {
    to(sb, tab) {
        sb.tab(tab).append('TRUNCATE TABLE ');
        if (this.table === undefined) {
            throw new Error('TRUNCATE table should not be undefined');
        }
        this.table.to(sb);
        sb.ln();
    }
}
class MyLog extends stat.Log {
    to(sb, tab) {
        if (this.isError === true) {
            sb.tab(tab).append(`SET @$_error=CONCAT(@$_error`);
            if (this.subject) {
                sb.comma();
                sb.exp(this.subject);
                sb.comma();
                sb.append('\'\\n\'');
            }
            if (this.content) {
                sb.comma();
                sb.exp(this.content);
                sb.comma();
                sb.append('\'\\n\'');
            }
            sb.r();
            sb.ln();
        }
        else {
            sb.tab(tab).append('CALL `$uq`.`log');
            //if (this.isError === true) {
            //    sb.append('_error');
            //}
            sb.append('`(');
            sb.exp(this.unit).comma().exp(this.uq).comma();
            if (!this.subject) {
                sb.append('\'\'');
            }
            else {
                sb.exp(this.subject);
            }
            sb.comma().exp(this.content);
            sb.r();
            sb.ln();
        }
    }
}
class VarTable extends stat.VarTable {
    declare(vars, puts) { }
    to(sb, tab) {
        if (this.noDrop !== true) {
            sb.tab(tab).append('DROP TEMPORARY TABLE IF EXISTS ').dbName().dot().var(this.name).ln();
        }
        sb.tab(tab).append('CREATE TEMPORARY TABLE IF NOT EXISTS ').dbName().dot().var(this.name).space().l();
        let first = true, autoId;
        for (let field of this.fields) {
            if (first === true)
                first = false;
            else
                sb.comma();
            sb.fld(field.name).space();
            field.dataType.sql(sb);
            sb.space().append(field.nullable === true ? 'NULL' : 'NOT NULL');
            if (field.autoInc === true) {
                autoId = field;
                sb.space().append('AUTO_INCREMENT');
            }
        }
        if (this.keys !== undefined) {
            first = true;
            sb.comma().append('PRIMARY KEY(');
            for (let key of this.keys) {
                if (first === true)
                    first = false;
                else
                    sb.comma();
                sb.fld(key.name);
            }
            sb.r();
        }
        else if (autoId !== undefined) {
            sb.comma().append('PRIMARY KEY(').fld(autoId.name).r();
        }
        sb.r().append(' ENGINE=MyISAM').ln();
    }
}
class ForTable extends stat.ForTable {
    constructor(isInProc) {
        super();
        this.isInProc = isInProc;
    }
    declare(vars, puts) { }
    to(sb, tab) {
        // 曾经去掉这个drop。会引发问题。多次调用之间，会数据相互覆盖。
        // 2023-03-13: 现在还需要加上。现在，所有临时表，都有序号数字，不重复，所以，可以而且应该drop
        // 2023-03-13 当日结论：还是得去掉。看看怎么处理connection release的问题。release之后，temporary table应该自动删除
        if (this.isInProc === false) {
            sb.tab(tab).append('DROP TEMPORARY TABLE IF EXISTS ').var(this.name).ln();
        }
        // 上面代码2023-03-13：恢复
        // 不DROP TEMPORARY TABLE的原因：
        // 当存储过程反复调用的时候，会出现问题。
        // 最好的办法：如果在存储过程里面，不drop，如果在act或query里面，drop。
        sb.tab(tab).append('CREATE TEMPORARY TABLE IF NOT EXISTS ').var(this.name).space().l();
        let first = true, autoId;
        for (let field of this.fields) {
            if (first === true)
                first = false;
            else
                sb.comma();
            sb.fld(field.name).space();
            field.dataType.sql(sb);
            sb.space().append(field.nullable === true ? 'NULL' : 'NOT NULL');
            if (field.autoInc === true) {
                autoId = field;
                sb.space().append('AUTO_INCREMENT');
            }
        }
        if (this.keys !== undefined) {
            first = true;
            sb.comma().append('PRIMARY KEY(');
            for (let key of this.keys) {
                if (first === true)
                    first = false;
                else
                    sb.comma();
                sb.fld(key.name);
            }
            sb.r();
        }
        else if (autoId !== undefined) {
            sb.comma().append('PRIMARY KEY(').fld(autoId.name).r();
        }
        sb.r().append(' ENGINE=MyISAM').ln();
    }
}
class LeaveProc extends stat.LeaveProc {
    to(sb, tab) {
        if (this.withCommit === true) {
            sb.tab(tab).append('COMMIT').ln();
        }
        sb.tab(tab).append('LEAVE __proc_exit').ln();
    }
}
exports.LeaveProc = LeaveProc;
class Return extends stat.Return {
    to(sb, tab) {
        sb.tab(tab);
        if (this.expVal !== undefined) {
            sb.append('RETURN ').exp(this.expVal);
        }
        else if (this.returnVar) {
            sb.append('RETURN ').var(this.returnVar);
        }
        else {
            sb.append('LEAVE __body_exit');
        }
        sb.ln();
    }
}
exports.Return = Return;
class ReturnBegin extends stat.Continue {
    to(sb, tab) { sb.tab(tab).append('__body_exit: BEGIN').n(); }
}
exports.ReturnBegin = ReturnBegin;
class ReturnEnd extends stat.Continue {
    to(sb, tab) { sb.tab(tab).append('END __body_exit').ln(); }
}
exports.ReturnEnd = ReturnEnd;
class Break extends stat.Break {
    to(sb, tab) {
        if (this.forQueueNo) {
            sb.tab(tab).append('SET _$queue_last').append(this.forQueueNo).append('=null').ln();
            sb.tab(tab).append('LEAVE __$queue_body_label_' + this.forQueueNo);
        }
        else {
            sb.tab(tab).append('LEAVE __loop_' + this.no);
        }
        sb.ln();
    }
}
exports.Break = Break;
class Continue extends stat.Continue {
    to(sb, tab) {
        sb.tab(tab);
        if (this.forQueueNo) {
            sb.append('LEAVE __$queue_body_label_' + this.forQueueNo);
        }
        else {
            sb.append('ITERATE __loop_' + this.no);
        }
        sb.ln();
    }
}
exports.Continue = Continue;
class Memo extends stat.Memo {
    to(sb, tab) {
        sb.tab(tab).append('-- ').append(this.text).ln();
    }
}
exports.Memo = Memo;
class ExecSql extends stat.ExecSql {
    to(sb, tab) {
        if (this.no === undefined) {
            throw new Error('exec sql must define statement no');
        }
        sb.tab(tab).append('SET @statement').append(this.no).append('=');
        sb.exp(this.sql).ln();
        if (this.parameters !== undefined) {
            let len = this.parameters.length;
            for (let i = 0; i < len; i++) {
                sb.tab(tab).append('SET @p__').append(i).append('=').exp(this.parameters[i]).ln();
            }
        }
        sb.tab(tab).append(`PREPARE stmt${this.no} FROM @statement${this.no}`).ln();
        sb.tab(tab).append(`EXECUTE stmt${this.no}`);
        if (this.parameters !== undefined) {
            sb.append(' USING ');
            let len = this.parameters.length;
            for (let i = 0; i < len; i++) {
                sb.tab(tab).append('@p__').append(i);
                if (i < len - 1)
                    sb.comma();
            }
        }
        sb.ln();
        sb.tab(tab).append(`DEALLOCATE PREPARE stmt${this.no}`).ln();
        if (this.toVarPoint) {
            sb.tab(tab).append('SET ').var(this.toVarPoint.varName(this.toVar))
                .append('=@execSqlValue')
                .ln();
        }
    }
}
exports.ExecSql = ExecSql;
class Prepare extends stat.Prepare {
    to(sb, tab) {
        sb.tab(tab).append('SET @').append(this.statementName).append('_sql').append('=').exp(this.sql).ln();
        sb.tab(tab).append('PREPARE ').append(this.statementName).append(' FROM @').append(this.statementName).append('_sql').ln();
    }
}
exports.Prepare = Prepare;
class ExecutePrepare extends stat.ExecutePrepare {
    to(sb, tab) {
        let hasParam = this.params !== undefined && this.params.length > 0;
        if (hasParam === true) {
            let len = this.params.length;
            for (let i = 0; i < len; i++) {
                let param = this.params[i];
                sb.tab(tab).append('SET @').append(this.statementName).append(i).append('=').exp(param).ln();
            }
        }
        sb.tab(tab).append('EXECUTE ').append(this.statementName).append(' USING ');
        sb.sepStart(',');
        if (hasParam === true) {
            let len = this.params.length;
            for (let i = 0; i < len; i++) {
                sb.sep();
                sb.append('@').append(this.statementName).append(i);
            }
        }
        sb.sepEnd();
        sb.ln();
    }
}
exports.ExecutePrepare = ExecutePrepare;
class DeallocatePrepare extends stat.DeallocatePrepare {
    to(sb, tab) {
        sb.tab(tab).append('DEALLOCATE PREPARE ').append(this.statementName).ln();
    }
}
exports.DeallocatePrepare = DeallocatePrepare;
class SetTableSeed extends stat.SetTableSeed {
    to(sb, tab) {
        sb.tab(tab).append('-- SET TABLE SEED').ln();
        sb.tab(tab).append(`set @sql_set_table_seed = concat('ALTER TABLE ${sb.twProfix}'`).comma();
        this.table.to(sb);
        sb.comma();
        sb.append('\' auto_increment=\'').comma();
        this.seed.to(sb);
        sb.r().ln();
        sb.tab(tab).append('PREPARE stmt FROM @sql_set_table_seed').ln();
        sb.tab(tab).append('EXECUTE stmt').ln();
        sb.tab(tab).append('DEALLOCATE PREPARE stmt').ln();
    }
}
exports.SetTableSeed = SetTableSeed;
class GetTableSeed extends stat.GetTableSeed {
    to(sb, tab) {
        sb.tab(tab).append('-- GET TABLE SEED').ln();
        sb.tab(tab).append('select auto_increment into ');
        this.seed.to(sb);
        sb.append(' from information_schema.tables where table_schema=database() and table_name=');
        sb.append('concat(\'')
            .append(sb.twProfix).append('\', convert(').exp(this.table).append(' using utf8))');
        sb.ln();
    }
}
exports.GetTableSeed = GetTableSeed;
class Transaction extends stat.Transaction {
    to(sb, tab) {
        sb.tab(tab).append('START TRANSACTION').ln();
    }
}
exports.Transaction = Transaction;
class Commit extends stat.Commit {
    to(sb, tab) {
        sb.tab(tab).append('COMMIT').ln();
    }
}
exports.Commit = Commit;
class RollBack extends stat.RollBack {
    to(sb, tab) {
        sb.tab(tab).append('ROLLBACK').ln();
    }
}
exports.RollBack = RollBack;
class Inline extends stat.Inline {
    to(sb, tab) {
        sb.tab(tab).append('-- ').append(this.dbType).space().append(this.memo).ln();
        if (this.dbType !== 'mysql')
            return;
        sb.tab(tab).append('-- start inline code ').append(this.memo).ln();
        sb.append(this.code);
        sb.n().tab(tab).append('-- end inline code --').ln();
    }
}
exports.Inline = Inline;
class Signal extends stat.Singal {
    to(sb, tab) {
        sb.tab(tab).append('SIGNAL SQLSTATE \'45000\' SET MESSAGE_TEXT=').exp(this.text).ln();
    }
}
exports.Signal = Signal;
class Sleep extends stat.Sleep {
    to(sb, tab) {
        sb.tab(tab).append('DO SLEEP').l().exp(this.value).r().ln();
    }
}
exports.Sleep = Sleep;
class BlockBegin extends stat.BlockBegin {
    to(sb, tab) {
        sb.tab(tab).append(this.label).append(': BEGIN').n();
    }
}
exports.BlockBegin = BlockBegin;
class BlockEnd extends stat.BlockEnd {
    to(sb, tab) {
        sb.tab(tab).append('END');
        if (this.label) {
            sb.semicolon().append(' -- ').append(this.label);
        }
        sb.ln();
    }
}
exports.BlockEnd = BlockEnd;
class SetUTCTimezone extends stat.SetUTCTimezone {
    to(sb, tab) {
        sb.tab(tab).append(`SET time_zone='+00:00'`).ln();
    }
}
exports.SetUTCTimezone = SetUTCTimezone;
//# sourceMappingURL=sqlMy.js.map