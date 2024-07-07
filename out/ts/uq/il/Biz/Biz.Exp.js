"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizCheckBudOperand = exports.CheckAction = exports.BizExpOperand = exports.BizFieldOperand = exports.BizExp = exports.BizExpParam = exports.BizExpParamType = void 0;
const parser_1 = require("../../parser");
const IElement_1 = require("../IElement");
const Op_1 = require("../Exp/Op");
const Biz_Exp_1 = require("../../parser/Biz/Biz.Exp");
var BizExpParamType;
(function (BizExpParamType) {
    BizExpParamType[BizExpParamType["none"] = 0] = "none";
    BizExpParamType[BizExpParamType["scalar"] = 1] = "scalar";
    BizExpParamType[BizExpParamType["duo"] = 2] = "duo";
    BizExpParamType[BizExpParamType["multi"] = 3] = "multi";
    BizExpParamType[BizExpParamType["spec"] = 4] = "spec";
    BizExpParamType[BizExpParamType["ix"] = 5] = "ix";
})(BizExpParamType || (exports.BizExpParamType = BizExpParamType = {}));
class BizExpParam extends IElement_1.IElement {
    constructor() {
        super(...arguments);
        this.type = 'BizExpParam';
        this.params = [];
    }
    parser(context) {
        return new Biz_Exp_1.PBizExpParam(this, context);
    }
}
exports.BizExpParam = BizExpParam;
// 1. (#Entity.Bud(id).^|Prop IN timeSpan +- delta)     -- sigle value
// 2. (#Book.Bud#ID(*,*,1))                             -- group by Sum
class BizExp extends IElement_1.IElement {
    constructor() {
        super(...arguments);
        this.type = 'BizExp';
        this.isReadonly = false;
    }
    parser(context) {
        return new Biz_Exp_1.PBizExp(this, context);
    }
}
exports.BizExp = BizExp;
class BizFieldOperand extends Op_1.Atom {
    get type() { return 'bizfield'; }
    parser(context) { return new parser_1.PBizFieldOperand(this, context); }
    to(stack) {
        stack.bizFieldOperand(this);
    }
}
exports.BizFieldOperand = BizFieldOperand;
class BizExpOperand extends Op_1.Atom {
    get type() { return 'bizexp'; }
    parser(context) { return new Biz_Exp_1.PBizExpOperand(this, context); }
    to(stack) {
        stack.bizExp(this.bizExp);
    }
}
exports.BizExpOperand = BizExpOperand;
var CheckAction;
(function (CheckAction) {
    CheckAction[CheckAction["on"] = 0] = "on";
    CheckAction[CheckAction["equ"] = 1] = "equ";
    CheckAction[CheckAction["in"] = 2] = "in";
})(CheckAction || (exports.CheckAction = CheckAction = {}));
class BizCheckBudOperand extends Op_1.Atom {
    get type() { return 'bizcheckbudoperand'; }
    parser(context) { return new Biz_Exp_1.PBizCheckBudOperand(this, context); }
    to(stack) {
        stack.bizCheckBud(this);
    }
}
exports.BizCheckBudOperand = BizCheckBudOperand;
//# sourceMappingURL=Biz.Exp.js.map