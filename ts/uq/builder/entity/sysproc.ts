import * as il from '../../il';
import { ExpFunc, ExpNum, ExpVar } from '../sql';
import { Sqls } from '../bstatement';
import { BAct } from './act';

export class BSysProc extends BAct<il.SysProc> {
    buildProcedures() {
        let factory = this.context.factory;
        let proc = this.context.createProcedure(this.entity.name);
        proc.addUnitUserParameter();
        let stats = proc.statements;
        proc.parameters.push(
            ...this.entity.fields
        );
        const site = '$site';
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(site, new il.BigInt());
        let setSite = factory.createSet();
        stats.push(setSite);
        setSite.equ(site, new ExpVar('$unit'));
        this.declareBusVar(declare, this.entity.buses, stats);
        declare.var('$date', new il.DateTime);
        let s = factory.createSet();
        stats.push(s);
        s.equ('$date', new ExpFunc(factory.func_now, new ExpNum(6)));

        let returns = this.entity.returns;
        this.returnsDeclare(stats, returns);

        let sqls = new Sqls(this.context, stats);
        const { statements } = this.entity.statement;
        sqls.head(statements);
        sqls.body(statements);
        sqls.foot(statements);
        this.buildBusWriteQueueStatement(stats, this.entity.buses);
        this.returns(stats, returns);
        sqls.done(proc);
        this.context.appObjs.procedures.push(proc);
    }
}
