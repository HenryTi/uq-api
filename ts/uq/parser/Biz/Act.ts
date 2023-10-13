import { BizAct } from "../../il";
import { PElement } from "../element";
import { Token } from "../tokens";

export abstract class PBizAct<T extends BizAct<any>> extends PElement<T> {
    protected override _parse(): void {
        this.ts.passToken(Token.LBRACE);
        this.ts.passToken(Token.RBRACE);
        this.ts.mayPassToken(Token.SEMICOLON);
    }
}
