import { OpAt, ValueExpression } from "../../il";
import { PElement } from "../element";
import { Space } from "../space";
import { Token } from "../tokens";

export class POpAt extends PElement<OpAt>  {
    protected _parse(): void {
        if (this.ts.token === Token.EQU) {
            this.ts.readToken();
            this.element.bizVal = this.context.parse(ValueExpression);
        }
        else {
            let bizName: string[] = [];
            if (this.ts.token === Token.DOLLARVAR) {
                bizName.push(this.ts.lowerVar);
                this.ts.readToken();
            }
            else {
                for (; ;) {
                    let v = this.ts.passVar();
                    bizName.push(v);
                    if (this.ts.token !== Token.DOT) break;
                    this.ts.readToken();
                }
            }
            this.element.bizName = bizName;
        }
    }
    scan(space: Space): boolean {
        let ok = true;
        let { bizName, bizVal } = this.element;
        if (bizName !== undefined) {
            let biz = space.getBizBase(bizName);
            if (biz === undefined) {
                this.log(`unknown biz object '${bizName.join('.')}'`);
                ok = false;
            }
            this.element.biz = biz;
        }
        else {
            bizVal.pelement.scan(space);
        }
        return ok;
    }
}
