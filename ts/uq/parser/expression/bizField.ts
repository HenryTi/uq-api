import { BizBudValue } from '../../il';
import { BizFieldOperand } from '../../il/expression';
import { PElement } from '../element';
import { Space } from '../space';

export class PBizFieldOperand extends PElement<BizFieldOperand> {
    private fieldName: string;
    _parse() {
        this.fieldName = this.ts.passVar();
    }

    scan(space: Space): boolean {
        let ok = true;
        let from = space.getBizFrom();
        let { bizEntity0 } = from;
        let bud: BizBudValue = from.getBud(this.fieldName);
        if (bud !== undefined) {
            this.element.bizBud = bud;
        }
        else if (bizEntity0?.hasField(this.fieldName) === true) {
            this.element.fieldName = this.fieldName;
        }
        else {
            this.log(`Unknown field ${this.fieldName}`);
            ok = false;
        }
        return ok;
    }
}
