"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpQueue = void 0;
const il_1 = require("../../../il");
const dbContext_1 = require("../../dbContext");
const select_1 = require("../select");
const statementWithFrom_1 = require("../statementWithFrom");
const Exp_1 = require("./Exp");
const exps_1 = require("./exps");
// memo 1
class ExpQueue extends Exp_1.Exp {
    constructor(queue, of, action, vals) {
        super();
        this.queue = queue;
        this.ix = of;
        this.action = action;
        this.vals = vals;
    }
    to(sb) {
        const { factory } = sb;
        const { dbContext } = factory;
        const { hasUnit } = dbContext;
        const $queue = '$queue';
        const $queue$ = '$queue$';
        const { queue, vals } = this;
        const buildWheres = () => {
            let wheres = [new exps_1.ExpEQ(new exps_1.ExpField('ix'), this.ix === undefined ? exps_1.ExpNum.num0 : dbContext.convertExp(this.ix))];
            return wheres;
        };
        const buildSelectQueue = (tblQueue) => {
            const select = factory.createSelect();
            select.from(new statementWithFrom_1.EntityTable(tblQueue, hasUnit));
            select.lock = select_1.LockType.update;
            select.col('queue');
            select.col('value');
            let wheres = buildWheres();
            if (vals.length === 1) {
                wheres.push(new exps_1.ExpEQ(new exps_1.ExpField('value'), dbContext.convertExp(vals[0])));
            }
            else {
                wheres.push(new exps_1.ExpIn(new exps_1.ExpField('value'), ...vals.map(v => dbContext.convertExp(v))));
            }
            if (hasUnit === true) {
                wheres.push(new exps_1.ExpEQ(new exps_1.ExpField('$unit'), new exps_1.ExpVar('$unit')));
            }
            select.where(new exps_1.ExpAnd(...wheres));
            return select;
        };
        const buildSelectValue = (...selects) => {
            const selectEntity = factory.createSelect();
            selectEntity.col('id');
            selectEntity.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
            selectEntity.where(new exps_1.ExpEQ(new exps_1.ExpField('name'), new exps_1.ExpStr(queue.name)));
            let unionSelect;
            unionSelect = selects[0];
            if (selects.length > 1) {
                unionSelect.unions = selects.slice(1);
            }
            const ret = factory.createSelect();
            ret.col('value', 'a');
            ret.from(new select_1.SelectTable(unionSelect, 'a'));
            let wheres = buildWheres();
            wheres.push(new exps_1.ExpEQ(new exps_1.ExpField('queue', 'a'), new exps_1.ExpSelect(selectEntity)));
            ret.where(new exps_1.ExpAnd(...wheres));
            return ret;
        };
        let select;
        switch (this.action) {
            case il_1.OpQueueAction.has:
                select = buildSelectValue(buildSelectQueue($queue), buildSelectQueue($queue$));
                break;
            case il_1.OpQueueAction.wait:
                select = buildSelectValue(buildSelectQueue($queue));
                break;
            case il_1.OpQueueAction.done:
                select = buildSelectValue(buildSelectQueue($queue$));
                break;
        }
        sb.exists(select);
    }
}
exports.ExpQueue = ExpQueue;
//# sourceMappingURL=ExpQueue.js.map