"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveProcedures = void 0;
const sql = require("../sql");
const il = require("../../il");
const sheetProcs_1 = require("./sheetProcs");
const dbContext_1 = require("../dbContext");
class ArchiveProcedures extends sheetProcs_1.SheetProcedures {
    build() {
        this.archiveIdProc(this.sysProc('$archive_id'));
        this.archiveIdsProc(this.sysProc('$archive_ids'));
        this.archivesProc(this.sysProc('$archives'));
    }
    archiveIdProc(proc) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let schemaName = il.charField('schemaName', 50);
        let id = il.bigIntField('id');
        proc.parameters.push(schemaName, id);
        let ta = 'a';
        let select = this.createSelectSheet(true); //factory.createSelect();
        select.column(new sql.ExpField('data', ta));
        proc.statements.push(select);
        let wheres = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpVar(id.name)));
        select.where(new sql.ExpAnd(...wheres));
        proc.statements.push(this.flowSelect(true));
    }
    archiveIdsProc(proc) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let schemaName = il.charField('schemaName', 50);
        let ids = '$ids';
        let stats = proc.statements;
        let paramIds = new il.Field();
        paramIds.name = ids;
        paramIds.dataType = new il.Text();
        proc.parameters.push(schemaName, paramIds);
        let c = '$c', p = '$p', len = '$len', int = new il.Int;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(c, int);
        declare.var(p, int);
        declare.var(len, int);
        let varTable = factory.createVarTable();
        stats.push(varTable);
        varTable.name = 'ids$tbl';
        let vtId = new il.Field();
        vtId.name = 'id';
        vtId.dataType = new il.BigInt();
        varTable.fields = [vtId];
        let set = factory.createSet();
        stats.push(set);
        set.equ(c, new sql.ExpNum(1));
        set = factory.createSet();
        stats.push(set);
        set.equ(len, new sql.ExpFunc(factory.func_length, new sql.ExpVar(ids)));
        let loop = factory.createWhile();
        stats.push(loop);
        loop.no = 1;
        loop.cmp = new sql.ExpEQ(new sql.ExpNum(1), new sql.ExpNum(1));
        let lstats = loop.statements;
        set = factory.createSet();
        lstats.add(set);
        set.equ(p, new sql.ExpFunc(factory.func_charindex, new sql.ExpStr(','), new sql.ExpVar(ids), new sql.ExpVar(c)));
        let iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql.ExpLE(new sql.ExpVar(p), new sql.ExpNum(0));
        set = factory.createSet();
        iff.then(set);
        set.equ(p, new sql.ExpAdd(new sql.ExpVar(len), new sql.ExpNum(1)));
        let insert = factory.createInsert();
        lstats.add(insert);
        insert.table = new sql.SqlVarTable(varTable.name);
        insert.cols.push({
            col: vtId.name,
            val: new sql.ExpFunc('SUBSTRING', new sql.ExpVar(ids), new sql.ExpVar(c), new sql.ExpSub(new sql.ExpVar(p), new sql.ExpVar(c)))
        });
        iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql.ExpGE(new sql.ExpVar(p), new sql.ExpVar(len));
        let leave = factory.createBreak();
        iff.then(leave);
        leave.no = loop.no;
        set = factory.createSet();
        lstats.add(set);
        set.equ(c, new sql.ExpAdd(new sql.ExpVar(p), new sql.ExpNum(1)));
        let ta = 'a', tf = 'b';
        let sel = this.createSelectSheet(true);
        stats.push(sel);
        /* factory.createSelect();
        stats.push(sel);
        sel.from(new EntityTable('$archive', this.context.hasUnit, t1));
        sel.join('inner', new VarTable(varTable.name, t2));
        sel.on(new sql.ExpEQ(new sql.ExpField('id', t1), new sql.ExpField(vtId.name, t2)))
        archiveFields.forEach(f => sel.column(new sql.ExpField(f, t1)))
        */
        let wheres = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpVar('id')));
        if (wheres.length > 0)
            sel.where(new sql.ExpAnd(...wheres));
    }
    archivesProc(proc) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let schemaName = il.charField('schemaName', 50);
        let pageStart = il.bigIntField('$pageStart');
        let pageSize = il.intField('$pageSize');
        proc.parameters.push(schemaName, pageStart, pageSize);
        let ta = 'a', tf = 'b';
        let select = this.createSelectSheet(true);
        proc.statements.push(select);
        let wheres = [];
        wheres.push(new sql.ExpLT(new sql.ExpField('id', ta), new sql.ExpFunc(factory.func_ifnull, new sql.ExpVar(pageStart.name), new sql.ExpStr('9223372036854775807'))));
        let selectSheet = factory.createSelect();
        selectSheet.column(new sql.ExpField('id'));
        selectSheet.from((0, dbContext_1.sysTable)(il.EnumSysTable.entity));
        selectSheet.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta), new sql.ExpSelect(selectSheet)));
        select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpVar(pageSize.name));
        select.order(new sql.ExpField('id', ta), 'desc');
    }
}
exports.ArchiveProcedures = ArchiveProcedures;
//# sourceMappingURL=archiveProcs.js.map