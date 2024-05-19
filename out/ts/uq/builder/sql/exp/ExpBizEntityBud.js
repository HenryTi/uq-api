"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpBizEntityBud = void 0;
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const exps_1 = require("./exps");
class ExpBizEntityBud extends exps_1.ExpVal {
    constructor(bizEntity, bud) {
        super();
        this.bizEntity = bizEntity;
        this.bud = bud;
    }
    to(sb) {
        switch (this.bizEntity.bizPhraseType) {
            case BizPhraseType_1.BizPhraseType.options:
                sb.append(this.bud.id);
                break;
        }
    }
}
exports.ExpBizEntityBud = ExpBizEntityBud;
//# sourceMappingURL=ExpBizEntityBud.js.map