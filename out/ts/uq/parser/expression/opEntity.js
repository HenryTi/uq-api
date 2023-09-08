"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpEntityName = exports.POpEntityId = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
const expression_1 = require("./expression");
class POpEntityId extends element_1.PElement {
    constructor(opEntityId, context) {
        super(opEntityId, context);
        this.opEntityId = opEntityId;
    }
    _parse() {
        let val = new il_1.ValueExpression();
        val.parser(this.context).parse();
        this.opEntityId.val = val;
        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space) {
        let { val } = this.opEntityId;
        let { pelement } = val;
        let theSpace = new expression_1.ExpressionSpace(space);
        let ok = pelement.scan(theSpace);
        return ok;
    }
}
exports.POpEntityId = POpEntityId;
class POpEntityName extends element_1.PElement {
    constructor(opEntityName, context) {
        super(opEntityName, context);
        this.opEntityName = opEntityName;
    }
    _parse() {
        let val = new il_1.ValueExpression();
        val.parser(this.context).parse();
        this.opEntityName.val = val;
        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space) {
        let { val } = this.opEntityName;
        let { pelement } = val;
        let theSpace = new expression_1.ExpressionSpace(space);
        let ok = pelement.scan(theSpace);
        return ok;
    }
}
exports.POpEntityName = POpEntityName;
//# sourceMappingURL=opEntity.js.map