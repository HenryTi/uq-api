"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSleepStatement = void 0;
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
class PSleepStatement extends PStatement_1.PStatement {
    constructor(sleepStatement, context) {
        super(sleepStatement, context);
        this.sleepStatement = sleepStatement;
    }
    _parse() {
        let val = new il_1.ValueExpression();
        val.parser(this.context).parse();
        this.sleepStatement.value = val;
    }
    scan(space) {
        let ok = true;
        let { value } = this.sleepStatement;
        if (value) {
            if (value.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PSleepStatement = PSleepStatement;
//# sourceMappingURL=sleep.js.map