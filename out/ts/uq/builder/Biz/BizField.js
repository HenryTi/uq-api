"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFieldJsonProp = exports.BBizFieldField = exports.MapFieldTable = exports.BBizFieldBud = exports.BBizField = void 0;
const il_1 = require("../../il");
class BBizField {
    constructor(dbContext, bizField) {
        this.dbContext = dbContext;
        this.bizField = bizField;
    }
}
exports.BBizField = BBizField;
class BBizFieldBud extends BBizField {
    to(sb) {
        let { bud } = this.bizField;
        function buildSelectValue(tbl) {
            sb.l().append('select value from ').dbName().dot().append(tbl)
                .append(' where i=t1.id and x=').append(bud.id)
                .r();
        }
        function buildSelectMulti() {
            sb.l().append('select JSON_ARRAYAGG(x1.ext) from ')
                .dbName().dot().append(il_1.EnumSysTable.ixBud).append(' AS x0 JOIN ')
                .dbName().dot().append(il_1.EnumSysTable.bud).append(' AS x1 ON x1.id=x0.x ')
                .append(' where x0.i=t1.id AND x1.base=').append(bud.id)
                .r();
        }
        switch (bud.dataType) {
            default:
                buildSelectValue(il_1.EnumSysTable.ixBudInt);
                return;
            case il_1.BudDataType.str:
            case il_1.BudDataType.char:
                buildSelectValue(il_1.EnumSysTable.ixBudStr);
                return;
            case il_1.BudDataType.dec:
                buildSelectValue(il_1.EnumSysTable.ixBudDec);
                return;
            case il_1.BudDataType.radio:
            case il_1.BudDataType.check:
                buildSelectMulti();
                return;
        }
    }
}
exports.BBizFieldBud = BBizFieldBud;
exports.MapFieldTable = {
    pend: 't1',
    bin: 'b',
    sheet: 'c',
    sheetBin: 'd',
    atom: 't1',
    baseAtom: 't1',
};
class BBizFieldField extends BBizField {
    to(sb) {
        let tbl = exports.MapFieldTable[this.tbl];
        sb.append(tbl).dot().append(this.bizField.fieldName);
    }
}
exports.BBizFieldField = BBizFieldField;
// only for pend med
class BBizFieldJsonProp extends BBizField {
    to(sb) {
        let { bud } = this.bizField;
        let tblPend = exports.MapFieldTable['pend'];
        sb.l().append(`JSON_VALUE(${tblPend}.med, '$."${bud.id}"')`).r();
    }
}
exports.BBizFieldJsonProp = BBizFieldJsonProp;
//# sourceMappingURL=BizField.js.map