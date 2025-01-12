import {
    BigInt, JoinType,
    bigIntField, EnumSysTable, Char, BizBud,
    BizBudBin,
    EnumSysBud,
    BizPend,
    Index,
    jsonField
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import {
    ExpAnd, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpNum, ExpStr, ExpVal, ExpVar, Procedure, Statement
} from "../sql";
import { EntityTable, VarTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

const a = 'a';
const b = 'b';
const c = 'c';
export class BBizPend extends BBizEntity<BizPend> {
    override async buildTables(): Promise<void> {
        const { id, keys } = this.bizEntity;
        if (keys === undefined) return;
        let table = this.createSiteTable(id); // `${this.context.site}.${id}`);
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
        const procQuery = this.createSiteEntityProcedure('gp');
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
        this.buildGetBinProps(statements);
    }

    private buildGetBinProps(statements: Statement[]) {
        this.bizEntity.forEachBud(v => this.buildBinBud(statements, '$page', v));
    }

    private buildBinBud(statements: Statement[], tbl: string, bud: BizBud) {
        if (bud.dataType !== BudDataType.bin) return;
        const { factory } = this.context;
        const binBud = bud as BizBudBin;
        const { showBuds, sysBuds, sysNO } = binBud;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bud ${binBud.getJName()} bin ${binBud.bin.getJName()}`;
        for (let sysBud of sysBuds) {
            this.buildBinSysProp(statements, tbl, binBud, sysBud);
        }
        if (sysNO === undefined) {
            this.buildBinSysProp(statements, tbl, binBud, EnumSysBud.sheetNo);
        }
        for (let [bud0, bud1] of showBuds) {
            if (bud0 === undefined) {
                this.buildBinProp(statements, tbl, bud, bud1, true);
            }
            else {
                this.buildBinProp(statements, tbl, bud, bud0, false);
            }
        }
    }

    private buildBinSysProp(statements: Statement[], tbl: string, binBud: BizBudBin, sysBud: EnumSysBud) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        const select = factory.createSelect();
        insert.select = select;

        select.from(new VarTable(tbl, a));

        let expBin: ExpVal = new ExpFunc('JSON_VALUE', new ExpField('mid', a), new ExpStr(`$."${binBud.id}"`));
        if (binBud.bin.main !== undefined) {
            const t0 = 't0', t1 = 't1';
            select.column(new ExpField('id', t0), 'id');
            /*
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizDetail, false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expBin))
                .join(JoinType.join, new EntityTable('bud', false, t1))
                .on(new ExpEQ(new ExpField('id', t1), new ExpField('base', t0)));
            */
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expBin));
            expBin = new ExpField('sheet', t0);
        }
        else {
            select.column(new ExpField('id', c), 'id');
        }
        select.join(JoinType.join, new EntityTable(EnumSysTable.bizSheet, false, c))
            .on(new ExpEQ(new ExpField('id', c), expBin));
        select.column(new ExpNum(sysBud), 'phrase');
        let valueCol: string;
        switch (sysBud) {
            default: debugger; break;
            case EnumSysBud.id: valueCol = 'id'; break;
            case EnumSysBud.sheetDate: valueCol = 'id'; break;
            case EnumSysBud.sheetNo: valueCol = 'no'; break;
            case EnumSysBud.sheetOperator: valueCol = 'operator'; break;
        }
        select.column(new ExpFuncCustom(factory.func_cast, new ExpField(valueCol, c), new ExpDatePart('json')), 'value');
    }

    private buildBinProp(statements: Statement[], tbl: string, binBud: BizBud, bud: BizBud, upMain: boolean) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new VarTable('props');
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
        ];
        const select = factory.createSelect();
        insert.select = select;
        let tblIxName: EnumSysTable
            , colValue: ExpVal = new ExpFuncCustom(factory.func_cast, new ExpField('value', c), new ExpDatePart('json'));
        switch (bud.dataType) {
            default:
                tblIxName = EnumSysTable.ixInt;
                break;
            case BudDataType.str:
            case BudDataType.char:
                tblIxName = EnumSysTable.ixStr;
                colValue = new ExpFunc('JSON_QUOTE', new ExpField('value', c));
                break;
            case BudDataType.dec:
                tblIxName = EnumSysTable.ixDec;
                break;
        }

        select.from(new VarTable(tbl, a));

        let expBin: ExpVal = new ExpFunc('JSON_VALUE', new ExpField('mid', a), new ExpStr(`$."${binBud.id}"`));
        if (upMain === true) {
            const t1 = 't1';
            select.column(new ExpField('id', t1), 'id');
            /*
            select.join(JoinType.join, new EntityTable('detail', false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expBin))
                .join(JoinType.join, new EntityTable('bud', false, t1))
                .on(new ExpEQ(new ExpField('id', t1), new ExpField('base', t0)));
            */
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, t1))
                .on(new ExpEQ(new ExpField('id', t1), expBin))
            expBin = new ExpField('sheet', t1);
        }
        else {
            select.column(new ExpField('i', c), 'id');
        }
        select.join(JoinType.join, new EntityTable(tblIxName, false, c))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('i', c), expBin),
                new ExpEQ(new ExpField('x', c), new ExpNum(bud.id))
            ));
        select.column(new ExpField('x', c), 'phrase');
        select.column(colValue, 'value');
    }
}
