"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizFieldOperand = void 0;
const il_1 = require("../../il");
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
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            this.fieldName.push(this.ts.passVar());
        }
    }
    scan(space) {
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
                    this.element.field = new il_1.BizFieldUser(bizFieldSpace, f1);
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
exports.PBizFieldOperand = PBizFieldOperand;
//# sourceMappingURL=BizFieldOperand.js.map