"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PArr = void 0;
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PArr extends entity_1.PEntity {
    saveSource() {
        this.entity.source = this.getSource();
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            // this.arr.name = '$';
            this.expect('arr name');
        }
        else {
            this.setName();
        }
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (;;) {
            if (this.ts.token === tokens_1.Token.SHARP || this.ts.token === tokens_1.Token.MUL) {
                this.pushSharpField(this.parseSharpField(this.entity.fields.length));
            }
            else {
                this.parseField();
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.RPARENTHESE)
                    continue;
                this.ts.readToken();
                break;
            }
            else if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            else {
                this.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
            }
        }
    }
    parseField() {
        this.entity.fields.push(this.field(true));
    }
    scan(space) {
        let ok = super.scan(space);
        if (this.replaceSharpFields(space, this.sharpFields, this.entity.fields) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PArr = PArr;
//# sourceMappingURL=arr.js.map