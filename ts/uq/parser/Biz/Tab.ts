import { BizTab } from "../../il";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTab extends PBizEntity<BizTab> {
    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
        };
        // const keys = Object.keys(keyColl);
        for (; ;) {
            if (this.ts.token === Token.RBRACE) break;
            let parse = keyColl[this.ts.lowerVar];
            if (this.ts.varBrace === true || parse === undefined) {
                this.parseProp();
                // this.ts.expect(...keys);

                continue;
            }
            this.ts.readToken();
            parse();
        }
    }
}
