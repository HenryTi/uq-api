import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, SettingStatement } from "../../il";
import { Statement } from "../sql";
import { LockType } from "../sql/select";
import { EntityTable } from "../sql/statementWithFrom";
import { ExpEQ, ExpCmp, ExpAnd, ExpField, ExpVar, ExpStr, convertExp, ExpVal, ExpNum } from "../sql";
import { sysTable } from "../dbContext";

export class BSettingStatement extends BStatement {
    protected istatement: SettingStatement;

    body(sqls: Sqls) {
        let { addUnit } = this.istatement;
        if (addUnit === true) {
            sqls.push(this.buildAddUnit());
            return;
        }
        let { factory, hasUnit, unitFieldName } = this.context;
        let { val, var: varName, name, dataType, isGlobal } = this.istatement;
        let valField: string;
        switch (dataType.type) {
            default: valField = 'value'; break;
            case 'bigint': valField = 'big'; break;
            case 'int': valField = 'int'; break;
        }
        let varUnit = isGlobal === true ? ExpNum.num0 : new ExpVar(unitFieldName);
        if (varName !== undefined) {
            let select = factory.createSelect();
            sqls.push(select);
            select.toVar = true;
            select.col(valField, varName.pointer.varName(varName.name));
            select.from(new EntityTable('$setting', false /*hasUnit*/));
            let wheres: ExpCmp[] = [];
            if (hasUnit === true) {
                wheres.push(new ExpEQ(new ExpField(unitFieldName), varUnit));
            }
            wheres.push(new ExpEQ(new ExpField('name'), new ExpStr(name)));
            select.where(new ExpAnd(...wheres));
            select.lock = LockType.update;
        }
        else {
            let upsert = factory.createInsert();
            sqls.push(upsert);
            upsert.table = new EntityTable('$setting', hasUnit);
            upsert.keys = [
                { col: 'name', val: new ExpStr(name) }
            ];
            if (hasUnit === true) {
                upsert.keys.push({
                    col: unitFieldName, val: varUnit
                });
            }
            upsert.cols = [
                { col: valField, val: convertExp(this.context, val) as ExpVal }
            ];
        }
    }

    private buildAddUnit(): Statement {
        let { factory } = this.context;
        let { val } = this.istatement;
        let upsert = factory.createInsert();
        upsert.table = sysTable(EnumSysTable.unit);
        upsert.keys = [
            { col: 'unit', val: convertExp(this.context, val) as ExpVal }
        ];
        return upsert;
    }
}
