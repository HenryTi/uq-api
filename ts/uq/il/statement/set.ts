import { PContext, PSetStatement } from "../../parser";
import { Builder } from "../builder";
import { Select } from "../select";
import { Statement } from "./statement";

export class SetStatement extends Statement {
    out: boolean;
    select: Select;
    get type(): string { return 'set'; }
    db(db: Builder): object { return db.setStatement(this); }
    parser(context: PContext) { return new PSetStatement(this, context); }
}
