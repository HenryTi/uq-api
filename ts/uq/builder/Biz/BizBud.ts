import { BizBud, BizBudChar, BizBudDate, BizBudDec, BizBudFork, BizBudInt, EnumSysTable } from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { DbContext } from "../dbContext";
import { ExpAnd, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpNum, ExpVal, ExpVar, Select } from "../sql";
import { LockType } from "../sql/select";
import { EntityTable, VarTableWithSchema } from "../sql/statementWithFrom";

export abstract class BBizBud<T extends BizBud> {
    protected readonly context: DbContext
    protected readonly bud: T;
    constructor(context: DbContext, bud: BizBud) {
        this.context = context;
        this.bud = bud as T;
    }
    ixTable: EnumSysTable = EnumSysTable.ixInt;

    static createBBizBud(context: DbContext, bud: BizBud): BBizBud<any> {
        switch (bud.dataType) {
            default:
                return new BBizBudInt(context, bud);
            case BudDataType.int:
                return new BBizBudInt(context, bud);
            case BudDataType.date:
                return new BBizBudDate(context, bud);
            case BudDataType.str:
            case BudDataType.char:
                return new BBizBudChar(context, bud);
            case BudDataType.dec:
                return new BBizBudDec(context, bud);
            case BudDataType.fork:
                return new BBizBudFork(context, bud);
        }
    }

    get expJsonValue() {
        const a = 'a';
        const { factory } = this.context;
        let colValue: ExpVal = new ExpFuncCustom(factory.func_cast, new ExpField('value', a), new ExpDatePart('JSON'));
        return colValue;
    }

    buildInsertBudPhraseValue(tbl: string, expPhrase: ExpVal, expAtomId: ExpVal) {
        const insert = this.context.factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTableWithSchema(tbl);
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        insert.select = this.buildBudSelectWithoutIdCol(expPhrase, expAtomId);
    }

    buildBudSelectWithoutIdCol(expPhrase: ExpVal, expAtomId: ExpVal) {
        const { factory } = this.context;
        let select = factory.createSelect();
        select.lock = LockType.none;
        const a = 'a';
        const { id } = this.bud;
        select.from(new EntityTable(this.ixTable, false, a));
        select.column(expPhrase, 'phrase');
        select.column(this.expJsonValue, 'value');
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('i', a), expAtomId),
            new ExpEQ(new ExpField('x', a), new ExpNum(id)),
        ));
        return select;
    }

    buildInsertBudPhraseValueId(tbl: string, expPhrase: ExpVal, expAtomId: ExpVal) {
        const insert = this.context.factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTableWithSchema(tbl);
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
            { col: 'id', val: undefined },
        ];
        insert.select = this.buildBudSelectWithIdCol(expPhrase, expAtomId);
    }

    buildBudSelectWithIdCol(expPhrase: ExpVal, expAtomId: ExpVal) {
        let select = this.buildBudSelectWithoutIdCol(expPhrase, expAtomId);
        select.column(expAtomId, 'id');
        return select;
    }
}

class BBizBudInt extends BBizBud<BizBudInt> {
    ixTable = EnumSysTable.ixInt;
}

class BBizBudDate extends BBizBud<BizBudDate> {
    ixTable = EnumSysTable.ixInt;
}

class BBizBudChar extends BBizBud<BizBudChar> {
    ixTable = EnumSysTable.ixStr;

    get expJsonValue() {
        const a = 'a';
        let colValue: ExpVal = new ExpFunc('JSON_QUOTE', new ExpField('value', a));
        return colValue;
    }
}

class BBizBudDec extends BBizBud<BizBudDec> {
    ixTable = EnumSysTable.ixDec;
}

class BBizBudFork extends BBizBud<BizBudFork> {
    ixTable = EnumSysTable.ixJson;
}
