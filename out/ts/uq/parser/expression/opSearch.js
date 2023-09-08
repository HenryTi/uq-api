"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpSearch = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpSearch extends element_1.PElement {
    constructor(opSearch, context) {
        super(opSearch, context);
    }
    _parse() {
        let values = this.element.values = [];
        for (;;) {
            let value = new il_1.ValueExpression();
            value.parser(this.context).parse();
            values.push(value);
            if (this.ts.token !== tokens_1.Token.COMMA)
                break;
            this.ts.readToken();
        }
        const likes = ['on', 'like'];
        if (this.ts.isKeywords(...likes) === false) {
            this.ts.expect(...likes);
        }
        this.ts.readToken();
        let key = this.element.key = new il_1.ValueExpression();
        key.parser(this.context).parse();
        if (this.ts.token != tokens_1.Token.RPARENTHESE) {
            this.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        let { key, values } = this.element;
        if (key.pelement.scan(space) === false)
            ok = false;
        for (let value of values) {
            if (value.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.POpSearch = POpSearch;
//# sourceMappingURL=opSearch.js.map