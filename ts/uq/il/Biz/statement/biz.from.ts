import { PContext, PElement, PFromStatement, PFromStatementInPend } from "../../../parser";
import { BizBud } from "../Bud";
import { BizEntity, BizFromEntity } from "../Entity";
import { Builder } from "../../builder";
import { IElement } from "../../IElement";
import { CompareExpression, ValueExpression } from "../../Exp";
import { UI } from "../../UI";
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
import { Statement } from "../../statement";
import { PendQuery } from "../../Biz/Pend";

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


interface IntoTables {
    ret: string;
    atoms: string;
    specs: string;
    props: string;
}

export enum EnumAsc { asc = 1, desc = 0 }
export interface IdColumn {
    asc: EnumAsc;
    ui?: Partial<UI>;
    fromEntity: FromEntity;
}

export abstract class BizSelectStatement extends Statement {
    fromEntity: FromEntity;
    ids: IdColumn[];
    value: FromColumn;
    cols: FromColumn[] = [];
    where: CompareExpression;
}

export class FromStatement extends BizSelectStatement {
    get type(): string { return 'from'; }
    showIds: IdColumn[];
    groupByBase?: boolean;          // spec group by base atom
    ban: BanColumn;
    intoTables: IntoTables;

    db(db: Builder): object {
        return db.fromStatement(this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatement(this, context);
    }

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

    getIdFromEntity(idAlias: string): FromEntity {
        if (idAlias === undefined) {
            return this.fromEntity;
        }
        return this.getBizFromEntityFromAlias(idAlias);
    }
}

export class FromInPendStatement extends FromStatement {
    readonly pendQuery: PendQuery;
    constructor(parent: Statement, pendQuery: PendQuery) {
        super(parent);
        this.pendQuery = pendQuery;
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatementInPend(this, context);
    }
    db(db: Builder): object {
        return db.fromStatementInPend(this);
    }
}
