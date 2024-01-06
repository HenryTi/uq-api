import { BizBud, BizEntity, BizPhraseType } from "../../../il";
import { SqlBuilder } from "../sqlBuilder";
import { ExpVal } from "./exps";

export class ExpBizEntityBud extends ExpVal {
    readonly bizEntity: BizEntity;
    readonly bud: BizBud;
    constructor(bizEntity: BizEntity, bud: BizBud) {
        super();
        this.bizEntity = bizEntity;
        this.bud = bud;
    }

    to(sb: SqlBuilder) {
        switch (this.bizEntity.bizPhraseType) {
            case BizPhraseType.options:
                sb.append(this.bud.id);
                break;
        }
    }
}
