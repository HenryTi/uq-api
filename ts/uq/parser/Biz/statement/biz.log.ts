import { BizLog, LogArray, LogObject, LogScalar, LogType, LogValue, ValueExpression } from "../../../il";
import { Space } from "../../space";
import { PStatement } from "../../PStatement";
import { Token } from "../../tokens";

export class PBizLog extends PStatement<BizLog> {
    protected _parse(): void {
        // let val = this.element.val = new ValueExpression();
        // this.context.parseElement(val);
        this.element.val = this.parseValue();
    }

    private parseValue(): LogValue {
        switch (this.ts.token) {
            default:
                if (this.ts.isKeyword('on') === true) {
                    this.ts.readToken();
                    return {
                        type: LogType.on,
                        value: undefined,
                    }
                }
                if (this.ts.isKeyword('off') === true) {
                    this.ts.readToken();
                    return {
                        type: LogType.off,
                        value: undefined,
                    }
                }
                return {
                    type: LogType.scalar,
                    value: this.parseScalar(),
                }
            case Token.COLON:
                this.ts.readToken();
                return {
                    type: LogType.object,
                    value: this.parseObject(),
                };
            case Token.SHARP:
                this.ts.readToken();
                return {
                    type: LogType.array,
                    value: this.parseArray(),
                };
        }
    }

    private parseScalar(): LogScalar {
        let val = new ValueExpression();
        this.context.parseElement(val);
        return val;
    }

    private parseArray(): LogArray {
        let ret: LogArray = [];
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            ret.push(this.parseValue());
            if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
        return ret;
    }

    private parseObject(): LogObject {
        let ret: LogObject = {};
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            let name = this.ts.passVar();
            this.ts.passToken(Token.COLON);
            ret[name] = this.parseValue();
            if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
        return ret;
    }

    override scan(space: Space): boolean {
        let ok = true;
        const { val } = this.element;
        if (this.scanValue(space, val) === false) {
            ok = false;
        }
        return ok;
    }

    private scanValue(space: Space, { type, value }: LogValue): boolean {
        let ok = true;
        switch (type) {
            case LogType.on: space.logOn(); break;
            case LogType.on: space.logOff(); break;
            case LogType.scalar:
                if (this.scanScalar(space, value as LogScalar) === false) {
                    ok = false;
                }
                break;
            case LogType.array:
                if (this.scanArray(space, value as LogArray) === false) {
                    ok = false;
                }
                break;
            case LogType.object:
                if (this.scanObject(space, value as LogObject) === false) {
                    ok = false;
                }
                break;
        }
        return ok;
    }

    private scanScalar(space: Space, val: LogScalar): boolean {
        let ok = true;
        if (val.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }

    private scanArray(space: Space, val: LogArray): boolean {
        let ok = true;
        for (let v of val) {
            if (this.scanValue(space, v) === false) ok = false;
        }
        return ok;
    }

    private scanObject(space: Space, val: LogObject): boolean {
        let ok = true;
        for (let i in val) {
            if (this.scanValue(space, val[i]) === false) ok = false;
        }
        return ok;
    }
}
