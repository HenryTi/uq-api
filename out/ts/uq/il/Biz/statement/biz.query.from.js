"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromStatementInQuery = void 0;
const parser_1 = require("../../../parser");
const BizPhraseType_1 = require("../BizPhraseType");
const biz_from_1 = require("./biz.from");
class FromStatementInQuery extends biz_from_1.FromStatement {
    constructor() {
        super(...arguments);
        this.values = [];
    }
    get type() { return 'from'; }
    db(db) {
        return db.fromStatementInQuery(this);
    }
    parser(context) {
        return new parser_1.PFromStatementInQuery(this, context);
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
exports.FromStatementInQuery = FromStatementInQuery;
//# sourceMappingURL=biz.query.from.js.map