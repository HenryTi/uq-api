"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizFieldOperand = void 0;
const element_1 = require("../element");
class PBizFieldOperand extends element_1.PElement {
    _parse() {
        this.fieldName = this.ts.passVar();
    }
    scan(space) {
        let ok = true;
        let from = space.getBizFrom();
        let { bizEntity0 } = from;
        let bud = from.getBud(this.fieldName);
        if (bud !== undefined) {
            this.element.bizBud = bud;
        }
        else if ((bizEntity0 === null || bizEntity0 === void 0 ? void 0 : bizEntity0.hasField(this.fieldName)) === true) {
            this.element.fieldName = this.fieldName;
        }
        else {
            this.log(`Unknown field ${this.fieldName}`);
            ok = false;
        }
        return ok;
    }
}
exports.PBizFieldOperand = PBizFieldOperand;
//# sourceMappingURL=bizField.js.map