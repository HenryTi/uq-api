"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromInPendStatement = exports.FromStatement = void 0;
const parser_1 = require("../../../parser");
const biz_select_1 = require("./biz.select");
const BizPhraseType_1 = require("../BizPhraseType");
class FromStatement extends biz_select_1.BizSelectStatement {
    constructor() {
        super(...arguments);
        this.cols = [];
    }
    get type() { return 'from'; }
    db(db) {
        return db.fromStatement(this);
    }
    parser(context) {
        return new parser_1.PFromStatement(this, context);
    }
    getIdFromEntity(idAlias) {
        if (idAlias === undefined) {
            return this.fromEntity;
        }
        return this.getBizFromEntityFromAlias(idAlias);
    }
    // 从值表达式推到bud
    setValBud(col) {
        const { val: { atoms } } = col;
        if (atoms.length !== 1)
            return;
        let atom = atoms[0];
        if (atom.type !== 'var')
            return;
        let { pointer } = atom;
        let bud = pointer.bud;
        if (bud === undefined)
            return;
        if (bud.dataType !== BizPhraseType_1.BudDataType.atom)
            return;
        col.valBud = bud;
    }
}
exports.FromStatement = FromStatement;
class FromInPendStatement extends FromStatement {
    constructor(parent, pendQuery) {
        super(parent);
        this.pendQuery = pendQuery;
    }
    parser(context) {
        return new parser_1.PFromStatementInPend(this, context);
    }
    db(db) {
        return db.fromStatementInPend(this);
    }
}
exports.FromInPendStatement = FromInPendStatement;
//# sourceMappingURL=biz.from.js.map