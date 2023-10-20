import { PContext, PElement, PPutStatement } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../element";
import { ValueExpression } from "../expression";
import { Statement } from "./statement";

export class PutStatement extends Statement {
    putName: string;
    val: ValueExpression;

    db(db: Builder): object {
        return db.putStatement(this);
    }
    parser(context: PContext): PElement<IElement> {
        return new PPutStatement(this, context);
    }
}
