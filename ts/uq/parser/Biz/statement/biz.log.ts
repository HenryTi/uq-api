import { BizLog, ValueExpression } from "../../../il";
import { Space } from "../../space";
import { PStatement } from "../../statement";

export class PBizLog extends PStatement<BizLog> {
    protected _parse(): void {
        let val = this.element.val = new ValueExpression();
        this.context.parseElement(val);
    }

    override scan(space: Space): boolean {
        let ok = true;
        const { val } = this.element;
        if (val.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
