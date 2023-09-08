import { BizBase } from "../../il";
import { DbContext } from "../dbContext";

export class BBizBase<B extends BizBase> {
    protected readonly context: DbContext;
    protected readonly base: B;

    constructor(context: DbContext, base: B) {
        this.context = context;
        this.base = base;
    }
    buildTables() {
    }
    buildProcedures() {
    }
}
