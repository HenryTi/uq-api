import { PContext, PElement, PFromStatement, PFromStatementInPend } from "../../parser";
import {
    BizBudValue, BizEntity
    , BizTie, PendQuery
} from "../Biz";
import { EnumSysTable } from "../EnumSysTable";
import { Builder } from "../builder";
import { IElement } from "../IElement";
import { CompareExpression, ValueExpression } from "../Exp";
import { Statement } from "./Statement";
import { UI } from "../UI";
// 下面这句，改成 from "../Biz"; 会出错 Class extends value undefined is not a constructor or null
import { BizPhraseType } from "../Biz/BizPhraseType";
import { BizField, BizFieldBud, BizFieldField, BizFieldJsonProp } from "../BizField";

export interface FromColumn {
    name: string;
    ui?: Partial<UI>;
    val: ValueExpression;
    field: any; // BizField;
}

export interface BanColumn {
    caption?: string;
    val: CompareExpression;
}

export class FromStatement extends Statement {
    get type(): string { return 'from'; }
    bizEntityArr: BizEntity[] = [];
    bizPhraseType: BizPhraseType;
    bizEntityTable: EnumSysTable;
    ofIXs: BizTie[] = [];
    ofOn: ValueExpression;
    asc: 'asc' | 'desc';
    ban: BanColumn;
    cols: FromColumn[] = [];
    where: CompareExpression;

    db(db: Builder): object {
        return db.fromStatement(this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatement(this, context);
    }

    getBizField(fieldName: string): BizField {
        switch (fieldName) {
            default:
                return this.getBudField(fieldName);
            case 'no':
            case 'ex':
                return this.getNoExField(fieldName);
        }
    }

    private getBudField(fieldName: string): BizField {
        let bizEntity: BizEntity = undefined;
        let bud: BizBudValue = undefined;
        for (let entity of this.bizEntityArr) {
            let b = entity.getBud(fieldName) as BizBudValue;
            if (b !== undefined) {
                bizEntity = entity;
                bud = b;
            }
        }
        if (bud === undefined) return undefined;
        let ret = new BizFieldBud();
        ret.entity = bizEntity;
        ret.bud = bud;
        return ret;
    }

    private getNoExField(fieldName: string): BizField {
        if (this.bizPhraseType === BizPhraseType.atom) {
            let ret = new BizFieldField();
            ret.tbl = 'atom';
            ret.fieldName = fieldName;
            return ret;
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
    override getBizField(fieldName: string): BizField {
        switch (fieldName) {
            default: return this.getBizPendMidField(fieldName);
            case 'no': return this.getBizPendSheetField(fieldName);
            case 'si':
            case 'sx':
            case 'svalue':
            case 'samount':
            case 'sprice':
            case 'i':
            case 'x':
            case 'value':
            case 'amount':
            case 'price': return this.getBizPendBinField(fieldName);
        }
    }
    private getBizPendMidField(fieldName: string): BizField {
        let { bizPend } = this.pendQuery;
        let bud = bizPend.getBud(fieldName) as BizBudValue;
        if (bud === undefined) return;
        let ret = new BizFieldJsonProp();
        ret.tbl = 'pend';
        ret.bud = bud;
        ret.entity = bizPend;
        return ret;
    }

    private getBizPendBinField(fieldName: string): BizField {
        let ret = new BizFieldField();
        ret.tbl = 'pend';
        ret.fieldName = fieldName;
        return ret;
    }

    private getBizPendSheetField(fieldName: string): BizField {
        let ret = new BizFieldField();
        ret.tbl = 'sheet';
        ret.fieldName = fieldName;
        return ret;
    }
}
