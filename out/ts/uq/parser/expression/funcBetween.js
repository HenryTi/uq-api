"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFuncBetween = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class PFuncBetween extends element_1.PElement {
    constructor(funcBetween, context) {
        super(funcBetween, context);
    }
    _parse() {
        let type = this.ts.passKey();
        this.element.betweenType = il_1.EnumFuncBetweenType[type];
        this.context.parseElement(this.element.value = new il_1.ValueExpression());
        if (this.ts.token !== tokens_1.Token.COMMA) {
            this.ts.expectToken(tokens_1.Token.COMMA);
        }
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.COMMA) {
            let compare;
            switch (this.ts.token) {
                default:
                    compare = il_1.EnumFuncBetweenCompare.inclusive;
                    break;
                case tokens_1.Token.Exclamation:
                    compare = il_1.EnumFuncBetweenCompare.exclusive;
                    this.ts.readToken();
                    break;
                case tokens_1.Token.SHARP:
                    compare = il_1.EnumFuncBetweenCompare.inclusive;
                    this.ts.readToken();
                    break;
            }
            this.element.leftCompare = compare;
            this.context.parseElement(this.element.left = new il_1.ValueExpression());
        }
        if (this.ts.token === tokens_1.Token.COMMA) {
            this.ts.readToken();
            let compare;
            switch (this.ts.token) {
                default:
                    compare = il_1.EnumFuncBetweenCompare.exclusive;
                    break;
                case tokens_1.Token.Exclamation:
                    compare = il_1.EnumFuncBetweenCompare.exclusive;
                    this.ts.readToken();
                    break;
                case tokens_1.Token.SHARP:
                    compare = il_1.EnumFuncBetweenCompare.inclusive;
                    this.ts.readToken();
                    break;
            }
            this.element.rightCompare = compare;
            this.context.parseElement(this.element.right = new il_1.ValueExpression());
        }
        if (this.ts.token != tokens_1.Token.RPARENTHESE) {
            this.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        let { betweenType, value, left, right } = this.element;
        if (betweenType === undefined) {
            this.log('BETWEEN([idate, date, int, dec] value, left, right)');
            ok = false;
        }
        if (value.pelement.scan(space) === false)
            ok = false;
        if (left !== undefined) {
            if (left.pelement.scan(space) === false)
                ok = false;
        }
        if (right !== undefined) {
            if (right.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PFuncBetween = PFuncBetween;
//# sourceMappingURL=funcBetween.js.map