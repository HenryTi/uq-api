"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIdBase = void 0;
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PIdBase extends entity_1.PEntityWithTable {
    parseStamp() {
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (;;) {
            if (this.ts.isKeyword('create') === true) {
                if (this.entity.stampCreate === true) {
                    this.ts.error('create stamp alread declared');
                }
                this.entity.stampCreate = true;
                this.ts.readToken();
            }
            else if (this.ts.isKeyword('update') === true) {
                if (this.entity.stampUpdate === true) {
                    this.ts.error('update stamp alread declared');
                }
                this.entity.stampUpdate = true;
                this.ts.readToken();
            }
            else {
                this.ts.error('stamp only create and update');
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
    }
}
exports.PIdBase = PIdBase;
//# sourceMappingURL=idBase.js.map