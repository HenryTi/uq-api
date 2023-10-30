import { BigInt, DateTime, SpanPeriod, UseBase, UseMonthZone, UseSetting, UseStatement, UseTimeSpan, UseTimeZone, UseYearZone } from "../../il";
import { DbContext } from "../dbContext";
import { ExpAdd, ExpDatePart, ExpFunc, ExpFuncCustom, ExpInterval, ExpMod, ExpNum, ExpSub, ExpVal, ExpVar } from "../sql";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export class BUseStatement extends BStatement<UseStatement> {
    protected readonly bUse: BUseBase<any>;
    singleKey = '$use';
    constructor(context: DbContext, stat: UseStatement) {
        super(context, stat);
        const { useBase } = stat;
        this.bUse = useBase.db(context);
        this.bUse.convertFrom();
        this.bUse.setStatement(stat);
    }
    singleHead(sqls: Sqls): void {
        this.bUse.singleHead(sqls);
    }
    head(sqls: Sqls): void {
        this.bUse.head(sqls);
    }
    body(sqls: Sqls): void {
        this.bUse.body(sqls);
    }
}

export class BUseBase<T extends UseBase> {
    protected context: DbContext;
    protected statement: UseStatement;
    readonly useObj: T;
    protected value: ExpVal;
    constructor(useObj: T, context: DbContext) {
        this.useObj = useObj;
        this.context = context;
    }
    convertFrom() {
        this.value = this.context.expVal(this.useObj.value);
    }
    setStatement(statement: UseStatement) { this.statement = statement; }
    singleHead(sqls: Sqls): void { }
    head(sqls: Sqls): void { }
    body(sqls: Sqls): void { }
}

export class BUseSetting<T extends UseSetting> extends BUseBase<T> {
}

export class BUseTimeZone extends BUseSetting<UseTimeZone> {
    head(sqls: Sqls): void {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var('$timezone', new BigInt());
    }
}

export class BUseMonthZone extends BUseSetting<UseMonthZone> {
    head(sqls: Sqls): void {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var('$monthzone', new BigInt());
    }
}

export class BUseYearZone extends BUseSetting<UseYearZone> {
    head(sqls: Sqls): void {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var('$yearzone', new BigInt());
    }
}

const sysTimeZone = '$systimezone';
const timeZone = '$timezone';
const weekZone = '$weekzone';
const monthZone = '$monthzone';
const yearZone = '$yearzone';
export class BUseTimeSpan extends BUseBase<UseTimeSpan> {
    singleHead(sqls: Sqls): void {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(sysTimeZone, new BigInt());
        declare.var(timeZone, new BigInt());
        declare.var(weekZone, new BigInt());
        declare.var(monthZone, new BigInt());
        declare.var(yearZone, new BigInt());
        let setSysTimeZone = factory.createSet();
        sqls.push(setSysTimeZone);
        setSysTimeZone.equ(sysTimeZone, new ExpFunc(
            factory.func_timestampdiff,
            new ExpDatePart('hour'),
            new ExpFuncCustom(factory.func_utc_timestamp),
            new ExpFunc(factory.func_now),
        ));
        let setTimeZone = factory.createSet();
        sqls.push(setTimeZone);
        setTimeZone.equ(timeZone, new ExpNum(8));
        let setWeekZone = factory.createSet();
        sqls.push(setWeekZone);
        setWeekZone.equ(weekZone, new ExpNum(0));
        let setMonthZone = factory.createSet();
        sqls.push(setMonthZone);
        setMonthZone.equ(monthZone, new ExpNum(1));
        let setYearZone = factory.createSet();
        sqls.push(setYearZone);
        setYearZone.equ(yearZone, new ExpNum(1));
    }

    head(sqls: Sqls): void {
    }

    body(sqls: Sqls): void {
        const { factory } = this.context;
        const { varName, op, spanPeriod, statementNo } = this.useObj;
        if (op === undefined) {
            const { no } = this.statement;
            let value = this.value;
            let vInit = `${varName}_${no}$`;
            let vStart = `${varName}_${no}$start`;
            let vEnd = `${varName}_${no}$end`;
            let varInit = new ExpVar(vInit);
            let varTimezone = new ExpVar(timeZone);
            let declare = factory.createDeclare();
            sqls.push(declare);
            declare.var(vStart, new DateTime());
            declare.var(vEnd, new DateTime());
            let setInit = factory.createSet()
            sqls.push(setInit);
            let setStart = factory.createSet()
            sqls.push(setStart);
            function dayInit() {
                declare.var(vInit, new DateTime());
                let expInit: ExpVal;
                if (value === undefined) {
                    expInit = new ExpAdd(
                        new ExpFuncCustom(factory.func_utc_timestamp),
                        new ExpInterval(SpanPeriod.hour, varTimezone),
                    );
                }
                else {
                    expInit = new ExpAdd(
                        value,
                        new ExpInterval(
                            SpanPeriod.hour,
                            new ExpSub(varTimezone, new ExpVar(sysTimeZone)),
                        ),
                    )
                }
                setInit.equ(vInit, new ExpSub(
                    new ExpFunc(factory.func_date, expInit),
                    new ExpInterval(SpanPeriod.hour, varTimezone),
                ));
            }
            function yearStart() {
                dayInit();
                setStart.equ(vStart, new ExpFunc(
                    'MAKEDATE',
                    new ExpFunc(factory.func_year, varInit),
                    ExpNum.num1
                ));
            }
            function monthStart() {
                dayInit();
                setStart.equ(vStart, new ExpAdd(
                    new ExpSub(varInit, new ExpInterval(SpanPeriod.month, ExpNum.num1)),
                    new ExpInterval(SpanPeriod.day, ExpNum.num1)
                ));
            }
            function weekStart() {
                dayInit();
                setStart.equ(vStart, new ExpAdd(
                    varInit,
                    new ExpInterval(
                        SpanPeriod.day,
                        new ExpSub(
                            ExpNum.num1,
                            new ExpFunc('DAYOFWEEK', varInit),
                        )
                    )
                ));
            }
            function dayStart() {
                dayInit();
                setStart.equ(vStart, varInit);
            }
            function hourOrMinuteInit(seconds: number) {
                const initParams: ExpVal[] = [];
                if (value !== undefined) initParams.push(value);
                declare.var(vInit, new BigInt());
                setInit.equ(vInit, new ExpFuncCustom(factory.func_unix_timestamp, ...initParams));
                setStart.equ(vStart, new ExpFunc(
                    factory.func_from_unixtime,
                    new ExpSub(varInit, new ExpMod(varInit, new ExpNum(seconds)))
                ));
            }
            function hourStart() {
                return hourOrMinuteInit(3600);
            }
            function minuteStart() {
                return hourOrMinuteInit(60);
            }
            const starts: { [period in SpanPeriod]: () => void } = {
                [SpanPeriod.year]: yearStart,
                [SpanPeriod.month]: monthStart,
                [SpanPeriod.week]: weekStart,
                [SpanPeriod.day]: dayStart,
                [SpanPeriod.hour]: hourStart,
                [SpanPeriod.minute]: minuteStart,
            }
            starts[spanPeriod]();
            let setEnd = factory.createSet();
            sqls.push(setEnd);
            setEnd.equ(vEnd, new ExpAdd(new ExpVar(vStart), new ExpInterval(spanPeriod, ExpNum.num1)));
        }
        else {
            let vStart = `${varName}_${statementNo}$start`;
            let vEnd = `${varName}_${statementNo}$end`;
            const buildSet = (varName: string) => {
                let set = factory.createSet();
                sqls.push(set);
                let arr: ExpVal[] = [
                    new ExpVar(varName),
                    new ExpInterval(spanPeriod, this.value),
                ];
                let result = op === '+' ? new ExpAdd(...arr) : new ExpSub(...arr);
                set.equ(varName, result);
            }
            buildSet(vStart);
            buildSet(vEnd);
        }
    }
}