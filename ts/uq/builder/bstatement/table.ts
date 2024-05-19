import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { TableStatement } from "../../il";

export class BTableStatement extends BStatement<TableStatement> {
    body(sqls: Sqls) {
        let { noDrop, table } = this.istatement;
        let { name, fields, keys } = table;
        let factory = this.context.factory;
        let tbl = factory.createVarTable();
        sqls.push(tbl);
        tbl.name = name;
        tbl.fields = fields;
        tbl.keys = keys;
        tbl.noDrop = noDrop;
    }
}

