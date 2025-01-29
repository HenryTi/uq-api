"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPokeStatement = void 0;
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
class PPokeStatement extends PStatement_1.PStatement {
    constructor(pokeStatement, context) {
        super(pokeStatement, context);
        this.pokeStatement = pokeStatement;
    }
    _parse() {
        let val = new il_1.ValueExpression();
        val.parser(this.context).parse();
        this.pokeStatement.user = val;
    }
    scan(space) {
        let ok = true;
        let { user } = this.pokeStatement;
        if (user) {
            if (user.pelement.scan(space) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PPokeStatement = PPokeStatement;
//# sourceMappingURL=poke.js.map