import { BizBud } from "../Bud";
import { BizEntity, BizFromEntity } from "../Entity";
import { CompareExpression, ValueExpression } from "../../Exp";
import { UI } from "../../UI";
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
import { Statement } from "../../statement";

export interface FromColumn {
    name: string;
    ui?: Partial<UI>;
    val: ValueExpression;
    bud: BizBud;
}

export interface BanColumn {
    caption?: string;
    val: CompareExpression;
}

export class FromEntity<E extends BizEntity = BizEntity> extends BizFromEntity<E> {
}

export enum EnumAsc { asc = 1, desc = 0 }
export interface IdColumn {
    asc: EnumAsc;
    ui?: Partial<UI>;
    fromEntity: FromEntity;
}

export abstract class BizSelectStatement extends Statement {
    fromEntity: FromEntity;
    where: CompareExpression;

    getBizFromEntityFromAlias(alias: string): FromEntity {
        return this.getBizFromEntityArrFromAlias(alias, this.fromEntity);
    }

    private getBizFromEntityArrFromAlias(alias: string, fromEntity: FromEntity) {
        if (alias === fromEntity.alias) return fromEntity;
        const { subs } = fromEntity;
        if (subs === undefined) return undefined;
        for (let sub of subs) {
            let ret = this.getBizFromEntityArrFromAlias(alias, sub.fromEntity);
            if (ret !== undefined) return ret;
        }
        return undefined;
    }
}
