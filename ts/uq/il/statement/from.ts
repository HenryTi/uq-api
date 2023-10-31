import { PContext, PElement, PFromStatement, PPutStatement } from "../../parser";
import { BizBud, BizBudValue, BizEntity, BizPhraseType } from "../Biz";
import { EnumSysTable } from "../EnumSysTable";
import { Builder } from "../builder";
import { IElement } from "../element";
import { CompareExpression, ValueExpression } from "../Exp";
import { Statement } from "./statement";

export interface FromColumn {
    name: string;
    caption?: string;
    val: ValueExpression;
    bud?: BizBudValue;
    entity?: BizEntity;
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
    asc: 'asc' | 'desc';
    ban: BanColumn;
    cols: FromColumn[] = [];
    putName: string;
    where: CompareExpression;

    db(db: Builder): object {
        return db.fromStatement(this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatement(this, context);
    }

    getBud(fieldName: string): [BizEntity, BizBudValue] {
        let bizEntity: BizEntity = undefined;
        let bud: BizBudValue = undefined;
        for (let entity of this.bizEntityArr) {
            let b = entity.getBud(fieldName) as BizBudValue;
            if (b !== undefined) {
                bud = b;
            }
        }
        return [bizEntity, bud];
    }
}
