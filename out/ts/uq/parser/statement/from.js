"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFromStatement = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const statement_1 = require("./statement");
class PFromStatement extends statement_1.PStatement {
    constructor() {
        super(...arguments);
        this.tbls = [];
    }
    _parse() {
        for (;;) {
            this.tbls.push(this.ts.passVar());
            if (this.ts.token === tokens_1.Token.BITWISEOR) {
                this.ts.readToken();
            }
            else {
                break;
            }
        }
        this.ts.passKey('id');
        if (this.ts.isKeyword('asc') === true) {
            this.element.asc = 'asc';
        }
        else if (this.ts.isKeyword('desc') === true) {
            this.element.asc = 'desc';
        }
        else {
            this.ts.expect('ASC', 'DESC');
        }
        this.ts.readToken();
        this.ts.passKey('column');
        for (;;) {
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            this.ts.passKey('as');
            let name = this.ts.passVar();
            this.element.cols.push({ name, val });
            if (this.ts.token !== tokens_1.Token.COMMA)
                break;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            let where = new il_1.CompareExpression();
            this.context.parseElement(where);
            this.element.where = where;
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        const { where } = this.element;
        if (where !== undefined) {
            if (where.pelement.scan(space) === false) {
                ok = false;
            }
        }
        for (let { val } of this.element.cols) {
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PFromStatement = PFromStatement;
//# sourceMappingURL=from.js.map