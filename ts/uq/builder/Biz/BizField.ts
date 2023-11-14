import {
    BizField, BizFieldBud, BizFieldField, BizFieldJsonProp,
    BudDataType, EnumSysTable
} from "../../il";
import { DbContext } from "../dbContext";
import { SqlBuilder } from "../sql";

export abstract class BBizField<T extends BizField = BizField> {
    protected readonly dbContext: DbContext;
    protected readonly bizField: T;
    constructor(dbContext: DbContext, bizField: T) {
        this.dbContext = dbContext;
        this.bizField = bizField;
    }
    abstract to(sb: SqlBuilder): void;
}

export class BBizFieldBud extends BBizField<BizFieldBud> {
    override to(sb: SqlBuilder): void {
        let { bud } = this.bizField;
        function buildSelectValue(tbl: EnumSysTable) {
            sb.l().append('select value from ').dbName().dot().append(tbl)
                .append(' where i=t1.id and x=').append(bud.id)
                .r();
        }
        function buildSelectMulti() {
            sb.l().append('select JSON_ARRAYAGG(x1.ext) from ')
                .dbName().dot().append(EnumSysTable.ixBud).append(' AS x0 JOIN ')
                .dbName().dot().append(EnumSysTable.bud).append(' AS x1 ON x1.id=x0.x ')
                .append(' where x0.i=t1.id AND x1.base=').append(bud.id)
                .r();
        }
        switch (bud.dataType) {
            default:
                buildSelectValue(EnumSysTable.ixBudInt);
                return;
            case BudDataType.str:
            case BudDataType.char:
                buildSelectValue(EnumSysTable.ixBudStr);
                return;
            case BudDataType.dec:
                buildSelectValue(EnumSysTable.ixBudDec);
                return;
            case BudDataType.radio:
            case BudDataType.check:
                buildSelectMulti();
                return;
        }
    }
}

export type TypeMapFieldTable = {
    pend: 't1',
    bin: 'b',
    sheet: 'f',
    sheetBin: 'e',
    atom: 't1',
    baseAtom: 't1',
}

export const MapFieldTable: TypeMapFieldTable = {
    pend: 't1',
    bin: 'b',
    sheet: 'f',
    sheetBin: 'e',
    atom: 't1',
    baseAtom: 't1',
}

export type KeyOfMapFieldTable = keyof TypeMapFieldTable;

export class BBizFieldField extends BBizField<BizFieldField> {
    override to(sb: SqlBuilder): void {
        let tbl = MapFieldTable[this.bizField.tbl];
        sb.append(tbl).dot().append(this.bizField.fieldName);
    }
}

// only for pend med
export class BBizFieldJsonProp extends BBizField<BizFieldJsonProp> {
    override to(sb: SqlBuilder): void {
        let { bud } = this.bizField;
        let tblPend = MapFieldTable['pend'];
        sb.append(`JSON_VALUE(${tblPend}.mid, '$."${bud.id}"')`);
    }
}
