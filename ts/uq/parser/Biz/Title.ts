import { BizTitle } from "../../il";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTitle extends PBizEntity<BizTitle> {
    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
        };
        for (; ;) {
            if (this.ts.token === Token.RBRACE) break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.parseProp();

                continue;
            }
            this.ts.readToken();
            parse();
        }
    }
}
