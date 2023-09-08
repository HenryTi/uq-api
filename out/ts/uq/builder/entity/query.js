"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BQuery = void 0;
const il = require("../../il");
const entity_1 = require("./entity");
const sql = require("../sql");
const bstatement_1 = require("../bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
class BQuery extends entity_1.BEntity {
    buildProcedures() {
        this.proc(this.context.createAppProc(this.entity.name));
    }
    proc(p) {
        p.addUnitUserParameter();
        this.buildProcProxyAuth(p, this.entity);
        let { ver, statement, returns } = this.entity;
        let { factory } = this.context;
        let { parameters, statements } = p;
        if (ver !== undefined) {
            let memo = factory.createMemo();
            statements.push(memo);
            memo.text = `version ${ver}`;
        }
        let pageStart = il.charField('$pageStart', 100);
        let pageSize = il.intField('$pageSize');
        let { page } = returns;
        if (page !== undefined) {
            parameters.push(pageStart, pageSize);
            let { orderSwitch, start } = page;
            if (orderSwitch && orderSwitch.length > 0) {
                parameters.push(il.charField('$orderSwitch', 50));
            }
            else if (start) {
                let iff = factory.createIf();
                statements.push(iff);
                iff.cmp = new sql.ExpIsNull(new sql.ExpVar(pageStart.name));
                let set = factory.createSet();
                iff.then(set);
                set.equ(pageStart.name, sql.convertExp(this.context, page.start));
            }
        }
        this.buildRoleCheck(statements);
        const site = '$site';
        let declare = factory.createDeclare();
        declare.var(site, new il.BigInt());
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpVar('$unit'));
        this.entity.fields.forEach(v => this.context.buildParam(v, parameters, statements, declare));
        this.buildBiz$User(statements);
        statements.push(declare);
        let row = '$row';
        let dtInt = new il_1.Int();
        declare.var(row, dtInt);
        this.returnsDeclare(statements, returns);
        const { statements: stats } = statement;
        let sqls = new bstatement_1.Sqls(this.context, statements);
        sqls.head(stats);
        let rb = this.context.returnStartStatement();
        rb.body(sqls);
        sqls.body(stats);
        let re = this.context.returnEndStatement();
        re.body(sqls);
        sqls.foot(stats);
        this.returns(statements, returns);
        sqls.done(p);
    }
}
exports.BQuery = BQuery;
//# sourceMappingURL=query.js.map