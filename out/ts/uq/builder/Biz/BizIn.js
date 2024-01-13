"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizIn = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizIn extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }
    buildSubmitProc(proc) {
        const paramJson = 'json';
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const { act, props, arrs } = this.bizEntity;
        let varJson = new sql_1.ExpVar(paramJson);
        let json = (0, il_1.jsonField)(paramJson);
        parameters.push(json);
        const declare = factory.createDeclare();
        statements.push(declare);
        let vars = [
            (0, il_1.intField)(consts_1.$site),
            (0, il_1.intField)('$id'),
            (0, il_1.intField)('$rowId'),
        ];
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(this.context.site));
        for (let [name, bud] of props) {
            vars.push(this.fieldFromBud(bud));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`)));
        }
        for (let i in arrs) {
            let { name: arrName, props } = arrs[i];
            let varTable = factory.createVarTable();
            statements.push(varTable);
            varTable.name = arrName;
            let idField = (0, il_1.intField)('$id');
            idField.autoInc = true;
            varTable.keys = [idField];
            varTable.fields = [idField];
            const { fields } = varTable;
            let insertArr = factory.createInsert();
            statements.push(insertArr);
            insertArr.table = new sql_1.SqlVarTable(arrName);
            insertArr.cols = [];
            const { cols } = insertArr;
            let selectJsonArr = factory.createSelect();
            insertArr.select = selectJsonArr;
            let jsonColumns = [];
            let jsonTable = new statementWithFrom_1.FromJsonTable('a', varJson, `$.${arrName}[*]`, jsonColumns);
            selectJsonArr.from(jsonTable);
            selectJsonArr.lock = select_1.LockType.none;
            for (let [name, bud] of props) {
                let field = this.fieldFromBud(bud);
                vars.push(field);
                field.nullable = true;
                fields.push(field);
                cols.push({ col: name, val: new sql_1.ExpField(name, 'a') });
                selectJsonArr.column(new sql_1.ExpField(name, 'a'));
                jsonColumns.push({ field: this.fieldFromBud(bud), path: `$.${name}` });
            }
        }
        declare.vars(...vars);
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
    }
    fieldFromBud(bud) {
        const { name } = bud;
        switch (bud.dataType) {
            default:
                debugger;
                return;
            case il_1.BudDataType.char: return (0, il_1.charField)(name, 200);
            case il_1.BudDataType.int: return (0, il_1.intField)(name);
            case il_1.BudDataType.dec: return (0, il_1.decField)(name, 18, 6);
            case il_1.BudDataType.date: return (0, il_1.dateField)(name);
        }
    }
}
exports.BBizIn = BBizIn;
//# sourceMappingURL=BizIn.js.map