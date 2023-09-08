import { Enum } from "../../il";
import { Space } from '../space';
import { Token } from "../tokens";
import { PEntity } from "./entity";

export class PEnum extends PEntity<Enum> {
    private duplicateKeys: string[] = [];
    scanDoc2(): boolean {
        return true;
    }
    protected _parse() {
        this.setName();
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        this.entity.keyValues = {};
        const { keyValues } = this.entity;
        this.entity.keyValuesSchema = {};
        for (; ;) {
            this.ts.assertVar();
            let key = this.ts.lowerVar;
            let vKey = this.ts._var;
            this.ts.readToken();
            this.ts.assertToken(Token.EQU);
            this.ts.readToken();
            let v: number;
            switch (this.ts.token) {
                case Token.SUB:
                    this.ts.readToken();
                    this.ts.assertToken(Token.NUM);
                    v = -this.ts.dec;
                    this.ts.readToken();
                    break;
                case Token.NUM:
                    v = this.ts.dec;
                    this.ts.readToken();
                    break;
                case Token.HEX:
                    v = Number.parseInt(this.ts.text, 16);
                    this.ts.readToken();
                    break;
                /*
                enum的值应该只支持数字
                case Token.STRING:
                    v = this.ts.text;
                    this.ts.readToken();
                    break;
                */
                default:
                    this.ts.expectToken(Token.NUM); //, Token.STRING);
                    break;
            }
            if (keyValues[key] !== undefined) {
                this.duplicateKeys.push(vKey);
            }
            keyValues[key] = {
                key: vKey,
                val: v,
            }
            this.entity.keyValuesSchema[vKey] = v;
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            if (this.ts.token as any === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        if (this.duplicateKeys.length > 0) {
            this.log(this.duplicateKeys.map(v => `'${v}'`).join(', ') + ' duplicated.');
            ok = false;
        }
        let { keyValues } = this.entity;
        for (let i in keyValues) {
            let { val } = keyValues[i];
            if ((val as number) < -0x7fff || (val as number) > 0x7fff) {
                this.log(`${i}: enum值最大0x7FFF, 最小-0x7FFF`);
                ok = false;
            }
        }
        return ok;
    }
}
