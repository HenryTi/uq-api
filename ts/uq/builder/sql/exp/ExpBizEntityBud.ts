import { BizBud, BizFromEntity } from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { SqlBuilder } from "../sqlBuilder";
import { ExpVal } from "./exps";

export class ExpBizEntityBud extends ExpVal {
    readonly bizFromEntity: BizFromEntity;
    readonly bud: BizBud;
    constructor(bizFromEntity: BizFromEntity, bud: BizBud) {
        super();
        this.bizFromEntity = bizFromEntity;
        this.bud = bud;
    }

    to(sb: SqlBuilder) {
        switch (this.bizFromEntity.bizPhraseType) {
            case BizPhraseType.options:
                sb.append(this.bud.id);
                break;
        }
    }
}
