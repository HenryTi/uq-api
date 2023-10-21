import * as il from '../../il';
import { ExpFunc, ExpNum, ExpEQ, ExpField, ExpStr, ExpSelect, ExpVar, ExpAnd, Statement } from '../sql';
import { Sqls } from '../bstatement';
import { BAct } from './act';
import { EntityTable } from '../sql/statementWithFrom';
import { LockType } from '../sql/select';
import { sysTable } from '../dbContext';

export class BProc extends BAct {
    protected entity: il.Proc;

    buildProcedures() {
        let { factory } = this.context;
        let { name, fields, buses, statement, logError, isScheduled } = this.entity;

        let proc = this.context.createProcedure(name, true);
        if (isScheduled === true) {
            proc.logError = [this.createUpdateRunning(0)];
        }
        else {
            proc.logError = logError;
        }
        proc.addUnitUserParameter();
        let stats = proc.statements;
        proc.parameters.push(
            ...fields
        );
        const site = '$site', date = '$date';
        let declare = factory.createDeclare();
        stats.push(declare);
        this.declareBusVar(declare, buses, stats);
        declare.var(date, new il.DateTime);
        declare.var(site, new il.BigInt());
        let setSite = factory.createSet();
        stats.push(setSite);
        setSite.equ(site, new ExpVar('$unit'));

        let s = factory.createSet();
        stats.push(s);
        s.equ(date, new ExpFunc(factory.func_now, new ExpNum(6)));

        let sqls = new Sqls(this.context, stats);
        sqls.push(this.createUpdateRunning(1));
        const { statements } = statement;
        sqls.head(statements);
        let rb = this.context.returnStartStatement()
        rb.body(sqls);
        sqls.body(statements);
        let re = this.context.returnEndStatement();
        re.body(sqls);
        sqls.foot(statements);
        this.buildBusWriteQueueStatement(stats, buses);
        sqls.done(proc);
        sqls.push(this.createUpdateRunning(0));
        this.context.appObjs.procedures.push(proc);
    }

    private createUpdateRunning(val: 0 | 1): Statement {
        if (this.entity.isScheduled === false) return;
        let { factory, hasUnit } = this.context;
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from(sysTable(il.EnumSysTable.entity));
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpStr(this.entity.name)));
        selectEntity.lock = LockType.update;
        let updateRunning = factory.createUpdate();
        updateRunning.table = new EntityTable('$queue_act', hasUnit);
        updateRunning.cols = [
            { col: 'running', val: new ExpNum(val) }
        ]
        let wheres = [
            new ExpEQ(new ExpField('entity'), new ExpSelect(selectEntity)),
        ];
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField('$unit'), new ExpVar('$unit')));
        }
        updateRunning.where = new ExpAnd(...wheres);
        return updateRunning;
    }
}
