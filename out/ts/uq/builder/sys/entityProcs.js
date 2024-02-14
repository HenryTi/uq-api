"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityProcedures = void 0;
const sql = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sql_1 = require("../sql");
const il = require("../../il");
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
class EntityProcedures extends sysProcedures_1.SysProcedures {
    build() {
        this.entitysProc(this.coreProc('$entitys'));
        this.entityProc(this.coreProc('$entity'));
        this.entityVersionProc(this.coreProc('$entity_version'));
        this.entityValidateProc(this.coreProc('$entity_validate'));
        this.entityNoProc(this.coreProc('$entity_no'));
        this.syncUnitsProc(this.sysProc('$sync_units'));
        this.pullNewProc(this.sysProc('$from_new')); // tuid or map 新的，需要同步
        this.pullNewSetProc(this.sysProc('$from_new_set'));
        this.pullModifyProc(this.sysProc('$sync_from'));
        this.pullModifySetProc(this.sysProc('$sync_from_set'));
        this.context.pullCheckProc(this.sysProc('$map_pull_check'), undefined, 'map');
    }
    entityNoProc(p) {
        let { factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        p.addUnitParameter();
        parameters.push(il.charField('entity', 100));
        parameters.push(il.dateField('date'));
        statements.push(p.createTransaction());
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('entityId', new il_1.Int());
        declare.var('docDate', new il_1.DDate());
        declare.var('no', new il_1.Int());
        let selectEntity = factory.createSelect();
        statements.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectEntity.col('id', 'entityId');
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('entity')));
        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('date', 'a'), 'docDate');
        select.column(new sql_1.ExpField('no', 'a'), 'no');
        select.from(new statementWithFrom_1.EntityTable('$no', hasUnit, 'a'));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('sheet', 'a'), new sql_1.ExpVar('entityId')), new sql_1.ExpGE(new sql_1.ExpField('date', 'a'), new sql_1.ExpVar('date'))));
        select.lock = select_1.LockType.update;
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpOr(new sql_1.ExpIsNull(new sql_1.ExpVar('docDate')), new sql_1.ExpIsNull(new sql_1.ExpVar('no')));
        let setDate = factory.createSet();
        iff.then(setDate);
        setDate.equ('docDate', new sql_1.ExpVar('date'));
        let setNo = factory.createSet();
        iff.then(setNo);
        setNo.equ('no', sql_1.ExpNum.num1);
        let upsert = factory.createInsert();
        statements.push(upsert);
        upsert.table = new statementWithFrom_1.EntityTable('$no', hasUnit);
        upsert.keys.push({ col: 'sheet', val: new sql_1.ExpVar('entityId') });
        if (hasUnit === true) {
            upsert.keys.push({ col: '$unit', val: new sql_1.ExpVar('$unit') });
        }
        upsert.cols.push({ col: 'date', val: new sql_1.ExpVar('docDate') }, { col: 'no', val: new sql_1.ExpAdd(new sql_1.ExpVar('no'), sql_1.ExpNum.num1) });
        let selectRet = factory.createSelect();
        selectRet.column(new sql_1.ExpVar('docDate'), 'date');
        selectRet.column(new sql_1.ExpVar('no'), 'no');
        statements.push(selectRet);
        statements.push(p.createCommit());
    }
    syncUnitsProc(p) {
        let { statements } = p;
        let { factory } = this.context;
        statements.push(factory.createTransaction());
        let selectSyncs = factory.createSelect();
        statements.push(selectSyncs);
        selectSyncs.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.unit, 'a'));
        selectSyncs.column(new sql_1.ExpField('unit', 'a'), 'unit');
        selectSyncs.column(new sql_1.ExpField('syncId', 'a'), 'maxId');
        selectSyncs.column(new sql_1.ExpField('syncId1', 'a'), 'maxId1');
        selectSyncs.column(new sql_1.ExpField('start', 'a'), 'start');
        selectSyncs.column(new sql_1.ExpField('start1', 'a'), 'start1');
        selectSyncs.lock = select_1.LockType.update;
        statements.push(factory.createCommit());
    }
    pullNewProc(p) {
        let { factory, hasUnit, unitField } = this.context;
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql_1.ExpField('id', 'a'));
        if (hasUnit === true) {
            select.column(new sql_1.ExpField(unitField.name, 'a'), 'unit');
        }
        select.column(new sql_1.ExpField('tries'), 'a');
        select.column(new sql_1.ExpField('name', 'b'), 'entity'),
            select.column(new sql_1.ExpField('key', 'a'), 'key'),
            select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update_time')), 'update_time');
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp), 'now');
        select.from(new statementWithFrom_1.EntityTable('$from_new', false, 'a'));
        select.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.entity, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('entity', 'a'), new sql_1.ExpField('id', 'b')));
        select.order(new sql_1.ExpField('id', 'a'), 'asc');
        select.limit(new sql_1.ExpNum(100));
    }
    pullNewSetProc(p) {
        let { factory, hasUnit, unitField, unitFieldName } = this.context;
        let { parameters, statements } = p;
        p.addUnitParameter();
        parameters.push(il.bigIntField('id'));
        parameters.push(il.smallIntField('done'));
        let wheres = [new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id'))];
        if (hasUnit === true) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), new sql_1.ExpVar(unitFieldName)));
        }
        let iff = factory.createIf();
        statements.push(iff);
        // 2 = moreTries
        iff.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('done'), new sql_1.ExpNum(2));
        let update = factory.createUpdate();
        iff.then(update);
        update.table = new statementWithFrom_1.EntityTable('$from_new', hasUnit);
        update.cols = [{ col: 'tries', val: new sql_1.ExpAdd(new sql_1.ExpField('tries'), sql_1.ExpVal.num1) }];
        update.where = new sql_1.ExpAnd(...wheres);
        let iffBad = factory.createIf();
        iff.else(iffBad);
        // 3 = bad
        iffBad.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('done'), new sql_1.ExpNum(3));
        let select = factory.createSelect();
        select.col('id');
        select.col('entity');
        select.col('key');
        select.col('create_time');
        select.from(new statementWithFrom_1.EntityTable('$from_new', hasUnit));
        select.where(new sql_1.ExpAnd(...wheres));
        select.lock = select_1.LockType.update;
        let insert = factory.createInsert();
        iffBad.then(insert);
        insert.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.fromNewBad, hasUnit);
        insert.select = select;
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'entity', val: undefined },
            { col: 'key', val: undefined },
            { col: 'create_time', val: undefined },
        ];
        if (hasUnit === true) {
            select.col(unitFieldName);
            insert.cols.push({ col: unitFieldName, val: undefined });
        }
        let del = factory.createDelete();
        let tableFromNew = new statementWithFrom_1.EntityTable('$from_new', hasUnit);
        del.tables = [tableFromNew];
        del.from(tableFromNew);
        del.where(new sql_1.ExpAnd(...wheres));
        iff.else(del);
    }
    pullModifyProc(p) {
        let { factory, hasUnit } = this.context;
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql_1.ExpField('name', 'c'), 'entity');
        select.column(new sql_1.ExpField('modifyMax', 'b'));
        if (hasUnit === true) {
            select.column(new sql_1.ExpField('unit', 'a'));
            select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.unit, 'a'))
                .join(il_1.JoinType.cross, (0, dbContext_1.sysTable)(il_1.EnumSysTable.entity, 'c'))
                .on(new sql_1.ExpIsNotNull(new sql_1.ExpField('from', 'c')))
                .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable('$sync_from', false, 'b'))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('unit', 'a'), new sql_1.ExpField('$unit', 'b')), new sql_1.ExpEQ(new sql_1.ExpField('id', 'c'), new sql_1.ExpField('entity', 'b'))));
        }
        else {
            select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity, 'c'))
                .join(il_1.JoinType.left, new statementWithFrom_1.EntityTable('$sync_from', false, 'b'))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', 'c'), new sql_1.ExpField('entity', 'b')));
        }
        let selectTypes = factory.createSelect();
        selectTypes.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.const));
        selectTypes.col('id');
        selectTypes.where(new sql_1.ExpIn(new sql_1.ExpField('name'), new sql_1.ExpStr('tuid'), new sql_1.ExpStr('map')));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('valid', 'c'), sql_1.ExpVal.num1), new sql_1.ExpIn(new sql_1.ExpField('type', 'c'), new sql_1.ExpSelect(selectTypes))));
    }
    pullModifySetProc(p) {
        let { factory, hasUnit } = this.context;
        p.addUnitParameter();
        p.parameters.push(il.charField('entity', 100));
        p.parameters.push(il.bigIntField('modifyMax'));
        let upsert = factory.createInsert();
        p.statements.push(upsert);
        upsert.table = new statementWithFrom_1.EntityTable('$sync_from', hasUnit);
        upsert.cols = [
            { col: 'modifyMax', val: new sql_1.ExpVar('modifyMax') }
        ];
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('entity')));
        upsert.keys = [
            { col: 'entity', val: new sql_1.ExpSelect(selectEntity) }
        ];
        if (hasUnit === true) {
            upsert.keys.push({
                col: '$unit',
                val: new sql_1.ExpVar('$unit')
            });
        }
    }
    entityValidateProc(p) {
        let { factory } = this.context;
        p.parameters.push(il.textField('entities'), il.tinyIntField('valid'));
        let dec = factory.createDeclare();
        p.statements.push(dec);
        dec.var('p', new il.Int());
        dec.var('c', new il.Int());
        dec.var('len', new il.Int());
        let setLen = factory.createSet();
        p.statements.push(setLen);
        setLen.equ('len', new sql_1.ExpFunc(factory.func_length, new sql_1.ExpVar('entities')));
        let setP = factory.createSet();
        p.statements.push(setP);
        setP.equ('p', sql_1.ExpVal.num1);
        let loop = factory.createWhile();
        p.statements.push(loop);
        loop.no = 1;
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        let setC = factory.createSet();
        loop.statements.add(setC);
        setC.equ('c', new sql_1.ExpFunc(factory.func_charindex, new sql_1.ExpStr('\\t'), new sql_1.ExpVar('entities'), new sql_1.ExpVar('p')));
        let iff = factory.createIf();
        loop.statements.add(iff);
        iff.cmp = new sql_1.ExpLT(new sql_1.ExpVar('c'), sql_1.ExpVal.num1);
        let setPC = factory.createSet();
        iff.then(setPC);
        setPC.equ('c', new sql_1.ExpAdd(new sql_1.ExpVar('len'), sql_1.ExpVal.num1));
        let updateValid = factory.createUpdate();
        loop.statements.add(updateValid);
        updateValid.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.entity);
        updateValid.cols.push({
            col: 'valid',
            val: new sql_1.ExpVar('valid')
        });
        updateValid.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpFunc(factory.func_substr, new sql_1.ExpVar('entities'), new sql_1.ExpVar('p'), new sql_1.ExpSub(new sql_1.ExpVar('c'), new sql_1.ExpVar('p'))));
        let iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new sql_1.ExpGT(new sql_1.ExpVar('c'), new sql_1.ExpVar('len'));
        let leave = factory.createBreak();
        iffExit.then(leave);
        leave.no = 1;
        let setPAhead = factory.createSet();
        loop.statements.add(setPAhead);
        setPAhead.equ('p', new sql_1.ExpAdd(new sql_1.ExpVar('c'), sql_1.ExpVal.num1));
    }
    entitysProc(p) {
        p.parameters.push(il.tinyIntField('hasSource'));
        let { factory, hasUnit } = this.context;
        let select = factory.createSelect();
        p.statements.push(select);
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        select.column(new sql.ExpField('id'))
            .column(new sql.ExpField('name'))
            .column(new sql.ExpField('type'))
            .column(new sql.ExpField('version'))
            .column(new sql.ExpField('schema'))
            .column(new sql.ExpField('run'))
            .column(new sql.ExpSearchCase([new sql_1.ExpEQ(new sql_1.ExpVar('hasSource'), new sql.ExpNum(1)), new sql.ExpField('source')], sql_1.ExpVal.null), 'source')
            .column(new sql.ExpField('from'), 'from')
            .column(new sql.ExpField('private'), 'private');
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('valid'), sql_1.ExpVal.num1), new sql_1.ExpIsNotNull(new sql_1.ExpField('schema'))));
        let settings = factory.createSelect();
        p.statements.push(settings);
        settings.from(new statementWithFrom_1.EntityTable('$setting', false));
        settings.column(new sql.ExpField('name'));
        settings.column(new sql.ExpField('value'));
        if (hasUnit === true) {
            settings.where(new sql.ExpEQ(new sql.ExpField('$unit'), new sql.ExpNum(0)));
        }
    }
    entityProc(p) {
        p.addUnitUserParameter();
        let id = il.intField('id');
        let name = il.charField('name', 50);
        let type = il.smallIntField('type');
        let schema = il.textField('schema');
        let run = il.textField('run');
        let source = il.textField('source');
        let from = il.charField('from', 200);
        let open = il.tinyIntField('open');
        let isPrivate = il.tinyIntField('private');
        p.parameters.push(id, name, type, schema, run, source, from, open, isPrivate);
        let factory = this.context.factory;
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('version', new il.Int)
            .var('date', new il.DateTime)
            .var('versionDate', new il.DDate)
            .var('valid', new il.TinyInt);
        let setDate = factory.createSet();
        p.statements.push(setDate);
        setDate.equ('date', new sql.ExpFunc(factory.func_now));
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new sql.ExpIsNull(new sql.ExpVar(id.name));
        let selectIdFromName = factory.createSelect();
        iff.then(selectIdFromName);
        selectIdFromName.col('id', 'id');
        selectIdFromName.col('valid', 'valid');
        selectIdFromName.toVar = true;
        selectIdFromName.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectIdFromName.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('name')));
        let iffNameExists = factory.createIf();
        p.statements.push(iffNameExists);
        iffNameExists.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar('id'));
        let updateEntityValid = factory.createUpdate();
        iffNameExists.then(updateEntityValid);
        updateEntityValid.cols = [
            { col: 'valid', val: sql_1.ExpVal.num1 }
        ];
        updateEntityValid.where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')), new sql_1.ExpEQ(new sql_1.ExpVar('valid'), sql_1.ExpVal.num0));
        updateEntityValid.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.entity);
        let insert = factory.createInsert();
        iffNameExists.else(insert);
        insert.table = new sql.SqlSysTable(il_1.EnumSysTable.entity);
        insert.cols.push({ col: 'name', val: new sql.ExpVar(name.name) }, { col: 'date', val: new sql.ExpVar('date') });
        let set = factory.createSet();
        iffNameExists.else(set);
        set.equ(id.name, new sql.ExpFunc(factory.func_lastinsertid));
        let selectVersion = factory.createSelect();
        selectVersion.toVar = true;
        selectVersion.column(new sql.ExpField('version'), 'version');
        selectVersion.column(new sql.ExpField('date'), 'versionDate');
        selectVersion.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.version, false));
        selectVersion.where(new sql.ExpEQ(new sql.ExpField('entity'), new sql.ExpVar('id')));
        selectVersion.order(new sql.ExpField('date'), 'desc');
        selectVersion.limit(new sql.ExpNum(1));
        selectVersion.lock = select_1.LockType.update;
        iff = factory.createIf();
        iff.cmp = new sql.ExpIsNull(new sql.ExpVar('version'));
        let setVerion1 = factory.createSet();
        iff.then(setVerion1);
        setVerion1.equ('version', sql_1.ExpNum.num1);
        let setVersionInc = factory.createSet();
        iff.else(setVersionInc);
        setVersionInc.equ('version', new sql.ExpAdd(new sql.ExpVar('version'), sql_1.ExpNum.num1));
        let notSameSelect = factory.createSelect();
        notSameSelect.column(new sql.ExpField('id'));
        notSameSelect.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        notSameSelect.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')), new sql_1.ExpEQ(new sql_1.ExpField('type'), new sql_1.ExpVar('type')), new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('name')), new sql_1.ExpOr(new sql_1.ExpAnd(new sql_1.ExpIsNull(new sql_1.ExpField('schema')), new sql_1.ExpIsNull(new sql_1.ExpVar('schema'))), new sql_1.ExpEQBinary(new sql_1.ExpField('schema'), new sql_1.ExpVar('schema'))), new sql_1.ExpOr(new sql_1.ExpAnd(new sql_1.ExpIsNull(new sql_1.ExpField('run')), new sql_1.ExpIsNull(new sql_1.ExpVar('run'))), new sql_1.ExpEQBinary(new sql_1.ExpField('run'), new sql_1.ExpVar('run'))), new sql_1.ExpOr(new sql_1.ExpAnd(new sql_1.ExpIsNull(new sql_1.ExpField('source')), new sql_1.ExpIsNull(new sql_1.ExpVar('source'))), new sql_1.ExpEQBinary(new sql_1.ExpField('source'), new sql_1.ExpVar('source'))), new sql_1.ExpOr(new sql_1.ExpAnd(new sql_1.ExpIsNull(new sql_1.ExpField('from')), new sql_1.ExpIsNull(new sql_1.ExpVar('from'))), new sql_1.ExpEQBinary(new sql_1.ExpField('name'), new sql_1.ExpVar('name'))), new sql_1.ExpOr(new sql_1.ExpAnd(new sql_1.ExpIsNull(new sql_1.ExpField('open')), new sql_1.ExpIsNull(new sql_1.ExpVar('open'))), new sql_1.ExpEQ(new sql_1.ExpField('open'), new sql_1.ExpVar('open')))));
        let ifNotSame = factory.createIf();
        p.statements.push(ifNotSame);
        ifNotSame.then(selectVersion);
        ifNotSame.then(iff);
        ifNotSame.cmp = new sql_1.ExpNot(new sql_1.ExpExists(notSameSelect));
        let upsertVersion = factory.createInsert();
        ifNotSame.then(upsertVersion);
        upsertVersion.table = new sql.SqlSysTable(il_1.EnumSysTable.version);
        upsertVersion.keys.push({ col: 'entity', val: new sql.ExpVar('id') }, { col: 'date', val: new sql.ExpFunc(factory.func_date, new sql.ExpVar('date')) });
        upsertVersion.cols.push({ col: 'version', val: new sql.ExpVar('version') }, { col: 'schema', val: new sql.ExpVar(schema.name) }, { col: 'run', val: new sql.ExpVar(run.name) }, { col: 'source', val: new sql.ExpVar(source.name) });
        let update = factory.createUpdate();
        ifNotSame.then(update);
        update.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.entity);
        update.where = new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpVar(id.name));
        update.cols.push({ col: 'version', val: new sql.ExpVar('version') }, { col: 'type', val: new sql.ExpVar(type.name) }, { col: 'schema', val: new sql.ExpVar(schema.name) }, { col: 'run', val: new sql.ExpVar(run.name) }, { col: 'source', val: new sql.ExpVar('source') }, { col: 'from', val: new sql.ExpVar(from.name) }, { col: 'open', val: new sql.ExpVar(open.name) }, { col: 'private', val: new sql.ExpVar(isPrivate.name) });
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql.ExpVar('id'), 'id');
    }
    entityVersionProc(p) {
        p.parameters.push(il.charField('name', 50), il.intField('version'));
        let select = this.context.factory.createSelect();
        p.statements.push(select);
        select.column(new sql.ExpField('schema', 'a'));
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.version, false, 'a'));
        select.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.entity, 'b'));
        select.on(new sql.ExpEQ(new sql.ExpField('entity', 'a'), new sql.ExpField('id', 'b')));
        select.where(new sql.ExpAnd(new sql.ExpEQ(new sql.ExpField('name', 'b'), new sql.ExpVar('name')), new sql.ExpEQ(new sql.ExpField('version', 'a'), new sql.ExpVar('version'))));
    }
}
exports.EntityProcedures = EntityProcedures;
//# sourceMappingURL=entityProcs.js.map