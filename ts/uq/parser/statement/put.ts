import { PutStatement, ValueExpression } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PStatement } from "../PStatement";

export class PPutStatement extends PStatement<PutStatement> {
    protected _parse(): void {
        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
        }
        else {
            this.element.putName = this.ts.passVar();
            this.ts.passToken(Token.EQU);
        }
        let val = new ValueExpression();
        this.context.parseElement(val);
        this.element.val = val;
    }

    scan(space: Space): boolean {
        let ok = true;
        const { val } = this.element;
        if (val.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
