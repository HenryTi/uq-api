import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, bigIntField, intField, JoinType, Queue, QueueAction, QueueStatement } from "../../il";
import {
    ExpVar, ExpVal, ExpEQ, ExpLE
    , ExpField, ExpStr, ExpNeg, ExpAnd, ExpFunc, ExpNum
    , ExpIsNull, Statements, ExpAdd
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { LockType } from "../sql/select";
import { sysTable } from "../dbContext";

export class BQueueStatement extends BStatement {
    protected istatement: QueueStatement;
    body(sqls: Sqls) {
        const { factory, hasUnit } = this.context;
        const { no, entityId, queue, value, ix } = this.istatement;
        const queueEntityId = '$queue_entity_' + no;
        const declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars(intField(queueEntityId));
        if (entityId !== undefined) {
            let set = factory.createSet();
            sqls.push(set);
            set.equ(queueEntityId, this.context.convertExp(entityId) as ExpVal);
        }
        else {
            let selectEntity = factory.createSelect();
            sqls.push(selectEntity);
            selectEntity.toVar = true;
            selectEntity.col('id', queueEntityId);
            selectEntity.from(sysTable(EnumSysTable.entity));
            selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(queue.name)))
        }

        const { action } = this.istatement;
        if (action === QueueAction.done) {
            this.buildDone(sqls, queueEntityId);
            return;
        }
        if (action === QueueAction.del) {
            this.buildDel(sqls, queueEntityId);
            return;
        }
        const expValue = this.context.convertExp(value) as ExpVal;
        const expIx = ix === undefined ? ExpNum.num0 : this.context.convertExp(ix) as ExpVal;

        let insert = factory.createInsert();
        sqls.push(insert);
        insert.ignore = true;
        insert.table = new EntityTable('$queue', hasUnit);
        insert.cols = [
            { col: 'queue', val: new ExpVar(queueEntityId) },
            { col: 'ix', val: expIx },
            { col: 'value', val: expValue },
        ];
        if (hasUnit === true) {
            insert.cols.push({ col: '$unit', val: new ExpVar('$unit') });
        }

        if (action === QueueAction.again) {
            let update = factory.createUpdate();
            sqls.push(update);
            update.table = new EntityTable('$queue$', hasUnit);
            update.cols = [
                {
                    col: 'count',
                    val: new ExpFunc(
                        factory.func_if,
                        new ExpLE(new ExpField('count'), ExpNum.num0),
                        new ExpField('count'),
                        new ExpNeg(new ExpField('count'))
                    )
                }
            ];
            let wheres = [
                new ExpEQ(new ExpField('queue'), new ExpVar(queueEntityId)),
                new ExpEQ(new ExpField('ix'), expIx),
                new ExpEQ(new ExpField('value'), expValue),
            ];
            if (hasUnit === true) {
                wheres.push(new ExpEQ(new ExpField('$unit'), new ExpVar('$unit')));
            }
            update.where = new ExpAnd(...wheres);
        }
    }

    private buildDone(sqls: Sqls, queueEntityId: string) {
        const { factory, hasUnit } = this.context;
        const { queue, ix, no, value } = this.istatement;
        const onceOnly = (queue?.onceOnly) ?? false;

        const queueIx = '$queue_ix_' + no;
        const queueValue = '$queue_value_' + no;
        const queueCount = '$queue_count_' + no;
        const declare = factory.createDeclare();
        const expValue = this.context.convertExp(value) as ExpVal;
        const expIx = ix === undefined ? ExpNum.num0 : this.context.convertExp(ix) as ExpVal;

        sqls.push(declare);
        declare.vars(bigIntField(queueIx));
        declare.vars(bigIntField(queueValue));
        declare.vars(bigIntField(queueCount));

        let selectEntity = factory.createSelect();
        sqls.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(expIx, queueIx);
        selectEntity.column(expValue, queueValue);

        let selectQueueValue = factory.createSelect();
        sqls.push(selectQueueValue);
        selectQueueValue.toVar = true;
        selectQueueValue.col('count', queueCount, 'a');
        selectQueueValue.from(new EntityTable('$queue$', hasUnit, 'a'));
        if (onceOnly === false) {
            selectQueueValue.col('count', queueCount, 'b');
            let ons = [
                new ExpEQ(new ExpField('queue', 'a'), new ExpField('queue', 'b')),
                new ExpEQ(new ExpField('ix', 'a'), new ExpField('ix', 'b')),
                new ExpEQ(new ExpField('value', 'a'), new ExpField('value', 'b')),
            ];
            if (hasUnit === true) {
                ons.push(new ExpEQ(new ExpField('$unit', 'a'), new ExpField('$unit', 'b')))
            }
            selectQueueValue.join(JoinType.left, new EntityTable('$queue$', hasUnit, 'b'))
                .on(new ExpAnd(...ons));
        }
        let wheres = [
            new ExpEQ(new ExpField('queue', 'a'), new ExpVar(queueEntityId)),
            new ExpEQ(new ExpField('ix', 'a'), new ExpVar(queueIx)),
            new ExpEQ(new ExpField('value', 'a'), new ExpVar(queueValue)),
        ];
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField('$unit', 'a'), new ExpVar('$unit')));
        }
        selectQueueValue.where(new ExpAnd(...wheres));
        selectQueueValue.lock = LockType.update;

        let ifCount = factory.createIf();
        sqls.push(ifCount);
        ifCount.cmp = new ExpIsNull(new ExpVar(queueCount));
        let insert = factory.createInsert();
        ifCount.then(insert);
        insert.table = new EntityTable('$queue$', hasUnit);
        insert.cols = [
            { col: 'queue', val: new ExpVar(queueEntityId) },
            { col: 'ix', val: new ExpVar(queueIx) },
            { col: 'value', val: new ExpVar(queueValue) },
        ];
        if (hasUnit === true) {
            insert.cols.push({ col: '$unit', val: new ExpVar('$unit') });
        }

        let update = factory.createUpdate();
        update.table = new EntityTable('$queue$', hasUnit);
        let updateWheres = [
            new ExpEQ(new ExpField('queue'), new ExpVar(queueEntityId)),
            new ExpEQ(new ExpField('ix'), new ExpVar(queueIx)),
            new ExpEQ(new ExpField('value'), new ExpVar(queueValue)),
        ];
        if (hasUnit === true) {
            updateWheres.push(new ExpEQ(new ExpField('$unit'), new ExpVar('$unit')));
        }
        update.where = new ExpAnd(...updateWheres);
        let expCount: ExpVal = new ExpField('count');
        if (onceOnly === true) {
            expCount = new ExpNeg(expCount);
        }
        update.cols = [
            {
                col: 'count', val: new ExpAdd(expCount, ExpNum.num1)
            }
        ];

        if (onceOnly === true) {
            let elseStatements = new Statements();
            ifCount.elseIf(new ExpLE(new ExpVar(queueCount), ExpNum.num0), elseStatements);
            elseStatements.add(update);
        }
        else {
            ifCount.else(update);
        }
        let deleteQueueValue = factory.createDelete();
        sqls.push(deleteQueueValue);
        deleteQueueValue.tables = ['a'];
        deleteQueueValue.from(new EntityTable('$queue', hasUnit, 'a'));
        let deleteQueueWheres = [
            new ExpEQ(new ExpField('queue', 'a'), new ExpVar(queueEntityId)),
            new ExpEQ(new ExpField('ix', 'a'), new ExpVar(queueIx)),
            new ExpEQ(new ExpField('value', 'a'), new ExpVar(queueValue))
        ]
        if (hasUnit === true) {
            deleteQueueWheres.push(new ExpEQ(new ExpField('$unit'), new ExpVar('$unit')));
        }
        deleteQueueValue.where(new ExpAnd(...deleteQueueWheres));
    }

    private buildDel(sqls: Sqls, queueEntityId: string) {
        const { factory, hasUnit } = this.context;
        const { ix, no, value } = this.istatement;

        const queueIx = '$queue_ix_' + no;
        const queueValue = '$queue_value_' + no;
        const queueCount = '$queue_count_' + no;
        const declare = factory.createDeclare();
        const expValue = this.context.convertExp(value) as ExpVal;
        const expIx = ix === undefined ? ExpNum.num0 : this.context.convertExp(ix) as ExpVal;

        sqls.push(declare);
        declare.vars(bigIntField(queueIx));
        declare.vars(bigIntField(queueValue));
        declare.vars(bigIntField(queueCount));

        let selectEntity = factory.createSelect();
        sqls.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(expIx, queueIx);
        selectEntity.column(expValue, queueValue);
        let deleteQueueValue = factory.createDelete();
        sqls.push(deleteQueueValue);
        deleteQueueValue.tables = ['a'];
        deleteQueueValue.from(new EntityTable('$queue', hasUnit, 'a'));
        let deleteQueueWheres = [
            new ExpEQ(new ExpField('queue', 'a'), new ExpVar(queueEntityId)),
            new ExpEQ(new ExpField('ix', 'a'), new ExpVar(queueIx)),
            new ExpEQ(new ExpField('value', 'a'), new ExpVar(queueValue))
        ]
        if (hasUnit === true) {
            deleteQueueWheres.push(new ExpEQ(new ExpField('$unit'), new ExpVar('$unit')));
        }
        deleteQueueValue.where(new ExpAnd(...deleteQueueWheres));
    }
}
