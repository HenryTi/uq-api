"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFunction = void 0;
const il = require("../../il");
const entity_1 = require("./entity");
const bstatement_1 = require("../bstatement");
const sql_1 = require("../sql");
class BFunction extends entity_1.BEntityBusable {
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
        setSite.equ(site, new sql_1.ExpVar('$unit'));
        let sqls = new bstatement_1.Sqls(this.context, stats);
        const { statements } = statement;
        sqls.head(statements);
        sqls.body(statements);
        sqls.foot(statements);
        sqls.done(proc);
        this.context.appObjs.procedures.push(proc);
    }
}
exports.BFunction = BFunction;
//# sourceMappingURL=function.js.map