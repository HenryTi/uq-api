"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpIsIdType = void 0;
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpIsIdType extends element_1.PElement {
    _parse() {
        this.ids = [];
        for (;;) {
            this.ids.push(this.ts.lowerVar);
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.BITWISEOR) {
                break;
            }
            this.ts.readToken();
        }
    }
    scan(space) {
        let ok = true;
        for (let id of this.ids) {
            let entity = space.uq.biz.bizEntities.get(id);
            if (entity === undefined) {
                ok = false;
                this.log(`${id} is not defined`);
                continue;
            }
            else {
                this.element.bizEntities.push(entity);
            }
        }
        return ok;
    }
}
exports.POpIsIdType = POpIsIdType;
//# sourceMappingURL=opIsIdType.js.map