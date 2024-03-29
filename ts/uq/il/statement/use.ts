import { BUseBase, BUseMonthZone, BUseSheet, BUseTimeSpan, BUseTimeZone, BUseYearZone, DbContext } from "../../builder";
import { PContext, PElement, PUseMonthZone, PUseSheet, PUseStatement, PUseTimeSpan, PUseTimeZone, PUseYearZone } from "../../parser";
import { IElement } from "../IElement";
import { ValueExpression } from "../Exp";
import { SpanPeriod } from "../tool";
import { Statement } from "./Statement";
import { Builder } from "../builder";
import { BizSheet } from "../Biz";

// use 某些特定的值，比如年月日，时段
export abstract class UseBase extends IElement {
    readonly statement: Statement;
    value: ValueExpression;
    abstract db(context: DbContext): BUseBase<any>;
    constructor(statement: Statement) {
        super();
        this.statement = statement;
    }
}

export abstract class UseSetting extends UseBase {
    // val: ValueExpression;
}

export class UseTimeZone extends UseSetting {
    readonly type = 'timezone';
    parser(context: PContext): PElement<IElement> {
        return new PUseTimeZone(this, context);
    }
    override db(context: DbContext) { return new BUseTimeZone(this, context) }
}

export class UseMonthZone extends UseSetting {
    readonly type = 'monthzone';
    parser(context: PContext): PElement<IElement> {
        return new PUseMonthZone(this, context);
    }
    override db(context: DbContext) { return new BUseMonthZone(this, context) }
}

export class UseYearZone extends UseSetting {
    readonly type = 'yearzone';
    parser(context: PContext): PElement<IElement> {
        return new PUseYearZone(this, context);
    }
    override db(context: DbContext) { return new BUseYearZone(this, context) }
}

export class UseTimeSpan extends UseBase {
    readonly type = 'timespan';
    varName: string;
    spanPeriod: SpanPeriod;
    statementNo: number;
    op: '+' | '-';
    parser(context: PContext): PElement<IElement> {
        return new PUseTimeSpan(this, context);
    }
    override db(context: DbContext) { return new BUseTimeSpan(this, context) }
}

export class UseSheet extends UseBase {
    readonly type = 'sheet';
    varName: string;
    sheet: BizSheet;
    parser(context: PContext): PElement<IElement> {
        return new PUseSheet(this, context);
    }
    override db(context: DbContext) { return new BUseSheet(this, context) }
}

export class UseStatement extends Statement {
    useBase: UseBase;
    get type() { return 'use'; }
    parser(context: PContext): PElement<IElement> {
        return new PUseStatement(this, context);
    }
    db(db: Builder): object {
        return db.useStatement(this);
    }
}
