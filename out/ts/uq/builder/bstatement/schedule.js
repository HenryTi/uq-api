"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BScheduleStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const dbContext_1 = require("../dbContext");
class BScheduleStatement extends bstatement_1.BStatement {
    body(sqls) {
        let { act, params, delay, on, repeat, interval, no } = this.istatement;
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        let entityId = 'entityId_' + no;
        let vInterval = 'interval_' + no;
        let vExecTime = 'exectime_' + no;
        let vUnixTimestamp = 'unix_timestamp_' + no;
        let vUtc = 'utc_timestamp_' + no;
        declare.var(entityId, new il_1.Int());
        declare.var(vInterval, new il_1.Int());
        declare.var(vExecTime, new il_1.Int());
        declare.var(vUnixTimestamp, new il_1.Int());
        declare.var(vUtc, new il_1.DateTime());
        let selectEntity = factory.createSelect();
        sqls.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(new sql_1.ExpField('id'), entityId);
        selectEntity.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(act.name)));
        //let execTime: ExpVal;
        let setInterval = factory.createSet();
        sqls.push(setInterval);
        setInterval.equ(vInterval, interval ? (0, sql_1.convertExp)(this.context, interval) : new sql_1.ExpNum(60 * 24));
        let setUnixTimestamp = factory.createSet();
        sqls.push(setUnixTimestamp);
        setUnixTimestamp.equ(vUnixTimestamp, new sql_1.ExpFuncCustom(factory.func_unix_timestamp));
        let setExecTime = factory.createSet();
        if (delay) {
            sqls.push(setExecTime);
            setExecTime.equ(vExecTime, new sql_1.ExpAdd(new sql_1.ExpVar(vUnixTimestamp), new sql_1.ExpMul((0, sql_1.convertExp)(this.context, delay), new sql_1.ExpNum(60))));
        }
        else if (on) {
            let setUtcTimestamp = factory.createSet();
            sqls.push(setUtcTimestamp);
            setUtcTimestamp.equ(vUtc, new sql_1.ExpFuncCustom(factory.func_utc_timestamp));
            let expOn = (typeof on === 'number') ?
                new sql_1.ExpNum(on) : (0, sql_1.convertExp)(this.context, on);
            sqls.push(setExecTime);
            let selectTimeZone = factory.createSelect();
            selectTimeZone.col('timezone');
            selectTimeZone.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.unit));
            selectTimeZone.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar('$unit')));
            setExecTime.equ(vExecTime, new sql_1.ExpSub(new sql_1.ExpVar(vUnixTimestamp), new sql_1.ExpMul(new sql_1.ExpSub(new sql_1.ExpFunc('hour', new sql_1.ExpVar(vUtc)), new sql_1.ExpSelect(selectTimeZone)), new sql_1.ExpNum(3600)), new sql_1.ExpMul(new sql_1.ExpFunc('minute', new sql_1.ExpVar(vUtc)), new sql_1.ExpNum(60)), new sql_1.ExpFunc('second', new sql_1.ExpVar(vUtc)), new sql_1.ExpNeg(new sql_1.ExpMul(expOn, new sql_1.ExpNum(60)))));
            let iff = factory.createIf();
            sqls.push(iff);
            iff.cmp = new sql_1.ExpLT(new sql_1.ExpVar(vExecTime), new sql_1.ExpVar(vUnixTimestamp));
            let setNextDay = factory.createSet();
            iff.then(setNextDay);
            setNextDay.equ(vExecTime, new sql_1.ExpAdd(new sql_1.ExpVar(vExecTime), new sql_1.ExpNum(24 * 3600)));
        }
        else {
            sqls.push(setExecTime);
            setExecTime.equ(vExecTime, new sql_1.ExpVar(vUnixTimestamp));
        }
        let update = factory.createUpdate();
        let insert = factory.createInsert();
        insert.ignore = true;
        update.table = insert.table = new statementWithFrom_1.EntityTable('$queue_act', true);
        // 2021-9-23: ???很大的疑问？这个地方为什么是$uq_unit? 不应该是$unit吗？
        let cols = [
            //{col: 'unit', val: new ExpVar('$uq_unit')},
            { col: 'unit', val: new sql_1.ExpVar('$unit') },
            { col: 'user', val: sql_1.ExpNum.num0 },
        ];
        if (params && params.length > 0) {
            let ps = params.map(v => (0, sql_1.convertExp)(this.context, v));
            let val = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpFunc(factory.func_concat_ws, new sql_1.ExpStr('\\t'), ...ps), new sql_1.ExpStr('\\n\\n'));
            cols.push({ col: 'param', val });
        }
        cols.push({
            col: 'repeat',
            val: repeat ? (0, sql_1.convertExp)(this.context, repeat) : new sql_1.ExpNum(1)
        });
        cols.push({
            col: 'interval',
            val: new sql_1.ExpVar(vInterval),
        });
        insert.cols.push(...cols, { col: 'exec_time', val: new sql_1.ExpFunc(factory.func_from_unixtime, new sql_1.ExpVar(vExecTime)) }, { col: 'entity', val: new sql_1.ExpVar(entityId) });
        update.cols.push(...cols);
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('entity'), new sql_1.ExpVar(entityId));
        sqls.push(update);
        let ifRows0 = factory.createIf();
        sqls.push(ifRows0);
        ifRows0.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc(factory.func_rowCount), sql_1.ExpNum.num0);
        ifRows0.then(insert);
    }
}
exports.BScheduleStatement = BScheduleStatement;
//# sourceMappingURL=schedule.js.map