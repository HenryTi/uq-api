import {
    BigInt, bigIntField, Char, Index, jsonField
} from "../../il";
import { BizPend } from "../../il/Biz/Pend";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { ExpFunc, ExpNum, ExpStr, ExpVar, Procedure } from "../sql";
import { BBizEntity } from "./BizEntity";

export class BBizPend extends BBizEntity<BizPend> {
    override async buildTables(): Promise<void> {
        const { id, keys } = this.bizEntity;
        if (keys === undefined) return;
        let table = this.createTable(`${this.context.site}.${id}`);
        let keyFields = keys.map(v => v.createField());
        let idField = bigIntField('id');
        table.keys = [idField];
        table.fields = [idField, ...keyFields];
        let keyIndex = new Index('$key', true);
        keyIndex.fields.push(...keyFields);
        table.indexes.push(keyIndex);
    }

    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procQuery = this.createProcedure(`${this.context.site}.${id}gp`);
        this.buildQueryProc(procQuery);
    }

    private buildQueryProc(proc: Procedure) {
        const { pendQuery } = this.bizEntity;
        if (pendQuery === undefined) {
            proc.dropOnly = true;
            return;
        }

        const { params, statement } = pendQuery;
        const json = '$json';
        const varJson = new ExpVar(json);
        let { statements, parameters } = proc;
        let { factory, site } = this.context;
        parameters.push(
            bigIntField('$user'),
            jsonField(json),
            bigIntField('$pageStart'),
            bigIntField('$pageSize'),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var($site, new BigInt());

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(site));


        for (let param of params) {
            const bud = param;
            const { id, name } = bud;
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

        let showBuds = this.bizEntity.allShowBuds();
        if (showBuds !== undefined) {
            let memo = factory.createMemo();
            statements.push(memo)
            memo.text = this.bizEntity.name + ' show buds';
            statements.push(...this.buildGetShowBuds(showBuds, '$page', 'id'));
        }
    }
}
