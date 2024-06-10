import { BizBud, BizFromEntity } from "../../../il";
import { BizPhraseType, budTypes } from "../../../il/Biz/BizPhraseType";
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
            default:
                this.buildSelectBud(sb);
                break;
            case BizPhraseType.combo:
                this.buildComboBud(sb);
                break;
            case BizPhraseType.options:
                sb.append(this.bud.id);
                break;
        }
    }

    private buildSelectBud(sb: SqlBuilder) {
        const { id, dataType } = this.bud;
        let budType = budTypes[dataType];
        if (budType === undefined) {
            debugger;
            throw new Error(`unknown bud type ${dataType}`);
        }
        sb.append('(SELECT value FROM ');
        sb.dbName().dot().fld(budType.sysTable);
        sb.append(` WHERE i=${this.bizFromEntity.alias}.id AND x=${id})`);
    }

    private buildComboBud(sb: SqlBuilder) {
        const { alias } = this.bizFromEntity;
        const { name } = this.bud;
        sb.name(alias).dot().name(name);
    }
}
