import { Pending, Index, charField, intField, History } from '../../il';
import { BEntity } from './entity';
import * as sql from '../sql';
import { EntityTable, VarTable } from '../sql/statementWithFrom';
import { BHistoryBase } from './historyBase';

export class BHistory extends BHistoryBase<History> {
    buildProcedures() {
        let p = this.context.createProcedure(this.entity.name);
        p.addUnitUserParameter();
        let pageStart = charField('$pageStart', 100);
        let pageSize = intField('$pageSize');
        p.parameters.push(
            pageStart,
            pageSize,
            //...this.entity.keys
        );
        let { statements } = p;
        this.buildRoleCheck(statements);
        let iff = this.context.factory.createIf();
        statements.push(iff);
        iff.cmp = new sql.ExpIsNull(new sql.ExpVar(pageStart.name));
        let set = this.context.factory.createSet();
        iff.then(set);
        set.equ(pageStart.name, new sql.ExpFunc(this.context.factory.func_now));
        let select = this.context.factory.createSelect();
        statements.push(select);
        select.col(this.entity.date.name);
        for (let f of this.entity.fields) select.col(f.name);
        if (this.entity.sheet !== undefined) {
            select.col(this.entity.sheetType.name);
            select.col(this.entity.sheet.name);
            select.col(this.entity.row.name);
        }
        if (this.entity.user !== undefined) select.col(this.entity.user.name);
        //if (this.entity.unit !== undefined) select.col(this.entity.unit.name);
        select.from(new EntityTable(this.entity.name, this.context.hasUnit))
        let wheres: sql.ExpCmp[] = [];
        wheres.push(new sql.ExpLT(new sql.ExpField(this.entity.date.name), new sql.ExpVar(pageStart.name)));
        /*
        for (let k of this.entity.keys) {
            wheres.push(new sql.ExpEQ(new sql.ExpField(k.name), new sql.ExpVar(k.name)));
        }
        */
        //if (wheres.length > 0) 
        select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpVar(pageSize.name));
        select.order(new sql.ExpField(this.entity.date.name), 'desc');
        this.context.appObjs.procedures.push(p);
    }
}
