import { BizBudValue, BizIn, BudDataType, DataType, EnumDataType, Field, JsonTableColumn, charField, dateField, decField, intField, jsonField } from "../../il";
import { Sqls } from "../bstatement";
import { ExpField, ExpFunc, ExpStr, ExpVar, Procedure, SqlVarTable } from "../sql";
import { LockType } from "../sql/select";
import { FromJsonTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizIn extends BBizEntity<BizIn> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }

    private buildSubmitProc(proc: Procedure) {
        const paramJson = 'json';
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const { act, props, arrs } = this.bizEntity;
        let varJson = new ExpVar(paramJson);
        let json = jsonField(paramJson);
        parameters.push(json);
        const declare = factory.createDeclare();
        statements.push(declare);
        let vars: Field[] = [
            intField('$id'),
            intField('$rowId'),
        ];
        for (let [name, bud] of props) {
            vars.push(this.fieldFromBud(bud));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${name}"`)));
        }
        for (let i in arrs) {
            let { name: arrName, props } = arrs[i];
            let varTable = factory.createVarTable();
            statements.push(varTable);
            varTable.name = arrName;
            let idField = intField('$id');
            idField.autoInc = true;
            varTable.keys = [idField];
            varTable.fields = [idField];
            const { fields } = varTable;
            let insertArr = factory.createInsert();
            statements.push(insertArr);
            insertArr.table = new SqlVarTable(arrName);
            insertArr.cols = [];
            const { cols } = insertArr;
            let selectJsonArr = factory.createSelect();
            insertArr.select = selectJsonArr;
            let jsonColumns: JsonTableColumn[] = [];
            let jsonTable = new FromJsonTable('a', varJson, `$.${arrName}[*]`, jsonColumns);
            selectJsonArr.from(jsonTable);
            selectJsonArr.lock = LockType.none;
            for (let [name, bud] of props) {
                let field = this.fieldFromBud(bud);
                vars.push(field);
                field.nullable = true;
                fields.push(field);
                cols.push({ col: name, val: new ExpField(name, 'a') });
                selectJsonArr.column(new ExpField(name, 'a'));
                jsonColumns.push({ field: this.fieldFromBud(bud), path: `$.${name}` });
            }
        }
        declare.vars(...vars);

        let sqls = new Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
    }

    private fieldFromBud(bud: BizBudValue) {
        const { name } = bud;
        switch (bud.dataType) {
            default: debugger; return;
            case BudDataType.char: return charField(name, 200);
            case BudDataType.int: return intField(name);
            case BudDataType.dec: return decField(name, 18, 6);
            case BudDataType.date: return dateField(name);
        }
    }
}
