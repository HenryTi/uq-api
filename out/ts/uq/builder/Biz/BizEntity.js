"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizEntity = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const sql_1 = require("../sql");
class BBizEntity {
    constructor(context, bizEntity) {
        this.context = context;
        this.bizEntity = bizEntity;
    }
    async buildTables() {
    }
    async buildProcedures() {
        this.bizEntity.forEachBud((bud) => {
            const { value } = bud;
            if (value === undefined)
                return;
            const { query } = value;
            if (query === undefined)
                return;
            const { id } = bud;
            const procBudValue = this.createProcedure(`${this.context.site}.${id}`);
            this.buildBudValueProc(procBudValue, query);
        });
    }
    async buildBudsValue() {
        this.bizEntity.forEachBud((bud) => {
            if (!bud)
                return;
            let { value } = bud;
            if (value === undefined)
                return;
            let { exp, act } = value;
            let str = this.stringify(exp);
            if (act === il_1.BudValueAct.init) {
                str += '\ninit';
            }
            else {
                str += '\nequ';
            }
            value.str = str;
        });
    }
    createProcedure(procName) {
        const proc = this.context.createProcedure(procName, true);
        this.context.coreObjs.procedures.push(proc);
        return proc;
    }
    createFunction(name, returnType) {
        const func = this.context.createAppFunc(name, returnType);
        this.context.coreObjs.procedures.push(func);
        return func;
    }
    stringify(value) {
        const exp = this.context.convertExp(value);
        if (exp === undefined)
            return;
        let sb = this.context.createClientBuilder();
        exp.to(sb);
        const { sql } = sb;
        return sql;
    }
    buildBudValueProc(proc, query) {
        const { parameters, statements } = proc;
        parameters.push((0, il_1.bigIntField)('$user'), (0, il_1.jsonField)('$json'));
        const site = '$site';
        const { factory } = this.context;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new il_1.BigInt());
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new sql_1.ExpNum(this.context.site));
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: queryStatements } = query.statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
        let select = factory.createSelect();
        statements.push(select);
        let names = ['value'];
        let values = [];
        for (let name of names) {
            values.push(new sql_1.ExpStr(name), new sql_1.ExpVar(name));
        }
        select.column(new sql_1.ExpFunc('JSON_Object', ...values), 'a');
    }
}
exports.BBizEntity = BBizEntity;
//# sourceMappingURL=BizEntity.js.map