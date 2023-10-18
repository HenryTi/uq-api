import { PContext, PElement, PUseMonthZone, PUseStatement, PUseTimeSpan, PUseTimeZone, PUseYearZone } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../element";
import { ValueExpression } from "../expression";
import { Statement } from "./statement";

export abstract class UseBase extends IElement {
}

export abstract class UseSetting extends UseBase {
    val: ValueExpression;
}

export class UseTimeZone extends UseSetting {
    readonly type = 'timezone';
    parser(context: PContext): PElement<IElement> {
        return new PUseTimeZone(this, context);
    }
}

export class UseMonthZone extends UseSetting {
    readonly type = 'monthzone';
    parser(context: PContext): PElement<IElement> {
        return new PUseMonthZone(this, context);
    }
}

export class UseYearZone extends UseSetting {
    readonly type = 'yearzone';
    parser(context: PContext): PElement<IElement> {
        return new PUseYearZone(this, context);
    }
}

export enum SpanPeriod {
    year, month, week, day, hour, minute, second
}
export class UseTimeSpan extends UseBase {
    readonly type = 'timespan';
    varName: string;
    spanPeiod: SpanPeriod;
    op: '+' | '-';
    value: ValueExpression;
    parser(context: PContext): PElement<IElement> {
        return new PUseTimeSpan(this, context);
    }
}

export class UseStatement extends Statement {
    useBase: UseBase;
    get type() { return 'use'; }
    parser(context: PContext): PElement<IElement> {
        return new PUseStatement(this, context);
    }
    db(db: Builder): object {
        return;
    }
}
