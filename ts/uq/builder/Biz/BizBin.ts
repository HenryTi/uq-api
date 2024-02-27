import { binAmount, binFieldArr, binPrice, binValue } from "../../consts";
import { BigInt, BizBin, Dec, JoinType, bigIntField, EnumSysTable, BizBudValue, BizBud, Char, DataType, BudDataType, JsonDataType, EnumDataType } from "../../il";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { ExpAnd, ExpEQ, ExpField, ExpFunc, ExpNum, ExpVal, ExpVar, Procedure, Select } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

const sheetId = 'sheet1';   // 实际写表时，会加上bin div.level=1
const si = 'si';
const sx = 'sx';
const svalue = 'svalue';
const samount = 'samount';
const sprice = 'sprice';
const pendFrom = 'pend';
const i = 'i';
const x = 'x';
const value = binValue;
const amount = binAmount;
const price = binPrice;
const binId = 'bin';
const origin = 'origin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const bin = 'bin';
const tempBinTable = 'bin';
const binFieldsSet = new Set(binFieldArr);

export class BBizBin extends BBizEntity<BizBin> {
    async buildBudsValue() {
        super.buildBudsValue();
        const { inputArr } = this.bizEntity;
        if (inputArr !== undefined) {
            for (let input of inputArr) {
                input.buildBudValue(this.expStringify);
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
        const { act, div } = this.bizEntity;

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
        const str = new Char(200);
        const json = new JsonDataType();
        declare.var($site, bigint);
        declare.var(sheetId, bigint);
        declare.var(si, bigint);
        declare.var(sx, bigint);
        declare.var(svalue, decValue);
        declare.var(samount, decValue);
        declare.var(sprice, decValue);
        declare.var(pendFrom, bigint);
        declare.var(i, bigint);
        declare.var(x, bigint);
        declare.var(value, decValue);
        declare.var(amount, decValue);
        declare.var(price, decValue);
        declare.var(origin, bigint);

        let pDiv = div;
        for (; ; pDiv = pDiv.div) {
            declare.var(bin + pDiv.level, bigint);
            if (pDiv.div === undefined) break;
        }

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(site));

        const varBin = new ExpVar('bin');
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

        function buildSelectBudValue(bud: BizBud, tbl: EnumSysTable): Select {
            let selectBud = factory.createSelect();
            selectBud.toVar = true;
            selectBud.col('value', bud.name, a);
            selectBud.from(new EntityTable(tbl, false, a));
            selectBud.where(new ExpAnd(
                new ExpEQ(new ExpField('i', a), varBin),
                new ExpEQ(new ExpField('x', a), new ExpNum(bud.id)),
            ));
            return selectBud;
        }

        function buildSelectBudIx(bud: BizBud, isRadio: boolean): Select {
            let selectBud = factory.createSelect();
            selectBud.toVar = true;
            let exp: ExpVal = isRadio === true ?
                new ExpField('x', a)
                : new ExpFunc('JSON_ARRAYAGG', new ExpField('x', a));
            selectBud.column(exp, bud.name);
            selectBud.from(new EntityTable(EnumSysTable.ixBud, false, a));
            selectBud.where(new ExpEQ(new ExpField('i', a), varBin));
            return selectBud;
        }

        function buildBud(bud: BizBud) {
            const { name, dataType } = bud;
            let declareType: DataType;
            let selectBud: Select;
            switch (dataType) {
                default: throw new Error('unknown type ' + EnumDataType[dataType]);
                case BudDataType.none:
                    return;
                case BudDataType.ID:
                case BudDataType.atom:
                case BudDataType.date:
                case BudDataType.int:
                    selectBud = buildSelectBudValue(bud, EnumSysTable.ixBudInt);
                    declareType = bigint;
                    break;
                case BudDataType.str:
                case BudDataType.char:
                    selectBud = buildSelectBudValue(bud, EnumSysTable.ixBudStr);
                    declareType = str;
                    break;
                case BudDataType.dec:
                    selectBud = buildSelectBudValue(bud, EnumSysTable.ixBudDec);
                    declareType = decValue;
                    break;
                case BudDataType.radio:
                    selectBud = buildSelectBudIx(bud, true);
                    declareType = bigint;
                    break;
                case BudDataType.check:
                    selectBud = buildSelectBudIx(bud, false);
                    declareType = json;
                    break;
            }
            statements.push(selectBud);
            declare.var(name, declareType);
        }

        for (; ; pDiv = pDiv.parent) {
            const { level } = pDiv;
            const selectDiv = factory.createSelect();
            statements.push(selectDiv);
            selectDiv.toVar = true;
            selectDiv.column(new ExpField(origin, a), level === 1 ? origin : bin + (level - 1));
            const { buds } = pDiv;
            for (let bud of buds) {
                let { name } = bud;
                if (binFieldsSet.has(name) === true) {
                    selectDiv.column(new ExpField(name, a), name);
                }
                else {
                    buildBud(bud);
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
        let showBuds = this.bizEntity.allShowBuds();
        if (showBuds === undefined) {
            proc.dropOnly = true;
            return;
        }

        let { statements, parameters } = proc;
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
    }
}
