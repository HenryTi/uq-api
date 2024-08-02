"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizFieldOperand = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
// %开始的字段，是BizField。
class PBizFieldOperand extends element_1.PElement {
    constructor() {
        super(...arguments);
        this.fieldName = [];
    }
    _parse() {
        this.fieldName.push(this.ts.passVar());
        while (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            this.fieldName.push(this.ts.passVar());
        }
    }
    scan(space) {
        let ok = true;
        // let bizFieldSpace = space.getBizFieldSpace();
        // let field = bizFieldSpace.getBizField(this.fieldName);
        let field = space.getBizField(this.fieldName);
        /*
        if (field === undefined) {
            debugger;
            space.getBizField(this.fieldName);
        }
        */
        if (field === null) {
            this.log(`%${this.fieldName.join('.')} is not defined`);
            // bizFieldSpace.getBizField(this.fieldName);
            space.getBizField(this.fieldName);
            return false;
        }
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
            let bizEntity = space.getBizEntity();
            if (bizEntity === undefined) {
                ok = false;
                this.log(`%${f0}.${f1} can only be used in biz Entity`);
            }
            else {
                // const { bizEntity } = bizEntitySpace;
                if (bizEntity.checkUserDefault(f1) === false) {
                    ok = false;
                    this.log(`%${f0}.${f1} not defined`);
                }
                else {
                    // this.element.field = new BizFieldUser(bizFieldSpace, f1);
                    this.element.field = new il_1.BizFieldUser(undefined, f1);
                }
            }
        }
        else {
            let fieldOptionsItem = this.scanOption(space, f0, f1);
            if (fieldOptionsItem !== undefined) {
                this.element.field = fieldOptionsItem;
            }
            else {
                this.log(`Unknown field ${this.fieldName.join('.')}`);
                ok = false;
            }
        }
        return ok;
    }
    scanOption(space, f0, f1) {
        let options = space.uq.biz.bizEntities.get(f0);
        if (options === undefined)
            return undefined;
        if (options.bizPhraseType !== BizPhraseType_1.BizPhraseType.options)
            return undefined;
        let optionsItem = options.items.find(v => v.name === f1);
        if (optionsItem === undefined)
            return undefined;
        return new il_1.BizFieldOptionsItem(options, optionsItem);
    }
}
exports.PBizFieldOperand = PBizFieldOperand;
//# sourceMappingURL=BizFieldOperand.js.map