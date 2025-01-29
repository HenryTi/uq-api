"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLogStatement = void 0;
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
class PLogStatement extends PStatement_1.PStatement {
    constructor(logStatement, context) {
        super(logStatement, context);
        this.logStatement = logStatement;
    }
    _parse() {
        // LOG xxx subject xxx; 前面是content
        if (this.ts.isKeyword('error') === true) {
            this.ts.readToken();
            this.logStatement.isError = true;
        }
        let val = new il_1.ValueExpression();
        val.parser(this.context).parse();
        this.logStatement.content = val;
        if (this.ts.isKeyword('subject') === true) {
            this.ts.readToken();
            let val = new il_1.ValueExpression();
            val.parser(this.context).parse();
            this.logStatement.subject = val;
        }
    }
    scan(space) {
        let ok = true;
        let { subject, content } = this.logStatement;
        if (subject) {
            if (subject.pelement.scan(space) === false)
                ok = false;
        }
        if (content) {
            if (content.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PLogStatement = PLogStatement;
//# sourceMappingURL=log.js.map