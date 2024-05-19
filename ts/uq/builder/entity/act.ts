import * as _ from 'lodash';
import * as il from '../../il';
import { BEntityBusable } from './entity';
import { Sqls } from '../bstatement';
import { ExpVar } from '../sql';
import { textField } from '../../il';

export class BAct<E extends il.Act = il.Act> extends BEntityBusable<E> {
    buildProcedures() {
        let { procedures } = this.context.appObjs;
        this.buildInBusProcedures(this.entity);

        let { factory } = this.context;
        let { ver, isOpen, transactionOff } = this.entity;
        let proc = this.context.createProcedure(this.actionProcName, isOpen === true);
        proc.addUnitUserParameter();
        this.buildProcProxyAuth(proc, this.entity);
        let stats = proc.statements;

        if (ver !== undefined) {
            let memo = factory.createMemo();
            stats.push(memo);
            memo.text = `version ${ver}`;
        }

        this.buildBiz$User(stats);

        let dtText = new il.Text();
        dtText.size = 'medium';
        let data = new il.Field();
        data.name = '$data';
        data.dataType = dtText;
        proc.parameters.push(
            data,
        );
        this.buildRoleCheck(stats);
        const site = '$site';
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(site, new il.BigInt());
        let setSite = factory.createSet();
        stats.push(setSite);
        setSite.equ(site, new ExpVar('$unit'));
        this.declareBusVar(declare, this.entity.buses, stats);
        this.declareInBusVars(declare, this.entity);
        declare.var('$id', new il.BigInt);
        let { fields, arrs, paramConvert, returns } = this.entity;
        if (paramConvert !== undefined) {
            fields = _.clone(fields);
            for (let t of paramConvert.to) {
                fields.push(textField(t));
            }
        }
        this.dataParse(proc, stats, { fields, arrs });
        this.returnsDeclare(stats, returns);

        if (transactionOff === false) {
            stats.push(proc.createTransaction());
        }

        let sqls = new Sqls(this.context, stats);
        const { statements } = this.entity.statement;
        sqls.head(statements);
        let rb = this.context.returnStartStatement();
        rb.body(sqls);
        sqls.body(statements);
        let re = this.context.returnEndStatement();
        re.body(sqls);
        sqls.foot(statements);
        this.buildBusWriteQueueStatement(stats, this.entity.buses);
        this.returns(stats, returns);
        sqls.done(proc);
        if (transactionOff === false) {
            stats.push(proc.createCommit());
        }
        proc.errLog.content = new ExpVar('$data');
        procedures.push(proc);
    }
}
