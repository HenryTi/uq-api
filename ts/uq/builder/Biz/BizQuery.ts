import {
    BigInt, BizAtom, BizBud, BizID, BizQueryTable, BizSpec, Char
    , EnumSysTable, FromEntity, JoinType, bigIntField, jsonField
} from "../../il";
import { BizPhraseType, BudDataType } from "../../il/Biz/BizPhraseType";
import { Sqls } from "../bstatement";
import { ExpAnd, ExpEQ, ExpField, ExpFunc, ExpIn, ExpNum, ExpStr, ExpVar, Procedure, Statement } from "../sql";
import { EntityTable, VarTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

const a = 'a', b = 'b';
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

        this.buildFromEntity(statements, from.idFromEntity);
    }

    private buildFromEntity(statements: Statement[], fromEntity: FromEntity) {
        let { bizPhraseType, bizEntityArr } = fromEntity;
        switch (bizPhraseType) {
            default: break;
            case BizPhraseType.atom: this.buildFromAtom(statements, bizEntityArr as BizAtom[]); break;
            case BizPhraseType.spec: this.buildFromSpec(statements, bizEntityArr as BizSpec[]); break;
        }
    }

    private buildInsertAtom() {
        const { factory } = this.context;
        let insertAtom = factory.createInsert();
        insertAtom.ignore = true;
        insertAtom.table = new VarTable('atoms');
        insertAtom.cols = [
            { col: 'id', val: undefined },
            { col: 'base', val: undefined },
            { col: 'no', val: undefined },
            { col: 'ex', val: undefined },
        ];
        let select = factory.createSelect();
        insertAtom.select = select;
        select.distinct = true;
        select.column(new ExpField('id', b));
        select.column(new ExpField('base', b));
        select.column(new ExpField('no', b));
        select.column(new ExpField('ex', b));
        return insertAtom;
    }

    private buildInsertAtomDirect() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new VarTable('ret', a))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
            .on(new ExpEQ(new ExpField('id', a), new ExpField('id', b)));
        return insert;
    }

    private buildInsertAtomOfSpec() {
        let insert = this.buildInsertAtom();
        const { select } = insert;
        select.from(new VarTable('specs', a))
            .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, b))
            .on(new ExpEQ(new ExpField('base', a), new ExpField('id', b)));
        return insert;
    }

    private buildFromAtom(statements: Statement[], entityArr: BizAtom[]) {
        let insertAtom = this.buildInsertAtomDirect()
        statements.push(insertAtom);
        let entity = entityArr[0];
        this.buildInsertAtomBuds(statements, entity);
    }

    private buildFromSpec(statements: Statement[], entityArr: BizSpec[]) {
        const { factory } = this.context;
        let insertSpec = factory.createInsert();
        statements.push(insertSpec);
        insertSpec.ignore = true;
        insertSpec.table = new VarTable('specs');
        insertSpec.cols = [
            { col: 'spec', val: undefined },
            { col: 'atom', val: undefined },
        ];
        let select = factory.createSelect();
        insertSpec.select = select;
        select.distinct = true;
        select.from(new VarTable('ret', a))
            .join(JoinType.join, new EntityTable(EnumSysTable.spec, false, b))
            .on(new ExpEQ(new ExpField('id', a), new ExpField('id', b)));
        select.column(new ExpField('id', b), 'spec');
        select.column(new ExpField('base', b), 'atom');

        for (let spec of entityArr) {
            const mapBuds: Map<EnumSysTable, BizBud[]> = new Map();
            const buds: BizBud[] = [];
            for (let [, bud] of spec.props) {
                buds.push(bud);
            }
            this.buildMapBuds(mapBuds, buds);
            this.buildInsertBuds(statements, 'specs', mapBuds);
        }
        let insertAtomOfSpec = this.buildInsertAtomOfSpec();
        statements.push(insertAtomOfSpec);

        // 暂时只生成第一个spec的atom的所有字段
        let [spec] = entityArr;
        this.buildInsertAtomBuds(statements, spec.base);
    }

    private buildInsertAtomBuds(statements: Statement[], atom: BizID) {
        const { titleBuds, primeBuds } = atom;
        const mapBuds: Map<EnumSysTable, BizBud[]> = new Map();
        this.buildMapBuds(mapBuds, titleBuds);
        this.buildMapBuds(mapBuds, primeBuds);
        this.buildInsertBuds(statements, 'atoms', mapBuds);
    }

    private buildMapBuds(mapBuds: Map<EnumSysTable, BizBud[]>, buds: BizBud[]) {
        if (buds === undefined) return;
        for (let bud of buds) {
            let ixBudTbl: EnumSysTable = EnumSysTable.ixBudInt;
            switch (bud.dataType) {
                default: ixBudTbl = EnumSysTable.ixBudInt; break;
                case BudDataType.dec:
                    ixBudTbl = EnumSysTable.ixBudDec; break;
                case BudDataType.str:
                case BudDataType.char:
                    ixBudTbl = EnumSysTable.ixBudStr; break;
            }
            let arr = mapBuds.get(ixBudTbl);
            if (arr === undefined) {
                arr = [];
                mapBuds.set(ixBudTbl, arr);
            }
            arr.push(bud);
        }
    }

    private buildInsertBuds(statements: Statement[], mainTbl: string, mapBuds: Map<EnumSysTable, BizBud[]>) {
        for (let [tbl, arr] of mapBuds) {
            this.buildInsertBud(statements, mainTbl, tbl, arr);
        }
    }

    private buildInsertBud(statements: Statement[], mainTbl: string, tbl: EnumSysTable, buds: BizBud[]) {
        const { factory } = this.context;
        let insertBud = factory.createInsert();
        statements.push(insertBud);
        insertBud.ignore = true;
        insertBud.table = new VarTable('props');
        insertBud.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        let select = factory.createSelect();
        insertBud.select = select;
        select.from(new VarTable(mainTbl, a))
            .join(JoinType.join, new EntityTable(tbl, false, b))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('id', a), new ExpField('i', b)),
                new ExpIn(new ExpField('x', b), ...buds.map(v => new ExpNum(v.id))),
            ));
        select.column(new ExpField('id', a), 'id');
        select.column(new ExpField('x', b), 'phrase');
        select.column(new ExpField('value', b), 'value');
    }
}
