import { PContext, PElement, PFromStatement, PFromStatementInPend } from "../../parser";
import { BizBudValue, BizEntity, BizField, BizFieldBud, BizPhraseType, BizTie } from "../Biz";
import { EnumSysTable } from "../EnumSysTable";
import { Builder } from "../builder";
import { IElement } from "../element";
import { CompareExpression, ValueExpression } from "../Exp";
import { Statement } from "./statement";
import { UI } from "../UI";

export interface FromColumn {
    name: string;
    ui?: Partial<UI>;
    val: ValueExpression;
    // bud?: BizBudValue;
    // entity?: BizEntity;
    field: BizField;
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
    /*
    getBud(fieldName: string): [BizEntity, BizBudValue] {
        let bizEntity: BizEntity = undefined;
        let bud: BizBudValue = undefined;
        for (let entity of this.bizEntityArr) {
            let b = entity.getBud(fieldName) as BizBudValue;
            if (b !== undefined) {
                bizEntity = entity;
                bud = b;
            }
        }
        return [bizEntity, bud];
    }
    */
    getBizField(fieldName: string): BizField {
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
}

export class FromStatementInPend extends FromStatement {
    parser(context: PContext): PElement<IElement> {
        return new PFromStatementInPend(this, context);
    }
    db(db: Builder): object {
        return db.fromStatementInPend(this);
    }
}
