"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFieldSheetBin = exports.BBizFieldSheet = exports.BBizFieldBinVar = exports.BBizFieldJsonProp = exports.BBizFieldField = exports.MapFieldTable = exports.BBizFieldSheetBud = exports.BBizFieldBinBud = exports.BBizFieldBud = exports.BBizField = void 0;
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
        switch (bud.dataType) {
            default:
                this.buildSelectValue(sb, il_1.EnumSysTable.ixBudInt);
                return;
            case il_1.BudDataType.str:
            case il_1.BudDataType.char:
                this.buildSelectValue(sb, il_1.EnumSysTable.ixBudStr);
                return;
            case il_1.BudDataType.dec:
                this.buildSelectValue(sb, il_1.EnumSysTable.ixBudDec);
                return;
            case il_1.BudDataType.radio:
            case il_1.BudDataType.check:
                this.buildSelectMulti(sb);
                return;
        }
    }
    buildSelectValue(sb, tbl) {
        let { bud } = this.bizField;
        sb.l().append('select value from ').dbName().dot().append(tbl)
            .append(' where i=');
        this.toXValue(sb);
        sb.append(' and x=').append(bud.id)
            .r();
    }
    buildSelectMulti(sb) {
        let { bud } = this.bizField;
        sb.l().append('select JSON_ARRAYAGG(x1.ext) from ')
            .dbName().dot().append(il_1.EnumSysTable.ixBud).append(' AS x0 JOIN ')
            .dbName().dot().append(il_1.EnumSysTable.bud).append(' AS x1 ON x1.id=x0.x ')
            .append(' where x0.i=t1.id AND x1.base=').append(bud.id)
            .r();
    }
    toXValue(sb) {
        sb.append('t1.id');
    }
}
exports.BBizFieldBud = BBizFieldBud;
class BBizFieldBinBud extends BBizFieldBud {
    toXValue(sb) {
        sb.append('_').append(this.bizField.bizTable.defaultFieldName);
    }
}
exports.BBizFieldBinBud = BBizFieldBinBud;
class BBizFieldSheetBud extends BBizFieldBud {
    toXValue(sb) {
        sb.append('_ss');
    }
}
exports.BBizFieldSheetBud = BBizFieldSheetBud;
exports.MapFieldTable = {
    pend: 't1',
    bin: 'b',
    sheet: 'f',
    sheetBin: 'e',
    atom: 't1',
    baseAtom: 't1',
};
class BBizFieldField extends BBizField {
    to(sb) {
        let tbl = exports.MapFieldTable[this.bizField.tbl];
        sb.append(tbl).dot().append(this.bizField.name);
    }
}
exports.BBizFieldField = BBizFieldField;
// only for pend med
class BBizFieldJsonProp extends BBizField {
    to(sb) {
        let { bud } = this.bizField;
        let tblPend = exports.MapFieldTable['pend'];
        sb.append(`JSON_VALUE(${tblPend}.mid, '$."${bud.id}"')`);
    }
}
exports.BBizFieldJsonProp = BBizFieldJsonProp;
class BBizFieldBinVar extends BBizField {
    to(sb) {
        let { name } = this.bizField;
        sb.append(`_${name}`);
    }
}
exports.BBizFieldBinVar = BBizFieldBinVar;
class BBizFieldSheet extends BBizField {
    to(sb) {
        let { name } = this.bizField;
        sb.append(`_${name}`);
    }
}
exports.BBizFieldSheet = BBizFieldSheet;
class BBizFieldSheetBin extends BBizField {
    to(sb) {
        let { name, bizTable } = this.bizField;
        sb.append(`_${bizTable.defaultFieldName}${name}`);
    }
}
exports.BBizFieldSheetBin = BBizFieldSheetBin;
//# sourceMappingURL=BizField.js.map