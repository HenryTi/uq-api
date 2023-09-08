"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpDollarVar = void 0;
const element_1 = require("../element");
class POpDollarVar extends element_1.PElement {
    constructor(opDollarVar, context) {
        super(opDollarVar, context);
        this.opDollarVar = opDollarVar;
    }
    _parse() { }
    ;
    scan(space) {
        let { _var } = this.opDollarVar;
        if (space.varPointer('$' + _var, false) === undefined) {
            this.log('不支持系统变量 $' + _var);
            return false;
        }
        return true;
    }
}
exports.POpDollarVar = POpDollarVar;
//# sourceMappingURL=opDollarVar.js.map