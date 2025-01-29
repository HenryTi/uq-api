"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PTransactionStatement = void 0;
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
class PTransactionStatement extends PStatement_1.PStatement {
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
        switch (this.stat.act) {
            case il_1.EnumTransaction.off:
                space.setTransactionOff(true);
                break;
            case il_1.EnumTransaction.start:
                space.setTransactionOff(false);
                break;
        }
        return ok;
    }
}
exports.PTransactionStatement = PTransactionStatement;
//# sourceMappingURL=transaction.js.map