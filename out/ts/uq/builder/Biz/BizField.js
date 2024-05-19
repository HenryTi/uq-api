"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFieldUser = exports.BBizFieldBinBud = exports.BBizFieldBinVar = exports.BBizFieldJsonProp = exports.BBizFieldField = exports.MapFieldTable = exports.BBizFieldBud = exports.BBizField = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
class BBizField {
    constructor(dbContext, bizField) {
        this.dbContext = dbContext;
        this.bizField = bizField;
    }
}
exports.BBizField = BBizField;
class BBizFieldBud extends BBizField {
    to(sb) {
        let { bud, tableAlias } = this.bizField;
        if (sb.forClient === true) {
            sb.append('%').append(tableAlias).dot().append(bud.name);
            return;
        }
        switch (bud.dataType) {
            default:
                this.buildSelectValue(sb, il_1.EnumSysTable.ixBudInt);
                return;
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                this.buildSelectValue(sb, il_1.EnumSysTable.ixBudStr);
                return;
            case BizPhraseType_1.BudDataType.dec:
                this.buildSelectValue(sb, il_1.EnumSysTable.ixBudDec);
                return;
            // case BudDataType.radio: radio 按int处理
            case BizPhraseType_1.BudDataType.check:
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
        const x0 = 'x0', x1 = 'x1';
        sb.l().append('SELECT ');
        if (this.noArrayAgg === true) {
            sb.append(`${x1}.ext as id`);
        }
        else {
            sb.append(`JSON_ARRAYAGG(${x1}.ext)`);
        }
        ;
        sb.append(' FROM ').dbName().dot().append(il_1.EnumSysTable.ixBud).append(` AS ${x0} JOIN `)
            .dbName().dot().append(il_1.EnumSysTable.bud).append(` AS ${x1} ON ${x1}.id=${x0}.x `)
            .append(` where ${x0}.i=`);
        this.toIValue(sb);
        sb.append(` AND ${x1}.base=`).append(bud.id)
            .r();
    }
    toIValue(sb) {
        let { tableAlias } = this.bizField;
        sb.append(tableAlias).dot().append('id');
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
        if (sb.forClient === true) {
            if (tableAlias === 's') {
                sb.append('%sheet').dot().append(name);
                return;
            }
            sb.append(`_${tableAlias}${name}`);
            return;
        }
        sb.append(`_${tableAlias}${name}`);
    }
}
exports.BBizFieldBinVar = BBizFieldBinVar;
class BBizFieldBinBud extends BBizFieldBud {
    toIValue(sb) {
        let { tableAlias, div } = this.bizField;
        sb.append('_').append(tableAlias + div.level);
    }
}
exports.BBizFieldBinBud = BBizFieldBinBud;
class BBizFieldUser extends BBizField {
    to(sb) {
        sb.append('%user').dot().append(this.bizField.tableAlias);
    }
}
exports.BBizFieldUser = BBizFieldUser;
//# sourceMappingURL=BizField.js.map