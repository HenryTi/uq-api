"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUseTimeSpan = exports.PUseYearZone = exports.PUseMonthZone = exports.PUseTimeZone = exports.PUseSetting = exports.PUseBase = exports.PUseStatement = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
const statement_1 = require("./statement");
class PUseStatement extends statement_1.PStatement {
    _parse() {
        let key = this.ts.passKey();
        let useBase;
        switch (key) {
            default:
                this.ts.error(`Unknown key ${key}`);
                break;
            case 'timezone':
                useBase = new il_1.UseTimeZone(this.element);
                break;
            case 'monthzone':
                useBase = new il_1.UseMonthZone(this.element);
                break;
            case 'yearzone':
                useBase = new il_1.UseYearZone(this.element);
                break;
            case 'timespan':
                useBase = new il_1.UseTimeSpan(this.element);
                break;
        }
        this.element.useBase = useBase;
        this.context.parseElement(useBase);
    }
    scan(space) {
        let ok = true;
        if (this.element.useBase.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PUseStatement = PUseStatement;
class PUseBase extends element_1.PElement {
}
exports.PUseBase = PUseBase;
class PUseSetting extends PUseBase {
    _parse() {
        this.ts.passToken(tokens_1.Token.EQU);
        let val = new il_1.ValueExpression();
        this.context.parseElement(val);
        this.element.value = val;
    }
    scan(space) {
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
exports.PUseSetting = PUseSetting;
class PUseTimeZone extends PUseSetting {
}
exports.PUseTimeZone = PUseTimeZone;
class PUseMonthZone extends PUseSetting {
}
exports.PUseMonthZone = PUseMonthZone;
class PUseYearZone extends PUseSetting {
}
exports.PUseYearZone = PUseYearZone;
class PUseTimeSpan extends PUseBase {
    _parse() {
        this.element.varName = this.ts.passVar();
        const { token } = this.ts;
        const parseOp = (op) => {
            this.element.op = op;
            this.ts.readToken();
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            this.element.value = val;
        };
        if (token === tokens_1.Token.ADDEQU) {
            parseOp('+');
        }
        else if (token === tokens_1.Token.SUBEQU) {
            parseOp('-');
        }
        else {
            let sp = this.ts.passKey();
            if (Object.keys(il_1.SpanPeriod).includes(sp) === false) {
                this.ts.expect('time span period');
            }
            this.element.spanPeriod = il_1.SpanPeriod[sp];
            if (this.ts.token === tokens_1.Token.LPARENTHESE) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                }
                else {
                    let val = new il_1.ValueExpression();
                    this.context.parseElement(val);
                    this.element.value = val;
                    this.ts.passToken(tokens_1.Token.RPARENTHESE);
                }
            }
        }
    }
    scan(space) {
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
exports.PUseTimeSpan = PUseTimeSpan;
/*
export class PUseOut extends PUseBase<UseOut> {
    private outEntity: string;
    protected _parse(): void {
        this.element.varName = this.ts.passVar();
        this.outEntity = this.ts.passVar();
    }
    scan(space: Space): boolean {
        let ok = true;
        this.element.outEntity = space.getBizEntity(this.outEntity);
        let { outEntity, statement, varName } = this.element;
        if (outEntity === undefined || outEntity.bizPhraseType !== BizPhraseType.out) {
            ok = false;
            this.log(`${this.outEntity} is not OUT`);
        }
        space.addUse(varName, statement.no, this.element);
        return ok;
    }
}
*/ 
//# sourceMappingURL=use.js.map