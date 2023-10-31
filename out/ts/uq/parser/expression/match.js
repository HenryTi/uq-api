"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PMatchOperand = void 0;
const Exp_1 = require("../../il/Exp");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class PMatchOperand extends element_1.PElement {
    constructor(opMatch, context) {
        super(opMatch, context);
        this.opMatch = opMatch;
    }
    _parse() {
        this.ts.assertToken(tokens_1.Token.LPARENTHESE);
        this.ts.readToken();
        let varOperands = [];
        while (true) {
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
                break;
            }
            let varOperand = new Exp_1.VarOperand();
            varOperand._var.push(this.ts.lowerVar);
            this.ts.readToken();
            let parser = varOperand.parser(this.context);
            parser.parse();
            varOperands.push(varOperand);
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token !== tokens_1.Token.COMMA) {
                this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                break;
            }
            this.ts.readToken();
        }
        this.ts.assertKey('against');
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.LPARENTHESE);
        this.ts.readToken();
        let expValue = new Exp_1.ValueExpression();
        let parser = expValue.parser(this.context);
        parser.parse();
        let isBoolean = false;
        if (this.ts.lowerVar === 'in') {
            this.ts.readToken();
            this.ts.assertKey('boolean');
            this.ts.readToken();
            this.ts.assertKey('mode');
            this.ts.readToken();
            isBoolean = true;
        }
        this.ts.assertToken(tokens_1.Token.RPARENTHESE);
        this.ts.readToken();
        this.opMatch.varOperands = varOperands;
        this.opMatch.isBoolean = isBoolean;
        this.opMatch.against = expValue;
    }
    scan(space) {
        let ok = true;
        let { varOperands, against } = this.opMatch;
        for (let varOperand of varOperands) {
            if (varOperand.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (against.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PMatchOperand = PMatchOperand;
//# sourceMappingURL=match.js.map