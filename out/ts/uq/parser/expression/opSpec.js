"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpSpecValue = exports.POpSpecId = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpSpecId extends element_1.PElement {
    constructor(opSpecId, context) {
        super(opSpecId, context);
    }
    _parse() {
        let expSpec = this.context.parse(il_1.ValueExpression);
        this.ts.passToken(tokens_1.Token.COMMA);
        let expAtom = this.context.parse(il_1.ValueExpression);
        this.ts.passToken(tokens_1.Token.COMMA);
        let expValues = this.context.parse(il_1.ValueExpression);
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
        this.element.spec = expSpec;
        this.element.atom = expAtom;
        this.element.values = expValues;
    }
    scan(space) {
        let ok = true;
        let { atom, spec, values } = this.element;
        if (atom.pelement.scan(space) === false)
            ok = false;
        if (spec.pelement.scan(space) === false)
            ok = false;
        if (values.pelement.scan(space) === false)
            ok = false;
        return ok;
    }
}
exports.POpSpecId = POpSpecId;
class POpSpecValue extends element_1.PElement {
    constructor(opSpecValue, context) {
        super(opSpecValue, context);
    }
    _parse() {
        let expId = this.context.parse(il_1.ValueExpression);
        this.element.id = expId;
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
    }
    scan(space) {
        let ok = true;
        let { id } = this.element;
        if (id.pelement.scan(space) === false)
            ok = false;
        return ok;
    }
}
exports.POpSpecValue = POpSpecValue;
//# sourceMappingURL=opSpec.js.map