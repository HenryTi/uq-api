"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSettingStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sql_1 = require("../sql");
const dbContext_1 = require("../dbContext");
class BSettingStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { addUnit } = this.istatement;
        if (addUnit === true) {
            sqls.push(this.buildAddUnit());
            return;
        }
        let { factory, hasUnit, unitFieldName } = this.context;
        let { val, var: varName, name, dataType, isGlobal } = this.istatement;
        let valField;
        switch (dataType.type) {
            default:
                valField = 'value';
                break;
            case 'bigint':
                valField = 'big';
                break;
            case 'int':
                valField = 'int';
                break;
        }
        let varUnit = isGlobal === true ? sql_1.ExpNum.num0 : new sql_1.ExpVar(unitFieldName);
        if (varName !== undefined) {
            let select = factory.createSelect();
            sqls.push(select);
            select.toVar = true;
            select.col(valField, varName.pointer.varName(varName.name));
            select.from(new statementWithFrom_1.EntityTable('$setting', false /*hasUnit*/));
            let wheres = [];
            if (hasUnit === true) {
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), varUnit));
            }
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(name)));
            select.where(new sql_1.ExpAnd(...wheres));
            select.lock = select_1.LockType.update;
        }
        else {
            let upsert = factory.createInsert();
            sqls.push(upsert);
            upsert.table = new statementWithFrom_1.EntityTable('$setting', hasUnit);
            upsert.keys = [
                { col: 'name', val: new sql_1.ExpStr(name) }
            ];
            if (hasUnit === true) {
                upsert.keys.push({
                    col: unitFieldName, val: varUnit
                });
            }
            upsert.cols = [
                { col: valField, val: (0, sql_1.convertExp)(this.context, val) }
            ];
        }
    }
    buildAddUnit() {
        let { factory } = this.context;
        let { val } = this.istatement;
        let upsert = factory.createInsert();
        upsert.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.unit);
        upsert.keys = [
            { col: 'unit', val: (0, sql_1.convertExp)(this.context, val) }
        ];
        return upsert;
    }
}
exports.BSettingStatement = BSettingStatement;
//# sourceMappingURL=setting.js.map