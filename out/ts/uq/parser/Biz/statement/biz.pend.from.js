"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFromStatementInPend = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const tokens_1 = require("../../tokens");
const biz_from_1 = require("./biz.from");
class PFromStatementInPend extends biz_from_1.PFromStatement {
    _parse() {
        this.parseTblsOf(this.pFromEntity);
        this.parseColumns();
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    createFromSpace(space) {
        return new FromInPendSpace(space, this.element);
    }
    scan(space) {
        let ret = super.scan(space);
        /*
        let { pendQuery: { bizPend }, fromEntity } = this.element;
        if (fromEntity.bizEntityArr.length > 0) {
            debugger;
        }
        fromEntity.bizEntityArr.push(bizPend);
        fromEntity.bizPhraseType = BizPhraseType.pend;
        fromEntity.bizEntityTable = EnumSysTable.pend;
        fromEntity.alias = 't1';
        */
        return ret;
    }
    scanIDsWithCheck0() {
        let ok = true;
        if (this.scanIDs() === false) {
            ok = false;
        }
        return ok;
    }
    setEntityArr(space) {
        const { pendQuery: { bizPend }, fromEntity } = this.element;
        fromEntity.bizEntityArr.push(bizPend);
        fromEntity.bizPhraseType = BizPhraseType_1.BizPhraseType.pend;
        fromEntity.bizEntityTable = il_1.EnumSysTable.pend;
        return true;
    }
}
exports.PFromStatementInPend = PFromStatementInPend;
class FromInPendSpace extends biz_from_1.FromSpace {
    createBizFieldSpace(from) {
        return new il_1.FromInPendFieldSpace(from);
    }
}
//# sourceMappingURL=biz.pend.from.js.map