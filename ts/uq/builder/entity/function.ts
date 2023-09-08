import * as il from '../../il';
import { BEntityBusable } from './entity';
import { Sqls } from '../bstatement';
import { ExpVar } from '../sql';

export class BFunction extends BEntityBusable<il.Function> {
    buildProcedures() {
        this.context.log('Build Function:' + this.entity.name);
        let { name, dataType, fields, statement } = this.entity;
        let proc = this.context.createFunction(name, dataType);
        let { factory } = this.context;

        proc.addUnitUserParameter();
        proc.parameters.push(...fields);
        let stats = proc.statements;

        const site = '$site';
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(site, new il.BigInt());
        let setSite = factory.createSet();
        stats.push(setSite);
        setSite.equ(site, new ExpVar('$unit'));

        let sqls = new Sqls(this.context, stats);
        const { statements } = statement;
        sqls.head(statements);
        sqls.body(statements);
        sqls.foot(statements);
        sqls.done(proc);

        this.context.appObjs.procedures.push(proc);
    }
}
