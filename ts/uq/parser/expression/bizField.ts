import { BizFieldOperand } from '../../il/Exp';
import { PElement } from '../element';
import { Space } from '../space';

// %开始的字段，是BizField。
export class PBizFieldOperand extends PElement<BizFieldOperand> {
    private fieldName: string;
    _parse() {
        this.fieldName = this.ts.passVar();
    }

    scan(space: Space): boolean {
        let ok = true;
        let from = space.getBizFrom();
        const { bizEntityArr } = from;
        function hasField(fieldName: string) {
            for (let be of bizEntityArr) {
                if (be.hasField(fieldName) === true) return true;
            }
            return true;
        }
        let [, bud] = from.getBud(this.fieldName);
        if (bud !== undefined) {
            this.element.bizBud = bud;
        }
        else if (hasField(this.fieldName) === true) {
            this.element.fieldName = this.fieldName;
        }
        else {
            this.log(`Unknown field ${this.fieldName}`);
            ok = false;
        }
        return ok;
    }
}
