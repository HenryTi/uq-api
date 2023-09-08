"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PTransactionStatement = void 0;
const il_1 = require("../../il");
const statement_1 = require("./statement");
class PTransactionStatement extends statement_1.PStatement {
    constructor(stat, context) {
        super(stat, context);
        this.stat = stat;
    }
    _parse() {
        const keys = ['start', 'commit', 'off'];
        if (this.ts.varBrace === true) {
            this.ts.expect(...keys);
        }
        switch (this.ts.lowerVar) {
            default:
                this.ts.expect(...keys);
                break;
            case 'off':
                this.stat.act = il_1.EnumTransaction.off;
                break;
            case 'start':
                this.stat.act = il_1.EnumTransaction.start;
                break;
            case 'commit':
                this.stat.act = il_1.EnumTransaction.commit;
                break;
        }
        this.ts.readToken();
    }
    scan(space) {
        let ok = true;
        if (this.stat.act === il_1.EnumTransaction.off) {
            space.setTransactionOff();
        }
        return ok;
    }
}
exports.PTransactionStatement = PTransactionStatement;
//# sourceMappingURL=transaction.js.map