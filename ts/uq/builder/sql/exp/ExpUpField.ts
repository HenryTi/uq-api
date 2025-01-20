import { EnumSysTable } from "../../../il";
import { SqlBuilder } from "../sqlBuilder";
import { Exp } from "./Exp";

abstract class ExpUpField extends Exp {
    protected readonly tblAlias: string;
    protected readonly upField: string;
    constructor(tblAlias: string, upField: string) {
        super();
        this.tblAlias = tblAlias;
        this.upField = upField;
    }
}

export class ExpBinUpField extends ExpUpField {
    override to(sb: SqlBuilder): void {
        sb.append('(SELECT ').fld(this.upField).append(' FROM ').dbName().dot().fld(EnumSysTable.bizSheet)
            .append(' WHERE id=').fld(this.tblAlias).dot().fld('sheet)');
    }
}

export class ExpForkUpField extends ExpUpField {
    override to(sb: SqlBuilder): void {
        sb.append('(SELECT ').fld(this.upField).append(' FROM ').dbName().dot().fld(EnumSysTable.atom)
            .append(' WHERE id=').fld(this.tblAlias).dot().fld('base)');
    }
}
