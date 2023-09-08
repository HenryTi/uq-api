"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PImport = void 0;
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PImport extends entity_1.PEntity {
    _parse() {
        this.setName();
        if (this.ts.token !== tokens_1.Token.EQU) {
            this.expectToken(tokens_1.Token.EQU);
        }
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.DIV) {
            this.ts.readToken();
            this.entity.uqOwner = '$$$';
        }
        else {
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.expectToken(tokens_1.Token.VAR);
            }
            this.entity.uqOwner = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.DIV) {
                this.expectToken(tokens_1.Token.DIV);
            }
            this.ts.readToken();
        }
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.expectToken(tokens_1.Token.VAR);
        }
        this.entity.uqName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.SEMICOLON) {
            this.expectToken(tokens_1.Token.SEMICOLON);
        }
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PImport = PImport;
//# sourceMappingURL=import.js.map