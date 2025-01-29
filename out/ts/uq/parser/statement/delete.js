"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDeleteStatement = void 0;
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
const select_1 = require("../select");
class PDeleteStatement extends PStatement_1.PStatement {
    constructor(delStatement, context) {
        super(delStatement, context);
        this.delStatement = delStatement;
    }
    _parse() {
        let del = this.delStatement.del = new il_1.Delete();
        let parser = del.parser(this.context);
        parser.parse();
    }
    scan(space) {
        let ok = true;
        let { del } = this.delStatement;
        let theSpace = new select_1.DeleteSpace(space, del);
        if (del.pelement.scan(theSpace) == false)
            ok = false;
        return ok;
    }
}
exports.PDeleteStatement = PDeleteStatement;
//# sourceMappingURL=delete.js.map