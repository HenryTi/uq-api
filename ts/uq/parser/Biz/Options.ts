import { BizOptions, OptionsItem, OptionsItemValueType } from "../../il";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizOptions extends PBizEntity<BizOptions> {
    readonly keyColl = {};

    protected override _parse(): void {
        let jName: string;
        const { token } = this.ts;
        if (token === Token.VAR) {
            this.element.name = this.ts.lowerVar;
            jName = this.ts._var;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('ver') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.NUM) {
                this.ts.expectToken(Token.NUM);
            }
            this.element.ver = this.ts.dec;
            this.ts.readToken();
        }
        this.element.ui = this.parseUI();
        this.element.setJName(jName);
        this.ts.passToken(Token.LPARENTHESE);
        for (; ;) {
            if (this.ts.token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.assertToken(Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            let ui = this.parseUI();
            let value: number | string;
            if (this.ts.token === Token.EQU) {
                this.ts.readToken();
                switch (this.ts.token as any) {
                    default: this.ts.expectToken(Token.STRING, Token.NUM); break;
                    case Token.STRING: value = this.ts.text; break;
                    case Token.NUM: value = this.ts.dec; break;
                }
                this.ts.readToken();
            }
            let type: OptionsItemValueType;
            switch (typeof value) {
                default:
                case 'undefined':
                    type = OptionsItemValueType.none; break;
                case 'string':
                    type = OptionsItemValueType.str; break;
                case 'number':
                    type = Number.isInteger(value) === true ? OptionsItemValueType.int : OptionsItemValueType.dec;
                    break;
            }
            let item = new OptionsItem(this.element, name, ui);
            item._itemType = type;
            item.itemValue = value;
            item.memo = String(value);
            this.element.items.push(item);
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
            }
        }
    }
}
