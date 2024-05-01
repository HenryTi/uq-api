"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizPend = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const BizEntity_1 = require("./BizEntity");
class BBizPend extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procQuery = this.createProcedure(`${this.context.site}.${id}gp`);
        this.buildQueryProc(procQuery);
    }
    buildQueryProc(proc) {
        const { pendQuery } = this.bizEntity;
        if (pendQuery === undefined) {
            proc.dropOnly = true;
            return;
        }
        const { params, statement } = pendQuery;
        const json = '$json';
        const varJson = new sql_1.ExpVar(json);
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        parameters.push((0, il_1.bigIntField)('$user'), (0, il_1.jsonField)(json), (0, il_1.bigIntField)('$pageStart'), (0, il_1.bigIntField)('$pageSize'));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(consts_1.$site, new il_1.BigInt());
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(site));
        for (let param of params) {
            const bud = param;
            const { id, name } = bud;
            declare.var(name, new il_1.Char(200));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${id}"`)));
        }
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: queryStatements } = statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
        let showBuds = this.bizEntity.allShowBuds();
        if (showBuds !== undefined) {
            let memo = factory.createMemo();
            statements.push(memo);
            memo.text = this.bizEntity.name + ' show buds';
            statements.push(...this.buildGetShowBuds(showBuds, '$page', 'id'));
        }
    }
}
exports.BBizPend = BBizPend;
//# sourceMappingURL=BizPend.js.map