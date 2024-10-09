"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizFieldOptionsItem = exports.BBizFieldUser = exports.BBizFieldPendSheet = exports.BBizFieldPendBin = exports.BBizFieldBinBinBudSelect = exports.BBizFieldPendBinBudSelect = exports.BBizFieldPendBudSelect = exports.BBizFieldBinBudSelect = exports.BBizFieldBinBud = exports.BBizFieldBinVar = exports.BBizFieldJsonProp = exports.BBizFieldField = exports.MapFieldTable = exports.BBizFieldBud = exports.BBizForkBaseField = exports.BBizField = void 0;
const il_1 = require("../../il");
const BizPhraseType_1 = require("../../il/Biz/BizPhraseType");
class BBizField {
    constructor(dbContext, bizField) {
        this.dbContext = dbContext;
        this.bizField = bizField;
    }
    ixTableFromBud(bud) {
        let tbl;
        switch (bud.dataType) {
            default:
                tbl = il_1.EnumSysTable.ixBudInt;
                break;
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                tbl = il_1.EnumSysTable.ixBudStr;
                break;
            case BizPhraseType_1.BudDataType.dec:
                tbl = il_1.EnumSysTable.ixBudDec;
                break;
            case BizPhraseType_1.BudDataType.check:
                tbl = il_1.EnumSysTable.ixBudCheck;
                break;
            case BizPhraseType_1.BudDataType.fork:
                tbl = il_1.EnumSysTable.ixBudJson;
                break;
        }
        return tbl;
    }
    buildPendBud(sb, bud) {
        if (sb.forClient === true) {
            sb.append('%pend').dot().append(bud.name);
            return;
        }
        sb.l();
        function jsonValue() {
            sb.append(`JSON_VALUE(t0.`).fld('mid').append(`, '$."${bud.id}"')`);
        }
        function cast(funcType) {
            sb.append('CAST(');
            jsonValue();
            sb.append(' as ');
            funcType();
            sb.append(')');
        }
        sb.append('SELECT ');
        switch (bud.dataType) {
            default:
                break;
            case BizPhraseType_1.BudDataType.fork:
                cast(() => sb.append('JSON'));
                break;
            case BizPhraseType_1.BudDataType.dec:
                cast(() => il_1.bizDecType.sql(sb));
                break;
            case BizPhraseType_1.BudDataType.int:
            case BizPhraseType_1.BudDataType.atom:
            case BizPhraseType_1.BudDataType.radio:
            case BizPhraseType_1.BudDataType.bin:
            case BizPhraseType_1.BudDataType.ID:
            case BizPhraseType_1.BudDataType.date:
            case BizPhraseType_1.BudDataType.datetime:
                cast(() => sb.append('UNSIGNED'));
                break;
        }
        sb.append(' as value FROM ').dbName().dot().name(il_1.EnumSysTable.pend)
            .append(' AS t0');
        sb.append(' WHERE t0.id=').var('$pend');
        sb.r();
    }
}
exports.BBizField = BBizField;
class BBizForkBaseField extends BBizField {
    to(sb) {
        if (sb.forClient === true) {
            sb.append('%base');
            return;
        }
    }
}
exports.BBizForkBaseField = BBizForkBaseField;
class BBizFieldBud extends BBizField {
    to(sb) {
        let { bud, tableAlias } = this.bizField;
        if (sb.forClient === true) {
            sb.append('%').append(tableAlias).dot().append(bud.name);
            return;
        }
        let tbl;
        switch (bud.dataType) {
            default:
                tbl = il_1.EnumSysTable.ixBudInt;
                break;
            case BizPhraseType_1.BudDataType.str:
            case BizPhraseType_1.BudDataType.char:
                tbl = il_1.EnumSysTable.ixBudStr;
                break;
            case BizPhraseType_1.BudDataType.dec:
                tbl = il_1.EnumSysTable.ixBudDec;
                break;
            case BizPhraseType_1.BudDataType.fork:
                tbl = il_1.EnumSysTable.ixBudJson;
                break;
            case BizPhraseType_1.BudDataType.check:
                this.buildSelectMulti(sb);
                return;
        }
        this.buildSelectValue(sb, tbl);
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
            sb.append(`JSON_ARRAYAGG(${x0}.x)`);
        }
        ;
        sb.append(' FROM ').dbName().dot().append(il_1.EnumSysTable.ixBudCheck).append(` AS ${x0}`)
            .append(` where ${x0}.ii=`);
        this.toIValue(sb);
        sb.append(` AND ${x0}.i=`).append(bud.id)
            .append(` GROUP BY ${x0}.i`).r();
    }
    toIValue(sb) {
        let { tableAlias } = this.bizField;
        sb.append(tableAlias).dot().append('id');
    }
}
exports.BBizFieldBud = BBizFieldBud;
exports.MapFieldTable = {
    pend: '$t1',
    bin: 'b',
    sheet: 'f',
    sheetBin: 'e',
    s: 'e',
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
    to(sb) {
        let { bud, tableAlias } = this.bizField;
        if (sb.forClient === true) {
            sb.append('%').append(tableAlias).dot().append(bud.name);
            return;
        }
        let budName = bud.name;
        if (tableAlias === 'sheet')
            budName = '$s' + budName;
        sb.var(budName);
    }
}
exports.BBizFieldBinBud = BBizFieldBinBud;
class BBizFieldBinBudSelect extends BBizField {
    buildBudArr(sb, budArr) {
        const { length } = budArr;
        for (let t = 0; t < length; t++) {
            let th = t + 1;
            let bud = budArr[t];
            let tbl;
            if (t < length - 1) {
                tbl = il_1.EnumSysTable.ixBudInt;
            }
            else {
                tbl = this.ixTableFromBud(bud);
            }
            sb.append(' JOIN ').dbName().dot().name(tbl)
                .append(' AS t').append(th)
                .append(` ON t${th}.i=t${t}.`).fld('value').append(` AND t${th}.x=${bud.id}`);
        }
    }
}
exports.BBizFieldBinBudSelect = BBizFieldBinBudSelect;
class BBizFieldPendBudSelect extends BBizFieldBinBudSelect {
    to(sb) {
        let { pend, bud } = this.bizField;
        this.buildPendBud(sb, bud);
        /*
        let tbl = this.ixTableFromBud(bud);
        sb.l();
        sb.append(`SELECT t0.`).fld('value').append(` FROM `).dbName().dot().name(tbl)
            .append(' AS t0');
        sb.append(' WHERE t0.i=').var('$pend').append(' AND t0.x=').append(bud.id);
        sb.r();
        sb.append('/*BBizFieldPendBudSelect* /');
        */
    }
}
exports.BBizFieldPendBudSelect = BBizFieldPendBudSelect;
class BBizFieldPendBinBudSelect extends BBizFieldBinBudSelect {
    to(sb) {
        let { bud, budArr } = this.bizField;
        sb.l();
        const { length } = budArr;
        sb.append(`SELECT t${length}.`).fld('value').append(` FROM `); // .dbName().dot().name(EnumSysTable.ixBudInt)
        this.buildPendBud(sb, bud);
        sb.append(' AS t0');
        this.buildBudArr(sb, budArr);
        // sb.append(' WHERE t0.i=').var('$pend').append(' AND t0.x=').append(bud.id);
        sb.r();
        // sb.append('/*BBizFieldPendBinBudSelect*/');
    }
}
exports.BBizFieldPendBinBudSelect = BBizFieldPendBinBudSelect;
class BBizFieldBinBinBudSelect extends BBizFieldBinBudSelect {
    to(sb) {
        let { bud, budArr } = this.bizField;
        sb.l();
        const { length } = budArr;
        sb.append(`SELECT t${length}.`).fld('value').append(` FROM `).dbName().dot().name(il_1.EnumSysTable.ixBudInt)
            .append(' AS t0');
        this.buildBudArr(sb, budArr);
        sb.append(' WHERE t0.i=').var(bud.name).append(' AND t0.x=').append(bud.id);
        sb.r();
    }
}
exports.BBizFieldBinBinBudSelect = BBizFieldBinBinBudSelect;
class BBizFieldPendBin extends BBizField {
    to(sb) {
        sb.l().append(`SELECT bin FROM `).dbName().dot().name(il_1.EnumSysTable.pend)
            .append(' WHERE id=').var('$pend').r();
    }
}
exports.BBizFieldPendBin = BBizFieldPendBin;
class BBizFieldPendSheet extends BBizField {
    to(sb) {
        sb.l().append(`SELECT c.base FROM `).dbName().dot().name(il_1.EnumSysTable.pend)
            .append(' AS a JOIN ').dbName().dot().name(il_1.EnumSysTable.bizDetail)
            .append(' AS b ON b.id=a.bin')
            .append(' JOIN ').dbName().dot().name(il_1.EnumSysTable.bud)
            .append(' AS c ON c.id=b.base')
            .append(' WHERE a.id=').var('$pend').r();
    }
}
exports.BBizFieldPendSheet = BBizFieldPendSheet;
class BBizFieldUser extends BBizField {
    to(sb) {
        sb.append('%user').dot().append(this.bizField.tableAlias);
    }
}
exports.BBizFieldUser = BBizFieldUser;
class BBizFieldOptionsItem extends BBizField {
    to(sb) {
        const { options, optionsItem } = this.bizField;
        sb.append('%').append(options.name).dot().append(optionsItem.name);
    }
}
exports.BBizFieldOptionsItem = BBizFieldOptionsItem;
//# sourceMappingURL=BizField.js.map