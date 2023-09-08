"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFail = void 0;
const statement_1 = require("./statement");
class PFail extends statement_1.PStatement {
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