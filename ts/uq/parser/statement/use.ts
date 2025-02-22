import {
    BizFromEntity,
    BizSheet,
    SpanPeriod, UseBase, UseMonthZone, UseSetting, UseSheet, UseStatement
    , UseTimeSpan, UseTimeZone, UseYearZone, ValueExpression
} from "../../il";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";
import { PElement } from "../element";
import { Space } from "../space";
import { Token } from "../tokens";
import { PStatement } from "../PStatement";

export class PUseStatement extends PStatement<UseStatement> {
    protected _parse(): void {
        let key = this.ts.passKey();
        let useBase: UseBase;
        switch (key) {
            default:
                this.ts.error(`Unknown key ${key}`);
                break;
            case 'timezone': useBase = new UseTimeZone(this.element); break;
            case 'monthzone': useBase = new UseMonthZone(this.element); break;
            case 'yearzone': useBase = new UseYearZone(this.element); break;
            case 'timespan': useBase = new UseTimeSpan(this.element); break;
            case 'sheet': useBase = new UseSheet(this.element); break;
        }
        this.element.useBase = useBase;
        this.context.parseElement(useBase);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (this.element.useBase.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

export abstract class PUseBase<T extends UseBase> extends PElement<T> {
}

export class PUseSetting<T extends UseSetting> extends PUseBase<T> {
    protected _parse(): void {
        this.ts.passToken(Token.EQU);
        let val = new ValueExpression();
        this.context.parseElement(val);
        this.element.value = val;
    }
    scan(space: Space): boolean {
        let ok = true;
        const { value } = this.element;
        if (value !== undefined) {
            if (value.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

export class PUseTimeZone extends PUseSetting<UseTimeZone> {
}

export class PUseMonthZone extends PUseSetting<UseMonthZone> {
}

export class PUseYearZone extends PUseSetting<UseYearZone> {
}

export class PUseTimeSpan extends PUseBase<UseTimeSpan> {
    protected _parse(): void {
        this.element.varName = this.ts.passVar();
        const { token } = this.ts;
        const parseOp = (op: '+' | '-') => {
            this.element.op = op;
            this.ts.readToken();
            let val = new ValueExpression();
            this.context.parseElement(val);
            this.element.value = val;
        }
        if (token === Token.ADDEQU) {
            parseOp('+');
        }
        else if (token === Token.SUBEQU) {
            parseOp('-');
        }
        else {
            let sp = this.ts.passKey();
            if (Object.keys(SpanPeriod).includes(sp) === false) {
                this.ts.expect('time span period');
            }
            this.element.spanPeriod = SpanPeriod[sp];
            if (this.ts.token === Token.LPARENTHESE) {
                this.ts.readToken();
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                }
                else {
                    let val = new ValueExpression();
                    this.context.parseElement(val);
                    this.element.value = val;
                    this.ts.passToken(Token.RPARENTHESE);
                }
            }
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        const { varName, op, value, spanPeriod } = this.element;
        const { no } = this.element.statement;
        if (op === undefined) {
            if (space.addUse(varName, no, spanPeriod) === false) {
                this.log(`Duplicate define ${varName}`);
                ok = false;
            }
        }
        else {
            const useObj = space.getUse(varName);
            if (useObj === undefined) {
                this.log(`${varName} is not defined`);
                ok = false;
            }
            else {
                const { obj: spanPeriod, statementNo } = useObj;
                this.element.spanPeriod = spanPeriod;
                this.element.statementNo = statementNo;
            }
        }
        if (value !== undefined) {
            if (value.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

export class PUseSheet extends PUseBase<UseSheet> {
    private sheet: string;
    protected _parse(): void {
        this.element.varName = this.ts.passVar();
        this.sheet = this.ts.passVar();
    }
    scan(space: Space): boolean {
        let ok = true;
        let { bizEntityArr: [s] } = space.getBizFromEntityArrFromName(this.sheet) as BizFromEntity<BizSheet>;
        this.element.sheet = s;
        let { sheet, statement, varName } = this.element;
        if (sheet === undefined || sheet.bizPhraseType !== BizPhraseType.sheet) {
            ok = false;
            this.log(`${this.sheet} is not SHEET`);
        }
        space.addUse(varName, statement.no, this.element);
        return ok;
    }
}
