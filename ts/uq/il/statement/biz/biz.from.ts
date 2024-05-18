import { PContext, PElement, PFromStatement, PFromStatementInPend } from "../../../parser";
import {
    BizEntity, BizTie, PendQuery
} from "../../Biz";
import { EnumSysTable } from "../../EnumSysTable";
import { Builder } from "../../builder";
import { IElement } from "../../IElement";
import { CompareExpression, ValueExpression } from "../../Exp";
import { Statement } from "../Statement";
import { UI } from "../../UI";
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
import { BizPhraseType } from "../../Biz/BizPhraseType";
import { BizField } from "../../BizField";

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
    /*
    bizEntityArr: BizEntity[] = [];
    bizPhraseType: BizPhraseType;
    bizEntityTable: EnumSysTable;
    ofIXs: BizTie[] = [];
    ofOn: ValueExpression;
    */
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
