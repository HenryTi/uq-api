"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUseSheet = exports.BUseTimeSpan = exports.BUseYearZone = exports.BUseMonthZone = exports.BUseTimeZone = exports.BUseSetting = exports.BUseBase = exports.BUseStatement = void 0;
const il_1 = require("../../il");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const bstatement_1 = require("./bstatement");
class BUseStatement extends bstatement_1.BStatementBase {
    get singleKey() { return this.bUse.singleKey; }
    ;
    constructor(context, stat) {
        super(context, stat);
        const { useBase } = stat;
        this.bUse = useBase.db(context);
        this.bUse.convertFrom();
        this.bUse.setStatement(stat);
    }
    singleHead(sqls) {
        this.bUse.singleHead(sqls);
    }
    head(sqls) {
        this.bUse.head(sqls);
    }
    body(sqls) {
        this.bUse.body(sqls);
    }
    singleFoot(sqls) {
        this.bUse.singleFoot(sqls);
    }
}
exports.BUseStatement = BUseStatement;
class BUseBase {
    constructor(useObj, context) {
        this.useObj = useObj;
        this.context = context;
    }
    convertFrom() {
        this.value = this.context.expVal(this.useObj.value);
    }
    setStatement(statement) { this.statement = statement; }
    singleHead(sqls) { }
    head(sqls) { }
    body(sqls) { }
    singleFoot(sqls) { }
}
exports.BUseBase = BUseBase;
class BUseSetting extends BUseBase {
}
exports.BUseSetting = BUseSetting;
class BUseTimeZone extends BUseSetting {
    constructor() {
        super(...arguments);
        this.singleKey = 'timezone';
    }
    head(sqls) {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var('$timezone', new il_1.BigInt());
    }
}
exports.BUseTimeZone = BUseTimeZone;
class BUseMonthZone extends BUseSetting {
    constructor() {
        super(...arguments);
        this.singleKey = 'monthzone';
    }
    head(sqls) {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var('$monthzone', new il_1.BigInt());
    }
}
exports.BUseMonthZone = BUseMonthZone;
class BUseYearZone extends BUseSetting {
    constructor() {
        super(...arguments);
        this.singleKey = 'yearzone';
    }
    head(sqls) {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var('$yearzone', new il_1.BigInt());
    }
}
exports.BUseYearZone = BUseYearZone;
const sysTimeZone = '$systimezone';
const timeZone = '$timezone';
const weekZone = '$weekzone';
const monthZone = '$monthzone';
const yearZone = '$yearzone';
class BUseTimeSpan extends BUseBase {
    constructor() {
        super(...arguments);
        this.singleKey = 'timespan';
    }
    singleHead(sqls) {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(sysTimeZone, new il_1.BigInt());
        declare.var(timeZone, new il_1.BigInt());
        declare.var(weekZone, new il_1.BigInt());
        declare.var(monthZone, new il_1.BigInt());
        declare.var(yearZone, new il_1.BigInt());
        let setSysTimeZone = factory.createSet();
        sqls.push(setSysTimeZone);
        setSysTimeZone.equ(sysTimeZone, new sql_1.ExpFunc(factory.func_timestampdiff, new sql_1.ExpDatePart('hour'), new sql_1.ExpFuncCustom(factory.func_utc_timestamp), new sql_1.ExpFunc(factory.func_now)));
        let setTimeZone = factory.createSet();
        sqls.push(setTimeZone);
        setTimeZone.equ(timeZone, new sql_1.ExpNum(8));
        let setWeekZone = factory.createSet();
        sqls.push(setWeekZone);
        setWeekZone.equ(weekZone, new sql_1.ExpNum(0));
        let setMonthZone = factory.createSet();
        sqls.push(setMonthZone);
        setMonthZone.equ(monthZone, new sql_1.ExpNum(1));
        let setYearZone = factory.createSet();
        sqls.push(setYearZone);
        setYearZone.equ(yearZone, new sql_1.ExpNum(1));
    }
    head(sqls) {
    }
    body(sqls) {
        const { factory } = this.context;
        const { varName, op, spanPeriod, statementNo } = this.useObj;
        if (op === undefined) {
            const { no } = this.statement;
            let value = this.value;
            let vInit = `${varName}_${no}$`;
            let vStart = `${varName}_${no}$start`;
            let vEnd = `${varName}_${no}$end`;
            let varInit = new sql_1.ExpVar(vInit);
            let varTimezone = new sql_1.ExpVar(timeZone);
            let declare = factory.createDeclare();
            sqls.push(declare);
            declare.var(vStart, new il_1.DateTime());
            declare.var(vEnd, new il_1.DateTime());
            let setInit = factory.createSet();
            sqls.push(setInit);
            let setStart = factory.createSet();
            sqls.push(setStart);
            function dayInit() {
                declare.var(vInit, new il_1.DateTime());
                let expInit;
                if (value === undefined) {
                    expInit = new sql_1.ExpAdd(new sql_1.ExpFuncCustom(factory.func_utc_timestamp), new sql_1.ExpInterval(il_1.SpanPeriod.hour, varTimezone));
                }
                else {
                    expInit = new sql_1.ExpAdd(value, new sql_1.ExpInterval(il_1.SpanPeriod.hour, new sql_1.ExpSub(varTimezone, new sql_1.ExpVar(sysTimeZone))));
                }
                setInit.equ(vInit, new sql_1.ExpSub(new sql_1.ExpFunc(factory.func_date, expInit), new sql_1.ExpInterval(il_1.SpanPeriod.hour, varTimezone)));
            }
            function yearStart() {
                dayInit();
                setStart.equ(vStart, new sql_1.ExpFunc('MAKEDATE', new sql_1.ExpFunc(factory.func_year, varInit), sql_1.ExpNum.num1));
            }
            function monthStart() {
                dayInit();
                setStart.equ(vStart, new sql_1.ExpAdd(new sql_1.ExpSub(varInit, new sql_1.ExpInterval(il_1.SpanPeriod.month, sql_1.ExpNum.num1)), new sql_1.ExpInterval(il_1.SpanPeriod.day, sql_1.ExpNum.num1)));
            }
            function weekStart() {
                dayInit();
                setStart.equ(vStart, new sql_1.ExpAdd(varInit, new sql_1.ExpInterval(il_1.SpanPeriod.day, new sql_1.ExpSub(sql_1.ExpNum.num1, new sql_1.ExpFunc('DAYOFWEEK', varInit)))));
            }
            function dayStart() {
                dayInit();
                setStart.equ(vStart, varInit);
            }
            function hourOrMinuteInit(seconds) {
                const initParams = [];
                if (value !== undefined)
                    initParams.push(value);
                declare.var(vInit, new il_1.BigInt());
                setInit.equ(vInit, new sql_1.ExpFuncCustom(factory.func_unix_timestamp, ...initParams));
                setStart.equ(vStart, new sql_1.ExpFunc(factory.func_from_unixtime, new sql_1.ExpSub(varInit, new sql_1.ExpMod(varInit, new sql_1.ExpNum(seconds)))));
            }
            function hourStart() {
                return hourOrMinuteInit(3600);
            }
            function minuteStart() {
                return hourOrMinuteInit(60);
            }
            const starts = {
                [il_1.SpanPeriod.year]: yearStart,
                [il_1.SpanPeriod.month]: monthStart,
                [il_1.SpanPeriod.week]: weekStart,
                [il_1.SpanPeriod.day]: dayStart,
                [il_1.SpanPeriod.hour]: hourStart,
                [il_1.SpanPeriod.minute]: minuteStart,
            };
            starts[spanPeriod]();
            let setEnd = factory.createSet();
            sqls.push(setEnd);
            setEnd.equ(vEnd, new sql_1.ExpAdd(new sql_1.ExpVar(vStart), new sql_1.ExpInterval(spanPeriod, sql_1.ExpNum.num1)));
        }
        else {
            let vStart = `${varName}_${statementNo}$start`;
            let vEnd = `${varName}_${statementNo}$end`;
            const buildSet = (varName) => {
                let set = factory.createSet();
                sqls.push(set);
                let arr = [
                    new sql_1.ExpVar(varName),
                    new sql_1.ExpInterval(spanPeriod, this.value),
                ];
                let result = op === '+' ? new sql_1.ExpAdd(...arr) : new sql_1.ExpSub(...arr);
                set.equ(varName, result);
            };
            buildSet(vStart);
            buildSet(vEnd);
        }
    }
}
exports.BUseTimeSpan = BUseTimeSpan;
class BUseSheet extends BUseBase {
    constructor() {
        super(...arguments);
        this.singleKey = 'sheet';
    }
    singleHead(sqls) {
        const { varName } = this.useObj;
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars((0, il_1.bigIntField)(varName));
    }
    singleFoot(sqls) {
        const { varName, sheet } = this.useObj;
        const { factory } = this.context;
        const memo = factory.createMemo();
        sqls.push(memo);
        memo.text = `call Sheet.Submit ${varName} ${sheet.getJName()}`;
        const proc = factory.createCall();
        sqls.push(proc);
        proc.db = '$site';
        proc.procName = `${this.context.site}.${sheet.id}`;
        proc.params.push({
            paramType: il_1.ProcParamType.in,
            value: new sql_1.ExpVar(consts_1.$site),
        }, {
            paramType: il_1.ProcParamType.in,
            value: sql_1.ExpNum.num0,
        }, {
            paramType: il_1.ProcParamType.in,
            value: new sql_1.ExpVar(varName),
        });
    }
}
exports.BUseSheet = BUseSheet;
//# sourceMappingURL=use.js.map