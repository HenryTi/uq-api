import {
    bigIntField, IDX, tinyIntField
} from "../../il";
import { DbContext } from "../dbContext";
import {
    ExpAnd, ExpVal, ExpEQ, ExpField,
    ExpNum, ExpVar, Procedure, Statements, convertExp
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BEntity } from "./entity";

export class BIDX extends BEntity<IDX> {
    buildTables() {
        let { name, id, indexes, stampCreate, stampUpdate, fieldsValuesList } = this.entity;
        // let { hasUnit } = this.context;
        let table = this.context.createTable(name);
        table.hasUnit = false; // global === false && hasUnit === true;
        table.id = id;
        table.keys = this.entity.getKeys();
        table.fields = [
            ...this.entity.getFields(),
        ];
        if (fieldsValuesList !== undefined) {
            table.fieldsValuesList = this.convertTableFieldsValuesList(fieldsValuesList);
            let validField = tinyIntField('$valid');
            validField.defaultValue = 2;
            table.fields.push(validField);
        }
        if (indexes) {
            table.indexes.push(...indexes);
        }
        this.buildSysFields(table, stampCreate, stampUpdate);
        this.context.appObjs.tables.push(table);
    }

    buildProcedures() {
        let { name } = this.entity;
        this.buildAct(this.context.createAppProc(name + '$act', true));
    }

    private buildAct(p: Procedure) {
        let { name } = this.entity;
        let { factory } = this.context;
        const vId = 'id';
        p.parameters.push(
            tinyIntField('act'),
            bigIntField(vId),
        );

        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new ExpEQ(new ExpVar('act'), ExpNum.num1);
        let insert = factory.createInsert();
        iff.then(insert);
        insert.ignore = true;
        insert.table = new EntityTable(name, false);
        insert.cols = [
            { col: vId, val: new ExpVar(vId) },
        ];

        let elseStats = new Statements();
        iff.elseIf(new ExpEQ(new ExpVar('act'), ExpNum.num2), elseStats);
        let del = factory.createDelete();
        elseStats.add(del);
        del.tables = ['a'];
        del.from(new EntityTable(name, false, 'a'));
        del.where(new ExpAnd(
            new ExpEQ(new ExpField(vId, 'a'), new ExpVar(vId)),
        ));
    }
}
