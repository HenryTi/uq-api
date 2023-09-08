"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BQueueStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const select_1 = require("../sql/select");
const dbContext_1 = require("../dbContext");
class BQueueStatement extends bstatement_1.BStatement {
    body(sqls) {
        const { factory, hasUnit } = this.context;
        const { no, entityId, queue, value, ix } = this.istatement;
        const queueEntityId = '$queue_entity_' + no;
        const declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars((0, il_1.intField)(queueEntityId));
        if (entityId !== undefined) {
            let set = factory.createSet();
            sqls.push(set);
            set.equ(queueEntityId, this.context.convertExp(entityId));
        }
        else {
            let selectEntity = factory.createSelect();
            sqls.push(selectEntity);
            selectEntity.toVar = true;
            selectEntity.col('id', queueEntityId);
            selectEntity.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
            selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(queue.name)));
        }
        const { action } = this.istatement;
        if (action === il_1.QueueAction.done) {
            this.buildDone(sqls, queueEntityId);
            return;
        }
        if (action === il_1.QueueAction.del) {
            this.buildDel(sqls, queueEntityId);
            return;
        }
        const expValue = this.context.convertExp(value);
        const expIx = ix === undefined ? sql_1.ExpNum.num0 : this.context.convertExp(ix);
        let insert = factory.createInsert();
        sqls.push(insert);
        insert.ignore = true;
        insert.table = new statementWithFrom_1.EntityTable('$queue', hasUnit);
        insert.cols = [
            { col: 'queue', val: new sql_1.ExpVar(queueEntityId) },
            { col: 'ix', val: expIx },
            { col: 'value', val: expValue },
        ];
        if (hasUnit === true) {
            insert.cols.push({ col: '$unit', val: new sql_1.ExpVar('$unit') });
        }
        if (action === il_1.QueueAction.again) {
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new statementWithFrom_1.EntityTable('$queue$', hasUnit);
            update.cols = [
                {
                    col: 'count',
                    val: new sql_1.ExpFunc(factory.func_if, new sql_1.ExpLE(new sql_1.ExpField('count'), sql_1.ExpNum.num0), new sql_1.ExpField('count'), new sql_1.ExpNeg(new sql_1.ExpField('count')))
                }
            ];
            let wheres = [
                new sql_1.ExpEQ(new sql_1.ExpField('queue'), new sql_1.ExpVar(queueEntityId)),
                new sql_1.ExpEQ(new sql_1.ExpField('ix'), expIx),
                new sql_1.ExpEQ(new sql_1.ExpField('value'), expValue),
            ];
            if (hasUnit === true) {
                wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), new sql_1.ExpVar('$unit')));
            }
            update.where = new sql_1.ExpAnd(...wheres);
        }
    }
    buildDone(sqls, queueEntityId) {
        var _a;
        const { factory, hasUnit } = this.context;
        const { queue, ix, no, value } = this.istatement;
        const onceOnly = (_a = (queue === null || queue === void 0 ? void 0 : queue.onceOnly)) !== null && _a !== void 0 ? _a : false;
        const queueIx = '$queue_ix_' + no;
        const queueValue = '$queue_value_' + no;
        const queueCount = '$queue_count_' + no;
        const declare = factory.createDeclare();
        const expValue = this.context.convertExp(value);
        const expIx = ix === undefined ? sql_1.ExpNum.num0 : this.context.convertExp(ix);
        sqls.push(declare);
        declare.vars((0, il_1.bigIntField)(queueIx));
        declare.vars((0, il_1.bigIntField)(queueValue));
        declare.vars((0, il_1.bigIntField)(queueCount));
        let selectEntity = factory.createSelect();
        sqls.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(expIx, queueIx);
        selectEntity.column(expValue, queueValue);
        let selectQueueValue = factory.createSelect();
        sqls.push(selectQueueValue);
        selectQueueValue.toVar = true;
        selectQueueValue.col('count', queueCount, 'a');
        selectQueueValue.from(new statementWithFrom_1.EntityTable('$queue$', hasUnit, 'a'));
        if (onceOnly === false) {
            selectQueueValue.col('count', queueCount, 'b');
            let ons = [
                new sql_1.ExpEQ(new sql_1.ExpField('queue', 'a'), new sql_1.ExpField('queue', 'b')),
                new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpField('ix', 'b')),
                new sql_1.ExpEQ(new sql_1.ExpField('value', 'a'), new sql_1.ExpField('value', 'b')),
            ];
            if (hasUnit === true) {
                ons.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit', 'a'), new sql_1.ExpField('$unit', 'b')));
            }
            selectQueueValue.join(il_1.JoinType.left, new statementWithFrom_1.EntityTable('$queue$', hasUnit, 'b'))
                .on(new sql_1.ExpAnd(...ons));
        }
        let wheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('queue', 'a'), new sql_1.ExpVar(queueEntityId)),
            new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpVar(queueIx)),
            new sql_1.ExpEQ(new sql_1.ExpField('value', 'a'), new sql_1.ExpVar(queueValue)),
        ];
        if (hasUnit === true) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit', 'a'), new sql_1.ExpVar('$unit')));
        }
        selectQueueValue.where(new sql_1.ExpAnd(...wheres));
        selectQueueValue.lock = select_1.LockType.update;
        let ifCount = factory.createIf();
        sqls.push(ifCount);
        ifCount.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(queueCount));
        let insert = factory.createInsert();
        ifCount.then(insert);
        insert.table = new statementWithFrom_1.EntityTable('$queue$', hasUnit);
        insert.cols = [
            { col: 'queue', val: new sql_1.ExpVar(queueEntityId) },
            { col: 'ix', val: new sql_1.ExpVar(queueIx) },
            { col: 'value', val: new sql_1.ExpVar(queueValue) },
        ];
        if (hasUnit === true) {
            insert.cols.push({ col: '$unit', val: new sql_1.ExpVar('$unit') });
        }
        let update = factory.createUpdate();
        update.table = new statementWithFrom_1.EntityTable('$queue$', hasUnit);
        let updateWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('queue'), new sql_1.ExpVar(queueEntityId)),
            new sql_1.ExpEQ(new sql_1.ExpField('ix'), new sql_1.ExpVar(queueIx)),
            new sql_1.ExpEQ(new sql_1.ExpField('value'), new sql_1.ExpVar(queueValue)),
        ];
        if (hasUnit === true) {
            updateWheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), new sql_1.ExpVar('$unit')));
        }
        update.where = new sql_1.ExpAnd(...updateWheres);
        let expCount = new sql_1.ExpField('count');
        if (onceOnly === true) {
            expCount = new sql_1.ExpNeg(expCount);
        }
        update.cols = [
            {
                col: 'count', val: new sql_1.ExpAdd(expCount, sql_1.ExpNum.num1)
            }
        ];
        if (onceOnly === true) {
            let elseStatements = new sql_1.Statements();
            ifCount.elseIf(new sql_1.ExpLE(new sql_1.ExpVar(queueCount), sql_1.ExpNum.num0), elseStatements);
            elseStatements.add(update);
        }
        else {
            ifCount.else(update);
        }
        let deleteQueueValue = factory.createDelete();
        sqls.push(deleteQueueValue);
        deleteQueueValue.tables = ['a'];
        deleteQueueValue.from(new statementWithFrom_1.EntityTable('$queue', hasUnit, 'a'));
        let deleteQueueWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('queue', 'a'), new sql_1.ExpVar(queueEntityId)),
            new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpVar(queueIx)),
            new sql_1.ExpEQ(new sql_1.ExpField('value', 'a'), new sql_1.ExpVar(queueValue))
        ];
        if (hasUnit === true) {
            deleteQueueWheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), new sql_1.ExpVar('$unit')));
        }
        deleteQueueValue.where(new sql_1.ExpAnd(...deleteQueueWheres));
    }
    buildDel(sqls, queueEntityId) {
        const { factory, hasUnit } = this.context;
        const { ix, no, value } = this.istatement;
        const queueIx = '$queue_ix_' + no;
        const queueValue = '$queue_value_' + no;
        const queueCount = '$queue_count_' + no;
        const declare = factory.createDeclare();
        const expValue = this.context.convertExp(value);
        const expIx = ix === undefined ? sql_1.ExpNum.num0 : this.context.convertExp(ix);
        sqls.push(declare);
        declare.vars((0, il_1.bigIntField)(queueIx));
        declare.vars((0, il_1.bigIntField)(queueValue));
        declare.vars((0, il_1.bigIntField)(queueCount));
        let selectEntity = factory.createSelect();
        sqls.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(expIx, queueIx);
        selectEntity.column(expValue, queueValue);
        let deleteQueueValue = factory.createDelete();
        sqls.push(deleteQueueValue);
        deleteQueueValue.tables = ['a'];
        deleteQueueValue.from(new statementWithFrom_1.EntityTable('$queue', hasUnit, 'a'));
        let deleteQueueWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('queue', 'a'), new sql_1.ExpVar(queueEntityId)),
            new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpVar(queueIx)),
            new sql_1.ExpEQ(new sql_1.ExpField('value', 'a'), new sql_1.ExpVar(queueValue))
        ];
        if (hasUnit === true) {
            deleteQueueWheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), new sql_1.ExpVar('$unit')));
        }
        deleteQueueValue.where(new sql_1.ExpAnd(...deleteQueueWheres));
    }
}
exports.BQueueStatement = BQueueStatement;
//# sourceMappingURL=queue.js.map