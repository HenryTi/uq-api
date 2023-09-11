import { BizBud, BizBudInt, BizTie } from "../../il";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

export class PBizTie extends PBizEntity<BizTie> {
    protected get defaultName(): string { return undefined; }

    protected parseContent(): void {
        const keyColl = {
            prop: this.parseProp,
            // assign: this.parseAssign,
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

    // bud 有没有type。Tie里面的bud，不需要type，都是bigint
    protected override parseBud(type: string, name: string, caption: string): BizBud {
        return new BizBudInt(type, name, caption);
    }
}
