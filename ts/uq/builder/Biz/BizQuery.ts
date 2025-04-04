import {
    BigInt, BizQueryTable, Char, bigIntField, jsonField
} from "../../il";
import { Sqls } from "../bstatement";
import { ExpFunc, ExpNum, ExpStr, ExpVar, Procedure } from "../sql";
import { BBizEntity } from "./BizEntity";

export class BBizQuery extends BBizEntity<BizQueryTable> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const procQuery = this.createSiteEntityProcedure('q');
        this.buildQueryProc(procQuery);
    }

    private buildQueryProc(proc: Procedure) {
        const { params, statement } = this.bizEntity;
        const site = '$site';
        const json = '$json';
        const varJson = new ExpVar(json);
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push(
            bigIntField('$user'),
            jsonField(json),
            bigIntField('$pageStart'),
            bigIntField('$pageSize'),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var(site, new BigInt());

        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(site, new ExpNum(this.context.site));

        for (let param of params) {
            const bud = param;
            const { name, id } = bud;
            declare.var(name, new Char(200));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${id}"`)));
        }

        let sqls = new Sqls(this.context, statements);
        let { statements: queryStatements } = statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);
    }
}
