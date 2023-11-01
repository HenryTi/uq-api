"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComarePartExpression = exports.CompareExpression = exports.ValueExpression = exports.Expression = void 0;
const parser_1 = require("../../parser");
const element_1 = require("../element");
const Op_1 = require("./Op");
class Expression extends element_1.IElement {
    constructor() {
        super(...arguments);
        this.atoms = [];
    }
    get type() { return 'expression'; }
    // select字段自动取出alias
    alias() {
        if (this.atoms.length > 1)
            return undefined;
        let atom = this.atoms[0];
        if (atom.type !== 'var')
            return undefined;
        let vars = atom._var;
        let len = vars.length;
        if (len > 0)
            return vars[len - 1];
    }
    isVarEqVar() {
        let len = this.atoms.length;
        let e1 = this.atoms[len - 2];
        let e2 = this.atoms[len - 1];
        let { type } = e1;
        if (type !== 'var')
            return false;
        if (type !== e2.type)
            return false;
        let varOperand = e1;
        return varOperand.isSameVar(e2);
    }
}
exports.Expression = Expression;
class ValueExpression extends Expression {
    static const(num) {
        let ret = new ValueExpression();
        let atom;
        switch (typeof num) {
            default:
                atom = new Op_1.NullOperand();
                break;
            case 'number':
                atom = new Op_1.NumberOperand(num);
                break;
            case 'string':
                atom = new Op_1.TextOperand(num);
                break;
        }
        ret.atoms.push(atom);
        return ret;
    }
    parser(context) { return new parser_1.PValueExpression(this, context); }
}
exports.ValueExpression = ValueExpression;
class CompareExpression extends Expression {
    parser(context) { return new parser_1.PCompareExpression(this, context); }
}
exports.CompareExpression = CompareExpression;
// 专门用于Select Of ID，比较的前半部分固定是id=exp
class ComarePartExpression extends CompareExpression {
    parser(context) { return new parser_1.PComparePartExpression(this, context); }
}
exports.ComarePartExpression = ComarePartExpression;
//# sourceMappingURL=Expression.js.map