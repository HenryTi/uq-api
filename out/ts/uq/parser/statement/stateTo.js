"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PStateTo = void 0;
const tokens_1 = require("../tokens");
const statement_1 = require("./statement");
class PStateTo extends statement_1.PStatement {
    constructor(stateTo, context) {
        super(stateTo, context);
        this.stateTo = stateTo;
    }
    _parse() {
        if (this.ts.isKeyword('to') !== true)
            this.expect('to');
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.VAR)
            this.expect('state名称');
        this.stateTo.to = this.ts.lowerVar;
        this.ts.readToken();
    }
    scan(space) {
        let to = this.stateTo.to;
        switch (to) {
            case 'start':
            case 'end':
            case 'delete': return true;
        }
        let states = space.getStates();
        if (states === undefined || states[to] === undefined) {
            this.log('未知的状态 ' + to);
            return false;
        }
        return true;
    }
}
exports.PStateTo = PStateTo;
//# sourceMappingURL=stateTo.js.map