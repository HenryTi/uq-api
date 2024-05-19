import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, DateTime, Int, ScheduleStatement } from "../../il";
import {
    ColVal, convertExp, ExpAdd, ExpEQ, ExpField
    , ExpFunc, ExpFuncCustom, ExpMul, ExpNum, ExpStr, ExpVal, ExpVar
    , ExpSub, ExpSelect, ExpNeg, ExpLT
} from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { sysTable } from "../dbContext";

export class BScheduleStatement extends BStatement<ScheduleStatement> {
    body(sqls: Sqls) {
        let { act, params, delay, on, repeat, interval, no } = this.istatement;
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        let entityId = 'entityId_' + no;
        let vInterval = 'interval_' + no;
        let vExecTime = 'exectime_' + no;
        let vUnixTimestamp = 'unix_timestamp_' + no;
        let vUtc = 'utc_timestamp_' + no;
        declare.var(entityId, new Int());
        declare.var(vInterval, new Int());
        declare.var(vExecTime, new Int());
        declare.var(vUnixTimestamp, new Int());
        declare.var(vUtc, new DateTime());

        let selectEntity = factory.createSelect();
        sqls.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.column(new ExpField('id'), entityId);
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(act.name)));

        //let execTime: ExpVal;
        let setInterval = factory.createSet();
        sqls.push(setInterval);
        setInterval.equ(vInterval, interval ? convertExp(this.context, interval) as ExpVal : new ExpNum(60 * 24));

        let setUnixTimestamp = factory.createSet();
        sqls.push(setUnixTimestamp);
        setUnixTimestamp.equ(vUnixTimestamp, new ExpFuncCustom(factory.func_unix_timestamp));

        let setExecTime = factory.createSet();
        if (delay) {
            sqls.push(setExecTime);
            setExecTime.equ(vExecTime, new ExpAdd(
                new ExpVar(vUnixTimestamp),
                new ExpMul(convertExp(this.context, delay) as ExpVal, new ExpNum(60)),
            ));
        }
        else if (on) {
            let setUtcTimestamp = factory.createSet();
            sqls.push(setUtcTimestamp);
            setUtcTimestamp.equ(vUtc, new ExpFuncCustom(factory.func_utc_timestamp));

            let expOn: ExpVal = (typeof on === 'number') ?
                new ExpNum(on) : convertExp(this.context, on) as ExpVal;
            sqls.push(setExecTime);
            let selectTimeZone = factory.createSelect();
            selectTimeZone.col('timezone');
            selectTimeZone.from(sysTable(EnumSysTable.unit));
            selectTimeZone.where(new ExpEQ(new ExpField('unit'), new ExpVar('$unit')));
            setExecTime.equ(vExecTime, new ExpSub(
                new ExpVar(vUnixTimestamp),
                new ExpMul(
                    new ExpSub(
                        new ExpFunc('hour', new ExpVar(vUtc)),
                        new ExpSelect(selectTimeZone)
                    ),
                    new ExpNum(3600),
                ),
                new ExpMul(
                    new ExpFunc('minute', new ExpVar(vUtc)),
                    new ExpNum(60),
                ),
                new ExpFunc('second', new ExpVar(vUtc)),
                new ExpNeg(
                    new ExpMul(expOn, new ExpNum(60))
                )
            ));
            let iff = factory.createIf();
            sqls.push(iff);
            iff.cmp = new ExpLT(new ExpVar(vExecTime), new ExpVar(vUnixTimestamp));
            let setNextDay = factory.createSet();
            iff.then(setNextDay);
            setNextDay.equ(vExecTime, new ExpAdd(new ExpVar(vExecTime), new ExpNum(24 * 3600)));
        }
        else {
            sqls.push(setExecTime);
            setExecTime.equ(vExecTime, new ExpVar(vUnixTimestamp));
        }

        let update = factory.createUpdate();
        let insert = factory.createInsert();
        insert.ignore = true;
        update.table = insert.table = new EntityTable('$queue_act', true);
        // 2021-9-23: ???很大的疑问？这个地方为什么是$uq_unit? 不应该是$unit吗？
        let cols: ColVal[] = [
            //{col: 'unit', val: new ExpVar('$uq_unit')},
            { col: 'unit', val: new ExpVar('$unit') },
            { col: 'user', val: ExpNum.num0 },
        ];
        if (params && params.length > 0) {
            let ps = params.map(v => convertExp(this.context, v) as ExpVal);
            let val = new ExpFunc(
                factory.func_concat,
                new ExpFunc(factory.func_concat_ws, new ExpStr('\\t'), ...ps),
                new ExpStr('\\n\\n'),
            );
            cols.push({ col: 'param', val });
        }
        cols.push({
            col: 'repeat',
            val: repeat ? convertExp(this.context, repeat) as ExpVal : new ExpNum(1)
        });
        cols.push({
            col: 'interval',
            val: new ExpVar(vInterval),
        });
        insert.cols.push(
            ...cols,
            { col: 'exec_time', val: new ExpFunc(factory.func_from_unixtime, new ExpVar(vExecTime)) },
            { col: 'entity', val: new ExpVar(entityId) }
        );
        update.cols.push(...cols);
        update.where = new ExpEQ(new ExpField('entity'), new ExpVar(entityId));
        sqls.push(update);
        let ifRows0 = factory.createIf();
        sqls.push(ifRows0);
        ifRows0.cmp = new ExpEQ(new ExpFunc(factory.func_rowCount), ExpNum.num0);
        ifRows0.then(insert);
    }
}
