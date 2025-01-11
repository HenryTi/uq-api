import { binAmount, binFieldArr, binFieldArrRoot, binPrice, binValue } from "../../consts";
import {
    BigInt, BizBin, JoinType, bigIntField, EnumSysTable, bizDecType
} from "../../il";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { ExpEQ, ExpField, ExpNum, ExpVar, Procedure } from "../sql";
import { EntityTable } from "../sql/statementWithFrom";
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
const iBase = 'ibase';
const x = 'x';
const xBase = 'xbase';
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
const binFieldsSet = new Set(binFieldArrRoot);

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
        // const { id } = this.bizEntity;
        const procSubmit = this.createSiteEntityProcedure();
        this.buildSubmitProc(procSubmit);
        // const procGet = this.createProcedure(`${this.context.site}.${id}gb`);
        // this.buildGetProc(procGet);
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
        const decValue = bizDecType;
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
            // .join(JoinType.join, new EntityTable(EnumSysTable.bizDetail, false, dt))
            // .on(new ExpEQ(new ExpField('id', dt), new ExpField('id', a)))
            // .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
            // .on(new ExpEQ(new ExpField('id', b), new ExpField('base', dt)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizBin, false, c))
            // .on(new ExpEQ(new ExpField('id', c), new ExpField('base', b)))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('sheet', a)))
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
}
