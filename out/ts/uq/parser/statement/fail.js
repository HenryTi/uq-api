"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFail = void 0;
const PStatement_1 = require("../PStatement");
class PFail extends PStatement_1.PStatement {
    constructor(fail, context) {
        super(fail, context);
        this.fail = fail;
    }
    _parse() {
    }
    scan(space) {
        return true;
    }
}
exports.PFail = PFail;
//# sourceMappingURL=fail.js.map