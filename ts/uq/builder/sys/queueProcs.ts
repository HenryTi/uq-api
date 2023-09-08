import * as sql from '../sql';
import { EntityTable, VarTable } from '../sql/statementWithFrom';
import {
    ExpEQ, ExpField, ExpVar, ExpAnd, ExpNum, ExpGT, ExpAdd
    , ExpFunc, ExpOr, ExpIsNull, ExpVal, ExpIsNotNull, ExpFuncCustom, ExpLE
    , ExpGE, ExpMul, ExpLT, ExpNull, ExpSub, ExpFuncInUq, ExpCmp, ExpNeg, ExpSearchCase, ExpStr
} from '../sql';
import * as il from '../../il';
import { SysProcedures } from './sysProcedures';
import { bigIntField, BigInt, Int, intField, tinyIntField, Field, JoinType } from '../../il';
import { settingQueueInSeed } from '../consts';
import { LockType } from '../sql/select';
import { EnumSysTable, sysTable } from '../dbContext';

//const const_queueInPointer = 'queue_in_pointer';

export class QueueProcedures extends SysProcedures {
    build() {
        this.queueOutGetProc(this.sysProc('$message_queue_get'));
        this.queueOutSetProc(this.sysProc('$message_queue_set'));

        this.queueInAddProc(this.sysProc('$queue_in_add'));
        this.queueInGetProc(this.sysProc('$queue_in_get'));
        this.queueInSetProc(this.sysProc('$queue_in_set'));
        this.queueInDoneAgoProc(this.sysProc('$queue_in_done_ago'));
        this.modifyQueueProc(this.sysProc('$modify_queue'));
        this.modifyQueueMaxProc(this.sysProc('$modify_queue_max'));
        this.execQueueActProc(this.sysProc('$exec_queue_act'));
    }

    private queueOutGetProc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        let startParam = il.bigIntField('start');
        let deferParam = il.tinyIntField('defer');
        let countParam = il.intField('count');
        p.parameters.push(
            startParam,
            deferParam,
            countParam,
        );

        let stats = p.statements;
        const a = 'a', b = 'b';
        let select = factory.createSelect();
        stats.push(select);
        if (hasUnit === true) select.column(new ExpField('$unit'));
        select.column(new ExpField('id', a));
        select.column(new ExpField('to', a));
        select.column(new ExpField('action', a));
        select.column(new ExpField('subject', a));
        select.column(new ExpField('content', a));
        select.column(new ExpField('tries', a));
        select.column(new ExpField('stamp', a));
        select.column(new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update_time', a)), 'update_time');
        select.column(new ExpFuncCustom(factory.func_unix_timestamp), 'now');
        // 不管有没有$unit字段，都不需要比较$unit, 按id顺序取message就好了
        select.from(new EntityTable(EnumSysTable.messageQueue, false, a));
        select.join(JoinType.join, new EntityTable('$queue_defer', false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('id', a)));
        select.where(
            new ExpAnd(
                new ExpEQ(new ExpField('defer', b), new ExpVar('defer')),
                new ExpGT(new ExpField('id', b), new ExpVar('start')),
            )
        );
        select.order(new ExpField('id', b), 'asc');
        select.limit(new ExpVar('count'));
    }

    private queueOutSetProc(p: sql.Procedure) {
        p.addUnitParameter();
        let { factory, hasUnit, unitFieldName } = this.context;
        let idParam = il.bigIntField('id');
        let deferParam = intField('defer');
        let finish = 'finish';
        let finishParam = il.tinyIntField(finish);
        p.parameters.push(
            idParam,
            deferParam,
            finishParam,
        );

        let a = 'a', b = 'b';
        let exp0 = ExpVal.num0;
        let select = factory.createSelect();
        select.column(new ExpField('to', a));
        select.column(new ExpField('action', a));
        select.column(new ExpField('subject', a));
        select.column(new ExpField('content', a));
        select.column(new ExpField('stamp', a));
        select.column(new ExpField('create_time', a));
        if (hasUnit === true) {
            select.column(new ExpField(unitFieldName, a));
        }
        select.column(new ExpField('id', a));
        select.from(new EntityTable(EnumSysTable.messageQueue, hasUnit, a))
            .join(JoinType.join, new EntityTable('$queue_defer', false, b))
            .on(new ExpEQ(new ExpField('id', a), new ExpField('id', b)));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('id', b), new ExpVar('id')),
            new ExpEQ(new ExpField('defer', b), new ExpVar('defer')),
        ));
        let cols = [
            { col: 'to', val: exp0 },
            { col: 'action', val: exp0 },
            { col: 'subject', val: exp0 },
            { col: 'content', val: exp0 },
            { col: 'stamp', val: new ExpNull() },
            { col: 'create_time', val: exp0 },
        ];
        let keys = [
            { col: 'id', val: exp0 },
        ];
        if (hasUnit === true) {
            keys.unshift({ col: unitFieldName, val: exp0 });
        }

        let stats = p.statements;
        stats.push(p.createTransaction());

        let iff = factory.createIf();
        stats.push(iff);
        iff.cmp = new ExpEQ(new ExpVar(finish), ExpVal.num1); // 消息发送完成，删去
        let upsertEnd = factory.createUpsert();
        iff.then(upsertEnd);
        upsertEnd.cols = cols;
        upsertEnd.keys = keys;
        upsertEnd.select = select;
        upsertEnd.table = new EntityTable(EnumSysTable.messageQueueEnd, hasUnit);

        let del = factory.createDelete();
        iff.then(del);
        let tableMessageQueue = new EntityTable(EnumSysTable.messageQueue, hasUnit);
        del.tables = [tableMessageQueue];
        del.from(tableMessageQueue);
        del.where(new ExpAnd(new ExpEQ(new ExpField('id'), new ExpVar('id'))));
        let delDefer = factory.createDelete();
        iff.then(delDefer);
        let tableQueueDefer = new EntityTable('$queue_defer', false);
        delDefer.tables = [tableQueueDefer];
        delDefer.from(tableQueueDefer);
        delDefer.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar('id')),
            new ExpEQ(new ExpField('defer'), new ExpVar('defer')),
        ));
        let iff2 = factory.createIf();
        iff.else(iff2);
        iff2.cmp = new ExpEQ(new ExpVar(finish), new ExpNum(2)); // 消息发送失败，增加tries
        let update = factory.createUpdate();
        iff2.then(update);
        update.cols = [
            { col: 'tries', val: new ExpAdd(new ExpField('tries'), ExpVal.num1) },
        ];
        update.table = new EntityTable(EnumSysTable.messageQueue, hasUnit);
        update.where = new ExpAnd(new ExpEQ(new ExpField('id'), new ExpVar('id')));

        let iff3 = factory.createIf();
        iff2.else(iff3);
        iff3.cmp = new ExpEQ(new ExpVar(finish), new ExpNum(3)); // tris 多次，进入 message_failed
        let upsertFail = factory.createUpsert();
        iff3.then(upsertFail);
        upsertFail.cols = cols;
        upsertFail.keys = keys;
        upsertFail.select = select;
        upsertFail.table = new EntityTable(EnumSysTable.messageQueueFailed, hasUnit);

        iff3.then(del);
        iff3.then(delDefer);

        stats.push(p.createCommit());
    }

    private queueInAddProc(p: sql.Procedure) {
        let { factory, unitFieldName } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            il.intField(unitFieldName),
            il.bigIntField('to'),
            il.tinyIntField('defer'),
            il.bigIntField('msgId'),
            il.charField('bus', 100),
            il.charField('faceName', 50),
            il.textField('data'),
            il.intField('version'),
            il.intField('stamp'),
        );
        let declare = factory.createDeclare();
        declare.var('syncId', new BigInt());
        let varMsgId = new ExpVar('msgId');
        let varSyncId = new ExpVar('syncId');
        let varDefer = new ExpVar('defer');
        let tblUnit = sysTable(EnumSysTable.unit);

        let arr = ['to', 'bus', 'faceName', 'data', 'version', 'stamp'];
        statements.push(p.createTransaction());

        function createSelectSyncId() {
            let select = factory.createSelect();
            select.toVar = true;
            select.column(
                new ExpSearchCase(
                    [
                        new ExpEQ(new ExpVar('defer'), ExpNum.num0),
                        new ExpField('syncId')
                    ],
                    new ExpField('syncId1'),
                ),
                'syncId');
            select.from(tblUnit);
            select.where(new ExpEQ(new ExpField('unit'), new ExpVar('$unit')));
            select.lock = LockType.update;
            return select;
        }

        function createUpdateSyncId(defer: string) {
            let update = factory.createUpdate();
            update.table = tblUnit;
            let syncId = 'syncId' + defer;
            let start = 'start' + defer;
            update.cols = [
                {
                    col: syncId,
                    val: varMsgId
                },
                {
                    col: start,
                    val: new ExpSearchCase(
                        [
                            new ExpIsNull(new ExpField(start)),
                            varMsgId
                        ],
                        new ExpField(start)
                    )
                }
            ];
            update.where = new ExpEQ(new ExpField('unit'), new ExpVar(unitFieldName));
            return update;
        }

        // if defer neg, local bus message
        let ifNegDefer = factory.createIf();
        statements.push(ifNegDefer);
        ifNegDefer.cmp = new ExpLT(varDefer, ExpNum.num0);
        let setDefer0 = factory.createSet();
        ifNegDefer.then(setDefer0);
        setDefer0.equ('defer', ExpNum.num0);

        ifNegDefer.else(createSelectSyncId());
        let ifInvalidMsg = factory.createIf();
        ifNegDefer.else(ifInvalidMsg);
        ifInvalidMsg.cmp = new ExpAnd(
            new ExpIsNotNull(varSyncId),
            new ExpLE(varMsgId, varSyncId)
        );
        ifInvalidMsg.then(p.createLeaveProc());

        let ifDefer = factory.createIf();
        ifNegDefer.else(ifDefer);
        ifDefer.cmp = new ExpEQ(varDefer, ExpNum.num0);
        ifDefer.then(createUpdateSyncId(''));       // defer 0
        ifDefer.else(createUpdateSyncId('1'));      // defer 1

        let ifUnitInvalid = factory.createIf();
        ifNegDefer.else(ifUnitInvalid);
        ifUnitInvalid.cmp = new ExpLE(new ExpFunc(factory.func_rowCount), ExpVal.num0);
        ifUnitInvalid.then(p.createLeaveProc());

        declare.var(settingQueueInSeed, new BigInt());
        statements.push(declare);

        /*
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpAnd(
            new ExpIsNotNull(new ExpVar('bus')),
            new ExpGT(new ExpFunc(factory.func_rowCount), ExpVal.num0)
        );
        */

        let iffBusNull = factory.createIf();
        statements.push(iffBusNull);
        iffBusNull.cmp = new ExpIsNull(new ExpVar('bus'));
        iffBusNull.then(p.createLeaveProc());

        let ifNegUnit = factory.createIf();
        statements.push(ifNegUnit);
        ifNegUnit.cmp = new ExpLT(new ExpVar('$unit'), ExpNum.num0);
        let setNegUnit = factory.createSet();
        ifNegUnit.then(setNegUnit);
        setNegUnit.equ('$unit', new ExpNeg(new ExpVar('$unit')));

        statements.push(...this.context.tableSeed(settingQueueInSeed, settingQueueInSeed));

        let insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new EntityTable('$queue_in', false);
        insert.cols = arr.map(v => {
            return { col: v, val: new ExpVar(v) }
        });
        insert.cols.push(
            { col: 'unit', val: new ExpVar(unitFieldName) },
            { col: 'id', val: new ExpVar(settingQueueInSeed) },
            { col: 'defer', val: new ExpAdd(new ExpNum(10), new ExpVar('defer')) },
            { col: 'bus_text_id', val: new ExpFuncInUq('$textid', [new ExpVar('bus')], true) },
            { col: 'face_text_id', val: new ExpFuncInUq('$textid', [new ExpVar('faceName')], true) },
            { col: 'msg_unitx_id', val: new ExpVar('msgId') },
        );

        let insertDefer = factory.createInsert();
        statements.push(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new EntityTable('$queue_defer', false);
        insertDefer.cols = [
            { col: 'defer', val: new ExpAdd(new ExpNum(10), new ExpVar('defer')) },
            { col: 'id', val: new ExpVar(settingQueueInSeed) },
        ];

        statements.push(p.createCommit());
    }

    private queueInGetProc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            bigIntField('start'),
            tinyIntField('defer'),
            intField('count'),
        );
        /*
        let selectStart = factory.createSelect();
        statements.push(selectStart);
        selectStart.toVar = true;
        selectStart.from(new EntityTable('$setting', false));
        selectStart.column(new ExpField('big'), 'start');
        let wheres: ExpCmp[] = [
            new ExpEQ(new ExpField('name'), new ExpStr(const_queueInPointer)),
        ];
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField('$unit'), ExpNum.num0));
        }
        selectStart.where(new ExpAnd(...wheres));
        selectStart.lock = LockType.update;

        let ifStartNull = factory.createIf();
        statements.push(ifStartNull);
        ifStartNull.cmp = new ExpIsNull(new ExpVar('start'));
        let setStart0 = factory.createSet();
        ifStartNull.then(setStart0);
        setStart0.equ('start', ExpNum.num0);
        let insertQueueInPointer = factory.createInsert();
        ifStartNull.then(insertQueueInPointer);
        insertQueueInPointer.ignore = true;
        insertQueueInPointer.table = new EntityTable('$setting', hasUnit);
        insertQueueInPointer.cols = [
            { col: 'name', val: new ExpStr(const_queueInPointer) },
            { col: 'big', val: new ExpVar('_start') }
        ]
        if (hasUnit === true) {
            insertQueueInPointer.cols.push({
                col: '$unit', val: new ExpVar('$unit'),
            });
        }
        */
        let a = 'a', b = 'b', c = 'c';
        let select = factory.createSelect();
        statements.push(select);
        select.column(new ExpField('id', a));
        select.column(new ExpField('unit', a));
        select.column(new ExpField('to', a));
        select.column(new ExpFuncInUq('$idtext', [new ExpField('bus_text_id', a)], true), 'bus');
        select.column(new ExpFuncInUq('$idtext', [new ExpField('face_text_id', a)], true), 'faceName');
        select.column(new ExpField('data', a));
        select.column(new ExpField('version', a));
        select.column(new ExpField('stamp', a));
        select.column(new ExpField('tries', a), 'tries');
        select.column(
            new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update_time', a)),
            'update_time'
        );
        select.column(new ExpFuncCustom(factory.func_unix_timestamp), 'now');
        select.from(new EntityTable('$queue_defer', false, b))
            .join(JoinType.join, new EntityTable('$queue_in', false, a))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('id', b), new ExpField('id', a)),
                new ExpEQ(new ExpField('defer', b), new ExpAdd(new ExpNum(10), new ExpVar('defer'))),
            ));
        select.where(
            new ExpAnd(
                new ExpGT(new ExpField('id', b), new ExpVar('start')),
                new ExpGE(
                    new ExpSub(
                        new ExpFuncCustom(factory.func_unix_timestamp),
                        new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update_time', a)),
                    ),
                    new ExpMul(
                        new ExpField('tries', a),
                        new ExpNum(60 * 10),
                    )
                )
            )
        );
        select.order(new ExpField('id', b), 'asc');
        select.limit(new ExpVar('count'));
    }

    private queueInSetProc(p: sql.Procedure) {
        let { factory } = this.context;
        let idParam = il.bigIntField('id');
        let deferParam = intField('defer');
        let finish = 'finish';
        let finishParam = il.tinyIntField(finish);
        let versionParam = intField('version');
        p.parameters.push(
            idParam,
            deferParam,
            finishParam,
            versionParam,
        );

        let stats = p.statements;
        stats.push(p.createTransaction());
        let declare = factory.createDeclare();
        declare.var('$unit', new Int());

        let iff = factory.createIf();
        stats.push(iff);
        // 1 = ok
        iff.cmp = new ExpEQ(new ExpVar(finish), ExpVal.num1);
        // 消息处理完成，删去
        // 2022-02-18: 不再删去done
        /*
        let upsertDone = factory.createUpsert();
        iff.then(upsertDone);
        upsertDone.cols = cols;
        upsertDone.keys = keys;
        upsertDone.select = select;
        upsertDone.table = new EntityTable('$queue_i n_done', false);

        let del = factory.createDelete();
        iff.then(del);
        let tableQueueIn = new EntityTable('$queue_i n', false);
        del.tables = [tableQueueIn];
        del.from(tableQueueIn);
        del.where(new ExpAnd(new ExpEQ(new ExpField('id'), new ExpVar('id'))));
        */
        //iff.then(upsertQueueInPointer);
        let delDefer = factory.createDelete();
        iff.then(delDefer);
        let tableQueueDefer = new EntityTable('$queue_defer', false);
        delDefer.tables = [tableQueueDefer];
        delDefer.from(tableQueueDefer);
        delDefer.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar('id')),
            new ExpEQ(new ExpField('defer'), new ExpAdd(new ExpNum(10), new ExpVar('defer'))),
        ));

        //let iff2 = factory.createIf();
        let elseIfTry = new sql.Statements();
        iff.elseIf(new ExpEQ(new ExpVar(finish), new ExpNum(2)), elseIfTry);
        // 2 = moreTries
        //iff2.cmp = new ExpEQ(new ExpVar(finish), new ExpNum(2)); // 消息处理失败，增加tries
        let update = factory.createUpdate();
        elseIfTry.add(update);
        //iff2.then(update);
        update.cols = [
            { col: 'tries', val: new ExpAdd(new ExpField('tries'), ExpVal.num1) },
        ];
        update.table = new EntityTable('$queue_in', false);
        update.where = new ExpAnd(new ExpEQ(new ExpField('id'), new ExpVar('id')));

        let elseIfBad = new sql.Statements();
        iff.elseIf(new ExpEQ(new ExpVar(finish), new ExpNum(3)), elseIfBad);
        elseIfBad.add(delDefer);
        //let iff3 = factory.createIf();
        //iff2.else(iff3);
        // 3 = bad
        //iff3.cmp = new ExpEQ(new ExpVar(finish), new ExpNum(3)); // tris 多次，进入 queue_in_bad
        /*
        let upsertBad = factory.createUpsert();
        iff3.then(upsertBad);
        upsertBad.cols = cols;
        upsertBad.keys = keys;
        upsertBad.select = select;
        upsertBad.table = new EntityTable('$queue_i n_bad', false);
        */
        // iff3.then(del);
        //iff3.then(upsertQueueInPointer);
        //iff3.then(delDefer);

        stats.push(p.createCommit());
    }

    private queueInDoneAgoProc(p: sql.Procedure) {
        const { parameters, statements } = p;
        const { factory } = this.context;
        parameters.push(intField('unit'));

        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField('negStart'),
            bigIntField('negStart1'),
            bigIntField('syncId'),
            bigIntField('syncId1'),
            bigIntField('start'),
            bigIntField('start1'),
        );

        statements.push(p.createTransaction());
        let expUnit: ExpVal = new ExpVar('unit');
        let ifPositive = factory.createIf();
        statements.push(ifPositive);
        ifPositive.cmp = new ExpGE(expUnit, ExpNum.num0);
        ifPositive.then(p.createLeaveProc());

        function createSelect(field: string, neg: boolean) {
            let select = factory.createSelect();
            select.toVar = true;
            select.col(field, field, 'a');
            let field1 = field + '1';
            select.col(field1, field1, 'a');
            select.from(sysTable(EnumSysTable.unit, 'a'));
            select.where(
                new ExpEQ(
                    new ExpField('unit', 'a'),
                    neg === true ? new ExpNeg(expUnit) : expUnit
                )
            );
            select.lock = LockType.update;
            return select;
        }
        let selectNeg = createSelect('syncId', false);
        selectNeg.col('start', 'negStart');
        selectNeg.col('start1', 'negStart1');
        statements.push(selectNeg);
        statements.push(createSelect('start', true));

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpAnd(
            new ExpGE(new ExpVar('syncId'), new ExpVar('start')),
            new ExpGE(new ExpVar('syncId1'), new ExpVar('start1')),
        );
        let log = factory.createLog();
        iff.then(log);
        log.unit = expUnit;
        log.uq = new ExpStr(this.context.dbName);
        log.subject = new ExpFunc(factory.func_concat, new ExpStr('Remove Neg Unit '), expUnit);
        log.content = new ExpFunc(
            factory.func_concat,
            new ExpStr('start='), new ExpVar('start'), new ExpStr('\\n'),
            new ExpStr('start1='), new ExpVar('start1'), new ExpStr('\\n'),
            new ExpStr('-start='), new ExpVar('negStart'), new ExpStr('\\n'),
            new ExpStr('-start1='), new ExpVar('negStart1'), new ExpStr('\\n'),
        );

        let update = factory.createUpdate();
        iff.then(update);
        update.table = sysTable(EnumSysTable.unit);
        update.cols = [
            { col: 'start', val: new ExpVar('negStart') },
            { col: 'start1', val: new ExpVar('negStart1') },
        ];
        update.where = new ExpEQ(new ExpField('unit'), new ExpNeg(expUnit));

        let del = factory.createDelete();
        iff.then(del);
        let tblUnit = sysTable(EnumSysTable.unit);
        del.tables = [tblUnit];
        del.from(tblUnit);
        del.where(new ExpEQ(new ExpField('unit'), expUnit));
        statements.push(p.createCommit());
    }

    private modifyQueueProc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        p.addUnitParameter();
        let start = il.bigIntField('start');
        let page = il.intField('page');
        let entities = il.textField('entities');
        p.parameters.push(
            start,
            page,
            entities
        );
        let stats = this.context.buildSplitStringToTable('tbl_entities', 'entity', 'entities', '\\t');
        p.statements.push(...stats);
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new ExpField('id', 'a'));
        select.column(new ExpField('entity', 'c'));
        select.column(new ExpField('key', 'a'));
        select.from(new EntityTable('$modify_queue', hasUnit, 'a'))
            .join(JoinType.join, sysTable(EnumSysTable.entity, 'b'))
            .on(new ExpEQ(new ExpField('entity', 'a'), new ExpField('id', 'b')));
        select.join(JoinType.join, new VarTable('tbl_entities', 'c'))
            .on(new ExpEQ(new ExpField('name', 'b'), new ExpField('entity', 'c')));
        select.where(new ExpGT(new ExpField('id', 'a'), new ExpVar('start')));
        select.order(new ExpField('id', 'a'), 'asc');
        select.limit(new ExpVar(page.name));

        let retSelectMax = this.selectQueueMax(); // factory.createSelect();
        p.statements.push(retSelectMax);
    }


    private modifyQueueMaxProc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        p.addUnitParameter();
        let retSelectMax = this.selectQueueMax(); // factory.createSelect();
        p.statements.push(retSelectMax);
        /*
        let selectMax = factory.createSelect();
        retSelectMax.column(new ExpFunc(factory.func_ifnull, new ExpSelect(selectMax), ExpVal.num0), 'max');
        selectMax.column(new ExpFunc(factory.func_max, new ExpField('id', 'a')));
        selectMax.from(new EntityTable('$modify_queue', hasUnit, 'a'));
        */
    }

    private selectQueueMax(): sql.Select {
        let { factory } = this.context;
        let retSelectMax = factory.createSelect();
        let valMax = ExpVal.num0;
        retSelectMax.column(new ExpFunc(factory.func_ifnull, new ExpField('modifyQueueMax'), valMax), 'max');
        retSelectMax.from(sysTable(EnumSysTable.unit));
        retSelectMax.where(new ExpEQ(new ExpField('unit'), new ExpVar('$unit')));
        return retSelectMax;
    }

    private execQueueActProc(p: sql.Procedure) {
        let { factory } = this.context;
        let { statements } = p;
        let select = factory.createSelect();
        statements.push(select);
        select.column(new ExpField('id', 'b'), 'entity');
        select.column(new ExpField('name', 'b'), 'entityName');
        select.column(new ExpFunc('unix_timestamp', new ExpField('exec_time', 'a')), 'exec_time');
        select.column(new ExpField('unit', 'a'), 'unit');
        select.column(new ExpField('param', 'a'), 'param');
        select.column(new ExpField('repeat', 'a'), 'repeat');
        select.column(new ExpField('interval', 'a'), 'interval');
        select.from(new EntityTable('$queue_act', false, 'a'));
        select.join(JoinType.join, sysTable(EnumSysTable.entity, 'b'))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('entity', 'a'), new ExpField('id', 'b')),
                new ExpEQ(new ExpField('valid', 'b'), ExpNum.num1)
            ));
        let wheres = [
            new ExpLE(
                new ExpField('exec_time', 'a'),
                new ExpFuncCustom(factory.func_current_timestamp)
            ),
            new ExpEQ(new ExpField('running', 'a'), ExpNum.num0),
        ]
        select.where(new ExpAnd(...wheres));
        select.order(new ExpField('exec_time'), 'asc');
    }
}
