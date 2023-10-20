import { PContext, PElement, PPutStatement } from "../../parser";
import { Builder } from "../builder";
import { IElement } from "../element";
import { Statement } from "./statement";

export class PutStatement extends Statement {
    db(db: Builder): object {
        throw new Error("Method not implemented.");
    }
    parser(context: PContext): PElement<IElement> {
        return new PPutStatement(this, context);
    }
}
