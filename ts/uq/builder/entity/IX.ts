import { IX, bigIntField, tinyIntField, Index, Field } from "../../il";
import { DbContext } from "../dbContext";
import {
    ColVal, ExpAnd, ExpCmp, ExpEQ, ExpField
    , ExpNum, ExpVar, Procedure, Statements
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BEntity } from "./entity";

export class BIX extends BEntity<IX> {
    private params: Field[];
    private cols: ColVal[];
    private andCmps: ExpCmp[];
    protected entity: IX;
    constructor(context: DbContext, entity: IX) {
        super(context, entity);
        this.entity = entity;
        this.init();
    }

    private init() {
        let { ixx, i, x } = this.entity;
        const vI = i.name, vX = x.name;
        this.params = [
            bigIntField(vI),
            bigIntField(vX)
        ];
        this.cols = [
            { col: vI, val: new ExpVar(vI) },
            { col: vX, val: new ExpVar(vX) },
        ];
        this.andCmps = [
            new ExpEQ(new ExpField(vI, 'a'), new ExpVar(vI)),
            new ExpEQ(new ExpField(vX, 'a'), new ExpVar(vX)),
        ];
        if (ixx) {
            const vIxx = 'ixx';
            this.params.unshift(bigIntField(vIxx));
            this.cols.unshift({ col: vIxx, val: new ExpVar(vIxx) });
            this.andCmps.unshift(new ExpEQ(new ExpField(vIxx, 'a'), new ExpVar(vIxx)));
        }
    }

    buildTables() {
        let { name, twoWayIndex, ixx, i, x, indexes, prev, fieldsValuesList, stampCreate, stampUpdate, isConst, onlyForSyntax } = this.entity;
        if (onlyForSyntax === true) return;
        let table = this.context.createTable(name);
        table.hasUnit = false;
        table.keys = this.entity.getKeys();
        table.fields = [...this.entity.getFields()];
        if (isConst === true) {
            let validField = tinyIntField('$valid');
            validField.defaultValue = 2;
            table.fields.push(validField);
        }
        if (indexes) {
            table.indexes.push(...indexes);
        }
        if (twoWayIndex === true) {
            let index = new Index(`${x.name}_${i.name}`);
            index.unique = true;
            let arr = [x, i];
            if (ixx) arr.unshift(ixx);
            index.fields = arr;
            table.indexes.push(index);
        }
        if (prev !== undefined) {
            let index = new Index('ix_seq');
            index.unique = true;
            index.fields = [i, prev];
            table.indexes.push(index);
        }
        table.fieldsValuesList = this.convertTableFieldsValuesList(fieldsValuesList);
        this.buildSysFields(table, stampCreate, stampUpdate);
        this.context.appObjs.tables.push(table);
    }

    buildProcedures() {
        let { onlyForSyntax, name, prev } = this.entity;
        if (onlyForSyntax === true) return;
        this.buildAct(this.context.createAppProc(name + '$act', true));
        if (prev !== undefined) {
            //let returnType = new BigInt();
            //let p = this.context.createAppFunc(`${name}$sort`, returnType);
            //this.buildSort(p);
        }
    }

    private buildAct(p: Procedure) {
        let { name } = this.entity;
        let { factory } = this.context;
        p.parameters.push(
            tinyIntField('act'),
        );
        p.parameters.push(...this.params);
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new ExpEQ(new ExpVar('act'), ExpNum.num1);
        let insert = factory.createInsert();
        iff.then(insert);
        insert.ignore = true;
        insert.table = new EntityTable(name, false);
        insert.cols = [...this.cols];

        let elseStats = new Statements();
        iff.elseIf(new ExpEQ(new ExpVar('act'), ExpNum.num2), elseStats);
        let del = factory.createDelete();
        elseStats.add(del);
        del.tables = ['a'];
        del.from(new EntityTable(name, false, 'a'));
        del.where(new ExpAnd(...this.andCmps));
    }
}
