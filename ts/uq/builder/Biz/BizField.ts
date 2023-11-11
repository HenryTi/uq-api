import { BizField, BizFieldBud, BizFieldField, BizFieldJsonProp } from "../../il";
import { DbContext } from "../dbContext";
import { SqlBuilder } from "../sql";

export abstract class BBizField<T extends BizField = BizField> {
    protected readonly dbContext: DbContext;
    protected readonly bizField: T;
    constructor(dbContext: DbContext, bizField: T) {
        this.dbContext = dbContext;
        this.bizField = bizField;
    }
    abstract to(sb: SqlBuilder): void;
}

export class BBizFieldBud extends BBizField<BizFieldBud> {
    override to(sb: SqlBuilder): void {

    }
}

export class BBizFieldField extends BBizField<BizFieldField> {
    override to(sb: SqlBuilder): void {

    }
}

export class BBizFieldJsonProp extends BBizField<BizFieldJsonProp> {
    override to(sb: SqlBuilder): void {

    }
}
