import { BizFieldOperand, BizFieldUser, Uq } from '../../il';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';

// %开始的字段，是BizField。
export class PBizFieldOperand extends PElement<BizFieldOperand> {
    private fieldName: string[] = [];
    _parse() {
        this.fieldName.push(this.ts.passVar());
        if (this.ts.token === Token.DOT) {
            this.ts.readToken();
            this.fieldName.push(this.ts.passVar());
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let bizFieldSpace = space.getBizFieldSpace();
        let field = bizFieldSpace.getBizField(this.fieldName);
        if (field !== undefined) {
            this.element.field = field;
            field.scanBinDiv();
        }
        else if (this.fieldName[0] === 'id') {
            if (this.fieldName[1] !== undefined) {
                this.log(`Unknown field ${this.fieldName.join('.')}`);
                ok = false;
            }
        }
        else if (this.fieldName[0] === 'user') {
            // 暂时任何字段都允许
            this.element.field = new BizFieldUser(bizFieldSpace, this.fieldName[1])
        }
        else {
            this.log(`Unknown field ${this.fieldName.join('.')}`);
            ok = false;
        }
        return ok;
    }
}
