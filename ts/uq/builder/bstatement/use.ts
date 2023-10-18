import { BigInt, UseBase, UseMonthZone, UseSetting, UseStatement, UseTimeSpan, UseTimeZone, UseYearZone } from "../../il";
import { DbContext } from "../dbContext";
import { ExpNum } from "../sql";
import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";

export class BUseStatement extends BStatement<UseStatement> {
    protected readonly bUse: BUseBase<any>;
    singleKey = '$use';
    constructor(context: DbContext, stat: UseStatement) {
        super(context, stat);
        const { useBase } = stat;
        this.bUse = useBase.db(context);
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
    constructor(useObj: T, context: DbContext) {
        this.useObj = useObj;
        this.context = context;
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

    }
}

export class BUseMonthZone extends BUseSetting<UseMonthZone> {
}

export class BUseYearZone extends BUseSetting<UseYearZone> {
}

export class BUseTimeSpan extends BUseBase<UseTimeSpan> {
    singleHead(sqls: Sqls): void {
        const { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var('$timezone', new BigInt());
        declare.var('$weekzone', new BigInt());
        declare.var('$monthzone', new BigInt());
        declare.var('$yearzone', new BigInt());
        let setTimeZone = factory.createSet();
        sqls.push(setTimeZone);
        setTimeZone.equ('$timezone', new ExpNum(8));
        let setWeekZone = factory.createSet();
        sqls.push(setWeekZone);
        setWeekZone.equ('$weekzone', new ExpNum(0));
        let setMonthZone = factory.createSet();
        sqls.push(setMonthZone);
        setMonthZone.equ('$monthzone', new ExpNum(1));
        let setYearZone = factory.createSet();
        sqls.push(setYearZone);
        setYearZone.equ('$yearzone', new ExpNum(1));
    }

    head(sqls: Sqls): void {
    }

    body(sqls: Sqls): void {
        const { factory } = this.context;
        const { varName } = this.useObj;
        const { no } = this.statement;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(`${varName}_${no}$start`, new BigInt());
        declare.var(`${varName}_${no}$end`, new BigInt());
    }
}
