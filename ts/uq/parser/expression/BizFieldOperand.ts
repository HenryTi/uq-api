import { BizField, BizFieldOperand, BizFieldOptionsItem, BizFieldUser, BizOptions } from '../../il';
import { BizPhraseType } from '../../il/Biz/BizPhraseType';
import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';

// %开始的字段，是BizField。
export class PBizFieldOperand extends PElement<BizFieldOperand> {
    private fieldNames: string[] = [];
    _parse() {
        this.fieldNames.push(this.ts.passVar());
        while (this.ts.token === Token.DOT) {
            this.ts.readToken();
            this.fieldNames.push(this.ts.passVar());
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let field = space.getBizField(this.fieldNames);
        if (field === null) {
            this.log(`%${this.fieldNames.join('.')} is not defined`);
            return false;
        }
        const [f0, f1] = this.fieldNames;
        if (field !== undefined) {
            this.element.field = field;
            field.scanBinDiv();
        }
        else if (f0 === 'id') {
            if (this.fieldNames[1] !== undefined) {
                this.log(`Unknown field ${this.fieldNames.join('.')}`);
                ok = false;
            }
            else {
                this.log(`Unknown ID field`);
                ok = false;
            }
        }
        else if (f0 === 'user') {
            // 暂时任何字段都允许
            let bizEntity = space.getBizEntity();
            if (bizEntity === undefined) {
                ok = false;
                this.log(`%${f0}.${f1} can only be used in biz Entity`);
            }
            else {
                if (bizEntity.checkUserDefault(f1) === false) {
                    ok = false;
                    this.log(`%${f0}.${f1} not defined`);
                }
                else {
                    this.element.field = new BizFieldUser(undefined, f1);
                }
            }
        }
        else {
            let fieldOptionsItem = this.scanOption(space, f0, f1);
            if (fieldOptionsItem !== undefined) {
                this.element.field = fieldOptionsItem;
            }
            else {
                this.log(`Unknown field ${this.fieldNames.join('.')}`);
                ok = false;
            }
        }
        return ok;
    }

    private scanOption(space: Space, f0: string, f1: string): BizField {
        let options = space.uq.biz.bizEntities.get(f0) as BizOptions;
        if (options === undefined) return undefined;
        if (options.bizPhraseType !== BizPhraseType.options) return undefined;
        let optionsItem = options.items.find(v => v.name === f1);
        if (optionsItem === undefined) return undefined;
        return new BizFieldOptionsItem(options, optionsItem);
    }
}
