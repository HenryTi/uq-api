import { PContext, PElement, PFromStatement, PPutStatement } from "../../parser";
import { BizEntity } from "../Biz";
import { Builder } from "../builder";
import { IElement } from "../element";
import { CompareExpression, ValueExpression } from "../expression";
import { Statement } from "./statement";

export interface FromColumn {
    name: string;
    val: ValueExpression;
}

export class FromStatement extends Statement {
    get type(): string { return 'from'; }
    tbls: BizEntity[] = [];
    asc: 'asc' | 'desc';
    cols: FromColumn[] = [];
    putName: string;
    where: CompareExpression;

    db(db: Builder): object {
        return db.fromStatement(this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PFromStatement(this, context);
    }
}
