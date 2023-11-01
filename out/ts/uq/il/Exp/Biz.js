"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizExpOperand = exports.BizFieldOperand = exports.BizExp = exports.BizExpParam = exports.BizExpParamType = void 0;
const parser_1 = require("../../parser");
const element_1 = require("../element");
const Op_1 = require("./Op");
var BizExpParamType;
(function (BizExpParamType) {
    BizExpParamType[BizExpParamType["scalar"] = 0] = "scalar";
    BizExpParamType[BizExpParamType["spec"] = 1] = "spec";
    BizExpParamType[BizExpParamType["ix"] = 2] = "ix";
})(BizExpParamType || (exports.BizExpParamType = BizExpParamType = {}));
class BizExpParam extends element_1.IElement {
    constructor() {
        super(...arguments);
        this.type = 'BizExpParam';
    }
    parser(context) {
        return new parser_1.PBizExpParam(this, context);
    }
}
exports.BizExpParam = BizExpParam;
class BizExp extends element_1.IElement {
    constructor() {
        super(...arguments);
        this.type = 'BizExp';
    }
    parser(context) {
        return new parser_1.PBizExp(this, context);
    }
}
exports.BizExp = BizExp;
class BizFieldOperand extends Op_1.Atom {
    get type() { return 'bizfield'; }
    parser(context) { return new parser_1.PBizFieldOperand(this, context); }
    to(stack) {
        stack.bizField(this);
    }
}
exports.BizFieldOperand = BizFieldOperand;
class BizExpOperand extends Op_1.Atom {
    get type() { return 'bizexp'; }
    parser(context) { return new parser_1.PBizExpOperand(this, context); }
    to(stack) {
        stack.bizExp(this.bizExp);
    }
}
exports.BizExpOperand = BizExpOperand;
//# sourceMappingURL=Biz.js.map