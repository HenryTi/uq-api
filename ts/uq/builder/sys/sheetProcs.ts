import * as sql from '../sql';
import { Select, LockType } from '../sql/select';
import { EntityTable, VarTable } from '../sql/statementWithFrom';
import { ExpEQ, ExpField, ExpVar, ExpExists, ExpNot, ExpAnd, ExpStr, ExpCmp, ExpAdd, ExpVal, ExpLT, ExpNeg, ExpNum } from '../sql';
import * as il from '../../il';
import { SysProcedures } from './sysProcedures';
import { BigInt, JoinType } from '../../il';
import { settingQueueSeed, settingSheetSeed } from '../consts';
import { EnumSysTable, sysTable } from '../dbContext';

export const sheetFields = ['id', 'no', 'user', 'date', 'sheet', 'version', 'flow', 'discription', 'processing'];
export const archiveFields = sheetFields.slice(0, sheetFields.length - 1);

export class SheetProcedures extends SysProcedures {
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
    private sheetToQueueProc(proc: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        let $unit = '$unit';
        proc.addUnitParameter();
        proc.parameters.push(
            il.charField('name', 100),
            il.bigIntField('id'),
            il.textField('content')
        );
        let stats = proc.statements;
        //proc.declareRollbackHandler = true;
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(settingQueueSeed, new BigInt());
        stats.push(proc.createTransaction());
        let select = factory.createSelect();
        select.col('id');
        select.from(this.context.sysTable(EnumSysTable.sheet));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar('id')),
            new ExpEQ(new ExpField('processing'), ExpVal.num1),
        ));
        select.lock = LockType.update;

        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new ExpExists(select);
        let selectRet0 = factory.createSelect();
        iff.then(selectRet0);
        selectRet0.column(ExpVal.num0, 'ret');

        let update = factory.createUpdate();
        iff.else(update);
        update.table = this.context.sysTable(EnumSysTable.sheet);
        update.cols = [{ col: 'processing', val: new sql.ExpNum(1) }];
        let wheres = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpVar('id')));
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField($unit), new ExpVar($unit)));
        }
        update.where = new sql.ExpAnd(...wheres);

        this.context.tableSeed(settingQueueSeed, settingQueueSeed).forEach(v => iff.else(v));

        let insert = factory.createInsert();
        iff.else(insert);
        insert.table = new EntityTable(EnumSysTable.messageQueue, hasUnit);
        insert.cols = [
            { col: 'id', val: new ExpVar(settingQueueSeed) },
            { col: 'subject', val: new ExpVar('name') },
            { col: 'action', val: new ExpStr('sheet') },
            { col: 'content', val: new ExpVar('content') },
            { col: 'defer', val: ExpNum.num0 },
        ];
        if (hasUnit === true) {
            insert.cols.push({
                col: $unit, val: new ExpVar($unit)
            });
        }
        let insertDefer = factory.createInsert();
        iff.else(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new EntityTable('$queue_defer', false);
        insertDefer.cols = [
            { col: 'defer', val: ExpNum.num0 },
            { col: 'id', val: new ExpVar(settingQueueSeed) },
        ];
        let selectRet1 = factory.createSelect();
        iff.else(selectRet1);
        selectRet1.column(ExpVal.num1, 'ret');
        stats.push(proc.createCommit());
    }

    private sheetSaveProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let { factory } = this.context;
        let stats = proc.statements;
        let hasUnit = this.context.hasUnit;
        let unit = this.context.unitField;
        let sheetName = il.charField('sheetName', 50);
        let app = il.intField('app');
        let data = il.textField('data');
        let discription = il.charField('discription', 50);
        proc.parameters.push(
            sheetName,
            app,
            discription,
            data,
        );
        let now = 'now', date = 'date', no = 'no', noVal = 'noVal', noDate = 'noDate',
            sheet = 'sheet', version = 'version', id = 'id', startState = '$',
            uq = 'uq';
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
        select.from(sysTable(EnumSysTable.entity));
        select.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(sheetName.name)));

        select = factory.createSelect();
        stats.push(select);
        select.toVar = true;
        select.column(new sql.ExpAdd(new sql.ExpField('no'), new sql.ExpNum(1)), noVal)
            .column(new sql.ExpField('date'), noDate);
        select.from(new EntityTable('$no', this.context.hasUnit));
        let wheres: sql.ExpCmp[] = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('sheet'), new sql.ExpVar(sheet)));
        select.where(new sql.ExpAnd(...wheres));
        select.lock = LockType.update;

        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new sql.ExpAnd(
            new sql.ExpIsNotNull(new sql.ExpVar(noVal)),
            new sql.ExpEQ(new sql.ExpVar(noDate), new sql.ExpVar(date))
        );
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
        if (hasUnit === true) upsert.keys.unshift({ col: unit.name, val: new sql.ExpVar(unit.name) });

        set = factory.createSet();
        stats.push(set);
        let varDate = new sql.ExpVar(noDate), num2 = new sql.ExpNum(2),
            str0 = new sql.ExpStr('0');
        set.equ('no', new sql.ExpFunc(factory.func_concat,
            factory.lPad(new sql.ExpMod(new sql.ExpFunc(factory.func_year, varDate), new sql.ExpNum(100)),
                num2, str0),
            factory.lPad(new sql.ExpFunc(factory.func_month, varDate), num2, str0),
            factory.lPad(new sql.ExpFunc(factory.func_day, varDate), num2, str0),
            factory.lPad(new sql.ExpVar(noVal), new sql.ExpNum(6), str0)
        ));

        let selectConstStr = factory.createSelect();
        stats.push(selectConstStr);
        selectConstStr.toVar = true;
        selectConstStr.column(new sql.ExpField('id'), startState);
        selectConstStr.from(sysTable(EnumSysTable.const));
        selectConstStr.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpStr(startState)));

        let selectId = factory.createSelect();
        stats.push(selectId);
        selectId.toVar = true;
        selectId.column(new ExpAdd(new ExpField('big'), ExpVal.num1), 'id');
        selectId.from(new EntityTable('$setting', false));
        let selectIdWheres: ExpCmp[] = [new ExpEQ(new ExpField('name'), new ExpStr(settingSheetSeed))];
        if (hasUnit === true) selectIdWheres.push(new ExpEQ(new ExpField('$unit'), ExpVal.num0));
        selectId.where(new ExpAnd(...selectIdWheres));
        selectId.lock = LockType.update;

        let updateSeed = factory.createUpdate();
        stats.push(updateSeed);
        updateSeed.cols = [{ col: 'big', val: new ExpVar(id) }];
        updateSeed.table = new EntityTable('$setting', false);
        updateSeed.where = new ExpAnd(...selectIdWheres);

        let insert = factory.createInsert();
        stats.push(insert);
        insert.table = this.context.sysTable(EnumSysTable.sheet);
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
        if (hasUnit === true) insert.cols.unshift({ col: unit.name, val: new sql.ExpVar(unit.name) });
        //set = factory.createSet();
        //stats.push(set);
        //set.equ(id, new sql.ExpFunc(factory.func_lastinsertid));

        insert = factory.createInsert();
        stats.push(insert);
        insert.table = this.context.sysTable(EnumSysTable.sheetTo);
        insert.cols = [
            { col: 'sheet', val: new sql.ExpVar(id) },
            { col: 'to', val: new sql.ExpVar('$user') }
        ];
        if (hasUnit === true) insert.cols.push({ col: unit.name, val: new sql.ExpVar(unit.name) });

        insert = factory.createInsert();
        stats.push(insert);
        insert.table = sysTable(EnumSysTable.flow);
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
        selectUq.from(new EntityTable('$setting', false));
        let where: ExpCmp;
        let eqName = new ExpEQ(new ExpField('name'), new ExpStr('uqId'));
        if (hasUnit === true) {
            where = new ExpAnd(
                new ExpEQ(new ExpField('$unit'), ExpVal.num0),
                eqName
            );
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
            .column(new sql.ExpFunc(
                factory.func_concat,
                new sql.ExpStr('['),
                new sql.ExpVar('$user'),
                new sql.ExpStr(']')),
                'to'
            );

        stats.push(proc.createCommit());
    }

    private sheetDetailSaveProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let sheet = il.bigIntField('sheet');
        let arr = il.tinyIntField('arr');
        let row = il.smallIntField('row');
        let data = il.textField('data');
        proc.parameters.push(
            sheet, arr, row, data
        );
    }

    private sheetToProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let sheet = il.bigIntField('sheet');
        let toArr = il.textField('toArr');
        let { unitField, factory, hasUnit } = this.context;
        proc.parameters.push(
            sheet,
            toArr,
        );
        let stats = proc.statements;
        stats.push(proc.createTransaction());
        let sheetToTable = this.context.sysTable(EnumSysTable.sheetTo);
        let del = factory.createDelete();
        stats.push(del);
        del.tables = [sheetToTable];
        del.where(new sql.ExpAnd(
            new sql.ExpEQ(new sql.ExpField(sheet.name), new sql.ExpVar(sheet.name))
        ));

        let ifSheet = factory.createIf();
        stats.push(ifSheet);
        let sheetSelect = factory.createSelect();
        ifSheet.cmp = new ExpNot(new ExpExists(sheetSelect));
        sheetSelect.from(this.context.sysTable(EnumSysTable.sheet));
        sheetSelect.col('id');
        sheetSelect.where(new ExpEQ(new ExpField('id'), new ExpVar(sheet.name)));
        sheetSelect.lock = LockType.update;
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
        insert.cols.push(
            {
                col: 'to',
                val: new sql.ExpFunc('SUBSTRING', new sql.ExpVar(toArr.name), new sql.ExpVar(c), new sql.ExpSub(
                    new sql.ExpVar(p), new sql.ExpVar(c)
                ))
            },
            { col: sheet.name, val: new sql.ExpVar(sheet.name) },
        );
        if (hasUnit === true) {
            insert.cols.push(
                { col: unitField.name, val: new sql.ExpVar(unitField.name) },
            );
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

    private sheetIdProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let schemaName = il.charField('schemaName', 50);
        let id = il.bigIntField('id');
        proc.parameters.push(
            schemaName,
            id,
        );
        let ta = 'a';
        let select = this.createSelectSheet(false); // factory.createSelect();
        select.column(new sql.ExpField('data', ta));
        proc.statements.push(select);
        let wheres: sql.ExpCmp[] = [];
        wheres.push(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpVar(id.name)));
        select.where(new sql.ExpAnd(...wheres));

        proc.statements.push(this.flowSelect(false));
    }

    private sheetScanProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let schemaName = il.charField('schemaName', 50);
        let id = il.bigIntField('id');
        proc.parameters.push(
            schemaName,
            id,
        );
        let ta = 'a';
        let select = this.createSelectSheet(false); // factory.createSelect();
        select.column(new sql.ExpField('data', ta));
        proc.statements.push(select);
        let wheres: sql.ExpCmp[] = [];
        wheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(id.name)));
        select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpNum(1));

        //proc.statements.push(this.flowSelect(false));
    }

    protected flowSelect(isArchive: boolean): Select {
        let ta = 'a';
        let flow = this.context.factory.createSelect();
        ['date', 'user', 'flow'].forEach(v => flow.column(new ExpField(v, ta)));
        ['preState', 'state', 'action'].forEach(v => {
            let constStr = this.context.factory.createSelect();
            constStr.column(new sql.ExpField('name'));
            constStr.from(sysTable(EnumSysTable.const));
            constStr.where(new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpField(v, ta)));
            flow.column(new sql.ExpSelect(constStr), v);
        });
        flow.from(sysTable(isArchive === true ? EnumSysTable.archiveFlow : EnumSysTable.flow, ta));
        flow.where(new ExpEQ(new ExpField('sheet', ta), new ExpVar('id')));
        flow.order(new ExpField('date', ta), 'asc');
        return flow;
    }

    private sheetIdsProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let factory = this.context.factory;
        let ids = '$ids';
        let schemaName = il.charField('schemaName', 50);
        let stats = proc.statements;
        let paramIds = new il.Field();
        paramIds.name = ids;
        paramIds.dataType = new il.Text();
        proc.parameters.push(
            schemaName,
            paramIds
        );
        let varTable = this.splitIdsTable(stats, ids, ',');
        let t1 = 'a', t2 = 'c';
        let sel = this.createSelectSheet(false); // factory.createSelect();
        stats.push(sel);
        sel.join(JoinType.inner, new VarTable(varTable.name, t2))
            .on(new sql.ExpEQ(new sql.ExpField('id', t1), new sql.ExpField('id'/*vtId.name*/, t2)))
    }

    private sheetStateProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let { hasUnit, factory } = this.context;
        let schemaName = il.charField('schemaName', 50);
        let state = il.charField('$state', 30);
        let pageStart = il.bigIntField('$pageStart');
        let pageSize = il.intField('$pageSize');
        proc.parameters.push(
            schemaName,
            state,
            pageStart, pageSize
        );
        let ta = 'a', tf = 'b', tc = 'c';
        let selectConstStr = factory.createSelect();
        selectConstStr.column(new sql.ExpField('id'));
        selectConstStr.from(sysTable(EnumSysTable.const));
        selectConstStr.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(state.name)));
        let select = factory.createSelect();
        proc.statements.push(select);
        select.from(this.context.sysTable(EnumSysTable.sheet, ta));
        select.join(JoinType.join, sysTable(EnumSysTable.flow, tf))
            .on(new sql.ExpAnd(
                new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tf)),
                new sql.ExpEQ(new sql.ExpField('flow', ta), new sql.ExpField('flow', tf))
            ))
            .join(JoinType.join, this.context.sysTable(EnumSysTable.sheetTo, tc))
            .on(new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tc)));
        sheetFields.forEach(f => select.column(new sql.ExpField(f, ta)));
        let wheres: sql.ExpCmp[] = [];
        //wheres.push(new sql.ExpEQ(new sql.ExpField('processing', ta), new sql.ExpNum(0)));
        wheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(pageStart.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('state', tf),
            new sql.ExpSelect(selectConstStr)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('to', tc), new sql.ExpVar('$user')));
        let selectSheet = factory.createSelect();
        selectSheet.column(new sql.ExpField('id'));
        selectSheet.from(sysTable(EnumSysTable.entity));
        selectSheet.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta),
            new sql.ExpSelect(selectSheet),
        ));
        select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpVar(pageSize.name));
        select.order(new sql.ExpField('id', ta), 'asc');
    }

    private sheetStateUserProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let { hasUnit, factory } = this.context;
        let schemaName = il.charField('schemaName', 50);
        let state = il.charField('$state', 30);
        let user = il.bigIntField('user');
        let pageStart = il.bigIntField('$pageStart');
        let pageSize = il.intField('$pageSize');
        proc.parameters.push(
            schemaName,
            state,
            user,
            pageStart, pageSize
        );
        let ta = 'a', tf = 'b', tc = 'c';
        let selectConstStr = factory.createSelect();
        selectConstStr.column(new sql.ExpField('id'));
        selectConstStr.from(sysTable(EnumSysTable.const));
        selectConstStr.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(state.name)));
        let select = factory.createSelect();
        proc.statements.push(select);
        select.from(this.context.sysTable(EnumSysTable.sheet, ta));
        select.join(JoinType.join, sysTable(EnumSysTable.flow, tf))
            .on(new sql.ExpAnd(
                new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tf)),
                new sql.ExpEQ(new sql.ExpField('flow', ta), new sql.ExpField('flow', tf))
            ))
        sheetFields.forEach(f => select.column(new sql.ExpField(f, ta)));
        let wheres: sql.ExpCmp[] = [];
        wheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(pageStart.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('state', tf),
            new sql.ExpSelect(selectConstStr)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('user', ta), new sql.ExpVar('user')));
        let selectSheet = factory.createSelect();
        selectSheet.column(new sql.ExpField('id'));
        selectSheet.from(sysTable(EnumSysTable.entity));
        selectSheet.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));
        wheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta),
            new sql.ExpSelect(selectSheet),
        ));
        select.where(new sql.ExpAnd(...wheres));
        select.limit(new sql.ExpVar(pageSize.name));
        select.order(new sql.ExpField('id', ta), 'asc');
    }

    private sheetStateMyProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let { factory } = this.context;
        let schemaName = il.charField('schemaName', 50);
        let state = il.charField('$state', 30);
        let pageStart = il.bigIntField('$pageStart');
        let pageSize = il.intField('$pageSize');
        proc.parameters.push(
            schemaName,
            state,
            pageStart, pageSize
        );

        let varPageSize = new ExpVar(pageSize.name);

        let createIff = (order: 'asc' | 'desc') => {
            let iif = factory.createIf();
            iif.cmp = new sql.ExpEQ(new sql.ExpVar(state.name), new sql.ExpStr('#'));

            let ta = 'a';
            let selectConstStr = factory.createSelect();
            selectConstStr.column(new sql.ExpField('id'));
            selectConstStr.from(sysTable(EnumSysTable.const));
            selectConstStr.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(state.name)));
            let selectSheetTypeId = factory.createSelect();
            selectSheetTypeId.column(new sql.ExpField('id'));
            selectSheetTypeId.from(sysTable(EnumSysTable.entity));
            selectSheetTypeId.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));

            let selectArchive = factory.createSelect();
            selectArchive.from(this.context.sysTable(EnumSysTable.archive, ta));
            archiveFields.forEach(f => selectArchive.column(new sql.ExpField(f, ta)));
            let archiveWheres: sql.ExpCmp[] = [];
            archiveWheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(pageStart.name)));
            archiveWheres.push(new sql.ExpEQ(new sql.ExpField('user', ta), new sql.ExpVar('$user')));
            archiveWheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta),
                new sql.ExpSelect(selectSheetTypeId),
            ));
            selectArchive.where(new sql.ExpAnd(...archiveWheres));
            selectArchive.order(new sql.ExpField('id', ta), order);
            selectArchive.limit(varPageSize);

            let selectSheet = factory.createSelect();
            selectSheet.from(this.context.sysTable(EnumSysTable.sheet, ta));
            sheetFields.forEach(f => selectSheet.column(new sql.ExpField(f, ta)));
            let sheetWheres: sql.ExpCmp[] = [];
            sheetWheres.push(new sql.ExpGT(new sql.ExpField('id', ta), new sql.ExpVar(pageStart.name)));
            sheetWheres.push(new sql.ExpEQ(new sql.ExpField('user', ta), new sql.ExpVar('$user')));
            sheetWheres.push(new sql.ExpEQ(new sql.ExpField('processing', ta), new sql.ExpNum(0)));
            sheetWheres.push(
                new sql.ExpOr(
                    new sql.ExpIsNull(new ExpVar(state.name)),
                    new sql.ExpEQ(new sql.ExpField('state', ta), new sql.ExpSelect(selectConstStr)),
                ));
            sheetWheres.push(new sql.ExpEQ(new sql.ExpField('sheet', ta),
                new sql.ExpSelect(selectSheetTypeId),
            ));
            selectSheet.where(new sql.ExpAnd(...sheetWheres));
            selectSheet.order(new sql.ExpField('id', ta), order);
            selectSheet.limit(varPageSize);

            iif.then(selectArchive);
            iif.else(selectSheet);
            return iif;
        }

        let iifDesc = factory.createIf();
        proc.statements.push(iifDesc);
        iifDesc.cmp = new ExpLT(varPageSize, ExpVal.num0);
        let setNeg = factory.createSet();
        iifDesc.then(setNeg);
        setNeg.equ(pageSize.name, new ExpNeg(varPageSize));
        iifDesc.then(createIff('desc'));
        iifDesc.else(createIff('asc'));
    }

    private sheetStateCountProc(proc: sql.Procedure) {
        proc.addUnitUserParameter();
        let { hasUnit, factory } = this.context;
        let schemaName = il.charField('schemaName', 50);
        proc.parameters.push(
            schemaName,
        );
        let selectConstStr = factory.createSelect();
        selectConstStr.column(new sql.ExpField('name'));
        selectConstStr.from(sysTable(EnumSysTable.const));
        selectConstStr.where(new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpField('state', 'b')));
        let select = factory.createSelect();
        proc.statements.push(select);
        select.column(new sql.ExpSelect(selectConstStr), 'state');
        select.column(new sql.ExpFunc('count', new ExpField('sheet', 'a')), 'count');
        select.from(this.context.sysTable(EnumSysTable.sheet, 'a'));
        select.join(JoinType.join, sysTable(EnumSysTable.flow, 'b'))
            .on(new sql.ExpAnd(
                new sql.ExpEQ(new sql.ExpField('id', 'a'), new sql.ExpField('sheet', 'b')),
                new sql.ExpEQ(new sql.ExpField('flow', 'a'), new sql.ExpField('flow', 'b'))
            ))
            .join(JoinType.join, this.context.sysTable(EnumSysTable.sheetTo, 'c'))
            .on(new sql.ExpEQ(new sql.ExpField('id', 'a'), new sql.ExpField('sheet', 'c')));
        let selectSheet = factory.createSelect();
        selectSheet.column(new sql.ExpField('id'));
        selectSheet.from(sysTable(EnumSysTable.entity));
        selectSheet.where(new sql.ExpEQ(new sql.ExpField('name'), new sql.ExpVar(schemaName.name)));
        let wheres: sql.ExpCmp[] = [];
        //wheres.push(new sql.ExpEQ(new sql.ExpField('processing', 'a'), new sql.ExpNum(0)));
        wheres.push(new ExpEQ(new ExpField('sheet', 'a'), new sql.ExpSelect(selectSheet)));
        wheres.push(new ExpEQ(new ExpField('to', 'c'), new sql.ExpVar('$user')));
        select.where(new sql.ExpAnd(...wheres));
        select.group(new ExpField('state', 'b'));
    }

    protected createSelectSheet(isArchive: boolean): Select {
        let ta = 'a', tf = 'b';
        let tblSheet: EnumSysTable, tblFlow: EnumSysTable;
        if (isArchive === true) {
            tblSheet = EnumSysTable.archive;
            tblFlow = EnumSysTable.archiveFlow;
        }
        else {
            tblSheet = EnumSysTable.sheet;
            tblFlow = EnumSysTable.flow;
        }
        let select = this.context.factory.createSelect();
        select.from(this.context.sysTable(tblSheet, ta));
        select.join(JoinType.join, new EntityTable(tblFlow, false, tf))
            .on(new sql.ExpAnd(
                new sql.ExpEQ(new sql.ExpField('id', ta), new sql.ExpField('sheet', tf)),
                new sql.ExpEQ(new sql.ExpField('flow', ta), new sql.ExpField('flow', tf))
            ));
        archiveFields.forEach(f => select.column(new sql.ExpField(f, ta)));
        let selectStateConstStr = this.context.factory.createSelect();
        selectStateConstStr.column(new sql.ExpField('name'));
        selectStateConstStr.from(sysTable(EnumSysTable.const));
        selectStateConstStr.where(new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpField('state', tf)));
        select.column(new sql.ExpSelect(selectStateConstStr), 'state');
        return select;
    }
}
