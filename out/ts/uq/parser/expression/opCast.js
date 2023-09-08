"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpCast = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpCast extends element_1.PElement {
    _parse() {
        if (this.ts.isKeyword('as') === false)
            this.expect("AS");
        this.ts.readToken();
        let dataType = (0, il_1.createDataType)(this.ts.lowerVar); //FieldType.ParseSimple(tokenStream);
        if (dataType === undefined) {
            this.expect('合法的数据类型');
        }
        this.ts.readToken();
        let parser = dataType.parser(this.context);
        parser.parse();
        if (this.ts.token != tokens_1.Token.RPARENTHESE) {
            this.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
        this.element.dataType = dataType;
    }
    scan(space) {
        let ok = true;
        let { dataType } = this.element;
        if (dataType) {
            if (dataType.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.POpCast = POpCast;
//# sourceMappingURL=opCast.js.map