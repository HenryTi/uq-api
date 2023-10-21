import { EnumSysTable, OpQueueAction, Queue, ValueExpression } from "../../../il";
import { sysTable } from "../../dbContext";
import { LockType, Select, SelectTable } from "../select";
import { SqlBuilder } from "../sqlBuilder";
import { EntityTable } from "../statementWithFrom";
import { Exp } from "./Exp";
import { ExpAnd, ExpCmp, ExpEQ, ExpField, ExpIn, ExpNum, ExpSelect, ExpStr, ExpVal, ExpVar } from "./exps";

// memo 1
export class ExpQueue extends Exp {
    private readonly queue: Queue;
    private readonly ix: ValueExpression;
    private readonly action: OpQueueAction;
    private readonly vals: ValueExpression[];
    constructor(queue: Queue, of: ValueExpression, action: OpQueueAction, vals: ValueExpression[]) {
        super();
        this.queue = queue;
        this.ix = of;
        this.action = action;
        this.vals = vals;
    }
    to(sb: SqlBuilder) {
        const { factory } = sb;
        const { dbContext } = factory;
        const { hasUnit } = dbContext;
        const $queue = '$queue';
        const $queue$ = '$queue$';
        const { queue, vals } = this;
        const buildWheres = () => {
            let wheres: ExpCmp[] = [new ExpEQ(
                new ExpField('ix'),
                this.ix === undefined ? ExpNum.num0 : dbContext.convertExp(this.ix) as ExpVal
            )];
            return wheres;
        }
        const buildSelectQueue = (tblQueue: string): Select => {
            const select = factory.createSelect();
            select.from(new EntityTable(tblQueue, hasUnit));
            select.lock = LockType.update;
            select.col('queue');
            select.col('value');
            let wheres = buildWheres();
            if (vals.length === 1) {
                wheres.push(new ExpEQ(new ExpField('value'), dbContext.convertExp(vals[0]) as ExpVal));
            }
            else {
                wheres.push(
                    new ExpIn(
                        new ExpField('value'),
                        ...vals.map(v => dbContext.convertExp(v) as ExpVal)
                    )
                );
            }
            if (hasUnit === true) {
                wheres.push(new ExpEQ(new ExpField('$unit'), new ExpVar('$unit')));
            }
            select.where(new ExpAnd(...wheres));
            return select;
        }

        const buildSelectValue = (...selects: Select[]) => {
            const selectEntity = factory.createSelect();
            selectEntity.col('id');
            selectEntity.from(sysTable(EnumSysTable.entity));
            selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(queue.name)));

            let unionSelect: Select;
            unionSelect = selects[0];
            if (selects.length > 1) {
                unionSelect.unions = selects.slice(1);
            }

            const ret = factory.createSelect();
            ret.col('value', 'a');
            ret.from(new SelectTable(unionSelect, 'a'));
            let wheres = buildWheres();
            wheres.push(new ExpEQ(new ExpField('queue', 'a'), new ExpSelect(selectEntity)));
            ret.where(new ExpAnd(...wheres));
            return ret;
        }
        let select: Select;
        switch (this.action) {
            case OpQueueAction.has:
                select = buildSelectValue(buildSelectQueue($queue), buildSelectQueue($queue$));
                break;
            case OpQueueAction.wait:
                select = buildSelectValue(buildSelectQueue($queue));
                break;
            case OpQueueAction.done:
                select = buildSelectValue(buildSelectQueue($queue$));
                break;
        }
        sb.exists(select);
    }
}
