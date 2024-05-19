import { PContext, PElement, PFromStatement, PFromStatementInPend } from "../../../parser";
import {
    BizEntity, BizTie,
} from "..";
import { EnumSysTable } from "../../EnumSysTable";
import { Builder } from "../../builder";
import { IElement } from "../../IElement";
import { CompareExpression, ValueExpression } from "../../Exp";
import { UI } from "../../UI";
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
import { BizPhraseType } from "../BizPhraseType";
import { Statement } from "../../statement";
import { BizField } from "../../BizField";
import { PendQuery } from "../../Biz/Pend";

export interface FromColumn {
    name: string;
    ui?: Partial<UI>;
    val: ValueExpression;
    field: BizField;
}

export interface BanColumn {
    caption?: string;
    val: CompareExpression;
}

export class FromEntity {
    bizEntityArr: BizEntity[] = [];
    bizPhraseType: BizPhraseType;
    bizEntityTable: EnumSysTable;
    subs: FromEntity[];
    ofIXs: BizTie[] = [];
    ofOn: ValueExpression;
    alias: string;
}

export class FromStatement extends Statement {
    get type(): string { return 'from'; }
    readonly fromEntity: FromEntity;
    asc: 'asc' | 'desc';
    ban: BanColumn;
    cols: FromColumn[] = [];
    where: CompareExpression;

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

    getBizEntityFromAlias(alias: string): BizEntity[] {
        return this.getBizEntityArrFromAlias(alias, this.fromEntity);
    }

    private getBizEntityArrFromAlias(alias: string, fromEntity: FromEntity) {
        if (alias === fromEntity.alias) return fromEntity.bizEntityArr;
        for (let sub of fromEntity.subs) {
            let ret = this.getBizEntityArrFromAlias(alias, sub);
            if (ret !== undefined) return ret;
        }
        return undefined;
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
