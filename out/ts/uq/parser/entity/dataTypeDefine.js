"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDataTypeDefine = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PDataTypeDefine extends entity_1.PEntity {
    _parse() {
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        const { datatypes } = this.entity;
        for (;;) {
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            let name = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR)
                this.expect('Data type');
            let type = this.ts.lowerVar;
            let dt = (0, il_1.createDataProtoType)(type);
            if (dt === undefined) {
                this.error(`unknown data type ${this.ts._var}`);
            }
            this.ts.readToken();
            dt.parser(this.context).parse();
            datatypes[name] = dt;
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
        }
    }
}
exports.PDataTypeDefine = PDataTypeDefine;
//# sourceMappingURL=dataTypeDefine.js.map