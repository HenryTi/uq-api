import { PContext, PValueStatement } from "../../parser";
import { Builder } from "../builder";
import { IX } from "../entity";
import { ValueExpression } from "../Exp";
import { Statement } from "./statement";
import { VarPointer } from "..";

export class ValueXi {
    IX: IX;
    xi: ValueExpression;
    varType: string;
    typePointer: VarPointer;
    varValue: string;
    valuePointer: VarPointer;
}

export class ValueStatement extends Statement {
    valueXi: ValueXi;
    get type(): string { return 'value'; }
    db(db: Builder): object {
        return db.value(this);
    }
    parser(context: PContext) { return new PValueStatement(this, context); }
}
