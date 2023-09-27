"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueProcedures = void 0;
const sql = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sql_1 = require("../sql");
const il = require("../../il");
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const consts_1 = require("../consts");
const select_1 = require("../sql/select");
const dbContext_1 = require("../dbContext");
//const const_queueInPointer = 'queue_in_pointer';
class QueueProcedures extends sysProcedures_1.SysProcedures {
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
    queueOutGetProc(p) {
        let { factory, hasUnit } = this.context;
        let startParam = il.bigIntField('start');
        let deferParam = il.tinyIntField('defer');
        let countParam = il.intField('count');
        p.parameters.push(startParam, deferParam, countParam);
        let stats = p.statements;
        const a = 'a', b = 'b';
        let select = factory.createSelect();
        stats.push(select);
        if (hasUnit === true)
            select.column(new sql_1.ExpField('$unit'));
        select.column(new sql_1.ExpField('id', a));
        select.column(new sql_1.ExpField('to', a));
        select.column(new sql_1.ExpField('action', a));
        select.column(new sql_1.ExpField('subject', a));
        select.column(new sql_1.ExpField('content', a));
        select.column(new sql_1.ExpField('tries', a));
        select.column(new sql_1.ExpField('stamp', a));
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update_time', a)), 'update_time');
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp), 'now');
        // 不管有没有$unit字段，都不需要比较$unit, 按id顺序取message就好了
        select.from(new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.messageQueue, false, a));
        select.join(il_1.JoinType.join, new statementWithFrom_1.EntityTable('$queue_defer', false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id', a)));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('defer', b), new sql_1.ExpVar('defer')), new sql_1.ExpGT(new sql_1.ExpField('id', b), new sql_1.ExpVar('start'))));
        select.order(new sql_1.ExpField('id', b), 'asc');
        select.limit(new sql_1.ExpVar('count'));
    }
    queueOutSetProc(p) {
        p.addUnitParameter();
        let { factory, hasUnit, unitFieldName } = this.context;
        let idParam = il.bigIntField('id');
        let deferParam = (0, il_1.intField)('defer');
        let finish = 'finish';
        let finishParam = il.tinyIntField(finish);
        p.parameters.push(idParam, deferParam, finishParam);
        let a = 'a', b = 'b';
        let exp0 = sql_1.ExpVal.num0;
        let select = factory.createSelect();
        select.column(new sql_1.ExpField('to', a));
        select.column(new sql_1.ExpField('action', a));
        select.column(new sql_1.ExpField('subject', a));
        select.column(new sql_1.ExpField('content', a));
        select.column(new sql_1.ExpField('stamp', a));
        select.column(new sql_1.ExpField('create_time', a));
        if (hasUnit === true) {
            select.column(new sql_1.ExpField(unitFieldName, a));
        }
        select.column(new sql_1.ExpField('id', a));
        select.from(new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.messageQueue, hasUnit, a))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable('$queue_defer', false, b))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('id', b)));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpVar('id')), new sql_1.ExpEQ(new sql_1.ExpField('defer', b), new sql_1.ExpVar('defer'))));
        let cols = [
            { col: 'to', val: exp0 },
            { col: 'action', val: exp0 },
            { col: 'subject', val: exp0 },
            { col: 'content', val: exp0 },
            { col: 'stamp', val: sql_1.ExpVal.null },
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
        iff.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(finish), sql_1.ExpVal.num1); // 消息发送完成，删去
        let upsertEnd = factory.createUpsert();
        iff.then(upsertEnd);
        upsertEnd.cols = cols;
        upsertEnd.keys = keys;
        upsertEnd.select = select;
        upsertEnd.table = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.messageQueueEnd, hasUnit);
        let del = factory.createDelete();
        iff.then(del);
        let tableMessageQueue = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.messageQueue, hasUnit);
        del.tables = [tableMessageQueue];
        del.from(tableMessageQueue);
        del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id'))));
        let delDefer = factory.createDelete();
        iff.then(delDefer);
        let tableQueueDefer = new statementWithFrom_1.EntityTable('$queue_defer', false);
        delDefer.tables = [tableQueueDefer];
        delDefer.from(tableQueueDefer);
        delDefer.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')), new sql_1.ExpEQ(new sql_1.ExpField('defer'), new sql_1.ExpVar('defer'))));
        let iff2 = factory.createIf();
        iff.else(iff2);
        iff2.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(finish), new sql_1.ExpNum(2)); // 消息发送失败，增加tries
        let update = factory.createUpdate();
        iff2.then(update);
        update.cols = [
            { col: 'tries', val: new sql_1.ExpAdd(new sql_1.ExpField('tries'), sql_1.ExpVal.num1) },
        ];
        update.table = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.messageQueue, hasUnit);
        update.where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')));
        let iff3 = factory.createIf();
        iff2.else(iff3);
        iff3.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(finish), new sql_1.ExpNum(3)); // tris 多次，进入 message_failed
        let upsertFail = factory.createUpsert();
        iff3.then(upsertFail);
        upsertFail.cols = cols;
        upsertFail.keys = keys;
        upsertFail.select = select;
        upsertFail.table = new statementWithFrom_1.EntityTable(dbContext_1.EnumSysTable.messageQueueFailed, hasUnit);
        iff3.then(del);
        iff3.then(delDefer);
        stats.push(p.createCommit());
    }
    queueInAddProc(p) {
        let { factory, unitFieldName } = this.context;
        let { parameters, statements } = p;
        parameters.push(il.intField(unitFieldName), il.bigIntField('to'), il.tinyIntField('defer'), il.bigIntField('msgId'), il.charField('bus', 100), il.charField('faceName', 50), il.textField('data'), il.intField('version'), il.intField('stamp'));
        let declare = factory.createDeclare();
        declare.var('syncId', new il_1.BigInt());
        let varMsgId = new sql_1.ExpVar('msgId');
        let varSyncId = new sql_1.ExpVar('syncId');
        let varDefer = new sql_1.ExpVar('defer');
        let tblUnit = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit);
        let arr = ['to', 'bus', 'faceName', 'data', 'version', 'stamp'];
        statements.push(p.createTransaction());
        function createSelectSyncId() {
            let select = factory.createSelect();
            select.toVar = true;
            select.column(new sql_1.ExpSearchCase([
                new sql_1.ExpEQ(new sql_1.ExpVar('defer'), sql_1.ExpNum.num0),
                new sql_1.ExpField('syncId')
            ], new sql_1.ExpField('syncId1')), 'syncId');
            select.from(tblUnit);
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar('$unit')));
            select.lock = select_1.LockType.update;
            return select;
        }
        function createUpdateSyncId(defer) {
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
                    val: new sql_1.ExpSearchCase([
                        new sql_1.ExpIsNull(new sql_1.ExpField(start)),
                        varMsgId
                    ], new sql_1.ExpField(start))
                }
            ];
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar(unitFieldName));
            return update;
        }
        // if defer neg, local bus message
        let ifNegDefer = factory.createIf();
        statements.push(ifNegDefer);
        ifNegDefer.cmp = new sql_1.ExpLT(varDefer, sql_1.ExpNum.num0);
        let setDefer0 = factory.createSet();
        ifNegDefer.then(setDefer0);
        setDefer0.equ('defer', sql_1.ExpNum.num0);
        ifNegDefer.else(createSelectSyncId());
        let ifInvalidMsg = factory.createIf();
        ifNegDefer.else(ifInvalidMsg);
        ifInvalidMsg.cmp = new sql_1.ExpAnd(new sql_1.ExpIsNotNull(varSyncId), new sql_1.ExpLE(varMsgId, varSyncId));
        ifInvalidMsg.then(p.createLeaveProc());
        let ifDefer = factory.createIf();
        ifNegDefer.else(ifDefer);
        ifDefer.cmp = new sql_1.ExpEQ(varDefer, sql_1.ExpNum.num0);
        ifDefer.then(createUpdateSyncId('')); // defer 0
        ifDefer.else(createUpdateSyncId('1')); // defer 1
        let ifUnitInvalid = factory.createIf();
        ifNegDefer.else(ifUnitInvalid);
        ifUnitInvalid.cmp = new sql_1.ExpLE(new sql_1.ExpFunc(factory.func_rowCount), sql_1.ExpVal.num0);
        ifUnitInvalid.then(p.createLeaveProc());
        declare.var(consts_1.settingQueueInSeed, new il_1.BigInt());
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
        iffBusNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('bus'));
        iffBusNull.then(p.createLeaveProc());
        let ifNegUnit = factory.createIf();
        statements.push(ifNegUnit);
        ifNegUnit.cmp = new sql_1.ExpLT(new sql_1.ExpVar('$unit'), sql_1.ExpNum.num0);
        let setNegUnit = factory.createSet();
        ifNegUnit.then(setNegUnit);
        setNegUnit.equ('$unit', new sql_1.ExpNeg(new sql_1.ExpVar('$unit')));
        statements.push(...this.context.tableSeed(consts_1.settingQueueInSeed, consts_1.settingQueueInSeed));
        let insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable('$queue_in', false);
        insert.cols = arr.map(v => {
            return { col: v, val: new sql_1.ExpVar(v) };
        });
        insert.cols.push({ col: 'unit', val: new sql_1.ExpVar(unitFieldName) }, { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueInSeed) }, { col: 'defer', val: new sql_1.ExpAdd(new sql_1.ExpNum(10), new sql_1.ExpVar('defer')) }, { col: 'bus_text_id', val: new sql_1.ExpFuncInUq('$textid', [new sql_1.ExpVar('bus')], true) }, { col: 'face_text_id', val: new sql_1.ExpFuncInUq('$textid', [new sql_1.ExpVar('faceName')], true) }, { col: 'msg_unitx_id', val: new sql_1.ExpVar('msgId') });
        let insertDefer = factory.createInsert();
        statements.push(insertDefer);
        insertDefer.ignore = true;
        insertDefer.table = new statementWithFrom_1.EntityTable('$queue_defer', false);
        insertDefer.cols = [
            { col: 'defer', val: new sql_1.ExpAdd(new sql_1.ExpNum(10), new sql_1.ExpVar('defer')) },
            { col: 'id', val: new sql_1.ExpVar(consts_1.settingQueueInSeed) },
        ];
        statements.push(p.createCommit());
    }
    queueInGetProc(p) {
        let { factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push((0, il_1.bigIntField)('start'), (0, il_1.tinyIntField)('defer'), (0, il_1.intField)('count'));
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
        select.column(new sql_1.ExpField('id', a));
        select.column(new sql_1.ExpField('unit', a));
        select.column(new sql_1.ExpField('to', a));
        select.column(new sql_1.ExpFuncInUq('$idtext', [new sql_1.ExpField('bus_text_id', a)], true), 'bus');
        select.column(new sql_1.ExpFuncInUq('$idtext', [new sql_1.ExpField('face_text_id', a)], true), 'faceName');
        select.column(new sql_1.ExpField('data', a));
        select.column(new sql_1.ExpField('version', a));
        select.column(new sql_1.ExpField('stamp', a));
        select.column(new sql_1.ExpField('tries', a), 'tries');
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update_time', a)), 'update_time');
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp), 'now');
        select.from(new statementWithFrom_1.EntityTable('$queue_defer', false, b))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable('$queue_in', false, a))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('id', a)), new sql_1.ExpEQ(new sql_1.ExpField('defer', b), new sql_1.ExpAdd(new sql_1.ExpNum(10), new sql_1.ExpVar('defer')))));
        select.where(new sql_1.ExpAnd(new sql_1.ExpGT(new sql_1.ExpField('id', b), new sql_1.ExpVar('start')), new sql_1.ExpGE(new sql_1.ExpSub(new sql_1.ExpFuncCustom(factory.func_unix_timestamp), new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update_time', a))), new sql_1.ExpMul(new sql_1.ExpField('tries', a), new sql_1.ExpNum(60 * 10)))));
        select.order(new sql_1.ExpField('id', b), 'asc');
        select.limit(new sql_1.ExpVar('count'));
    }
    queueInSetProc(p) {
        let { factory } = this.context;
        let idParam = il.bigIntField('id');
        let deferParam = (0, il_1.intField)('defer');
        let finish = 'finish';
        let finishParam = il.tinyIntField(finish);
        let versionParam = (0, il_1.intField)('version');
        p.parameters.push(idParam, deferParam, finishParam, versionParam);
        let stats = p.statements;
        stats.push(p.createTransaction());
        let declare = factory.createDeclare();
        declare.var('$unit', new il_1.Int());
        let iff = factory.createIf();
        stats.push(iff);
        // 1 = ok
        iff.cmp = new sql_1.ExpEQ(new sql_1.ExpVar(finish), sql_1.ExpVal.num1);
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
        let tableQueueDefer = new statementWithFrom_1.EntityTable('$queue_defer', false);
        delDefer.tables = [tableQueueDefer];
        delDefer.from(tableQueueDefer);
        delDefer.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')), new sql_1.ExpEQ(new sql_1.ExpField('defer'), new sql_1.ExpAdd(new sql_1.ExpNum(10), new sql_1.ExpVar('defer')))));
        //let iff2 = factory.createIf();
        let elseIfTry = new sql.Statements();
        iff.elseIf(new sql_1.ExpEQ(new sql_1.ExpVar(finish), new sql_1.ExpNum(2)), elseIfTry);
        // 2 = moreTries
        //iff2.cmp = new ExpEQ(new ExpVar(finish), new ExpNum(2)); // 消息处理失败，增加tries
        let update = factory.createUpdate();
        elseIfTry.add(update);
        //iff2.then(update);
        update.cols = [
            { col: 'tries', val: new sql_1.ExpAdd(new sql_1.ExpField('tries'), sql_1.ExpVal.num1) },
        ];
        update.table = new statementWithFrom_1.EntityTable('$queue_in', false);
        update.where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')));
        let elseIfBad = new sql.Statements();
        iff.elseIf(new sql_1.ExpEQ(new sql_1.ExpVar(finish), new sql_1.ExpNum(3)), elseIfBad);
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
    queueInDoneAgoProc(p) {
        const { parameters, statements } = p;
        const { factory } = this.context;
        parameters.push((0, il_1.intField)('unit'));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)('negStart'), (0, il_1.bigIntField)('negStart1'), (0, il_1.bigIntField)('syncId'), (0, il_1.bigIntField)('syncId1'), (0, il_1.bigIntField)('start'), (0, il_1.bigIntField)('start1'));
        statements.push(p.createTransaction());
        let expUnit = new sql_1.ExpVar('unit');
        let ifPositive = factory.createIf();
        statements.push(ifPositive);
        ifPositive.cmp = new sql_1.ExpGE(expUnit, sql_1.ExpNum.num0);
        ifPositive.then(p.createLeaveProc());
        function createSelect(field, neg) {
            let select = factory.createSelect();
            select.toVar = true;
            select.col(field, field, 'a');
            let field1 = field + '1';
            select.col(field1, field1, 'a');
            select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit, 'a'));
            select.where(new sql_1.ExpEQ(new sql_1.ExpField('unit', 'a'), neg === true ? new sql_1.ExpNeg(expUnit) : expUnit));
            select.lock = select_1.LockType.update;
            return select;
        }
        let selectNeg = createSelect('syncId', false);
        selectNeg.col('start', 'negStart');
        selectNeg.col('start1', 'negStart1');
        statements.push(selectNeg);
        statements.push(createSelect('start', true));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpAnd(new sql_1.ExpGE(new sql_1.ExpVar('syncId'), new sql_1.ExpVar('start')), new sql_1.ExpGE(new sql_1.ExpVar('syncId1'), new sql_1.ExpVar('start1')));
        let log = factory.createLog();
        iff.then(log);
        log.unit = expUnit;
        log.uq = new sql_1.ExpStr(this.context.dbName);
        log.subject = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('Remove Neg Unit '), expUnit);
        log.content = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('start='), new sql_1.ExpVar('start'), new sql_1.ExpStr('\\n'), new sql_1.ExpStr('start1='), new sql_1.ExpVar('start1'), new sql_1.ExpStr('\\n'), new sql_1.ExpStr('-start='), new sql_1.ExpVar('negStart'), new sql_1.ExpStr('\\n'), new sql_1.ExpStr('-start1='), new sql_1.ExpVar('negStart1'), new sql_1.ExpStr('\\n'));
        let update = factory.createUpdate();
        iff.then(update);
        update.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit);
        update.cols = [
            { col: 'start', val: new sql_1.ExpVar('negStart') },
            { col: 'start1', val: new sql_1.ExpVar('negStart1') },
        ];
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpNeg(expUnit));
        let del = factory.createDelete();
        iff.then(del);
        let tblUnit = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit);
        del.tables = [tblUnit];
        del.from(tblUnit);
        del.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), expUnit));
        statements.push(p.createCommit());
    }
    modifyQueueProc(p) {
        let { factory, hasUnit } = this.context;
        p.addUnitParameter();
        let start = il.bigIntField('start');
        let page = il.intField('page');
        let entities = il.textField('entities');
        p.parameters.push(start, page, entities);
        let stats = this.context.buildSplitStringToTable('tbl_entities', 'entity', 'entities', '\\t');
        p.statements.push(...stats);
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql_1.ExpField('id', 'a'));
        select.column(new sql_1.ExpField('entity', 'c'));
        select.column(new sql_1.ExpField('key', 'a'));
        select.from(new statementWithFrom_1.EntityTable('$modify_queue', hasUnit, 'a'))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('entity', 'a'), new sql_1.ExpField('id', 'b')));
        select.join(il_1.JoinType.join, new statementWithFrom_1.VarTable('tbl_entities', 'c'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('name', 'b'), new sql_1.ExpField('entity', 'c')));
        select.where(new sql_1.ExpGT(new sql_1.ExpField('id', 'a'), new sql_1.ExpVar('start')));
        select.order(new sql_1.ExpField('id', 'a'), 'asc');
        select.limit(new sql_1.ExpVar(page.name));
        let retSelectMax = this.selectQueueMax(); // factory.createSelect();
        p.statements.push(retSelectMax);
    }
    modifyQueueMaxProc(p) {
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
    selectQueueMax() {
        let { factory } = this.context;
        let retSelectMax = factory.createSelect();
        let valMax = sql_1.ExpVal.num0;
        retSelectMax.column(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpField('modifyQueueMax'), valMax), 'max');
        retSelectMax.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit));
        retSelectMax.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar('$unit')));
        return retSelectMax;
    }
    execQueueActProc(p) {
        let { factory } = this.context;
        let { statements } = p;
        let select = factory.createSelect();
        statements.push(select);
        select.column(new sql_1.ExpField('id', 'b'), 'entity');
        select.column(new sql_1.ExpField('name', 'b'), 'entityName');
        select.column(new sql_1.ExpFunc('unix_timestamp', new sql_1.ExpField('exec_time', 'a')), 'exec_time');
        select.column(new sql_1.ExpField('unit', 'a'), 'unit');
        select.column(new sql_1.ExpField('param', 'a'), 'param');
        select.column(new sql_1.ExpField('repeat', 'a'), 'repeat');
        select.column(new sql_1.ExpField('interval', 'a'), 'interval');
        select.from(new statementWithFrom_1.EntityTable('$queue_act', false, 'a'));
        select.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity, 'b'))
            .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('entity', 'a'), new sql_1.ExpField('id', 'b')), new sql_1.ExpEQ(new sql_1.ExpField('valid', 'b'), sql_1.ExpNum.num1)));
        let wheres = [
            new sql_1.ExpLE(new sql_1.ExpField('exec_time', 'a'), new sql_1.ExpFuncCustom(factory.func_current_timestamp)),
            new sql_1.ExpEQ(new sql_1.ExpField('running', 'a'), sql_1.ExpNum.num0),
        ];
        select.where(new sql_1.ExpAnd(...wheres));
        select.order(new sql_1.ExpField('exec_time'), 'asc');
    }
}
exports.QueueProcedures = QueueProcedures;
//# sourceMappingURL=queueProcs.js.map