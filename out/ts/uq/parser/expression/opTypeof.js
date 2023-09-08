"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpTypeof = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
const expression_1 = require("./expression");
class POpTypeof extends element_1.PElement {
    constructor(opTypeof, context) {
        super(opTypeof, context);
        this.opTypeof = opTypeof;
    }
    _parse() {
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            let val = new il_1.ValueExpression();
            val.parser(this.context).parse();
            this.opTypeof.val = val;
            if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
                this.ts.expectToken(tokens_1.Token.RPARENTHESE);
            }
            this.ts.readToken();
            return;
        }
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expect('entity名字');
        }
        this.entity = this.ts.lowerVar;
        this.ts.readToken();
    }
    scan(space) {
        if (this.entity) {
            let entity = space.getEntity(this.entity);
            if (entity === undefined) {
                this.log('[' + this.entity + ']必须是Entity');
                return false;
            }
            this.opTypeof.entity = entity;
            return true;
        }
        let { val } = this.opTypeof;
        let { pelement } = val;
        let theSpace = new expression_1.ExpressionSpace(space);
        return pelement.scan(theSpace);
    }
}
exports.POpTypeof = POpTypeof;
//# sourceMappingURL=opTypeof.js.map