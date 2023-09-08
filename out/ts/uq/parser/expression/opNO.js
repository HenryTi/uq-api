"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpNO = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpNO extends element_1.PElement {
    constructor(opNO, context) {
        super(opNO, context);
        this.opNO = opNO;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expect('ID名字');
            }
            this.entity = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.isKeyword('stamp') === true
                || this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                let val = new il_1.ValueExpression();
                val.parser(this.context).parse();
                this.opNO.stamp = val;
            }
            if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
                this.ts.expectToken(tokens_1.Token.RPARENTHESE);
            }
        }
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        if (this.entity !== undefined) {
            let entity = space.getEntityTable(this.entity);
            if (entity === undefined || entity.type !== 'id') {
                this.log('[' + this.entity + ']必须是ID');
                return false;
            }
            this.opNO.id = entity;
        }
        let { stamp } = this.opNO;
        if (stamp) {
            if (stamp.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.POpNO = POpNO;
//# sourceMappingURL=opNO.js.map