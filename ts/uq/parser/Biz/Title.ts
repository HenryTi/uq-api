import { BizTitle } from "../../il";
// import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTitle extends PBizEntity<BizTitle> {
    readonly keyColl = {
        prop: this.parseProp,
    };
    /*
    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
        };
        const keys = Object.keys(keyColl);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.ts.expect(...keys);
            }
            this.ts.readToken();
            parse();
        }
    }
    */
}
