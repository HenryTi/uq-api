"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpOf = void 0;
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpOf extends element_1.PElement {
    constructor(opOf, context) {
        super(opOf, context);
        this.opOf = opOf;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expect('tuid名字');
        }
        this.tuid = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.DOT);
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expect('tuid arr名字');
        }
        this.arr = this.ts.lowerVar;
        this.ts.readToken();
    }
    scan(space) {
        let entity = space.getEntityTable(this.tuid);
        if (entity === undefined || entity.type !== 'tuid') {
            this.log('[' + this.tuid + ']必须是TUID');
            return false;
        }
        let tuid = entity;
        let arr = tuid.getArr(this.arr);
        if (arr === undefined) {
            this.log('[' + this.arr + ']必须是[' + this.tuid + ']的ARR');
            return false;
        }
        this.opOf.tuidArr = arr;
        return true;
    }
}
exports.POpOf = POpOf;
//# sourceMappingURL=opOf.js.map