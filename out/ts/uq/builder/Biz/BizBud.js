"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizBud = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
class BBizBud {
    constructor(context, bud) {
        this.ixTable = il_1.EnumSysTable.ixInt;
        this.context = context;
        this.bud = bud;
    }
    static createBBizBud(context, bud) {
        switch (bud.dataType) {
            default:
                return new BBizBudInt(context, bud);
            case BizPhraseType_1.BudDataType.int:
                return new BBizBudInt(context, bud);
            case BizPhraseType_1.BudDataType.date:
                return new BBizBudDate(context, bud);
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                return new BBizBudChar(context, bud);
            case BizPhraseType_1.BudDataType.dec:
                return new BBizBudDec(context, bud);
            case BizPhraseType_1.BudDataType.fork:
                return new BBizBudFork(context, bud);
        }
    }
    get expJsonValue() {
        const a = 'a';
        const { factory } = this.context;
        let colValue = new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpField('value', a), new sql_1.ExpDatePart('JSON'));
        return colValue;
    }
    buildInsertBudPhraseValue(tbl, expPhrase, expAtomId) {
        const insert = this.context.factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTableWithSchema(tbl);
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        insert.select = this.buildBudSelectWithoutIdCol(expPhrase, expAtomId);
    }
    buildBudSelectWithoutIdCol(expPhrase, expAtomId) {
        const { factory } = this.context;
        let select = factory.createSelect();
        select.lock = select_1.LockType.none;
        const a = 'a';
        const { id } = this.bud;
        select.from(new statementWithFrom_1.EntityTable(this.ixTable, false, a));
        select.column(expPhrase, 'phrase');
        select.column(this.expJsonValue, 'value');
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i', a), expAtomId), new sql_1.ExpEQ(new sql_1.ExpField('x', a), new sql_1.ExpNum(id))));
        return select;
    }
    buildInsertBudPhraseValueId(tbl, expPhrase, expAtomId) {
        const insert = this.context.factory.createInsert();
        insert.ignore = true;
        insert.table = new statementWithFrom_1.VarTableWithSchema(tbl);
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
            { col: 'id', val: undefined },
        ];
        insert.select = this.buildBudSelectWithIdCol(expPhrase, expAtomId);
    }
    buildBudSelectWithIdCol(expPhrase, expAtomId) {
        let select = this.buildBudSelectWithoutIdCol(expPhrase, expAtomId);
        select.column(expAtomId, 'id');
        return select;
    }
}
exports.BBizBud = BBizBud;
class BBizBudInt extends BBizBud {
    constructor() {
        super(...arguments);
        this.ixTable = il_1.EnumSysTable.ixInt;
    }
}
class BBizBudDate extends BBizBud {
    constructor() {
        super(...arguments);
        this.ixTable = il_1.EnumSysTable.ixInt;
    }
}
class BBizBudChar extends BBizBud {
    constructor() {
        super(...arguments);
        this.ixTable = il_1.EnumSysTable.ixStr;
    }
    get expJsonValue() {
        const a = 'a';
        let colValue = new sql_1.ExpFunc('JSON_QUOTE', new sql_1.ExpField('value', a));
        return colValue;
    }
}
class BBizBudDec extends BBizBud {
    constructor() {
        super(...arguments);
        this.ixTable = il_1.EnumSysTable.ixDec;
    }
}
class BBizBudFork extends BBizBud {
    constructor() {
        super(...arguments);
        this.ixTable = il_1.EnumSysTable.ixJson;
    }
}
//# sourceMappingURL=BizBud.js.map