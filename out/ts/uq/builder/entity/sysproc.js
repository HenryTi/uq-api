"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSysProc = void 0;
const il = require("../../il");
const sql_1 = require("../sql");
const bstatement_1 = require("../bstatement");
const act_1 = require("./act");
class BSysProc extends act_1.BAct {
    buildProcedures() {
        let factory = this.context.factory;
        let proc = this.context.createProcedure(this.entity.name);
        proc.addUnitUserParameter();
        let stats = proc.statements;
        proc.parameters.push(...this.entity.fields);
        const site = '$site';
        let declare = factory.createDeclare();
        stats.push(declare);
        declare.var(site, new il.BigInt());
        let setSite = factory.createSet();
        stats.push(setSite);
        setSite.equ(site, new sql_1.ExpVar('$unit'));
        this.declareBusVar(declare, this.entity.buses, stats);
        declare.var('$date', new il.DateTime);
        let s = factory.createSet();
        stats.push(s);
        s.equ('$date', new sql_1.ExpFunc(factory.func_now, new sql_1.ExpNum(6)));
        let returns = this.entity.returns;
        this.returnsDeclare(stats, returns);
        let sqls = new bstatement_1.Sqls(this.context, stats);
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
exports.BSysProc = BSysProc;
//# sourceMappingURL=sysproc.js.map