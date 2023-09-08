"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpUqDefinedFunction = void 0;
const element_1 = require("../element");
class POpUqDefinedFunction extends element_1.PElement {
    constructor(opFunc, context) {
        super(opFunc, context);
        this.opFunc = opFunc;
    }
    _parse() {
    }
    scan(space) {
        let ok = true;
        let { func, paramCount } = this.opFunc;
        let f = space.uq.funcs[func];
        if (f === undefined) {
            this.log(`function '${func}' is not defined`);
            ok = false;
        }
        else {
            let len = f.fields.length;
            if (len !== paramCount) {
                this.log(`function '${func}' parameters number is ${len}`);
                ok = false;
            }
        }
        return ok;
    }
}
exports.POpUqDefinedFunction = POpUqDefinedFunction;
//# sourceMappingURL=opFunction.js.map