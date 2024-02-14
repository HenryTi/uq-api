import * as sql from '../sql';
import { LockType } from '../sql/select';
import { EntityTable } from '../sql/statementWithFrom';
import {
    ExpEQ, ExpField, ExpVar, ExpIsNotNull,
    ExpExists, ExpNot, ExpNull, ExpAnd, ExpNum, ExpStr, ExpFunc,
    ExpAdd, ExpGT, ExpSub, ExpLT, ExpIsNull, ExpCmp, ExpSelect, ExpOr, ExpVal,
    ExpGE, ExpIn, ExpFuncCustom, ExpEQBinary
} from '../sql';
import * as il from '../../il';
import { SysProcedures } from './sysProcedures';
import { DDate, Int, EnumSysTable, JoinType } from '../../il';
import { sysTable } from '../dbContext';

export class EntityProcedures extends SysProcedures {
    build() {
        this.entitysProc(this.coreProc('$entitys'));
        this.entityProc(this.coreProc('$entity'));
        this.entityVersionProc(this.coreProc('$entity_version'));
        this.entityValidateProc(this.coreProc('$entity_validate'));
        this.entityNoProc(this.coreProc('$entity_no'));

        this.syncUnitsProc(this.sysProc('$sync_units'));
        this.pullNewProc(this.sysProc('$from_new'));           // tuid or map 新的，需要同步
        this.pullNewSetProc(this.sysProc('$from_new_set'));
        this.pullModifyProc(this.sysProc('$sync_from'));
        this.pullModifySetProc(this.sysProc('$sync_from_set'));
        this.context.pullCheckProc(this.sysProc('$map_pull_check'), undefined, 'map');
    }

    private entityNoProc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        p.addUnitParameter();
        parameters.push(il.charField('entity', 100));
        parameters.push(il.dateField('date'));
        statements.push(p.createTransaction());

        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('entityId', new Int());
        declare.var('docDate', new DDate());
        declare.var('no', new Int());

        let selectEntity = factory.createSelect();
        statements.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.col('id', 'entityId');
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpVar('entity')));

        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new ExpField('date', 'a'), 'docDate');
        select.column(new ExpField('no', 'a'), 'no');
        select.from(new EntityTable('$no', hasUnit, 'a'));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('sheet', 'a'), new ExpVar('entityId')),
            new ExpGE(new ExpField('date', 'a'), new ExpVar('date'))
        ));
        select.lock = LockType.update;

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpOr(
            new ExpIsNull(new ExpVar('docDate')),
            new ExpIsNull(new ExpVar('no'))
        );
        let setDate = factory.createSet();
        iff.then(setDate);
        setDate.equ('docDate', new ExpVar('date'));
        let setNo = factory.createSet();
        iff.then(setNo);
        setNo.equ('no', ExpNum.num1);

        let upsert = factory.createInsert();
        statements.push(upsert);
        upsert.table = new EntityTable('$no', hasUnit);
        upsert.keys.push({ col: 'sheet', val: new ExpVar('entityId') });
        if (hasUnit === true) {
            upsert.keys.push({ col: '$unit', val: new ExpVar('$unit') });
        }
        upsert.cols.push(
            { col: 'date', val: new ExpVar('docDate') },
            { col: 'no', val: new ExpAdd(new ExpVar('no'), ExpNum.num1) },
        );

        let selectRet = factory.createSelect();
        selectRet.column(new ExpVar('docDate'), 'date');
        selectRet.column(new ExpVar('no'), 'no');
        statements.push(selectRet);
        statements.push(p.createCommit());
    }

    private syncUnitsProc(p: sql.Procedure) {
        let { statements } = p;
        let { factory } = this.context;
        statements.push(factory.createTransaction());
        let selectSyncs = factory.createSelect();
        statements.push(selectSyncs);
        selectSyncs.from(sysTable(EnumSysTable.unit, 'a'));
        selectSyncs.column(new ExpField('unit', 'a'), 'unit');
        selectSyncs.column(new ExpField('syncId', 'a'), 'maxId');
        selectSyncs.column(new ExpField('syncId1', 'a'), 'maxId1');
        selectSyncs.column(new ExpField('start', 'a'), 'start');
        selectSyncs.column(new ExpField('start1', 'a'), 'start1');
        selectSyncs.lock = LockType.update;
        statements.push(factory.createCommit());
    }

    private pullNewProc(p: sql.Procedure) {
        let { factory, hasUnit, unitField } = this.context;
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new ExpField('id', 'a'));
        if (hasUnit === true) {
            select.column(new ExpField(unitField.name, 'a'), 'unit');
        }
        select.column(new ExpField('tries'), 'a');
        select.column(new ExpField('name', 'b'), 'entity'),
            select.column(new ExpField('key', 'a'), 'key'),
            select.column(new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update_time')), 'update_time');
        select.column(new ExpFuncCustom(factory.func_unix_timestamp), 'now');
        select.from(new EntityTable('$from_new', false, 'a'));
        select.join(JoinType.join, sysTable(EnumSysTable.entity, 'b'))
            .on(new ExpEQ(new ExpField('entity', 'a'), new ExpField('id', 'b')));
        select.order(new ExpField('id', 'a'), 'asc');
        select.limit(new ExpNum(100));
    }

    private pullNewSetProc(p: sql.Procedure) {
        let { factory, hasUnit, unitField, unitFieldName } = this.context;
        let { parameters, statements } = p;
        p.addUnitParameter();
        parameters.push(il.bigIntField('id'));
        parameters.push(il.smallIntField('done'));

        let wheres: ExpCmp[] = [new ExpEQ(new ExpField('id'), new ExpVar('id'))];
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)));
        }

        let iff = factory.createIf();
        statements.push(iff);
        // 2 = moreTries
        iff.cmp = new ExpEQ(new ExpVar('done'), new ExpNum(2));
        let update = factory.createUpdate();
        iff.then(update);
        update.table = new EntityTable('$from_new', hasUnit);
        update.cols = [{ col: 'tries', val: new ExpAdd(new ExpField('tries'), ExpVal.num1) }];
        update.where = new ExpAnd(...wheres);

        let iffBad = factory.createIf();
        iff.else(iffBad);
        // 3 = bad
        iffBad.cmp = new ExpEQ(new ExpVar('done'), new ExpNum(3));
        let select = factory.createSelect();
        select.col('id');
        select.col('entity');
        select.col('key');
        select.col('create_time');
        select.from(new EntityTable('$from_new', hasUnit));
        select.where(new ExpAnd(...wheres));
        select.lock = LockType.update;
        let insert = factory.createInsert();
        iffBad.then(insert);
        insert.table = new EntityTable(EnumSysTable.fromNewBad, hasUnit);
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
        let tableFromNew = new EntityTable('$from_new', hasUnit);
        del.tables = [tableFromNew];
        del.from(tableFromNew);
        del.where(new ExpAnd(...wheres));

        iff.else(del);
    }

    private pullModifyProc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new ExpField('name', 'c'), 'entity');
        select.column(new ExpField('modifyMax', 'b'));
        if (hasUnit === true) {
            select.column(new ExpField('unit', 'a'));
            select.from(sysTable(EnumSysTable.unit, 'a'))
                .join(JoinType.cross, sysTable(EnumSysTable.entity, 'c'))
                .on(new ExpIsNotNull(new ExpField('from', 'c')))
                .join(JoinType.left, new EntityTable('$sync_from', false, 'b'))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('unit', 'a'), new ExpField('$unit', 'b')),
                    new ExpEQ(new ExpField('id', 'c'), new ExpField('entity', 'b')),
                ));
        }
        else {
            select.from(sysTable(EnumSysTable.entity, 'c'))
                .join(JoinType.left, new EntityTable('$sync_from', false, 'b'))
                .on(new ExpEQ(new ExpField('id', 'c'), new ExpField('entity', 'b')));
        }

        let selectTypes = factory.createSelect();
        selectTypes.from(sysTable(EnumSysTable.const));
        selectTypes.col('id');
        selectTypes.where(new ExpIn(
            new ExpField('name'),
            new ExpStr('tuid'), new ExpStr('map'),
        ));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('valid', 'c'), ExpVal.num1),
            new ExpIn(
                new ExpField('type', 'c'),
                new ExpSelect(selectTypes),
            )
        ));
    }

    private pullModifySetProc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        p.addUnitParameter();
        p.parameters.push(il.charField('entity', 100));
        p.parameters.push(il.bigIntField('modifyMax'));
        let upsert = factory.createInsert();
        p.statements.push(upsert);
        upsert.table = new EntityTable('$sync_from', hasUnit);
        upsert.cols = [
            { col: 'modifyMax', val: new ExpVar('modifyMax') }
        ];
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpVar('entity')));
        upsert.keys = [
            { col: 'entity', val: new ExpSelect(selectEntity) }
        ];
        if (hasUnit === true) {
            upsert.keys.push({
                col: '$unit',
                val: new ExpVar('$unit')
            });
        }
    }

    private entityValidateProc(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            il.textField('entities'),
            il.tinyIntField('valid'),
        );
        let dec = factory.createDeclare();
        p.statements.push(dec);
        dec.var('p', new il.Int());
        dec.var('c', new il.Int());
        dec.var('len', new il.Int());

        let setLen = factory.createSet();
        p.statements.push(setLen);
        setLen.equ('len', new ExpFunc(factory.func_length, new ExpVar('entities')));
        let setP = factory.createSet();
        p.statements.push(setP);
        setP.equ('p', ExpVal.num1);
        let loop = factory.createWhile();
        p.statements.push(loop);
        loop.no = 1;
        loop.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);
        let setC = factory.createSet();
        loop.statements.add(setC);
        setC.equ('c', new ExpFunc(factory.func_charindex, new ExpStr('\\t'), new ExpVar('entities'), new ExpVar('p')));
        let iff = factory.createIf();
        loop.statements.add(iff);
        iff.cmp = new ExpLT(new ExpVar('c'), ExpVal.num1);
        let setPC = factory.createSet()
        iff.then(setPC);
        setPC.equ('c', new ExpAdd(new ExpVar('len'), ExpVal.num1));

        let updateValid = factory.createUpdate();
        loop.statements.add(updateValid);
        updateValid.table = sysTable(EnumSysTable.entity);
        updateValid.cols.push({
            col: 'valid',
            val: new ExpVar('valid')
        });
        updateValid.where = new ExpEQ(new ExpField('name'),
            new ExpFunc(factory.func_substr, new ExpVar('entities'), new ExpVar('p'), new ExpSub(new ExpVar('c'), new ExpVar('p'))));

        let iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new ExpGT(new ExpVar('c'), new ExpVar('len'));
        let leave = factory.createBreak();
        iffExit.then(leave);
        leave.no = 1;

        let setPAhead = factory.createSet();
        loop.statements.add(setPAhead);
        setPAhead.equ('p', new ExpAdd(new ExpVar('c'), ExpVal.num1));
    }

    private entitysProc(p: sql.Procedure) {
        p.parameters.push(
            il.tinyIntField('hasSource')
        );
        let { factory, hasUnit } = this.context;
        let select = factory.createSelect();
        p.statements.push(select);
        select.from(sysTable(EnumSysTable.entity));
        select.column(new sql.ExpField('id'))
            .column(new sql.ExpField('name'))
            .column(new sql.ExpField('type'))
            .column(new sql.ExpField('version'))
            .column(new sql.ExpField('schema'))
            .column(new sql.ExpField('run'))
            .column(
                new sql.ExpSearchCase(
                    [new ExpEQ(new ExpVar('hasSource'), new sql.ExpNum(1)), new sql.ExpField('source')],
                    ExpVal.null,
                ), 'source'
            )
            .column(new sql.ExpField('from'), 'from')
            .column(new sql.ExpField('private'), 'private');
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('valid'), ExpVal.num1),
            new ExpIsNotNull(new ExpField('schema')),
        ));
        let settings = factory.createSelect();
        p.statements.push(settings);
        settings.from(new EntityTable('$setting', false));
        settings.column(new sql.ExpField('name'));
        settings.column(new sql.ExpField('value'));
        if (hasUnit === true) {
            settings.where(new sql.ExpEQ(new sql.ExpField('$unit'), new sql.ExpNum(0)));
        }
    }

    private entityProc(p: sql.Procedure) {
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

        p.parameters.push(
            id,
            name,
            type,
            schema,
            run,
            source,
            from,
            open,
            isPrivate,
        );
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
        selectIdFromName.col('valid', 'valid')
        selectIdFromName.toVar = true;
        selectIdFromName.from(sysTable(EnumSysTable.entity));
        selectIdFromName.where(new ExpEQ(new ExpField('name'), new ExpVar('name')));

        let iffNameExists = factory.createIf();
        p.statements.push(iffNameExists);

        iffNameExists.cmp = new ExpIsNotNull(new ExpVar('id'));
        let updateEntityValid = factory.createUpdate();
        iffNameExists.then(updateEntityValid);
        updateEntityValid.cols = [
            { col: 'valid', val: ExpVal.num1 }
        ];
        updateEntityValid.where = new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar('id')),
            new ExpEQ(new ExpVar('valid'), ExpVal.num0));
        updateEntityValid.table = sysTable(EnumSysTable.entity);

        let insert = factory.createInsert();
        iffNameExists.else(insert);
        insert.table = new sql.SqlSysTable(EnumSysTable.entity);
        insert.cols.push(
            { col: 'name', val: new sql.ExpVar(name.name) },
            { col: 'date', val: new sql.ExpVar('date') },
        );
        let set = factory.createSet();
        iffNameExists.else(set);
        set.equ(id.name, new sql.ExpFunc(factory.func_lastinsertid));

        let selectVersion = factory.createSelect();
        selectVersion.toVar = true;
        selectVersion.column(new sql.ExpField('version'), 'version');
        selectVersion.column(new sql.ExpField('date'), 'versionDate');
        selectVersion.from(new EntityTable(EnumSysTable.version, false));
        selectVersion.where(new sql.ExpEQ(new sql.ExpField('entity'), new sql.ExpVar('id')));
        selectVersion.order(new sql.ExpField('date'), 'desc');
        selectVersion.limit(new sql.ExpNum(1));
        selectVersion.lock = LockType.update;

        iff = factory.createIf();
        iff.cmp = new sql.ExpIsNull(new sql.ExpVar('version'));
        let setVerion1 = factory.createSet();
        iff.then(setVerion1);
        setVerion1.equ('version', ExpNum.num1);
        let setVersionInc = factory.createSet();
        iff.else(setVersionInc);
        setVersionInc.equ('version', new sql.ExpAdd(new sql.ExpVar('version'), ExpNum.num1));

        let notSameSelect = factory.createSelect();
        notSameSelect.column(new sql.ExpField('id'));
        notSameSelect.from(sysTable(EnumSysTable.entity));
        notSameSelect.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar('id')),
            new ExpEQ(new ExpField('type'), new ExpVar('type')),
            new ExpEQ(new ExpField('name'), new ExpVar('name')),
            new ExpOr(
                new ExpAnd(
                    new ExpIsNull(new ExpField('schema')),
                    new ExpIsNull(new ExpVar('schema')),
                ),
                new ExpEQBinary(new ExpField('schema'), new ExpVar('schema'))
            ),
            new ExpOr(
                new ExpAnd(
                    new ExpIsNull(new ExpField('run')),
                    new ExpIsNull(new ExpVar('run')),
                ),
                new ExpEQBinary(new ExpField('run'), new ExpVar('run'))
            ),
            new ExpOr(
                new ExpAnd(
                    new ExpIsNull(new ExpField('source')),
                    new ExpIsNull(new ExpVar('source')),
                ),
                new ExpEQBinary(new ExpField('source'), new ExpVar('source'))
            ),
            new ExpOr(
                new ExpAnd(
                    new ExpIsNull(new ExpField('from')),
                    new ExpIsNull(new ExpVar('from')),
                ),
                new ExpEQBinary(new ExpField('name'), new ExpVar('name'))
            ),
            new ExpOr(
                new ExpAnd(
                    new ExpIsNull(new ExpField('open')),
                    new ExpIsNull(new ExpVar('open')),
                ),
                new ExpEQ(new ExpField('open'), new ExpVar('open'))
            ),
        ));

        let ifNotSame = factory.createIf();
        p.statements.push(ifNotSame);
        ifNotSame.then(selectVersion);
        ifNotSame.then(iff);
        ifNotSame.cmp = new ExpNot(new ExpExists(notSameSelect));
        let upsertVersion = factory.createInsert();
        ifNotSame.then(upsertVersion);
        upsertVersion.table = new sql.SqlSysTable(EnumSysTable.version);
        upsertVersion.keys.push(
            { col: 'entity', val: new sql.ExpVar('id') },
            { col: 'date', val: new sql.ExpFunc(factory.func_date, new sql.ExpVar('date')) },
        );
        upsertVersion.cols.push(
            { col: 'version', val: new sql.ExpVar('version') },
            { col: 'schema', val: new sql.ExpVar(schema.name) },
            { col: 'run', val: new sql.ExpVar(run.name) },
            { col: 'source', val: new sql.ExpVar(source.name) },
        );

        let update = factory.createUpdate();
        ifNotSame.then(update)
        update.table = sysTable(EnumSysTable.entity);
        update.where = new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpVar(id.name));
        update.cols.push(
            { col: 'version', val: new sql.ExpVar('version') },
            { col: 'type', val: new sql.ExpVar(type.name) },
            { col: 'schema', val: new sql.ExpVar(schema.name) },
            { col: 'run', val: new sql.ExpVar(run.name) },
            { col: 'source', val: new sql.ExpVar('source') },
            { col: 'from', val: new sql.ExpVar(from.name) },
            { col: 'open', val: new sql.ExpVar(open.name) },
            { col: 'private', val: new sql.ExpVar(isPrivate.name) },
        );

        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql.ExpVar('id'), 'id');
    }

    private entityVersionProc(p: sql.Procedure) {
        p.parameters.push(
            il.charField('name', 50),
            il.intField('version')
        );
        let select = this.context.factory.createSelect();
        p.statements.push(select);
        select.column(new sql.ExpField('schema', 'a'));
        select.from(new EntityTable(EnumSysTable.version, false, 'a'));
        select.join(JoinType.join, sysTable(EnumSysTable.entity, 'b'));
        select.on(new sql.ExpEQ(new sql.ExpField('entity', 'a'), new sql.ExpField('id', 'b')));
        select.where(new sql.ExpAnd(
            new sql.ExpEQ(new sql.ExpField('name', 'b'), new sql.ExpVar('name')),
            new sql.ExpEQ(new sql.ExpField('version', 'a'), new sql.ExpVar('version'))
        ));
    }
}
