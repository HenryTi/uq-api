"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizAct = void 0;
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class PBizAct extends element_1.PElement {
    _parse() {
        this.ts.passToken(tokens_1.Token.LBRACE);
        this.ts.passToken(tokens_1.Token.RBRACE);
        this.ts.mayPassToken(tokens_1.Token.SEMICOLON);
    }
}
exports.PBizAct = PBizAct;
//# sourceMappingURL=Act.js.map