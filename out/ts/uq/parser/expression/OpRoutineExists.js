"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpRoutineExists = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpRoutineExists extends element_1.PElement {
    constructor(re, context) {
        super(re, context);
    }
    _parse() {
        this.context.parseElement(this.element.schema = new il_1.ValueExpression());
        this.ts.passToken(tokens_1.Token.COMMA);
        this.context.parseElement(this.element.routine = new il_1.ValueExpression());
        this.ts.passToken(tokens_1.Token.RPARENTHESE);
    }
    scan(space) {
        let ok = true;
        let { schema, routine } = this.element;
        if (schema.pelement.scan(space) === false)
            ok = false;
        if (routine.pelement.scan(space) === false)
            ok = false;
        return ok;
    }
}
exports.POpRoutineExists = POpRoutineExists;
//# sourceMappingURL=OpRoutineExists.js.map