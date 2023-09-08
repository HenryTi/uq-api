"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POpRole = void 0;
const il_1 = require("../../il");
const element_1 = require("../element");
const tokens_1 = require("../tokens");
class POpRole extends element_1.PElement {
    constructor(opRole, context) {
        super(opRole, context);
        this.opRole = opRole;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.ts.expect('Role name');
        }
        this.opRole.role = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expect('sub role name');
            }
            this.opRole.roleSub = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
        }
        let valUnit = new il_1.ValueExpression();
        valUnit.parser(this.context).parse();
        this.opRole.unit = valUnit;
        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
            this.ts.expectToken(tokens_1.Token.RPARENTHESE);
        }
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        let { unit, role, roleSub } = this.opRole;
        if (unit.pelement.scan(space) === false) {
            ok = false;
        }
        if (this.isEqu(role, 'admin')) {
            return ok;
        }
        if (this.isEqu(role, 'owner')) {
            return ok;
        }
        let roleObj = space.getRole();
        if (!roleObj) {
            this.log('no role defined');
            ok = false;
        }
        else if (roleObj.isValid(role, roleSub) === false) {
            ok = false;
            this.log(`unknown role "${role}.${roleSub}"`);
        }
        return ok;
    }
    isEqu(s1, s2) {
        return s1.localeCompare(s2, undefined, { sensitivity: 'base' }) === 0;
    }
}
exports.POpRole = POpRole;
//# sourceMappingURL=opRole.js.map