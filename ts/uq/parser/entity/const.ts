import { Const, ValueExpression } from "../../il";
import { Space } from '../space';
import { Token } from "../tokens";
import { PEntity } from "./entity";

export class PConst extends PEntity<Const> {
    scanDoc2(): boolean {
        return true;
    }
    protected _parse() {
        this.setName();
        this.ts.assertToken(Token.EQU);
        this.ts.readToken();
        this.entity.keyValues = {};
        this.entity.keyValuesSchema = {};
        if (this.ts.token === Token.LBRACE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token as any !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                    break;
                }
                let { lowerVar, _var } = this.ts;
                this.ts.readToken();
                if (this.ts.token as any !== Token.COLON) {
                    this.ts.expectToken(Token.COLON);
                    break;
                }
                this.ts.readToken();
                let val = new ValueExpression();
                let parser = val.parser(this.context);
                parser.parse();
                this.entity.values[lowerVar] = val;
                /*
                let { atoms } = val;
                if (atoms.length === 1) {
                    let a = atoms[0];
                    let { scalarValue } = a;
                    if (scalarValue !== undefined) {
                        this.entity.keyValues[lowerVar] = {
                            key: _var,
                            val: String(scalarValue).toLowerCase(),
                        };
                    }
                }
                */
                const { scalarValue } = val;
                if (scalarValue !== undefined && Array.isArray(scalarValue) !== true) {
                    this.entity.keyValues[lowerVar] = {
                        key: _var,
                        val: String(scalarValue).toLowerCase(),
                    };
                }

                if (this.ts.token as any === Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token as any !== Token.COMMA) {
                    this.ts.expectToken(Token.COMMA, Token.RBRACE);
                    break;
                }
                this.ts.readToken();
                if (this.ts.token as any === Token.RBRACE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        else {
            let val = new ValueExpression();
            let parser = val.parser(this.context);
            parser.parse();
            this.entity.values['$'] = val;
        }
    }

    scan(space: Space): boolean {
        let { values } = this.entity;
        let ok = true;
        for (let i in values) {
            let val = values[i];
            if (val.pelement.scan(space) === false) ok = false;
        }
        if (this.scanKeyValues() === false) ok = false;
        return ok;
    }

    private scanKeyValues() {
        const { keyValues } = this.entity;
        if (keyValues === undefined) return true;
        this.entity.keyValuesSchema = {};
        for (let i in keyValues) {
            let { key, val } = keyValues[i];
            if (key === undefined) key = i;
            let scalarValue: string | number;
            if (Array.isArray(val) === true) {
                let [v0, v1] = val as [string, string];
                scalarValue = this.entity.uq.calcKeyValue(v0, v1);
                if (scalarValue === undefined) {
                    this.log(`${v0}.${v1} is not defined`);
                }
            }
            else {
                scalarValue = val as string | number;
            }
            this.entity.keyValuesSchema[key] = scalarValue;
        }
        return true;
    }
}
