import { Pending, charField, intField } from '../../il';
import { BEntity } from './entity';

export class BPending extends BEntity<Pending> {
    buildTables() {
        let { name, id, done, keyFields } = this.entity;
        let table = this.context.createTable(name);
        if (id.autoInc === true) table.autoIncId = id;
        table.keys = keyFields;
        table.fields = this.entity.getFields();
        let indexes = this.entity.indexes;
        if (indexes !== undefined) table.indexes.push(...indexes);
        this.context.appObjs.tables.push(table);
    }
    /*
        buildProcedures() {
            let {name, id, date, fields, sheet, sheetType, row, user} = this.entity;
            let p = this.context.createProcedure(name);
            p.addUnitUserParameter();
            let pageStart = charField('$pageStart', 100);
            let pageSize = intField('$pageSize');
            p.parameters.push(
                pageStart,
                pageSize,
                this.entity.id
            );
            let iff = this.context.factory.createIf();
            p.statements.push(iff);
            iff.cmp = new sql.ExpIsNull(new sql.ExpVar(pageStart.name));
            let set = this.context.factory.createSet();
            iff.then(set);
            set.equ(pageStart.name, new sql.ExpFunc(this.context.factory.func_now));
            let select = this.context.factory.createSelect();
            p.statements.push(select);
            select.col(date.name);
            for (let f of fields) select.col(f.name);
            if (sheet !== undefined) {
                select.col(sheetType.name);
                select.col(sheet.name);
                select.col(row.name);
            }
            if (user !== undefined) select.col(user.name);
            //if (unit !== undefined) select.col(unit.name);
            select.from(new EntityTable(name, this.context.hasUnit))
            let wheres:sql.ExpCmp[] = [];
            wheres.push(new sql.ExpLT(new sql.ExpField(date.name), new sql.ExpVar(pageStart.name)));
            wheres.push(new sql.ExpEQ(new sql.ExpField(id.name), new sql.ExpVar(id.name)));
            if (wheres.length > 0) select.where(new sql.ExpAnd(...wheres));
            select.limit(new sql.ExpVar(pageSize.name));
            select.order(new sql.ExpField(id.name), 'desc');
            this.context.appObjs.procedures.push(p);
        }
    */
}
