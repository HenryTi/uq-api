import {
    BizBinVar,
    BizBud,
    bizDecType,
    BizField, BizFieldBinBinBudSelect, BizFieldBinBudSelect, BizFieldBud, BizFieldField, BizFieldOptionsItem, BizFieldPendBinBudSelect, BizFieldPendBudSelect, BizForkBaseField, EnumSysTable
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { DbContext } from "../dbContext";
import { SqlBuilder } from "../sql";

export abstract class BBizField<T extends BizField = BizField> {
    protected readonly dbContext: DbContext;
    protected readonly bizField: T;
    noArrayAgg: boolean;
    constructor(dbContext: DbContext, bizField: T) {
        this.dbContext = dbContext;
        this.bizField = bizField;
    }
    abstract to(sb: SqlBuilder): void;

    protected ixTableFromBud(bud: BizBud): EnumSysTable {
        let tbl: EnumSysTable;
        switch (bud.dataType) {
            default:
                tbl = EnumSysTable.ixInt;
                break;
            case BudDataType.str:
            case BudDataType.char:
                tbl = EnumSysTable.ixStr;
                break;
            case BudDataType.dec:
                tbl = EnumSysTable.ixDec;
                break;
            case BudDataType.check:
                tbl = EnumSysTable.ixCheck;
                break;
            case BudDataType.fork:
                tbl = EnumSysTable.ixJson;
                break;
        }
        return tbl;
    }

    protected buildPendBud(sb: SqlBuilder, bud: BizBud) {
        if (sb.forClient === true) {
            sb.append('%pend').dot().append(bud.name);
            return;
        }
        sb.l();
        function jsonValue() {
            sb.append(`JSON_VALUE(t0.`).fld('mid').append(`, '$."${bud.id}"')`);
        }
        function cast(funcType: () => void) {
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
            case BudDataType.fork:
                cast(() => sb.append('JSON'));
                break;
            case BudDataType.dec:
                cast(() => bizDecType.sql(sb));
                break;
            case BudDataType.int:
            case BudDataType.atom:
            case BudDataType.radio:
            case BudDataType.bin:
            case BudDataType.ID:
            case BudDataType.date:
            case BudDataType.datetime:
                cast(() => sb.append('UNSIGNED'));
                break;
        }
        sb.append(' as value FROM ').dbName().dot().name(EnumSysTable.pend)
            .append(' AS t0');
        sb.append(' WHERE t0.id=').var('$pend');
        sb.r();
    }
}

export class BBizBinVar extends BBizField<BizBinVar> {
    override to(sb: SqlBuilder): void {
        sb.var('$bin');
    }
}

export class BBizForkBaseField extends BBizField<BizForkBaseField> {
    override to(sb: SqlBuilder): void {
        if (sb.forClient === true) {
            sb.append('%base');
            return;
        }
    }
}

export class BBizFieldBud extends BBizField<BizFieldBud> {
    override to(sb: SqlBuilder): void {
        let { bud, tableAlias } = this.bizField;
        if (sb.forClient === true) {
            sb.append('%').append(tableAlias).dot().append(bud.name);
            return;
        }
        let tbl: EnumSysTable;
        switch (bud.dataType) {
            default:
                tbl = EnumSysTable.ixInt;
                break;
            case BudDataType.str:
            case BudDataType.char:
                tbl = EnumSysTable.ixStr;
                break;
            case BudDataType.dec:
                tbl = EnumSysTable.ixDec;
                break;
            case BudDataType.fork:
                tbl = EnumSysTable.ixJson;
                break;
            case BudDataType.check:
                this.buildSelectMulti(sb);
                return;
        }
        this.buildSelectValue(sb, tbl);
    }
    private buildSelectValue(sb: SqlBuilder, tbl: EnumSysTable) {
        let { bud } = this.bizField;
        sb.l().append('select value from ').dbName().dot().append(tbl)
            .append(' where i=');
        this.toIValue(sb);
        sb.append(' and x=').append(bud.id)
            .r();
    }
    private buildSelectMulti(sb: SqlBuilder) {
        let { bud } = this.bizField;
        const x0 = 'x0', x1 = 'x1';
        sb.l().append('SELECT ');
        if (this.noArrayAgg === true) {
            sb.append(`${x1}.ext as id`)
        }
        else {
            sb.append(`JSON_ARRAYAGG(${x0}.x)`)
        };
        sb.append(' FROM ').dbName().dot().append(EnumSysTable.ixCheck).append(` AS ${x0}`)
            .append(` where ${x0}.ii=`)
        this.toIValue(sb);
        sb.append(` AND ${x0}.i=`).append(bud.id)
            .append(` GROUP BY ${x0}.i`).r();
    }

    toIValue(sb: SqlBuilder) {
        let { tableAlias } = this.bizField;
        sb.append(tableAlias).dot().append('id');
    }
}

export type TypeMapFieldTable = {
    pend: '$t1',
    bin: 'b',
    sheet: 'f',
    sheetBin: 'e',
    s: 'e',
    // atom: 't1',
    // baseAtom: 't1',
}

export const MapFieldTable: TypeMapFieldTable = {
    pend: '$t1',
    bin: 'b',
    sheet: 'f',
    sheetBin: 'e',
    s: 'e',
}

export type KeyOfMapFieldTable = keyof TypeMapFieldTable;

export class BBizFieldField extends BBizField<BizFieldField> {
    override to(sb: SqlBuilder): void {
        sb.fld(this.bizField.tableAlias).dot().fld(this.bizField.name);
    }
}

// only for pend med
export class BBizFieldJsonProp extends BBizFieldBud {
    override to(sb: SqlBuilder): void {
        let { bud } = this.bizField;
        let tblPend = MapFieldTable['pend'];
        sb.append(`JSON_VALUE(${tblPend}.mid, '$."${bud.id}"')`);
    }
}

export class BBizFieldBinVar extends BBizFieldField {
    override to(sb: SqlBuilder): void {
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

export class BBizFieldBinBud extends BBizFieldBud {
    override to(sb: SqlBuilder): void {
        let { bud, tableAlias } = this.bizField;
        if (sb.forClient === true) {
            sb.append('%').append(tableAlias).dot().append(bud.name);
            return;
        }
        let budName = bud.name;
        if (tableAlias === 'sheet') budName = '$s' + budName;
        sb.var(budName);
    }
}

export abstract class BBizFieldBinBudSelect<T extends BizFieldBinBudSelect> extends BBizField<T> {
    protected buildBudArr(sb: SqlBuilder, budArr: BizBud[]) {
        const { length } = budArr;
        for (let t = 0; t < length; t++) {
            let th = t + 1;
            let bud = budArr[t];
            let tbl: EnumSysTable;
            if (t < length - 1) {
                tbl = EnumSysTable.ixInt;
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

export class BBizFieldPendBudSelect extends BBizFieldBinBudSelect<BizFieldPendBudSelect> {
    override to(sb: SqlBuilder): void {
        let { pend, bud } = this.bizField;
        this.buildPendBud(sb, bud);
    }
}

export class BBizFieldPendBinBudSelect extends BBizFieldBinBudSelect<BizFieldPendBinBudSelect> {
    override to(sb: SqlBuilder): void {
        let { bud, budArr } = this.bizField;
        sb.l();
        const { length } = budArr;
        sb.append(`SELECT t${length}.`).fld('value').append(` FROM `);
        this.buildPendBud(sb, bud);
        sb.append(' AS t0');
        this.buildBudArr(sb, budArr);
        sb.r();
    }
}

export class BBizFieldBinBinBudSelect extends BBizFieldBinBudSelect<BizFieldBinBinBudSelect> {
    override to(sb: SqlBuilder): void {
        let { bud, budArr } = this.bizField;
        sb.l();
        const { length } = budArr;
        sb.append(`SELECT t${length}.`).fld('value').append(` FROM `).dbName().dot().name(EnumSysTable.ixInt)
            .append(' AS t0');
        this.buildBudArr(sb, budArr);
        sb.append(' WHERE t0.i=').var(bud.name).append(' AND t0.x=').append(bud.id);
        sb.r();
    }
}

export class BBizFieldPendBin extends BBizField {
    override to(sb: SqlBuilder): void {
        sb.l().append(`SELECT bin FROM `).dbName().dot().name(EnumSysTable.pend)
            .append(' WHERE id=').var('$pend').r();
    }
}

export class BBizFieldPendSheet extends BBizField {
    override to(sb: SqlBuilder): void {
        sb.l().append(`SELECT c.base FROM `).dbName().dot().name(EnumSysTable.pend)
            // .append(' AS a JOIN ').dbName().dot().name(EnumSysTable.bizDetail)
            // .append(' AS b ON b.id=a.bin')
            // .append(' JOIN ').dbName().dot().name(EnumSysTable.bud)
            // .append(' AS c ON c.id=b.base')
            .append(' AS a JOIN ').dbName().dot().name(EnumSysTable.bizBin).append(' AS c ON c.id=a.bin')
            .append(' WHERE a.id=').var('$pend').r();
    }
}

export class BBizFieldUser extends BBizField<BizField> {
    override to(sb: SqlBuilder): void {
        sb.append('%user').dot().append(this.bizField.tableAlias);
    }
}

export class BBizFieldOptionsItem extends BBizField<BizFieldOptionsItem> {
    override to(sb: SqlBuilder): void {
        const { options, optionsItem } = this.bizField;
        if (sb.forClient === true) {
            sb.append('%').append(options.name).dot().append(optionsItem.name);
        }
        else {
            sb.append(optionsItem.id);
        }
    }
}
