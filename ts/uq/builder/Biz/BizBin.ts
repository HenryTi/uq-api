import {
    BigInt, BizBin, BizSheet, Dec, JoinType
    , bigIntField, decField, idField, EnumSysTable
    , BudDataType, FieldShowItem, FieldShow, Char
} from "../../il";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { ExecSql, ExpAnd, ExpEQ, ExpField, ExpFunc, ExpGT, ExpIsNull, ExpNum, ExpRoutineExists, ExpStr, ExpVal, ExpVar, Procedure, SqlVarTable, Statement } from "../sql";
import { userParamName } from "../sql/sqlBuilder";
import { EntityTable, VarTable, VarTableWithSchema } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

const sheetId = 'sheet';
const ss = 'ss';
const si = 'si';
const sx = 'sx';
const svalue = 'svalue';
const samount = 'samount';
const sprice = 'sprice';
const pendFrom = 'pend';
const i = 'i';
const x = 'x';
const value = 'value';
const amount = 'amount';
const price = 'price';
const binId = 'bin';
const pBinId = '$pBin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const tempBinTable = 'bin';

export class BBizBin extends BBizEntity<BizBin> {
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
        const { act } = this.bizEntity;

        parameters.push(
            userParam,
            bigIntField('bin'),
        );
        if (act === undefined) {
            return;
        }

        const declare = factory.createDeclare();
        statements.push(declare);
        const bigint = new BigInt();
        const decValue = new Dec(18, 6);
        declare.var($site, bigint);
        declare.var(ss, bigint);
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

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(site));

        const a1 = 'a1';
        const select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new ExpField('id', a), binId);
        select.column(new ExpField('i', a), i);
        select.column(new ExpField('x', a), x);
        select.column(new ExpField('value', a), value);
        select.column(new ExpField('amount', a), amount);
        select.column(new ExpField('price', a), price);
        select.column(new ExpField('id', c), ss);
        select.column(new ExpField('i', c), si);
        select.column(new ExpField('x', c), sx);
        select.column(new ExpField('value', c), svalue);
        select.column(new ExpField('price', c), sprice);
        select.column(new ExpField('amount', c), samount);
        select.column(new ExpField('pendFrom', d), pendFrom);

        select.from(new EntityTable(EnumSysTable.bizBin, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizDetail, false, a1))
            .on(new ExpEQ(new ExpField('id', a1), new ExpField('id', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a1)))
            .join(JoinType.left, new EntityTable(EnumSysTable.bizBin, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('base', b)))
            .join(JoinType.left, new EntityTable(EnumSysTable.binPend, false, d))
            .on(new ExpEQ(new ExpField('id', d), new ExpField('id', a)))
            ;
        select.where(new ExpEQ(new ExpField('id', a), new ExpVar('bin')));

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
            statements.push(...this.buildGetShowBuds(showBuds));
        }
    }

    private buildGetShowBuds(showBuds: { [bud: string]: FieldShow }): Statement[] {
        let statements: Statement[] = [];
        let { factory } = this.context;
        for (let i in showBuds) {
            let fieldShow = showBuds[i];
            let select = this.buildSelect(fieldShow);
            let insert = factory.createInsert();
            statements.push(insert);
            insert.table = new VarTableWithSchema('props');
            insert.cols = [
                { col: 'id', val: undefined },
                { col: 'phrase', val: undefined },
                { col: 'value', val: undefined },
                { col: 'owner', val: undefined },
            ];
            insert.select = select;
        }
        return statements;
    }

    private buildSelect(fieldShow: FieldShow) {
        const { owner, items } = fieldShow;
        const { factory } = this.context;
        const select = factory.createSelect();
        select.column(new ExpField('id', a), 'id');
        select.from(new VarTableWithSchema(tempBinTable, a));
        let lastT: string = 't0', lastField: string;
        let len = items.length - 1;
        let { bizEntity: lastEntity, bizBud: lastBud } = items[0];
        let { name: lastBudName } = lastBud;
        if (lastBudName === 'i' || lastBudName === 'x') {
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, lastT))
                .on(new ExpEQ(new ExpField('id', lastT), new ExpField('id', a)));
            lastField = lastBudName;
        }
        else {
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, b))
                .on(new ExpEQ(new ExpField('id', b), new ExpField('id', a)))
                .join(JoinType.join, new EntityTable(EnumSysTable.ixBudInt, false, lastT))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('i', lastT), new ExpField('id', b)),
                    new ExpEQ(new ExpField('x', lastT), new ExpNum(lastBud.id)),
                ));
            lastField = 'value';
        }

        for (let i = 1; i < len; i++) {
            let { bizEntity, bizBud } = items[i];
            lastEntity = bizEntity;
            lastBud = bizBud;
            const t = 't' + i;
            select.join(JoinType.join, new EntityTable(EnumSysTable.ixBudInt, false, t))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('i', t), new ExpField(lastField, lastT)),
                    new ExpEQ(new ExpField('x', t), new ExpNum(bizBud.id)),
                ));
            lastT = t;
            lastField = 'value';
        }
        let t = 't' + len;
        let { bizEntity, bizBud } = items[len];
        let tblIxBud: string;
        switch (bizBud.dataType) {
            default:
                tblIxBud = EnumSysTable.ixBudInt;
                selectValue();
                break;
            case BudDataType.dec:
                tblIxBud = EnumSysTable.ixBudDec;
                selectValue();
                break;
            case BudDataType.str:
            case BudDataType.char:
                tblIxBud = EnumSysTable.ixBudStr;
                selectValue();
                break;
            case BudDataType.radio:
            case BudDataType.check:
                tblIxBud = EnumSysTable.ixBud;
                selectCheck();
                break;
        }
        function selectValue() {
            select.join(JoinType.join, new EntityTable(tblIxBud, false, t))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('i', t), new ExpField(lastField, lastT)),
                    new ExpEQ(new ExpField('x', t), new ExpNum(bizBud.id)),
                ));
            select.column(new ExpNum(bizBud.id), 'phrase');
            select.column(new ExpFunc('JSON_ARRAY', new ExpField('value', t)));
        }
        function selectCheck() {
            select.join(JoinType.join, new EntityTable(tblIxBud, false, t))
                .on(new ExpEQ(new ExpField('i', t), new ExpField(lastField, lastT)))
                .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, c))
                .on(new ExpEQ(new ExpField('id', c), new ExpField('x', t)));
            select.column(new ExpField('base', c), 'phrase');
            select.column(new ExpFunc('JSON_ARRAY', ExpNum.num0, new ExpField('ext', c)));
            select.where(new ExpEQ(new ExpField('base', c), new ExpNum(bizBud.id)))
        }
        let expOwner: ExpVal;
        if (owner === undefined) {
            expOwner = ExpNum.num0;
        }
        else {
            expOwner = new ExpNum(owner.id);
        }
        select.column(expOwner, 'owner');
        return select;
    }
}
