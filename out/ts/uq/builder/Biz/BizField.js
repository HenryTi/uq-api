"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFieldBinBud = exports.BBizFieldBinVar = exports.BBizFieldJsonProp = exports.BBizFieldField = exports.MapFieldTable = exports.BBizFieldBud = exports.BBizField = void 0;
const il_1 = require("../../il");
const sql_1 = require("../sql");
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
        this.toIValue(sb);
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
    toIValue(sb) {
        let { tableAlias } = this.bizField;
        sb.append(tableAlias).dot().append('id');
    }
    buildColArr() {
        let ret = [];
        const { entity, bud } = this.bizField;
        if (entity !== undefined) {
            ret.push(new sql_1.ExpNum(entity.id));
        }
        ret.push(new sql_1.ExpNum(bud.id));
        return ret;
    }
}
exports.BBizFieldBud = BBizFieldBud;
exports.MapFieldTable = {
    pend: 't1',
    bin: 'b',
    sheet: 'f',
    sheetBin: 'e',
    s: 'e',
    atom: 't1',
    baseAtom: 't1',
};
class BBizFieldField extends BBizField {
    to(sb) {
        sb.append(this.bizField.tableAlias).dot().append(this.bizField.name);
    }
    buildColArr() {
        return [new sql_1.ExpStr(this.bizField.name)];
    }
}
exports.BBizFieldField = BBizFieldField;
// only for pend med
class BBizFieldJsonProp extends BBizFieldBud {
    to(sb) {
        let { bud } = this.bizField;
        let tblPend = exports.MapFieldTable['pend'];
        sb.append(`JSON_VALUE(${tblPend}.mid, '$."${bud.id}"')`);
    }
}
exports.BBizFieldJsonProp = BBizFieldJsonProp;
class BBizFieldBinVar extends BBizFieldField {
    to(sb) {
        let { name, tableAlias } = this.bizField;
        sb.append(`_${tableAlias}${name}`);
    }
}
exports.BBizFieldBinVar = BBizFieldBinVar;
class BBizFieldBinBud extends BBizFieldBud {
    toIValue(sb) {
        sb.append('_').append(this.bizField.tableAlias);
    }
}
exports.BBizFieldBinBud = BBizFieldBinBud;
/*
export class BBizFieldSheetVar extends BBizFieldField {
    override to(sb: SqlBuilder): void {
        let { tableAlias } = this.bizField;
        sb.append(`_${tableAlias}`);
    }
}

export class BBizFieldSheetBud extends BBizFieldBud {
    override to(sb: SqlBuilder): void {
        super.to(sb);
    }
}
*/ 
//# sourceMappingURL=BizField.js.map