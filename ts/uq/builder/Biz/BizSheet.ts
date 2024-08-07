import {
    BigInt, BizBin, BizSheet, JoinType
    , bigIntField, decField, idField, EnumSysTable, Char, ProcParamType, UseOut,
    BizBud,
    tinyIntField,
    EnumDataType
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { $site } from "../consts";
import {
    ExpAnd, ExpAtVar, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpGT, ExpIsNotNull, ExpIsNull, ExpNum
    , ExpRoutineExists, ExpSelect, ExpStr, ExpVal, ExpVar, Procedure, Statement
} from "../sql";
import { LockType, SelectTable } from "../sql/select";
import { userParamName } from "../sql/sqlBuilder";
import { EntityTable, NameTable, VarTable, VarTableWithSchema } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

const sheetId = 'sheet';
const s = 's';
const si = 'si';
const sx = 'sx';
const svalue = 'svalue';
const samount = 'samount';
const sprice = 'sprice';
const pendFrom = 'pend';
const binId = 'bin';
const pBinId = '$pBin';
const a = 'a';
const b = 'b';
const c = 'c';
const d = 'd';
const tempBinTable = 'bin';
const tempITable = 'bini';
const tempIdPhraseTable = 'idphrase';
const tempPhraseBudTable = 'phrasebud';
const siteAtomApp = '$siteAtomApp';
enum BinIType {
    atom, fork, forkAtom
}

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
        const { main, details, outs } = this.bizEntity;

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
            bigIntField(siteAtomApp),
        );

        for (let i in outs) {
            let out = outs[i];
            this.buildOutInit(statements, out);
        }

        // main
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `bin ${main.name}`;
        let setBin = factory.createSet();
        statements.push(setBin);
        setBin.equ(binId, new ExpVar(cId));
        // sheet main 界面编辑的时候，value，amount，price 保存到 ixBudDec 里面了。现在转到bin表上
        this.saveMainVPA(statements);
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

        for (let i in outs) {
            let out = outs[i];
            this.buildOut(statements, out);
        }
    }

    private saveMainVPA(statements: Statement[]) {
        const { value, price, amount } = this.bizEntity.main;
        const { factory } = this.context;
        let update = factory.createUpdate();
        const { cols } = update;
        let varBinId = new ExpVar(binId);
        function setVal(bud: BizBud) {
            if (bud === undefined) return;
            let select = factory.createSelect();
            select.lock = LockType.none;
            select.col('value');
            select.from(new EntityTable(EnumSysTable.ixBudDec, false));
            select.where(new ExpAnd(
                new ExpEQ(new ExpField('i'), varBinId),
                new ExpEQ(new ExpField('x'), new ExpNum(bud.id)),
            ));
            cols.push({ col: bud.name, val: new ExpSelect(select) })
        }
        setVal(value);
        setVal(price);
        setVal(amount);
        if (cols.length === 0) return;
        update.table = new EntityTable(EnumSysTable.bizBin, false);
        update.where = new ExpEQ(new ExpField('id'), varBinId);
        statements.push(update);
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
            .on(new ExpEQ(new ExpField('id', b), new ExpField('base', a)))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, c))
            .on(new ExpEQ(new ExpField('id', c), new ExpField('id', a)));
        select.where(new ExpAnd(
            new ExpGT(new ExpField('id', a), new ExpVar(pBinId)),
            new ExpEQ(new ExpField('ext', b), new ExpNum(entityId)),
            new ExpEQ(new ExpField('base', b), new ExpVar('$id')),
            new ExpIsNotNull(new ExpField('value', c)),
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

    // 这个应该是之前试验的老版本，现在应该不用了。
    // 直接在uq GetSheet里面实现了。
    private buildGetProc(proc: Procedure) {
        let { statements, parameters } = proc;
        let { factory, site } = this.context;

        parameters.push(bigIntField('id'));

        const varBinTable = factory.createVarTable();
        statements.push(varBinTable);
        varBinTable.name = tempBinTable;
        let idField = bigIntField('id');
        varBinTable.keys = [idField];
        varBinTable.fields = [idField];

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

        const arrBinIType = [BinIType.atom, BinIType.fork, BinIType.forkAtom];
        let typeField = tinyIntField('type');
        const varIdPhraseTable = factory.createVarTable();
        statements.push(varIdPhraseTable);
        varIdPhraseTable.name = tempIdPhraseTable;
        const phraseField = bigIntField('phrase');
        const budField = bigIntField('bud');
        varIdPhraseTable.keys = [idField];
        varIdPhraseTable.fields = [idField, phraseField, typeField];
        statements.push(...arrBinIType.map(v => this.buildSelectIdPhrase(v)));

        const varPhraseBudTable = factory.createVarTable();
        statements.push(varPhraseBudTable);
        varPhraseBudTable.name = tempPhraseBudTable;
        const phraseParentField = bigIntField('parent');
        const budTypeField = tinyIntField('budtype');
        varPhraseBudTable.keys = [phraseField, phraseParentField, budField];
        varPhraseBudTable.fields = [phraseField, phraseParentField, budField, budTypeField];
        statements.push(this.buildSelectPhraseBud());

        /*
        const varITable = factory.createVarTable();
        statements.push(varITable);
        varITable.name = tempITable;
        varITable.keys = [idField, budField];
        varITable.fields = [idField, budField, typeField];

        statements.push(...arrBinIType.map(v => this.buildSelectShowBuds(v)));
        */

        function funcJSON_QUOTE(expValue: ExpVal) {
            return new ExpFunc('JSON_QUOTE', expValue);
        }
        function funcCast(expValue: ExpVal) {
            return new ExpFuncCustom(factory.func_cast, expValue, new ExpDatePart('JSON'))
        }
        let budTypes: [(v: ExpVal) => ExpVal, EnumSysTable, BudDataType][] = [
            [funcCast, EnumSysTable.ixBudInt, BudDataType.int],
            [funcCast, EnumSysTable.ixBudDec, BudDataType.dec],
            [funcJSON_QUOTE, EnumSysTable.ixBudStr, BudDataType.str],
        ];
        statements.push(...budTypes.map(([func, tbl, budDataType]) => this.buildSelectIxBud(func, tbl, budDataType)));
    }

    private buildSelectPhraseBud() {
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTable(tempPhraseBudTable);
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'parent', val: undefined },
            { col: 'bud', val: undefined },
            { col: 'budtype', val: undefined },
        ];
        let selectAtomPhrase = factory.createSelect();
        insert.select = selectAtomPhrase;
        selectAtomPhrase.lock = LockType.none;
        let selectCTE = factory.createSelect();
        selectCTE.lock = LockType.none;
        const cte = 'cte', r = 'r', r0 = 'r0', s = 's', s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
        selectAtomPhrase.cte = { alias: cte, recursive: true, select: selectCTE };
        selectCTE.column(new ExpField('phrase', s0))
        selectCTE.column(new ExpField('i', s), 'i');
        selectCTE.column(new ExpField('phrase', s0), 'x');
        selectCTE.from(new VarTable(tempIdPhraseTable, s0))
            .join(JoinType.left, new EntityTable(EnumSysTable.ixBizPhrase, false, s))
            .on(new ExpEQ(new ExpField('x', s), new ExpField('phrase', s0)));
        let select1 = factory.createSelect();
        select1.lock = LockType.none;
        select1.column(new ExpField('phrase', r0));
        select1.column(new ExpField('i', r));
        select1.column(new ExpField('x', r));
        select1.from(new EntityTable(EnumSysTable.ixBizPhrase, false, r))
            .join(JoinType.join, new NameTable(cte, r0))
            .on(new ExpEQ(new ExpField('i', r0), new ExpField('x', r)));
        selectCTE.unions = [select1];
        selectCTE.unionsAll = true;
        selectAtomPhrase.distinct = true;
        selectAtomPhrase.column(new ExpField('phrase', a));
        selectAtomPhrase.column(new ExpField('x', a));
        selectAtomPhrase.column(new ExpField('x', b));
        selectAtomPhrase.column(new ExpField('type', b), 'budtype');
        selectAtomPhrase.from(new NameTable(cte, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBudShow, false, b))
            .on(new ExpEQ(new ExpField('i', b), new ExpField('x', a)));
        return insert;
    }

    private buildSelectIdPhrase(binIType: BinIType) {
        const { factory } = this.context;
        const insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTable(tempIdPhraseTable);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'phrase', val: undefined },
            { col: 'type', val: undefined },
        ];
        const s0 = 's0', s1 = 's1', t = 't', u = 'u', u0 = 'u0', u1 = 'u1';
        let select = factory.createSelect();
        insert.select = select;
        select.lock = LockType.none;
        select.from(new VarTable('bin', s0))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, s1))
            .on(new ExpEQ(new ExpField('id', s1), new ExpField('id', s0)));
        switch (binIType) {
            case BinIType.atom:
                select.join(JoinType.join, new EntityTable(EnumSysTable.atom, false, t))
                    .on(new ExpEQ(new ExpField('id', t), new ExpField('i', s1)));
                select.column(new ExpField('id', t));
                select.column(new ExpField('base', t));
                select.column(new ExpNum(BinIType.atom));
                break;
            case BinIType.fork:
                select.join(JoinType.join, new EntityTable(EnumSysTable.spec, false, u))
                    .on(new ExpEQ(new ExpField('id', u), new ExpField('i', s1)))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, u0))
                    .on(new ExpEQ(new ExpField('id', u0), new ExpField('base', u)));
                select.column(new ExpField('id', u));
                select.column(new ExpField('ext', u0));
                select.column(new ExpNum(BinIType.fork));
                break;
            case BinIType.forkAtom:
                select.join(JoinType.join, new EntityTable(EnumSysTable.spec, false, u))
                    .on(new ExpEQ(new ExpField('id', u), new ExpField('i', s1)))
                    .join(JoinType.join, new EntityTable(EnumSysTable.bud, false, u0))
                    .on(new ExpEQ(new ExpField('id', u0), new ExpField('base', u)))
                    .join(JoinType.join, new EntityTable(EnumSysTable.atom, false, u1))
                    .on(new ExpEQ(new ExpField('id', u1), new ExpField('base', u0)));;
                select.column(new ExpField('id', u1));
                select.column(new ExpField('base', u1));
                select.column(new ExpNum(BinIType.atom));
                break;
        }
        return insert;
    }

    private buildSelectIxBud(func: (expValue: ExpVal) => ExpVal, tbl: EnumSysTable, budDataType: BudDataType) {
        const { factory } = this.context;
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTableWithSchema('props');
        insert.cols = [
            { col: 'phrase', val: undefined },
            { col: 'value', val: undefined },
            { col: 'id', val: undefined },
        ];
        let select = factory.createSelect();
        insert.select = select;
        select.column(new ExpField('bud', b), 'phrase');
        select.column(func(new ExpField('value', c)), 'value');
        select.column(new ExpField('id', a), 'id');
        select.from(new VarTable(tempIdPhraseTable, a))
            .join(JoinType.join, new VarTable(tempPhraseBudTable, b))
            .on(new ExpEQ(new ExpField('phrase', b), new ExpField('phrase', a)))
            .join(JoinType.join, new EntityTable(tbl, false, c))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('i', c), new ExpField('id', a)),
                new ExpEQ(new ExpField('x', c), new ExpField('bud', b)),
            ));
        select.where(new ExpEQ(new ExpField('budtype', b), new ExpNum(budDataType)));
        return insert;
    }

    private buildSelectShowBuds(binIType: BinIType) {
        const { factory } = this.context;
        let insert = this.buildInsertITable();
        let select = factory.createSelect();
        insert.select = select;
        select.lock = LockType.none;
        let selectI = this.buildSelectI(binIType);
        select.column(new ExpField('i', b), 'id');
        select.column(new ExpField('x', b), 'bud');
        select.column(new ExpField('type', b), 'type');
        select.from(new SelectTable(selectI, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.bizBudShow, false, b))
            .on(new ExpEQ(new ExpField('i', b), new ExpField('x', a)));
        return insert;
    }

    private buildSelectI(binIType: BinIType) {
        const { factory } = this.context;
        let selectAtomPhrase = factory.createSelect();
        selectAtomPhrase.lock = LockType.none;
        let selectCTE = factory.createSelect();
        selectCTE.lock = LockType.none;
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
        select1.lock = LockType.none;
        select1.column(new ExpField('i', r));
        select1.column(new ExpField('x', r));
        select1.from(new EntityTable(EnumSysTable.ixBizPhrase, false, r))
            .join(JoinType.join, new NameTable(cte, r0))
            .on(new ExpEQ(new ExpField('i', r0), new ExpField('x', r)));

        selectCTE.unions = [select1];
        selectCTE.unionsAll = true;
        selectAtomPhrase.distinct = true;
        selectAtomPhrase.column(new ExpField('x'));
        selectAtomPhrase.from(new NameTable(cte));
        return selectAtomPhrase
    }

    private buildInsertITable() {
        let insert = this.context.factory.createInsert();
        insert.ignore = true;
        insert.table = new VarTableWithSchema(tempITable);
        insert.cols = [
            { col: 'id', val: undefined },
            { col: 'bud', val: undefined },
            { col: 'type', val: undefined },
        ];
        return insert;
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

    private buildOutInit(statements: Statement[], out: UseOut): void {
        const varName = '$' + out.varName;
        const { factory } = this.context;
        let tblTo = factory.createVarTable();
        statements.push(tblTo);
        tblTo.name = varName + '$TO';
        let fieldTo = bigIntField('to')
        tblTo.fields = [fieldTo];
        tblTo.keys = [fieldTo];

        let set = factory.createSet();
        statements.push(set);
        let params: ExpVal[] = [];
        for (let [, bud] of out.out.props) {
            const { dataType, name } = bud;
            if (dataType !== BudDataType.arr) continue;
            params.push(new ExpStr(name), new ExpFunc('JSON_ARRAY'));
        }
        set.isAtVar = true;
        set.equ(varName, new ExpFunc('JSON_OBJECT', ...params));
    }

    private buildOut(statements: Statement[], out: UseOut) {
        const { factory } = this.context;
        const { varName, out: bizOut } = out;
        const vName = '$' + varName;
        const memo = factory.createMemo();
        statements.push(memo);
        memo.text = `call PROC to write OUT @${vName} ${bizOut.getJName()}`;
        const call = factory.createCall();
        statements.push(call);
        call.db = '$site';
        call.procName = `${this.context.site}.${bizOut.id}`;
        call.params.push(
            {
                paramType: ProcParamType.in,
                value: new ExpAtVar(vName),
            }
        );
    }
}
