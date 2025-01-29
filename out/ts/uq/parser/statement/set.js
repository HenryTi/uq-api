"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSetStatement = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const PStatement_1 = require("../PStatement");
class PSetStatement extends PStatement_1.PStatement {
    constructor(set, context) {
        super(set, context);
        this.set = set;
    }
    _parse() {
        if (this.ts.isKeyword('out') === true) {
            this.ts.readToken();
            this.set.out = true;
        }
        let select = this.set.select = new il_1.Select();
        select.toVar = true;
        let parser = select.parser(this.context);
        parser.parse();
        if (this.ts.token === tokens_1.Token.SEMICOLON)
            this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        let { select } = this.set;
        if (select.pelement.scan(space) === false)
            ok = false;
        return ok;
    }
}
exports.PSetStatement = PSetStatement;
//# sourceMappingURL=set.js.map