"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBus = void 0;
const sql_1 = require("../sql");
const entity_1 = require("./entity");
const bstatement_1 = require("../bstatement");
const il_1 = require("../../il");
const statementWithFrom_1 = require("../sql/statementWithFrom");
// const const_queueInPointer = 'queue_in_pointer';
class BBus extends entity_1.BEntityBusable {
    get busName() { return this.entity.name; }
    log() {
        this.context.log(`${this.entity.type}`);
    }
    buildProcedures() {
        this.buildAcceptProcs();
        this.buildQueryProcs();
    }
    buildAcceptProcs() {
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
            bBusAccept.buildProcedures();
            //this.buildAcceptProc(accept);
        }
    }
    buildQueryProcs() {
        let { unitField, userParam } = this.context;
        for (let query of this.entity.queries) {
            let { name, fields, arrs } = query;
            let procName = `${this.entity.name}$q_${name}`;
            let proc = this.context.createProcedure(procName);
            let { parameters, statements: stats } = proc;
            parameters.push(unitField, userParam, ...fields);
            for (let arr of arrs) {
                parameters.push((0, il_1.textField)('$' + arr.name + '$text'));
            }
            //let declare = factory.createDeclare();
            //stats.push(declare);
            //declare.var('kkkkkk', new Int());
            let returns = query.returns;
            this.returnsDeclare(stats, returns);
            let sqls = new bstatement_1.Sqls(this.context, stats);
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
exports.BBus = BBus;
class BBusAccept extends entity_1.BEntity {
    constructor(context, bBus, busAccept /*, dup: number = 0*/) {
        super(context, busAccept);
        this.bBus = bBus;
        // this.dup = dup;
    }
    get actionProcName() {
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
    buildInBusDataParse(proc, statements, action) {
        // 加上[], 会自动过滤bus数据前面的import cmd
        this.dataParse(proc, statements, action, []);
    }
    buildAcceptProc() {
        let { factory, unitField, userParam, hasUnit, unitFieldName } = this.context;
        let { buses, isQuery, transactionOff } = this.entity;
        let procName = this.actionProcName;
        let proc = this.context.createProcedure(procName);
        let { parameters, statements: procStats } = proc;
        let msgId = (0, il_1.bigIntField)('$msgId');
        let syncedId = (0, il_1.bigIntField)('$syncedId');
        let data = (0, il_1.textField)('$data');
        let version = (0, il_1.intField)('$version');
        let stamp = (0, il_1.intField)('$stamp');
        let importing = (0, il_1.tinyIntField)('$importing');
        parameters.push(unitField, userParam, msgId, data, version, stamp);
        let declare = factory.createDeclare();
        procStats.push(declare);
        let subject = new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('$bus ' + procName + ':'), new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpVar(msgId.name), new sql_1.ExpStr('null')));
        let content = new sql_1.ExpVar(data.name);
        proc.errLog = {
            subject,
            content,
        };
        if (transactionOff === false) {
            procStats.push(proc.createTransaction());
        }
        declare.vars(syncedId, importing);
        let statsSetImportingBusVar = undefined;
        // 针对bus query的accept，不需要处理bus queue in队列
        if (isQuery === false) {
            let setImporting = factory.createSet();
            procStats.push(setImporting);
            setImporting.equ(importing.name, sql_1.ExpNum.num0);
            let delDefer = factory.createDelete();
            procStats.push(delDefer);
            let tableQueueDefer = new statementWithFrom_1.EntityTable('$queue_defer', false);
            delDefer.tables = [tableQueueDefer];
            delDefer.from(tableQueueDefer);
            delDefer.where(new sql_1.ExpAnd(new sql_1.ExpOr(new sql_1.ExpEQ(new sql_1.ExpField('defer'), new sql_1.ExpNum(10)), new sql_1.ExpEQ(new sql_1.ExpField('defer'), new sql_1.ExpNum(11))), new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(msgId.name))));
            let iffNoMsg = factory.createIf();
            procStats.push(iffNoMsg);
            iffNoMsg.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc(factory.func_rowCount), sql_1.ExpVal.num0);
            iffNoMsg.then(proc.createLeaveProc());
            statsSetImportingBusVar = this.bBus.buildSetImportingBusVar(declare, buses);
        }
        else {
            statsSetImportingBusVar = [];
        }
        this.bBus.declareBusVar(declare, buses, procStats);
        this.declareInBusVars(declare, this.entity);
        let loop = factory.createWhile();
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        loop.no = 0;
        let loopStats = loop.statements.statements;
        this.dataParse(proc, procStats, this.entity, statsSetImportingBusVar, loop);
        let sqls = new bstatement_1.Sqls(this.context, loopStats);
        const { statements } = this.entity.statement;
        sqls.head(statements);
        let rb = this.context.returnStartStatement();
        rb.body(sqls);
        sqls.body(statements);
        let re = this.context.returnEndStatement();
        re.body(sqls);
        sqls.foot(statements);
        let pLoopEnd = '$pLoopEnd';
        let varPLoopEnd = new sql_1.ExpVar(pLoopEnd);
        let leave = factory.createBreak();
        leave.no = loop.no;
        let iffEnd = factory.createIf();
        loopStats.push(iffEnd);
        iffEnd.cmp = new sql_1.ExpGE(varPLoopEnd, new sql_1.ExpVar('$dataLen'));
        iffEnd.then(leave);
        let iffRN = factory.createIf();
        iffEnd.else(iffRN);
        iffRN.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc(factory.func_substr, new sql_1.ExpVar('$data'), varPLoopEnd, sql_1.ExpVal.num1), new sql_1.ExpVar('$rn'));
        iffRN.then(leave);
        this.bBus.buildBusWriteQueueStatement(procStats, buses);
        sqls.done(proc);
        if (transactionOff === false) {
            procStats.push(proc.createCommit());
        }
        this.context.appObjs.procedures.push(proc);
    }
}
//# sourceMappingURL=bus.js.map