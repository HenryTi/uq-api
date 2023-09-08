import {
    Procedure, ExpEQ, ExpGE, ExpVar, ExpFunc, ExpField
    , ExpAnd, ExpStr, ExpVal, ExpOr, ExpNum, Statement
} from '../sql';
import { BEntity, BEntityBusable } from './entity';
import { Sqls } from '../bstatement';
import { Bus, textField, bigIntField, BusAccept, intField, tinyIntField, Field, Arr } from '../../il';
import { EntityTable } from '../sql/statementWithFrom';
import { DbContext } from '../dbContext';

// const const_queueInPointer = 'queue_in_pointer';

export class BBus extends BEntityBusable<Bus> {
    get busName() { return this.entity.name }

    log() {
        this.context.log(`${this.entity.type}`);
    }

    buildProcedures() {
        this.buildAcceptProcs();
        this.buildQueryProcs();
    }

    private buildAcceptProcs() {
        // let dups: { [name: string]: number } = {};
        let { accepts } = this.entity;
        for (let i in accepts) {
            let accept = this.entity.accepts[i];
            // let { name } = accept;
            // let dup = dups[name];
            let bBusAccept = new BBusAccept(this.context, this, accept);
            /*
            if (dup === undefined) {
                bBusAccept ;
                dups[name] = 0;
            }
            else {
                ++dup;
                bBusAccept = new BBusAccept(this.context, this, accept, dup);
                dups[name] = dup;
            }
            */
            bBusAccept.buildProcedures()
            //this.buildAcceptProc(accept);
        }
    }

    private buildQueryProcs() {
        let { unitField, userParam } = this.context;
        for (let query of this.entity.queries) {
            let { name, fields, arrs } = query;
            let procName = `${this.entity.name}$q_${name}`;
            let proc = this.context.createProcedure(procName);
            let { parameters, statements: stats } = proc;
            parameters.push(
                unitField,
                userParam,
                ...fields
            );
            for (let arr of arrs) {
                parameters.push(textField('$' + arr.name + '$text'));
            }

            //let declare = factory.createDeclare();
            //stats.push(declare);
            //declare.var('kkkkkk', new Int());

            let returns = query.returns;
            this.returnsDeclare(stats, returns);
            let sqls = new Sqls(this.context, stats);
            const { statements } = query.statement;
            sqls.head(statements);
            sqls.body(statements);
            sqls.foot(statements);
            this.returns(stats, returns);
            sqls.done(proc);

            this.context.appObjs.procedures.push(proc);
        }
    }
}

class BBusAccept extends BEntity<BusAccept> {
    private bBus: BBus;

    constructor(context: DbContext, bBus: BBus, busAccept: BusAccept/*, dup: number = 0*/) {
        super(context, busAccept);
        this.bBus = bBus;
        // this.dup = dup;
    }

    protected get actionProcName() {
        return `${this.bBus.busName}_${this.entity.name}`;
        /*
        let ret = this.bBus.busName + '_' + this.entity.name;
        if (this.dup === 0) return ret;
        return ret + '_' + this.dup;
        */
    }

    buildProcedures() {
        this.buildInBusProcedures(this.entity);
        this.buildAcceptProc();
    }

    protected buildInBusDataParse(proc: Procedure, statements: Statement[]
        , action: { fields: Field[]; arrs: Arr[]; }) {
        // 加上[], 会自动过滤bus数据前面的import cmd
        this.dataParse(proc, statements, action, []);
    }

    private buildAcceptProc() {
        let { factory, unitField, userParam, hasUnit, unitFieldName } = this.context;
        let { buses, isQuery, transactionOff } = this.entity;
        let procName = this.actionProcName;
        let proc = this.context.createProcedure(procName);
        let { parameters, statements: procStats } = proc;
        let msgId = bigIntField('$msgId');
        let syncedId = bigIntField('$syncedId');
        let data = textField('$data');
        let version = intField('$version');
        let stamp = intField('$stamp');
        let importing = tinyIntField('$importing');
        parameters.push(
            unitField,
            userParam,
            msgId,
            data,
            version,
            stamp,
        );

        let declare = factory.createDeclare();
        procStats.push(declare);
        let subject = new ExpFunc(
            factory.func_concat,
            new ExpStr('$bus ' + procName + ':'),
            new ExpFunc(factory.func_ifnull, new ExpVar(msgId.name), new ExpStr('null')));
        let content = new ExpVar(data.name);
        proc.errLog = {
            subject,
            content,
        }

        if (transactionOff === false) {
            procStats.push(proc.createTransaction());
        }

        declare.vars(syncedId, importing);

        let statsSetImportingBusVar: Statement[] = undefined;
        // 针对bus query的accept，不需要处理bus queue in队列
        if (isQuery === false) {
            let setImporting = factory.createSet();
            procStats.push(setImporting);
            setImporting.equ(importing.name, ExpNum.num0);

            let delDefer = factory.createDelete();
            procStats.push(delDefer);
            let tableQueueDefer = new EntityTable('$queue_defer', false);
            delDefer.tables = [tableQueueDefer];
            delDefer.from(tableQueueDefer);
            delDefer.where(new ExpAnd(
                new ExpOr(
                    new ExpEQ(new ExpField('defer'), new ExpNum(10)),
                    new ExpEQ(new ExpField('defer'), new ExpNum(11))
                ),
                new ExpEQ(new ExpField('id'), new ExpVar(msgId.name))
            ));

            let iffNoMsg = factory.createIf();
            procStats.push(iffNoMsg);
            iffNoMsg.cmp = new ExpEQ(new ExpFunc(factory.func_rowCount), ExpVal.num0);
            iffNoMsg.then(proc.createLeaveProc());

            statsSetImportingBusVar = this.bBus.buildSetImportingBusVar(declare, buses);
        }
        else {
            statsSetImportingBusVar = [];
        }

        this.bBus.declareBusVar(declare, buses, procStats);
        this.declareInBusVars(declare, this.entity);
        let loop = factory.createWhile();
        loop.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);
        loop.no = 0;
        let loopStats = loop.statements.statements;
        this.dataParse(proc, procStats, this.entity, statsSetImportingBusVar, loop);

        let sqls = new Sqls(this.context, loopStats);
        const { statements } = this.entity.statement;
        sqls.head(statements);
        let rb = this.context.returnStartStatement();
        rb.body(sqls);
        sqls.body(statements);
        let re = this.context.returnEndStatement();
        re.body(sqls);
        sqls.foot(statements);
        let pLoopEnd = '$pLoopEnd';
        let varPLoopEnd = new ExpVar(pLoopEnd);
        let leave = factory.createBreak();
        leave.no = loop.no;
        let iffEnd = factory.createIf();
        loopStats.push(iffEnd);
        iffEnd.cmp = new ExpGE(varPLoopEnd, new ExpVar('$dataLen'));
        iffEnd.then(leave);
        let iffRN = factory.createIf();
        iffEnd.else(iffRN);
        iffRN.cmp = new ExpEQ(
            new ExpFunc(factory.func_substr, new ExpVar('$data'), varPLoopEnd, ExpVal.num1),
            new ExpVar('$rn'));
        iffRN.then(leave);
        this.bBus.buildBusWriteQueueStatement(procStats, buses);
        sqls.done(proc);
        if (transactionOff === false) {
            procStats.push(proc.createCommit());
        }
        this.context.appObjs.procedures.push(proc);
    }
}
