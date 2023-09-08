"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BHistory = void 0;
const il_1 = require("../../il");
const sql = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const historyBase_1 = require("./historyBase");
class BHistory extends historyBase_1.BHistoryBase {
    buildProcedures() {
        let p = this.context.createProcedure(this.entity.name);
        p.addUnitUserParameter();
        let pageStart = (0, il_1.charField)('$pageStart', 100);
        let pageSize = (0, il_1.intField)('$pageSize');
        p.parameters.push(pageStart, pageSize);
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
        for (let f of this.entity.fields)
            select.col(f.name);
        if (this.entity.sheet !== undefined) {
            select.col(this.entity.sheetType.name);
            select.col(this.entity.sheet.name);
            select.col(this.entity.row.name);
        }
        if (this.entity.user !== undefined)
            select.col(this.entity.user.name);
        //if (this.entity.unit !== undefined) select.col(this.entity.unit.name);
        select.from(new statementWithFrom_1.EntityTable(this.entity.name, this.context.hasUnit));
        let wheres = [];
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
exports.BHistory = BHistory;
//# sourceMappingURL=history.js.map