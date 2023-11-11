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
        if (hasField(this.fieldName) === true) {
            this.element.fieldName = this.fieldName;
        }
        else {
            let [bizEntity, bud] = from.getBud(this.fieldName);
            if (bud !== undefined) {
                this.element.bizEntity = bizEntity;
                this.element.bizBud = bud;
            }
            else {
                this.log(`Unknown field ${this.fieldName}`);
                ok = false;
            }
        }
        return ok;
    }
}
