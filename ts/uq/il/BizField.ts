/*
import {
    BBizField, DbContext
    , BBizFieldBud, BBizFieldField, BBizFieldJsonProp
} from "../builder";
import { BizBudValue } from "./Biz/Bud";
import { BizEntity } from "./Biz/Entity";
*/
// in FROM statement, columns use BizField
// and in Where, BizField is used.
export abstract class BizField {
    tbl: 'pend' | 'bin' | 'sheet' | 'sheetBin' | 'atom' | 'baseAtom';
    bud: any;// BizBudValue;
    entity: any; // BizEntity;
    abstract db(dbContext: any): any; // DbContext): BBizField;
}

export class BizFieldBud extends BizField {
    override db(dbContext: any): any {
        return undefined;
    }
    /*
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldBud(dbContext, this);
    }
    */
}

export class BizFieldField extends BizField {
    fieldName: string;
    override db(dbContext: any): any {
        return undefined;
    }
    /*
    override db(dbContext: DbContext): BBizField {
        let ret = new BBizFieldField(dbContext, this);
        return ret;
    }
    */
}

export class BizFieldJsonProp extends BizField {
    override db(dbContext: any): any {
        return undefined;
    }
    /*
    override db(dbContext: DbContext): BBizField {
        return new BBizFieldJsonProp(dbContext, this);
    }
    */
}
