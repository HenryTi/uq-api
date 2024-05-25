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
    // field: BizField;
    bud: BizBud;
}

export interface BanColumn {
    caption?: string;
    val: CompareExpression;
}

export class FromEntity<E extends BizEntity = BizEntity> extends BizFromEntity<E> {
}

export class FromStatement extends Statement {
    get type(): string { return 'from'; }
    readonly fromEntity: FromEntity;
    asc: 'asc' | 'desc';
    ban: BanColumn;
    cols: FromColumn[] = [];
    where: CompareExpression;
    idFromEntity: FromEntity;
    intoTbl: string;

    constructor(parent: Statement) {
        super(parent);
        this.fromEntity = new FromEntity();
    }

    db(db: Builder): object {
        return db.fromStatement(this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatement(this, context);
    }

    getBizEntityFromAlias(alias: string): FromEntity {
        return this.getBizEntityArrFromAlias(alias, this.fromEntity);
    }

    private getBizEntityArrFromAlias(alias: string, fromEntity: FromEntity) {
        if (alias === fromEntity.alias) return fromEntity;
        const { subs } = fromEntity;
        if (subs === undefined) return undefined;
        for (let sub of subs) {
            let ret = this.getBizEntityArrFromAlias(alias, sub.fromEntity);
            if (ret !== undefined) return ret;
        }
        return undefined;
    }

    setIdFromEntity(idAlias: string): boolean {
        if (idAlias === undefined) {
            this.idFromEntity = this.fromEntity;
            return true;
        }
        else {
            this.idFromEntity = this.getBizEntityFromAlias(idAlias);
            return this.idFromEntity !== undefined;
        }
    }
}

export class FromStatementInPend extends FromStatement {
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
