"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizSelect = void 0;
const il_1 = require("../il");
const select_1 = require("./select");
const tokens_1 = require("./tokens");
class PBizSelect extends select_1.PSelect {
    _parse() {
        this.entity = this.ts.passVar();
        this.ts.passToken(tokens_1.Token.AT);
        this.on = new il_1.ValueExpression();
        this.context.parseElement(this.on);
    }
    scan(space) {
        let ok = true;
        if (this.entity !== undefined) {
            let bizEntity = space.getBizEntity(this.entity);
            if (bizEntity === undefined) {
                this.log(`${this.entity} is not defined`);
                ok = false;
            }
            let entity, tblName;
            switch (bizEntity.bizPhraseType) {
                default:
                    debugger;
                    throw new Error(`${bizEntity.name} to be implemented`);
                case il_1.BizPhraseType.atom:
                    tblName = 'atom';
                    entity.name = 'atom';
                    break;
                case il_1.BizPhraseType.spec:
                    tblName = 'spec';
                    entity = new il_1.ID(space.uq);
                    entity.name = 'spec';
                    break;
                case il_1.BizPhraseType.sheet:
                    tblName = 'sheet';
                    entity = new il_1.ID(space.uq);
                    entity.name = 'sheet';
                    break;
                case il_1.BizPhraseType.bin:
                    tblName = 'bin';
                    entity = new il_1.IDX(space.uq);
                    entity.name = 'bin';
                    break;
            }
            this.select.from = new il_1.FromTable();
            const { from } = this.select;
            from.name = tblName;
            from.entity = entity;
        }
        let expValue = new il_1.ValueExpression();
        let one = new il_1.VarOperand();
        one._var = ['i'];
        expValue.atoms.push(one);
        this.select.columns = [
            { alias: undefined, value: expValue }
        ];
        this.select.where = new il_1.CompareExpression();
        let { where } = this.select;
        where.atoms.push(one, ...this.on.atoms, new il_1.OpEQ());
        if (this.on.pelement.scan(space) === false) {
            ok = false;
        }
        // let limit = new ValueExpression();
        // this.select.limit = limit;
        // limit.atoms.push();
        return ok;
    }
}
exports.PBizSelect = PBizSelect;
//# sourceMappingURL=bizSelect.js.map