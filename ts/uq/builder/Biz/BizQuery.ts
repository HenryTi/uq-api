import { BigInt, BizAtom, BizBud, BizEntity, BizQueryTable, BizSpec, Char, FromEntity, bigIntField, jsonField } from "../../il";
import { BizPhraseType } from "../../il/Biz/BizPhraseType";
import { Sqls } from "../bstatement";
import { ExpFunc, ExpNum, ExpStr, ExpVar, Procedure, Statement } from "../sql";
import { BBizEntity } from "./BizEntity";

export class BBizQuery extends BBizEntity<BizQueryTable> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procQuery = this.createProcedure(`${this.context.site}.${id}q`);
        this.buildQueryProc(procQuery);
    }

    private buildQueryProc(proc: Procedure) {
        const { params, statement, from } = this.bizEntity;
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
            const { name } = bud;
            declare.var(name, new Char(200));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${name}"`)));
        }

        let sqls = new Sqls(this.context, statements);
        let { statements: queryStatements } = statement;
        sqls.head(queryStatements);
        sqls.body(queryStatements);
        sqls.foot(queryStatements);

        this.buildFrom(statements, from.fromEntity);
    }

    private buildFrom(statements: Statement[], fromEntity: FromEntity) {
        let { subs, bizPhraseType, bizEntityArr } = fromEntity;
        switch (bizPhraseType) {
            default: break;
            case BizPhraseType.atom: this.buildAtom(statements, bizEntityArr as BizAtom[]); break;
            case BizPhraseType.spec: this.buildSpec(statements, bizEntityArr as BizSpec[]); break;
        }
        if (subs !== undefined) {
            for (let sub of subs) {
                this.buildFrom(statements, sub);
            }
        }
    }

    private buildAtom(statements: Statement[], entityArr: BizAtom[]) {
        const { factory } = this.context;
        let insertAtom = factory.createInsert();
        statements.push(insertAtom);

        let entity = entityArr[0];
        const { titleBuds, primeBuds } = entity;
        for (let bud of titleBuds) this.buildInsertBud(statements, entity, bud);
        for (let bud of primeBuds) this.buildInsertBud(statements, entity, bud);
    }

    private buildSpec(statements: Statement[], entityArr: BizSpec[]) {
        for (let spec of entityArr) {
            for (let [, bud] of spec.props) {
                this.buildInsertBud(statements, spec, bud);
            }
        }
    }

    private buildInsertBud(statements: Statement[], entity: BizEntity, bud: BizBud) {
        const { factory } = this.context;
        let insertBud = factory.createInsert();
        statements.push(insertBud);
    }
}
