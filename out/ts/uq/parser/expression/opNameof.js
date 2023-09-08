"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpNameof = void 0;
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpNameof extends element_1.PElement {
    constructor(opNameof, context) {
        super(opNameof, context);
        this.opNameof = opNameof;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expect('entity名字');
        }
        this.entity = this.ts.lowerVar;
        this.ts.readToken();
    }
    scan(space) {
        let entity = space.getEntity(this.entity);
        if (entity === undefined) {
            this.log('[' + this.entity + ']必须是Entity');
            return false;
        }
        this.opNameof.entity = entity;
        return true;
    }
}
exports.POpNameof = POpNameof;
//# sourceMappingURL=opNameof.js.map