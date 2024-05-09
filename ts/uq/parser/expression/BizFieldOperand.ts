import { BizFieldOperand, BizFieldUser, Uq } from '../../il';
import { BizEntitySpace } from '../Biz/Biz';
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
        const [f0, f1] = this.fieldName;
        if (field !== undefined) {
            this.element.field = field;
            field.scanBinDiv();
        }
        else if (f0 === 'id') {
            if (this.fieldName[1] !== undefined) {
                this.log(`Unknown field ${this.fieldName.join('.')}`);
                ok = false;
            }
        }
        else if (f0 === 'user') {
            // 暂时任何字段都允许
            let bizEntitySpace = space.getBizEntitySpace();
            if (bizEntitySpace === undefined) {
                ok = false;
                this.log(`%${f0}.${f1} can only be used in biz Entity`);
            }
            else {
                const { bizEntity } = bizEntitySpace;
                if (bizEntity.checkUserDefault(f1) === false) {
                    ok = false;
                    this.log(`%${f0}.${f1} not defined`);
                }
                else {
                    this.element.field = new BizFieldUser(bizFieldSpace, f1);
                }
            }
        }
        else {
            this.log(`Unknown field ${this.fieldName.join('.')}`);
            ok = false;
        }
        return ok;
    }
}
