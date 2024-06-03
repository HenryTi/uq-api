"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpBizEntityBud = void 0;
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const exps_1 = require("./exps");
class ExpBizEntityBud extends exps_1.ExpVal {
    constructor(bizFromEntity, bud) {
        super();
        this.bizFromEntity = bizFromEntity;
        this.bud = bud;
    }
    to(sb) {
        switch (this.bizFromEntity.bizPhraseType) {
            default:
                this.buildSelectBud(sb);
                break;
            case BizPhraseType_1.BizPhraseType.options:
                sb.append(this.bud.id);
                break;
        }
    }
    buildSelectBud(sb) {
        const { id, dataType } = this.bud;
        let budType = BizPhraseType_1.budTypes[dataType];
        if (budType === undefined) {
            debugger;
            throw new Error(`unknown bud type ${dataType}`);
        }
        sb.append('(SELECT value FROM ');
        sb.dbName().dot().fld(budType.sysTable);
        sb.append(` WHERE i=${this.bizFromEntity.alias}.id AND x=${id})`);
    }
}
exports.ExpBizEntityBud = ExpBizEntityBud;
//# sourceMappingURL=ExpBizEntityBud.js.map