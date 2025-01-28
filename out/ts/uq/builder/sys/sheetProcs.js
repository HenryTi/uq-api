"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetProcedures = exports.archiveFields = exports.sheetFields = void 0;
const sql = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sql_1 = require("../sql");
const il = require("../../il");
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const consts_1 = require("../consts");
const dbContext_1 = require("../dbContext");
exports.sheetFields = ['id', 'no', 'user', 'date', 'sheet', 'version', 'flow', 'discription', 'processing'];
exports.archiveFields = exports.sheetFields.slice(0, exports.sheetFields.length - 1);
class SheetProcedures extends sysProcedures_1.SysProcedures {
    build() {
        this.sheetToQueueProc(this.sysProc('$sheet_to_queue'));
        this.sheetSaveProc(this.sysProc('$sheet_save'));
        this.sheetDetailSaveProc(this.sysProc('$sheet_detail_save'));
        this.sheetToProc(this.sysProc('$sheet_to'));
        this.sheetScanProc(this.sysProc('$sheet_scan'));
        this.sheetIdProc(this.sysProc('$sheet_id'));
        this.sheetIdsProc(this.sysProc('$sheet_ids'));
        this.sheetStateProc(this.sysProc('$sheet_state'));
        this.sheetStateUserProc(this.sysProc('$sheet_state_user'));
        this.sheetStateMyProc(this.sysProc('$sheet_state_my'));
        this.sheetStateCountProc(this.sysProc('$sheet_state_count'));
    }
    // 将待处理的sheet action加入队列
    sheetToQueueProc(proc) {
        let { factory, hasUnit } = this.context;
        let $unit = '$unit';
        proc.addUnitParameter();
        proc.parameters.push(il.charField('name', 100), il.bigIntField('id'), il.textField('content'));
        let stats = proc.statements;
        //proc.declareRollbackHandler = true;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(consts_1.settingQueueSeed, new il_1.BigInt());
        stats.push(proc.createTransaction());
        let select = factory.createSelect();
        select.col('id');
        select.from(this.context.sysTable(il_1.EnumSysTable.$sheet));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')), new sql_1.ExpEQ(new sql_1.ExpField('processing'), sql_1.ExpVal.num1)));
        select.lock = select_1.LockType.update;
        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new sql_1.ExpExists(select);
        let selectRet0 = factory.createSelect();
        iff.then(selectRet0);
        selectRet0.column(sql_1.ExpVal.num0, 'ret');
        let update = factory.createUpdate();
        iff.else(update);
        update.table = this.context.sysTable(il_1.EnumSysTable.$sheet);
        update.cols = [{ col: 'processing', val: new sql.ExpNum(1) }];
        let wheres = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpVar('id')));
        if (hasUnit === true) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField($unit), new sql_1.ExpVar($unit)));
        }
        update.where = new sql.ExpAnd(...wheres);
        this.context.tableSeed(consts_1.settingQueueSeed, consts_1.settingQueueSeed).forEach(v => iff.else(v));
        let insert = factory.createInsert();
        iff.else(insert);
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.messageQueue, hasUnit);
        insert.cols = [
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
            { col: 'subject', val: new sql_1.ExpVar('name') },
            { col: 'action', val: new sql_1.ExpStr('sheet') },
            { col: 'content', val: new sql_1.ExpVar('content') },
            { col: 'defer', val: sql_1.ExpNum.num0 },
        ];
        if (hasUnit === true) {
            insert.cols.push({
                col: $unit, val: new sql_1.ExpVar($unit)
            });
        }
        let insertDefer = factory.createInsert();
        iff.else(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new statementWithFrom_1.EntityTable('$queue_defer', false);
        insertDefer.cols = [
            { col: 'defer', val: sql_1.ExpNum.num0 },
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueSeed) },
        ];
        let selectRet1 = factory.createSelect();
        iff.else(selectRet1);
        selectRet1.column(sql_1.ExpVal.num1, 'ret');
        stats.push(proc.createCommit());
    }
    sheetSaveProc(proc) {
        proc.addUnitUserParameter();
        let { factory } = this.context;
        let stats = proc.statements;
        let hasUnit = this.context.hasUnit;
        let unit = this.context.unitField;
        let sheetName = il.charField('sheetName', 50);
        let app = il.intField('app');
        let data = il.textField('data');
        let discription = il.charField('discription', 50);
        proc.parameters.push(sheetName, app, discription, data);
        let now = 'now', date = 'date', no = 'no', noVal = 'noVal', noDate = 'noDate', sheet = 'sheet', version = 'version', id = 'id', startState = '$', uq = 'uq';
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(now, new il.DateTime)
            .var(date, new il.DDate)
            .var(no, new il.Char(20))
            .var(noVal, new il.Int)
            .var(noDate, new il.DDate)
            .var(sheet, new il.Int)
            .var(version, new il.Int)
            .var(uq, new il.Int)
            .var(id, new il.BigInt)
            .var(startState, new il.Int());
        let set = factory.createSet();
        stats.push(set);
        set.equ(now, new sql.ExpFunc(factory.func_now));
        set = factory.createSet();
        stats.push(set);
        set.equ(date, new sql.ExpFunc(factory.func_datepart, new sql.ExpVar(now)));
        stats.push(proc.createTransaction());
        let select = factory.createSelect();
        stats.push(select);
        select.toVar = true;
        select.column(new sql.ExpField('id'), sheet).column(new sql.ExpField('version'), version);
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        select.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(sheetName.name)));
        select = factory.createSelect();
        stats.push(select);
        select.toVar = true;
        select.column(new sql.ExpAdd(new sql.ExpField('no'), new sql.ExpNum(1)), noVal)
            .column(new sql.ExpField('date'), noDate);
        select.from(new statementWithFrom_1.EntityTable('$no', this.context.hasUnit));
        let wheres = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('sheet'), new sql.ExpVar(sheet)));
        select.where(new sql.ExpAnd(...wheres));
        select.lock = select_1.LockType.update;
        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new sql.ExpAnd(new sql.ExpIsNotNull(new sql.ExpVar(noVal)), new sql.ExpEQ(new sql.ExpVar(noDate), new sql.ExpVar(date)));
        let update = factory.createUpdate();
        iff.then(update);
        update.table = new sql.SqlSysTable('$no');
        update.cols = [{ col: 'no', val: new sql.ExpVar(noVal) }];
        wheres = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('sheet'), new sql.ExpVar(sheet)));
        update.where = new sql.ExpAnd(...wheres);
        set = factory.createSet();
        iff.else(set);
        set.equ('noVal', new sql.ExpNum(1));
        set = factory.createSet();
        iff.else(set);
        set.equ('noDate', new sql.ExpVar(date));
        let upsert = factory.createUpsert();
        iff.else(upsert);
        upsert.table = new sql.SqlSysTable('$no');
        upsert.cols = [
            { col: 'date', val: new sql.ExpVar(noDate) },
            { col: 'no', val: new sql.ExpVar(noVal) },
        ];
        upsert.keys = [{ col: 'sheet', val: new sql.ExpVar(sheet) }];
        if (hasUnit === true)
            upsert.keys.unshift({ col: unit.name, val: new sql.ExpVar(unit.name) });
        set = factory.createSet();
        stats.push(set);
        let varDate = new sql.ExpVar(noDate), num2 = new sql.ExpNum(2), str0 = new sql.ExpStr('0');
        set.equ('no', new sql.ExpFunc(factory.func_concat, factory.lPad(new sql.ExpMod(new sql.ExpFunc(factory.func_year, varDate), new sql.ExpNum(100)), num2, str0), factory.lPad(new sql.ExpFunc(factory.func_month, varDate), num2, str0), factory.lPad(new sql.ExpFunc(factory.func_day, varDate), num2, str0), factory.lPad(new sql.ExpVar(noVal), new sql.ExpNum(6), str0)));
        let selectConstStr = factory.createSelect();
        stats.push(selectConstStr);
        selectConstStr.toVar = true;
        selectConstStr.column(new sql.ExpField('id'), startState);
        selectConstStr.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
        selectConstStr.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpStr(startState)));
        let selectId = factory.createSelect();
        stats.push(selectId);
        selectId.toVar = true;
        selectId.column(new sql_1.ExpAdd(new sql_1.ExpField('big'), sql_1.ExpVal.num1), 'id');
        selectId.from(new statementWithFrom_1.EntityTable('$setting', false));
        let selectIdWheres = [new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(consts_1.settingSheetSeed))];
        if (hasUnit === true)
            selectIdWheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), sql_1.ExpVal.num0));
        selectId.where(new sql_1.ExpAnd(...selectIdWheres));
        selectId.lock = select_1.LockType.update;
        let updateSeed = factory.createUpdate();
        stats.push(updateSeed);
        updateSeed.cols = [{ col: 'big', val: new sql_1.ExpVar(id) }];
        updateSeed.table = new statementWithFrom_1.EntityTable('$setting', false);
        updateSeed.where = new sql_1.ExpAnd(...selectIdWheres);
        let insert = factory.createInsert();
        stats.push(insert);
        insert.table = this.context.sysTable(il_1.EnumSysTable.$sheet);
        insert.cols = [
            { col: 'id', val: new sql.ExpVar('id') },
            { col: 'no', val: new sql.ExpVar(no) },
            { col: 'user', val: new sql.ExpVar('$user') },
            { col: 'sheet', val: new sql.ExpVar(sheet) },
            { col: 'version', val: new sql.ExpVar(version) },
            { col: 'flow', val: new sql.ExpNum(0) },
            { col: 'state', val: new sql.ExpVar(startState) },
            { col: 'date', val: new sql.ExpVar(now) },
            { col: 'app', val: new sql.ExpVar(app.name) },
            { col: 'discription', val: new sql.ExpVar(discription.name) },
            { col: 'data', val: new sql.ExpVar(data.name) },
            { col: 'processing', val: new sql.ExpNum(0) },
        ];
        if (hasUnit === true)
            insert.cols.unshift({ col: unit.name, val: new sql.ExpVar(unit.name) });
        //set = factory.createSet();
        //stats.push(set);
        //set.equ(id, new sql.ExpFunc(factory.func_lastinsertid));
        insert = factory.createInsert();
        stats.push(insert);
        insert.table = this.context.sysTable(il_1.EnumSysTable.sheetTo);
        insert.cols = [
            { col: 'sheet', val: new sql.ExpVar(id) },
            { col: 'to', val: new sql.ExpVar('$user') }
        ];
        if (hasUnit === true)
            insert.cols.push({ col: unit.name, val: new sql.ExpVar(unit.name) });
        insert = factory.createInsert();
        stats.push(insert);
        insert.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.flow);
        insert.cols = [
            { col: 'sheet', val: new sql.ExpVar(id) },
            { col: 'date', val: new sql.ExpVar('now') },
            { col: 'user', val: new sql.ExpVar('$user') },
            { col: 'flow', val: new sql.ExpNum(0) },
            { col: 'state', val: new sql.ExpVar(startState) },
        ];
        let selectUq = factory.createSelect();
        selectUq.toVar = true;
        selectUq.column(new sql.ExpField('value'), uq);
        selectUq.from(new statementWithFrom_1.EntityTable('$setting', false));
        let where;
        let eqName = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('uqId'));
        if (hasUnit === true) {
            where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), sql_1.ExpVal.num0), eqName);
        }
        else {
            where = eqName;
        }
        selectUq.where(where);
        stats.push(selectUq);
        select = factory.createSelect();
        stats.push(select);
        select.column(new sql.ExpVar(id), 'id')
            .column(new sql.ExpVar(no), 'no')
            .column(new sql.ExpVar('$user'), 'user')
            .column(new sql.ExpVar('now'), 'date')
            .column(new sql.ExpVar(sheet), 'sheet')
            .column(new sql.ExpVar('sheetName'), 'name')
            .column(new sql.ExpVar(version), 'version')
            .column(new sql.ExpNum(0), 'flow')
            .column(new sql.ExpVar(discription.name), 'discription')
            .column(new sql.ExpStr(startState), 'state')
            .column(new sql.ExpNum(0), 'processing')
            .column(new sql.ExpVar(app.name), 'app')
            .column(new sql.ExpVar(uq), 'uq')
            .column(new sql.ExpFunc(factory.func_concat, new sql.ExpStr('['), new sql.ExpVar('$user'), new sql.ExpStr(']')), 'to');
        stats.push(proc.createCommit());
    }
    sheetDetailSaveProc(proc) {
        proc.addUnitUserParameter();
        let sheet = il.bigIntField('sheet');
        let arr = il.tinyIntField('arr');
        let row = il.smallIntField('row');
        let data = il.textField('data');
        proc.parameters.push(sheet, arr, row, data);
    }
    sheetToProc(proc) {
        proc.addUnitUserParameter();
        let sheet = il.bigIntField('sheet');
        let toArr = il.textField('toArr');
        let { unitField, factory, hasUnit } = this.context;
        proc.parameters.push(sheet, toArr);
        let stats = proc.statements;
        stats.push(proc.createTransaction());
        let sheetToTable = this.context.sysTable(il_1.EnumSysTable.sheetTo);
        let del = factory.createDelete();
        stats.push(del);
        del.tables = [sheetToTable];
        del.where(new sql.ExpAnd(new sql.ExpEQ(new sql.ExpField(sheet.name), new sql.ExpVar(sheet.name))));
        let ifSheet = factory.createIf();
        stats.push(ifSheet);
        let sheetSelect = factory.createSelect();
        ifSheet.cmp = new sql_1.ExpNot(new sql_1.ExpExists(sheetSelect));
        sheetSelect.from(this.context.sysTable(il_1.EnumSysTable.$sheet));
        sheetSelect.col('id');
        sheetSelect.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(sheet.name)));
        sheetSelect.lock = select_1.LockType.update;
        let ret = proc.createLeaveProc();
        ifSheet.then(ret);
        let c = '$c', p = '$p', len = '$len', int = new il.Int;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(c, int);
        declare.var(p, int);
        declare.var(len, int);
        let set = factory.createSet();
        stats.push(set);
        set.equ(c, new sql.ExpNum(1));
        set = factory.createSet();
        stats.push(set);
        set.equ(len, new sql.ExpFunc(factory.func_length, new sql.ExpVar(toArr.name)));
        let loop = factory.createWhile();
        stats.push(loop);
        loop.no = 1;
        loop.cmp = new sql.ExpEQ(new sql.ExpNum(1), new sql.ExpNum(1));
        let lstats = loop.statements;
        set = factory.createSet();
        lstats.add(set);
        set.equ(p, new sql.ExpFunc(factory.func_charindex, new sql.ExpStr(','), new sql.ExpVar(toArr.name), new sql.ExpVar(c)));
        let iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql.ExpLE(new sql.ExpVar(p), new sql.ExpNum(0));
        set = factory.createSet();
        iff.then(set);
        set.equ(p, new sql.ExpAdd(new sql.ExpVar(len), new sql.ExpNum(1)));
        let insert = factory.createInsert();
        lstats.add(insert);
        insert.table = sheetToTable;
        insert.cols.push({
            col: 'to',
            val: new sql.ExpFunc('SUBSTRING', new sql.ExpVar(toArr.name), new sql.ExpVar(c), new sql.ExpSub(new sql.ExpVar(p), new sql.ExpVar(c)))
        }, { col: sheet.name, val: new sql.ExpVar(sheet.name) });
        if (hasUnit === true) {
            insert.cols.push({ col: unitField.name, val: new sql.ExpVar(unitField.name) });
        }
        iff = factory.createIf();
        lstats.add(iff);
        iff.cmp = new sql.ExpGE(new sql.ExpVar(p), new sql.ExpVar(len));
        let leave = factory.createBreak();
        iff.then(leave);
        leave.no = loop.no;
        set = factory.createSet();
        lstats.add(set);
        set.equ(c, new sql.ExpAdd(new sql.ExpVar(p), new sql.ExpNum(1)));
        stats.push(proc.createCommit());
    }
    sheetIdProc(proc) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let schemaName = il.charField('schemaName', 50);
        let id = il.bigIntField('id');
        proc.parameters.push(schemaName, id);
        let ta = 'a';
        let select = this.createSelectSheet(false); // factory.createSelect();
        select.column(new sql.ExpField('data', ta));
        proc.statements.push(select);
        let wheres = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpVar(id.name)));
        select.where(new sql.ExpAnd(...wheres));
        proc.statements.push(this.flowSelect(false));
    }
    sheetScanProc(proc) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let schemaName = il.charField('schemaName', 50);
        let id = il.bigIntField('id');
        proc.parameters.push(schemaName, id);
        let ta = 'a';
        let select = this.createSelectSheet(false); // factory.createSelect();
        select.column(new sql.ExpField('data', ta));
        proc.statements.push(select);
        let wheres = [];
        wheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(id.name)));
        select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpNum(1));
        //proc.statements.push(this.flowSelect(false));
    }
    flowSelect(isArchive) {
        let ta = 'a';
        let flow = this.context.factory.createSelect();
        ['date', 'user', 'flow'].forEach(v => flow.column(new sql_1.ExpField(v, ta)));
        ['preState', 'state', 'action'].forEach(v => {
            let constStr = this.context.factory.createSelect();
            constStr.column(new sql.ExpField('name'));
            constStr.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
            constStr.where(new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpField(v, ta)));
            flow.column(new sql.ExpSelect(constStr), v);
        });
        flow.from((0, dbContext_1.sysTable)(isArchive === true ? il_1.EnumSysTable.archiveFlow : il_1.EnumSysTable.flow, ta));
        flow.where(new sql_1.ExpEQ(new sql_1.ExpField('sheet', ta), new sql_1.ExpVar('id')));
        flow.order(new sql_1.ExpField('date', ta), 'asc');
        return flow;
    }
    sheetIdsProc(proc) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let ids = '$ids';
        let schemaName = il.charField('schemaName', 50);
        let stats = proc.statements;
        let paramIds = new il.Field();
        paramIds.name = ids;
        paramIds.dataType = new il.Text();
        proc.parameters.push(schemaName, paramIds);
        let varTable = this.splitIdsTable(stats, ids, ',');
        let t1 = 'a', t2 = 'c';
        let sel = this.createSelectSheet(false); // factory.createSelect();
        stats.push(sel);
        sel.join(il_1.JoinType.inner, new statementWithFrom_1.VarTable(varTable.name, t2))
            .on(new sql.ExpEQ(new sql.ExpField('id', t1), new sql.ExpField('id' /*vtId.name*/, t2)));
    }
    sheetStateProc(proc) {
        proc.addUnitUserParameter();
        let { hasUnit, factory } = this.context;
        let schemaName = il.charField('schemaName', 50);
        let state = il.charField('$state', 30);
        let pageStart = il.bigIntField('$pageStart');
        let pageSize = il.intField('$pageSize');
        proc.parameters.push(schemaName, state, pageStart, pageSize);
        let ta = 'a', tf = 'b', tc = 'c';
        let selectConstStr = factory.createSelect();
        selectConstStr.column(new sql.ExpField('id'));
        selectConstStr.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
        selectConstStr.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(state.name)));
        let select = factory.createSelect();
        proc.statements.push(select);
        select.from(this.context.sysTable(il_1.EnumSysTable.$sheet, ta));
        select.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.flow, tf))
            .on(new sql.ExpAnd(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tf)), new sql.ExpEQ(new sql.ExpField('flow', ta), new sql.ExpField('flow', tf))))
            .join(il_1.JoinType.join, this.context.sysTable(il_1.EnumSysTable.sheetTo, tc))
            .on(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tc)));
        exports.sheetFields.forEach(f => select.column(new sql.ExpField(f, ta)));
        let wheres = [];
        //wheres.push(new sql.ExpEQ(new sql.ExpField('processing', ta), new sql.ExpNum(0)));
        wheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(pageStart.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('state', tf), new sql.ExpSelect(selectConstStr)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('to', tc), new sql.ExpVar('$user')));
        let selectSheet = factory.createSelect();
        selectSheet.column(new sql.ExpField('id'));
        selectSheet.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectSheet.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta), new sql.ExpSelect(selectSheet)));
        select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpVar(pageSize.name));
        select.order(new sql.ExpField('id', ta), 'asc');
    }
    sheetStateUserProc(proc) {
        proc.addUnitUserParameter();
        let { hasUnit, factory } = this.context;
        let schemaName = il.charField('schemaName', 50);
        let state = il.charField('$state', 30);
        let user = il.bigIntField('user');
        let pageStart = il.bigIntField('$pageStart');
        let pageSize = il.intField('$pageSize');
        proc.parameters.push(schemaName, state, user, pageStart, pageSize);
        let ta = 'a', tf = 'b', tc = 'c';
        let selectConstStr = factory.createSelect();
        selectConstStr.column(new sql.ExpField('id'));
        selectConstStr.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
        selectConstStr.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(state.name)));
        let select = factory.createSelect();
        proc.statements.push(select);
        select.from(this.context.sysTable(il_1.EnumSysTable.$sheet, ta));
        select.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.flow, tf))
            .on(new sql.ExpAnd(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tf)), new sql.ExpEQ(new sql.ExpField('flow', ta), new sql.ExpField('flow', tf))));
        exports.sheetFields.forEach(f => select.column(new sql.ExpField(f, ta)));
        let wheres = [];
        wheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(pageStart.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('state', tf), new sql.ExpSelect(selectConstStr)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('user', ta), new sql.ExpVar('user')));
        let selectSheet = factory.createSelect();
        selectSheet.column(new sql.ExpField('id'));
        selectSheet.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectSheet.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta), new sql.ExpSelect(selectSheet)));
        select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpVar(pageSize.name));
        select.order(new sql.ExpField('id', ta), 'asc');
    }
    sheetStateMyProc(proc) {
        proc.addUnitUserParameter();
        let { factory } = this.context;
        let schemaName = il.charField('schemaName', 50);
        let state = il.charField('$state', 30);
        let pageStart = il.bigIntField('$pageStart');
        let pageSize = il.intField('$pageSize');
        proc.parameters.push(schemaName, state, pageStart, pageSize);
        let varPageSize = new sql_1.ExpVar(pageSize.name);
        let createIff = (order) => {
            let iif = factory.createIf();
            iif.cmp = new sql.ExpEQ(new sql.ExpVar(state.name), new sql.ExpStr('#'));
            let ta = 'a';
            let selectConstStr = factory.createSelect();
            selectConstStr.column(new sql.ExpField('id'));
            selectConstStr.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
            selectConstStr.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(state.name)));
            let selectSheetTypeId = factory.createSelect();
            selectSheetTypeId.column(new sql.ExpField('id'));
            selectSheetTypeId.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
            selectSheetTypeId.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));
            let selectArchive = factory.createSelect();
            selectArchive.from(this.context.sysTable(il_1.EnumSysTable.archive, ta));
            exports.archiveFields.forEach(f => selectArchive.column(new sql.ExpField(f, ta)));
            let archiveWheres = [];
            archiveWheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(pageStart.name)));
            archiveWheres.push(new sql.ExpEQ(new sql.ExpField('user', ta), new sql.ExpVar('$user')));
            archiveWheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta), new sql.ExpSelect(selectSheetTypeId)));
            selectArchive.where(new sql.ExpAnd(...archiveWheres));
            selectArchive.order(new sql.ExpField('id', ta), order);
            selectArchive.limit(varPageSize);
            let selectSheet = factory.createSelect();
            selectSheet.from(this.context.sysTable(il_1.EnumSysTable.$sheet, ta));
            exports.sheetFields.forEach(f => selectSheet.column(new sql.ExpField(f, ta)));
            let sheetWheres = [];
            sheetWheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(pageStart.name)));
            sheetWheres.push(new sql.ExpEQ(new sql.ExpField('user', ta), new sql.ExpVar('$user')));
            sheetWheres.push(new sql.ExpEQ(new sql.ExpField('processing', ta), new sql.ExpNum(0)));
            sheetWheres.push(new sql.ExpOr(new sql.ExpIsNull(new sql_1.ExpVar(state.name)), new sql.ExpEQ(new sql.ExpField('state', ta), new sql.ExpSelect(selectConstStr))));
            sheetWheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta), new sql.ExpSelect(selectSheetTypeId)));
            selectSheet.where(new sql.ExpAnd(...sheetWheres));
            selectSheet.order(new sql.ExpField('id', ta), order);
            selectSheet.limit(varPageSize);
            iif.then(selectArchive);
            iif.else(selectSheet);
            return iif;
        };
        let iifDesc = factory.createIf();
        proc.statements.push(iifDesc);
        iifDesc.cmp = new sql_1.ExpLT(varPageSize, sql_1.ExpVal.num0);
        let setNeg = factory.createSet();
        iifDesc.then(setNeg);
        setNeg.equ(pageSize.name, new sql_1.ExpNeg(varPageSize));
        iifDesc.then(createIff('desc'));
        iifDesc.else(createIff('asc'));
    }
    sheetStateCountProc(proc) {
        proc.addUnitUserParameter();
        let { hasUnit, factory } = this.context;
        let schemaName = il.charField('schemaName', 50);
        proc.parameters.push(schemaName);
        let selectConstStr = factory.createSelect();
        selectConstStr.column(new sql.ExpField('name'));
        selectConstStr.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
        selectConstStr.where(new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpField('state', 'b')));
        let select = factory.createSelect();
        proc.statements.push(select);
        select.column(new sql.ExpSelect(selectConstStr), 'state');
        select.column(new sql.ExpFunc('count', new sql_1.ExpField('sheet', 'a')), 'count');
        select.from(this.context.sysTable(il_1.EnumSysTable.$sheet, 'a'));
        select.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.flow, 'b'))
            .on(new sql.ExpAnd(new sql.ExpEQ(new sql.ExpField('id', 'a'), new sql.ExpField('sheet', 'b')), new sql.ExpEQ(new sql.ExpField('flow', 'a'), new sql.ExpField('flow', 'b'))))
            .join(il_1.JoinType.join, this.context.sysTable(il_1.EnumSysTable.sheetTo, 'c'))
            .on(new sql.ExpEQ(new sql.ExpField('id', 'a'), new sql.ExpField('sheet', 'c')));
        let selectSheet = factory.createSelect();
        selectSheet.column(new sql.ExpField('id'));
        selectSheet.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectSheet.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));
        let wheres = [];
        //wheres.push(new sql.ExpEQ(new sql.ExpField('processing', 'a'), new sql.ExpNum(0)));
        wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('sheet', 'a'), new sql.ExpSelect(selectSheet)));
        wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('to', 'c'), new sql.ExpVar('$user')));
        select.where(new sql.ExpAnd(...wheres));
        select.group(new sql_1.ExpField('state', 'b'));
    }
    createSelectSheet(isArchive) {
        let ta = 'a', tf = 'b';
        let tblSheet, tblFlow;
        if (isArchive === true) {
            tblSheet = il_1.EnumSysTable.archive;
            tblFlow = il_1.EnumSysTable.archiveFlow;
        }
        else {
            tblSheet = il_1.EnumSysTable.$sheet;
            tblFlow = il_1.EnumSysTable.flow;
        }
        let select = this.context.factory.createSelect();
        select.from(this.context.sysTable(tblSheet, ta));
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(tblFlow, false, tf))
            .on(new sql.ExpAnd(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tf)), new sql.ExpEQ(new sql.ExpField('flow', ta), new sql.ExpField('flow', tf))));
        exports.archiveFields.forEach(f => select.column(new sql.ExpField(f, ta)));
        let selectStateConstStr = this.context.factory.createSelect();
        selectStateConstStr.column(new sql.ExpField('name'));
        selectStateConstStr.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
        selectStateConstStr.where(new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpField('state', tf)));
        select.column(new sql.ExpSelect(selectStateConstStr), 'state');
        return select;
    }
}
exports.SheetProcedures = SheetProcedures;
//# sourceMappingURL=sheetProcs.js.map