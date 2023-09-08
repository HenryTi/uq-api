"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BValueStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const dbContext_1 = require("../dbContext");
class BValueStatement extends bstatement_1.BStatement {
    head(sqls) {
        let { factory } = this.context;
        let { no } = this.istatement;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.var(`$type_${no}`, new il_1.Char(100));
        declare.var(`$sql_${no}`, new il_1.Text());
    }
    body(sqls) {
        let { valueXi } = this.istatement;
        if (valueXi !== undefined) {
            this.buildValueXi(sqls, valueXi);
            return;
        }
    }
    buildValueXi(sqls, valueXi) {
        let { no } = this.istatement;
        let { IX, xi, varType, varValue, typePointer, valuePointer } = valueXi;
        let { x: xiField } = IX;
        let { idType } = xiField;
        let { factory } = this.context;
        let selectType = factory.createSelect();
        sqls.push(selectType);
        selectType.toVar = true;
        let idRootTable;
        switch (idType) {
            case '$global':
                idRootTable = '$id';
                break;
            case '$local':
                idRootTable = '$id_local';
                break;
            case '$minute':
                idRootTable = '$id_minute';
                break;
        }
        let expId = (0, sql_1.convertExp)(this.context, xi);
        selectType.column(new sql_1.ExpField('name', 'b'), `$type_${no}`);
        selectType.from(new statementWithFrom_1.EntityTable(idRootTable, false, 'a'));
        selectType.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('entity', 'a'), new sql_1.ExpField('id', 'b')));
        selectType.where(new sql_1.ExpEQ(new sql_1.ExpField('id', 'a'), expId));
        let setAtId = factory.createSet();
        sqls.push(setAtId);
        setAtId.isAtVar = true;
        setAtId.equ(`id_${no}`, expId);
        let setSql = factory.createSet();
        sqls.push(setSql);
        setSql.equ(`$sql_${no}`, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('select ' + this.context.twProfix), new sql_1.ExpVar(`$type_${no}`), new sql_1.ExpStr(`$value(@id_${no}) into @value_${no}`)));
        let execSql = factory.createExecSql();
        sqls.push(execSql);
        execSql.sql = new sql_1.ExpVar(`$sql_${no}`);
        if (varType) {
            let setType = factory.createSet();
            sqls.push(setType);
            setType.equ(typePointer.varName(varType), new sql_1.ExpVar(`$type_${no}`));
        }
        if (varValue) {
            let setValue = factory.createSet();
            sqls.push(setValue);
            setValue.equ(valuePointer.varName(varValue), new sql_1.ExpAtVar(`value_${no}`));
        }
    }
}
exports.BValueStatement = BValueStatement;
//# sourceMappingURL=value.js.map