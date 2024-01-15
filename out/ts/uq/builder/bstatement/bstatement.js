"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BStatement = exports.BStatementBase = void 0;
class BStatementBase {
    constructor(context, istatement) {
        this.context = context;
        this.istatement = istatement;
    }
    singleHead(sqls) { }
    singleFoot(sqls) { }
    head(sqls) { }
    foot(sqls) { }
}
exports.BStatementBase = BStatementBase;
class BStatement extends BStatementBase {
    constructor() {
        super(...arguments);
        this.singleKey = undefined;
    }
}
exports.BStatement = BStatement;
//# sourceMappingURL=bstatement.js.map