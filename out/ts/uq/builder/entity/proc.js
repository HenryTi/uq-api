"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BProc = void 0;
const il = require("../../il");
const sql_1 = require("../sql");
const bstatement_1 = require("../bstatement");
const act_1 = require("./act");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const select_1 = require("../sql/select");
const dbContext_1 = require("../dbContext");
class BProc extends act_1.BAct {
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
        proc.parameters.push(...fields);
        const site = '$site', date = '$date';
        let declare = factory.createDeclare();
        stats.push(declare);
        this.declareBusVar(declare, buses, stats);
        declare.var(date, new il.DateTime);
        declare.var(site, new il.BigInt());
        let setSite = factory.createSet();
        stats.push(setSite);
        setSite.equ(site, new sql_1.ExpVar('$unit'));
        let s = factory.createSet();
        stats.push(s);
        s.equ(date, new sql_1.ExpFunc(factory.func_now, new sql_1.ExpNum(6)));
        let sqls = new bstatement_1.Sqls(this.context, stats);
        sqls.push(this.createUpdateRunning(1));
        const { statements } = statement;
        sqls.head(statements);
        let rb = this.context.returnStartStatement();
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
    createUpdateRunning(val) {
        if (this.entity.isScheduled === false)
            return;
        let { factory, hasUnit } = this.context;
        let selectEntity = factory.createSelect();
        selectEntity.col('id');
        selectEntity.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(this.entity.name)));
        selectEntity.lock = select_1.LockType.update;
        let updateRunning = factory.createUpdate();
        updateRunning.table = new statementWithFrom_1.EntityTable('$queue_act', hasUnit);
        updateRunning.cols = [
            { col: 'running', val: new sql_1.ExpNum(val) }
        ];
        let wheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('entity'), new sql_1.ExpSelect(selectEntity)),
        ];
        if (hasUnit === true) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), new sql_1.ExpVar('$unit')));
        }
        updateRunning.where = new sql_1.ExpAnd(...wheres);
        return updateRunning;
    }
}
exports.BProc = BProc;
//# sourceMappingURL=proc.js.map