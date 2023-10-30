"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizFieldOperand = exports.BizExp = void 0;
const parser = require("../../parser");
const expression_1 = require("./expression");
const element_1 = require("../element");
class BizExp extends element_1.IElement {
    constructor() {
        super(...arguments);
        this.type = 'BizExp';
    }
    parser(context) {
        return new parser.PBizExp(this, context);
    }
}
exports.BizExp = BizExp;
class BizFieldOperand extends expression_1.Atom {
    get type() { return 'bizfield'; }
    parser(context) { return new parser.PBizFieldOperand(this, context); }
    to(stack) {
        stack.bizField(this);
    }
}
exports.BizFieldOperand = BizFieldOperand;
//# sourceMappingURL=BizExp.js.map