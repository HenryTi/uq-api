import { binAmount, binFieldArr, binPrice, binValue } from "../../consts";
import {
    BigInt, BizBin, Dec, JoinType, bigIntField, EnumSysTable,
    Char, JsonDataType, BizBudIXBase, Statement,
    EntityVarTable
} from "../../il";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpNum, ExpVal, ExpVar, Procedure, Statement as SqlStatement } from "../sql";
import { SelectTable } from "../sql/select";
import { EntityTable, NameTable, VarTable, VarTableWithSchema } from "../sql/statementWithFrom";
import { buildSelectBinBud } from "../tools";
import { BBizEntity } from "./BizEntity";


const sheetId = 'sheet1';   // 实际写表时，会加上bin div.level=1
const si = '$si';
const sx = '$sx';
const svalue = '$svalue';
const samount = '$samount';
const sprice = '$sprice';
const pendFrom = '$pend';
const i = 'i';
const iBase = '.i';
const x = 'x';
const xBase = '.x';
const value = binValue;
const amount = binAmount;
const price = binPrice;
const binId = '$bin';
const origin = 'origin';
const $origin = '$' + origin;
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const bin = '$bin';
const tempBinTable = 'bin';
const binFieldsSet = new Set(binFieldArr);

enum BinIType {
    atom, fork, forkAtom
}

export class BBizBin extends BBizEntity<BizBin> {
    async buildBudsValue() {
        super.buildBudsValue();
        const { inputArr, pickArr } = this.bizEntity;
        if (inputArr !== undefined) {
            for (let input of inputArr) {
                input.buildBudValue(this.expStringify);
            }
        }
        if (pickArr !== undefined) {
            for (let pick of pickArr) {
                pick.buildBudValue(this.expStringify);
            }
        }
    }
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
        const procGet = this.createProcedure(`${this.context.site}.${id}gb`);
        this.buildGetProc(procGet);
    }

    private buildSubmitProc(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory, userParam, site } = this.context;
        const { act, div, main } = this.bizEntity;

        parameters.push(
            userParam,
            bigIntField(bin),
        );
        if (act === undefined) {
            return;
        }

        const declare = factory.createDeclare();
        statements.push(declare);
        const bigint = new BigInt();
        const decValue = new Dec(18, 6);
        declare.var($site, bigint);
        declare.var(sheetId, bigint);
        declare.var(si, bigint);
        declare.var(sx, bigint);
        declare.var(svalue, decValue);
        declare.var(samount, decValue);
        declare.var(sprice, decValue);
        declare.var(pendFrom, bigint);
        declare.var(i, bigint);
        declare.var(iBase, bigint);
        declare.var(x, bigint);
        declare.var(xBase, bigint);
        declare.var(value, decValue);
        declare.var(amount, decValue);
        declare.var(price, decValue);
        declare.var($origin, bigint);

        let pDiv = div;
        for (; ; pDiv = pDiv.div) {
            declare.var(bin + pDiv.level, bigint);
            if (pDiv.div === undefined) break;
        }

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(site));

        const varBin = new ExpVar(bin);
        const dt = 'dt';
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new ExpField('id', a), binId);
        select.column(new ExpField('origin', a), bin + pDiv.level);
        select.column(new ExpField('id', c), sheetId);
        select.column(new ExpField('i', c), si);
        select.column(new ExpField('x', c), sx);
        select.column(new ExpField('value', c), svalue);
        select.column(new ExpField('price', c), sprice);
        select.column(new ExpField('amount', c), samount);
        select.column(new ExpField('pendFrom', d), pendFrom);
        select.column(new ExpField('i', a), i);
        select.column(new ExpField('x', a), x);
        select.column(new ExpField('value', a), value);
        select.column(new ExpField('amount', a), amount);
        select.column(new ExpField('price', a), price);
        select.from(new EntityTable(EnumSysTable.bizBin, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizDetail, false, dt))
            .on(new ExpEQ(new ExpField('id', dt), new ExpField('id', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('base', dt)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizBin, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('base', b)))
            .join(JoinType.left, new EntityTable(EnumSysTable.binPend, false, d))
            .on(new ExpEQ(new ExpField('id', d), new ExpField('id', a)))
            ;
        select.where(new ExpEQ(new ExpField('id', a), varBin));

        let setBinThis = factory.createSet();
        statements.push(setBinThis);
        setBinThis.equ(bin + pDiv.level, new ExpVar(bin));

        if (main !== undefined) {
            // build main bud field
            let varSheetId = new ExpVar(sheetId);
            for (let [, bud] of main.props) {
                let { name } = bud;
                if (binFieldsSet.has(name) === true) continue;
                let varName = '$s' + name;
                statements.push(...buildSelectBinBud(this.context, bud, varSheetId, varName))
            }
        }

        for (; ; pDiv = pDiv.parent) {
            const { level } = pDiv;
            const selectDiv = factory.createSelect();
            statements.push(selectDiv);
            selectDiv.toVar = true;
            selectDiv.column(new ExpField(origin, a), level === 1 ? $origin : bin + (level - 1));
            const { buds } = pDiv;
            for (let bud of buds) {
                let { name } = bud;
                if (binFieldsSet.has(name) === true) {
                    selectDiv.column(new ExpField(name, a), name);
                }
                else {
                    statements.push(...buildSelectBinBud(this.context, bud, varBin))
                }
            }
            selectDiv.from(new EntityTable(EnumSysTable.bizBin, false, a));
            selectDiv.where(new ExpEQ(new ExpField('id', a), new ExpVar(bin + level)));
            if (pDiv.parent === undefined) break;
        }

        let sqls = new Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
    }

    private buildGetProc(proc: Procedure) {
        let { statements } = proc;
        const { iBase, xBase } = this.bizEntity;
        this.buildGetIXBase(statements, iBase);
        this.buildGetIXBase(statements, xBase);

        let showBuds = this.bizEntity.allShowBuds();
        if (showBuds === undefined) {
            proc.dropOnly = true;
            return;
        }

        let { factory, site } = this.context;

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var($site, new BigInt());

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(site));

        if (showBuds !== undefined) {
            let memo = factory.createMemo();
            statements.push(memo)
            memo.text = this.bizEntity.name + ' show buds';
            statements.push(...this.buildGetShowBuds(showBuds, tempBinTable, 'id'));
        }

        const expValue = new ExpField('value', c);
        function funcJSON_QUOTE() {
            return new ExpFunc('JSON_QUOTE', expValue);
        }
        function funcCast() {
            return new ExpFuncCustom(factory.func_cast, expValue, new ExpDatePart('JSON'))
        }

        let budTypes: [() => ExpVal, EnumSysTable][] = [
            [funcCast, EnumSysTable.ixBudInt],
            [funcCast, EnumSysTable.ixBudDec],
            [funcJSON_QUOTE, EnumSysTable.ixBudStr],
        ]

        for (let binIType of [BinIType.atom, BinIType.fork, BinIType.forkAtom]) {
            for (let [func, tbl] of budTypes) {
                this.buildGetShowBudsFromAtomId(statements, binIType, func, tbl);
            }
        }
    }

    private buildGetShowBudsFromAtomId(statements: SqlStatement[], binIType: BinIType, func: () => ExpVal, tbl: EnumSysTable) {
        const { factory } = this.context;
        let insert = this.buildGetShowBudsInsert();
        statements.push(insert);
        let select = factory.createSelect();
        insert.select = select;
        let selectI = this.buildSelectI(binIType);
        select.column(new ExpField('x', a));
        select.column(func());
        select.column(new ExpField('i', c));
        select.from(new SelectTable(selectI, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBudShow, false, b))
            .on(new ExpEQ(new ExpField('i', b), new ExpField('x', a)))
            .join(JoinType.join, new EntityTable(tbl, false, c))
            .on(new ExpEQ(new ExpField('i', c), new ExpField('x', b)));
    }

    private buildSelectI(binIType: BinIType) {
        const { factory } = this.context;
        let selectAtomPhrase = factory.createSelect();
        let selectCTE = factory.createSelect();
        const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
        selectAtomPhrase.cte = { alias: cte, recursive: true, select: selectCTE };
        selectCTE.column(new ExpField('i', s));
        selectCTE.column(new ExpField('x', s));
        selectCTE.from(new VarTable('bin', s0))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, s1))
            .on(new ExpEQ(new ExpField('id', s1), new ExpField('id', s0)));
        let tField: ExpVal;
        switch (binIType) {
            case BinIType.atom:
                selectCTE.join(JoinType.join, new EntityTable(EnumSysTable.atom, false, t))
                    .on(new ExpEQ(new ExpField('id', t), new ExpField('i', s1)));
                tField = new ExpField('base', t);
                break;
            case BinIType.fork:
                selectCTE.join(JoinType.join, new EntityTable(EnumSysTable.spec, false, u))
                    .on(new ExpEQ(new ExpField('id', u), new ExpField('i', s1)))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, u0))
                    .on(new ExpEQ(new ExpField('id', u0), new ExpField('base', u)));
                tField = new ExpField('ext', u0);
                break;
            case BinIType.forkAtom:
                selectCTE.join(JoinType.join, new EntityTable(EnumSysTable.spec, false, u))
                    .on(new ExpEQ(new ExpField('id', u), new ExpField('i', s1)))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, u0))
                    .on(new ExpEQ(new ExpField('id', u0), new ExpField('base', u)))
                    .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, u1))
                    .on(new ExpEQ(new ExpField('id', u1), new ExpField('base', u0)));;
                tField = new ExpField('base', u1);
                break;
        }
        selectCTE.join(JoinType.join, new EntityTable(EnumSysTable.ixBizPhrase, false, s))
            .on(new ExpEQ(new ExpField('x', s), tField));
        let select1 = factory.createSelect();
        select1.column(new ExpField('i', r));
        select1.column(new ExpField('x', r));
        select1.from(new EntityTable(EnumSysTable.ixBizPhrase, false, r))
            .join(JoinType.join, new NameTable(cte, r0))
            .on(new ExpEQ(new ExpField('i', r0), new ExpField('x', r)));

        selectCTE.unions = [select1];
        selectCTE.unionsAll = true;
        selectAtomPhrase.column(new ExpField('x'));
        selectAtomPhrase.from(new NameTable(cte));
        return selectAtomPhrase
    }

    private buildGetShowBudsInsert() {
        let insert = this.context.factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTableWithSchema('props');
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
            { col: 'id', val: undefined },
        ];
        return insert;
    }

    private buildGetIXBase(statements: SqlStatement[], bud: BizBudIXBase) {
        if (bud === undefined) return;
        let { factory } = this.context;
        const { name } = bud;
        let memo = factory.createMemo();
        statements.push(memo);
        memo.text = name;
        let select = factory.createSelect();
        let budName = name[1];
        select.column(new ExpNum(bud.id), 'phrase');
        //select.column(new ExpFunc('JSON_ARRAY', new ExpField('base', d)));
        select.column(new ExpFuncCustom(factory.func_cast, new ExpField('base', d), new ExpDatePart('JSON')));
        select.column(new ExpField('id', a), 'id');
        select.from(new VarTableWithSchema('bin', a));
        select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('id', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.spec, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField(budName, b)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, d))
            .on(new ExpEQ(new ExpField('id', d), new ExpField('base', c)));

        let insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = new VarTableWithSchema('props');
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
            { col: 'id', val: undefined },
        ];
        insert.select = select;
    }
}
