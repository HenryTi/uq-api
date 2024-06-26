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
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    createFromSpace(space) {
        return new FromInPendSpace(space, this.element);
    }
    scan(space) {
        return super.scan(space);
    }
    setEntityArr(space) {
        const { fromEntity } = this.element;
        fromEntity.bizEntityArr = [space.getBizEntity(undefined)];
        fromEntity.bizPhraseType = BizPhraseType_1.BizPhraseType.pend;
        fromEntity.bizEntityTable = il_1.EnumSysTable.pend;
        return true;
    }
}
exports.PFromStatementInPend = PFromStatementInPend;
class FromInPendSpace extends biz_from_1.FromSpace {
    createBizFieldSpace(from) {
        this.bizFieldSpace = new il_1.FromInPendFieldSpace(from);
    }
}
//# sourceMappingURL=biz.fromInPend.js.map