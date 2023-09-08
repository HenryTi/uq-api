import { BizTree } from "../../il";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTree extends PBizEntity<BizTree> {
    protected get defaultName(): string { return undefined; }

    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
            assign: this.parseAssign,
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
}
