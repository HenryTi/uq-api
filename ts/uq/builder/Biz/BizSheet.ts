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
const s = 's';
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

export class BBizSheet extends BBizEntity<BizSheet> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
        const procGet = this.createProcedure(`${this.context.site}.${id}gs`); // gs = get sheet
        this.buildGetProc(procGet);
    }

    private buildSubmitProc(proc: Procedure) {
        const { parameters, statements } = proc;
        const { factory, userParam } = this.context;
        const { main, details } = this.bizEntity;

        const site = '$site';
        const cId = '$id';

        parameters.push(
            bigIntField(site),
            userParam,
            idField(cId, 'big'),
        );

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField(sheetId),
            bigIntField(si),
            bigIntField(sx),
            decField(svalue, 18, 6),
            decField(samount, 18, 6),
            decField(sprice, 18, 6),
        );

        // main
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bin ${main.name}`;
        let setBin = factory.createSet();
        statements.push(setBin);
        setBin.equ(binId, new ExpVar(cId));
        let mainStatements = this.buildBinOneRow(main);
        statements.push(...mainStatements);

        // details
        declare.vars(
            bigIntField(pendFrom),
            bigIntField(binId),
            bigIntField(pBinId),
        );
        let len = details.length;
        for (let i = 0; i < len; i++) {
            let { bin } = details[i];
            this.buildBin(statements, bin, i + 101);
        }
    }

    private buildBin(statements: Statement[], bin: BizBin, statementNo: number) {
        const { id: entityId, name } = bin;
        const { factory } = this.context;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bin ${name}`;

        const setPBinId0 = factory.createSet();
        statements.push(setPBinId0);
        setPBinId0.equ(pBinId, ExpNum.num0);
        const loop = factory.createWhile();
        loop.no = statementNo;
        statements.push(loop);
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);

        const select = factory.createSelect();
        loop.statements.add(select);
        select.toVar = true;
        select.column(new ExpField('id', a), binId);
        select.from(new EntityTable(EnumSysTable.bizDetail, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)));
        select.where(new ExpAnd(
            new ExpGT(new ExpField('id', a), new ExpVar(pBinId)),
            new ExpEQ(new ExpField('ext', b), new ExpNum(entityId)),
            new ExpEQ(new ExpField('base', b), new ExpVar('$id')),
        ));
        select.order(new ExpField('id', a), 'asc');
        select.limit(ExpNum.num1);

        const iffExit = factory.createIf();
        loop.statements.add(iffExit);
        iffExit.cmp = new ExpIsNull(new ExpVar(binId));
        const exit = factory.createBreak();
        iffExit.then(exit);
        exit.no = statementNo;

        let binOneRow = this.buildBinOneRow(bin)
        loop.statements.add(...binOneRow);

        const setPBin = factory.createSet();
        loop.statements.add(setPBin);
        setPBin.equ(pBinId, new ExpVar(binId));

        const setBinNull = factory.createSet();
        loop.statements.add(setBinNull);
        setBinNull.equ(binId, ExpVal.null);
    }

    private buildBinOneRow(bin: BizBin): Statement[] {
        const statements: Statement[] = [];
        const { act, id: entityId } = bin;
        const { factory, site, dbName } = this.context;

        if (act !== undefined) {
            const call = factory.createCall();
            statements.push(call);
            call.db = '$site';
            call.procName = `${site}.${entityId}`;
            call.params = [
                { value: new ExpVar(userParamName) },
                { value: new ExpVar(binId) },
            ];
        }
        const delBinPend = factory.createDelete();
        statements.push(delBinPend);
        delBinPend.tables = [a];
        delBinPend.from(new EntityTable(EnumSysTable.binPend, false, a));
        delBinPend.where(new ExpEQ(new ExpField('id', a), new ExpVar(binId)));

        return statements;
    }

    private buildGetProc(proc: Procedure) {
        let { statements, parameters } = proc;
        let { factory, site } = this.context;

        parameters.push(bigIntField('id'));

        const varTable = factory.createVarTable();
        statements.push(varTable);
        varTable.name = tempBinTable;
        let idField = bigIntField('id');
        varTable.keys = [idField];
        varTable.fields = [idField];

        const declare = factory.createDeclare();
        statements.push(declare);
        declare.var($site, new BigInt());

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(site));

        let { main, details } = this.bizEntity;
        this.buildCallBin(statements, main, 'main');
        for (let detail of details) {
            const { bin } = detail;
            this.buildCallBin(statements, bin, 'details');
        }
    }

    private buildCallBin(statements: Statement[], bizBin: BizBin, tbl: string) {
        let { factory } = this.context;
        let vProc = 'proc_' + bizBin.id;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var(vProc, new Char(200));
        let setVProc = factory.createSet();
        statements.push(setVProc);
        setVProc.equ(vProc, new ExpFunc(factory.func_concat, new ExpVar($site), new ExpStr('.'), new ExpNum(bizBin.id), new ExpStr('gb')));

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpRoutineExists(new ExpStr($site), new ExpVar(vProc));
        let truncate = factory.createTruncate();
        iff.then(truncate);
        truncate.table = new VarTableWithSchema(tempBinTable);
        let insertBins = factory.createInsert();
        iff.then(insertBins);
        insertBins.table = truncate.table;
        insertBins.cols = [{ col: 'id', val: undefined }];
        let selectBins = factory.createSelect();
        insertBins.select = selectBins;
        selectBins.col('id');
        selectBins.from(new VarTableWithSchema(tbl));
        let execSql = factory.createExecSql();
        iff.then(execSql);
        execSql.no = bizBin.id;
        execSql.sql = new ExpFunc(factory.func_concat, new ExpStr('CALL `' + $site + '`.`'), new ExpVar(vProc), new ExpStr('`()'));
    }
}

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
        declare.var(s, bigint);
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
        select.column(new ExpField('id', c), s);
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
