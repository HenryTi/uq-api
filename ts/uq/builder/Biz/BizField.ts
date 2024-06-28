import {
    BizBud,
    BizField, BizFieldBinBudSelect, BizFieldBud, BizFieldField, EnumSysTable
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
                tbl = EnumSysTable.ixBudInt;
                break;
            case BudDataType.str:
            case BudDataType.char:
                tbl = EnumSysTable.ixBudStr;
                break;
            case BudDataType.dec:
                tbl = EnumSysTable.ixBudDec;
                break;
            // case BudDataType.radio: radio 按int处理
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
            sb.append(`JSON_ARRAYAGG(${x1}.ext)`)
        };
        sb.append(' FROM ').dbName().dot().append(EnumSysTable.ixBud).append(` AS ${x0} JOIN `)
            .dbName().dot().append(EnumSysTable.bud).append(` AS ${x1} ON ${x1}.id=${x0}.x `)
            .append(` where ${x0}.i=`)
        this.toIValue(sb);
        sb.append(` AND ${x1}.base=`).append(bud.id)
            .r();
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
    // atom: 't1',
    // baseAtom: 't1',
}

export type KeyOfMapFieldTable = keyof TypeMapFieldTable;

export class BBizFieldField extends BBizField<BizFieldField> {
    override to(sb: SqlBuilder): void {
        sb.append(this.bizField.tableAlias).dot().append(this.bizField.name);
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

export class BBizFieldBinBudSelect extends BBizField<BizFieldBinBudSelect> {
    override to(sb: SqlBuilder): void {
        let { bizBin, bud } = this.bizField;
        sb.string(`${bizBin?.getJName()}.${bud.getJName()}`);
    }
    protected buildSelectBudValue(sb: SqlBuilder, bud: BizBud) {
        let tbl: EnumSysTable;
        switch (bud.dataType) {
            default:
                tbl = EnumSysTable.ixBudInt;
                break;
            case BudDataType.str:
            case BudDataType.char:
                tbl = EnumSysTable.ixBudStr;
                break;
            case BudDataType.dec:
                tbl = EnumSysTable.ixBudDec;
                break;
            // case BudDataType.radio: radio 按int处理
            case BudDataType.check:
                // this.buildSelectMulti(sb);
                return;
        }
        //this.buildSelectValue(sb, tbl);
    }
}

export class BBizFieldPendBin extends BBizField {
    override to(sb: SqlBuilder): void {
        // let { bud, tableAlias } = this.bizField;
        // let budName = bud.name;
        //if (tableAlias === 'sheet') budName = '$s' + budName;
        sb.append('9009');
    }
}

export class BBizFieldUser extends BBizField<BizField> {
    override to(sb: SqlBuilder): void {
        sb.append('%user').dot().append(this.bizField.tableAlias);
    }
}
