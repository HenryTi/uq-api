import { SpanPeriod, UseBase, UseMonthZone, UseSetting, UseStatement, UseTimeSpan, UseTimeZone, UseYearZone, ValueExpression } from "../../il";
import { PElement } from "../element";
import { Space } from "../space";
import { Token } from "../tokens";
import { PStatement } from "./statement";

export class PUseStatement extends PStatement<UseStatement> {
    protected _parse(): void {
        let key = this.ts.passKey();
        let useBase: UseBase;
        switch (key) {
            default:
                this.ts.error(`Unknown key ${key}`);
                break;
            case 'timezone': useBase = new UseTimeZone(); break;
            case 'monthzone': useBase = new UseMonthZone(); break;
            case 'yearzone': useBase = new UseYearZone(); break;
            case 'timespan': useBase = new UseTimeSpan(); break;
        }
        this.statement.useBase = useBase;
        this.context.parseElement(useBase);
    }

    scan(space: Space): boolean {
        let ok = true;
        if (this.statement.useBase.pelement.scan(space) === false) {
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
        this.element.val = val;
    }
    scan(space: Space): boolean {
        let ok = true;
        if (this.element.val.pelement.scan(space) === false) {
            ok = false;
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
            this.element.spanPeiod = SpanPeriod[sp];
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
        const { varName, op, value } = this.element;
        if (op === undefined) {
            if (space.addUse(varName) === false) {
                this.log(`Duplicate define ${varName}`);
                ok = false;
            }
        }
        else {
            if (space.getUse(varName) === false) {
                this.log(`${varName} is not defined`);
                ok = false;
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
