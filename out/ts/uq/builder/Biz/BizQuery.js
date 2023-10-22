"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizQuery = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const sql_1 = require("../sql");
const BizEntity_1 = require("./BizEntity");
class BBizQuery extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procQuery = this.createProcedure(`${this.context.site}.${id}q`);
        this.buildQueryProc(procQuery);
    }
    buildQueryProc(proc) {
        const { params, statement } = this.bizEntity;
        const site = '$site';
        const json = '$json';
        const varJson = new sql_1.ExpVar(json);
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push((0, il_1.bigIntField)('$user'), (0, il_1.jsonField)(json), (0, il_1.bigIntField)('$pageStart'), (0, il_1.bigIntField)('$pageSize'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new il_1.BigInt());
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpNum(this.context.site));
        for (let param of params) {
            const bud = param;
            const { name } = bud;
            declare.var(name, new il_1.Char(200));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`)));
        }
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: queryStatements } = statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
    }
}
exports.BBizQuery = BBizQuery;
//# sourceMappingURL=BizQuery.js.map