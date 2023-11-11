import { BBizField, BBizFieldBud, BBizFieldField, BBizFieldJsonProp, DbContext } from "../../builder";
import { BizBudValue } from "./Bud";
import { BizEntity } from "./Entity";

// in FROM statement, columns use BizField
// and in Where, BizField is used.
export abstract class BizField {
    bud: BizBudValue;
    entity: BizEntity;
    abstract db(dbContext: DbContext): BBizField;
}

export class BizFieldBud extends BizField {
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldBud(dbContext, this);
    }
}

export class BizFieldField extends BizField {
    fieldName: string;
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldField(dbContext, this);
    }
}

export class BizFieldJsonProp extends BizField {
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldJsonProp(dbContext, this);
    }
}
