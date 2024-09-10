"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizLog = void 0;
const il_1 = require("../../../il");
const statement_1 = require("../../statement");
class PBizLog extends statement_1.PStatement {
    _parse() {
        let val = this.element.val = new il_1.ValueExpression();
        this.context.parseElement(val);
    }
    scan(space) {
        let ok = true;
        const { val } = this.element;
        if (val.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBizLog = PBizLog;
//# sourceMappingURL=biz.log.js.map