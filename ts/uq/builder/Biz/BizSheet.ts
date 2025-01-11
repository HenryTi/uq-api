import {
    BigInt, BizBin, BizSheet, JoinType
    , bigIntField, decField, idField, EnumSysTable, Char, ProcParamType, UseOut,
    BizBud,
    BizBudBin,
    EnumSysBud
} from "../../il";
import { BudDataType } from "../../il/Biz/BizPhraseType";
import { $site } from "../consts";
import {
    ExpAnd, ExpAtVar, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpGT, ExpIsNotNull, ExpIsNull, ExpNum
    , ExpRoutineExists, ExpSelect, ExpStr, ExpVal, ExpVar, Procedure, Statement,
} from "../sql";
import { LockType, Select, SelectTable } from "../sql/select";
import { userParamName } from "../sql/sqlBuilder";
import { EntityTable, NameTable, Table, VarTable, VarTableWithSchema } from "../sql/statementWithFrom";
import { buildIdPhraseTable, buildInsertSelectIdPhrase, buildPhraseBudTable, buildSelectIdPhrases, buildSelectIxBuds, buildSelectPhraseBud } from "../tools";
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
const siteAtomApp = '$siteAtomApp';

export class BBizSheet extends BBizEntity<BizSheet> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const procSubmit = this.createSiteEntityProcedure();
        this.buildSubmitProc(procSubmit);
        const procGet = this.createSiteEntityProcedure('gs'); // gs = get sheet
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
        // sheet main 界面编辑的时候，value，amount，price 保存到 ixDec 里面了。现在转到bin表上
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
            select.from(new EntityTable(EnumSysTable.ixDec, false));
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
        /*
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
        */
        select.from(new EntityTable(EnumSysTable.bizBin, false, a));
        select.where(new ExpAnd(
            new ExpGT(new ExpField('id', a), new ExpVar(pBinId)),
            new ExpEQ(new ExpField('base', a), new ExpNum(entityId)),
            new ExpEQ(new ExpField('sheet', a), new ExpVar('$id')),
            new ExpIsNotNull(new ExpField('value', a)),
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
            call.db = `${$site}.${site}`;
            call.procName = `${entityId}`;
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

        const varIdPhraseTable = buildIdPhraseTable(this.context);
        statements.push(varIdPhraseTable);
        function buildSelectFrom(select: Select) {
            const s0 = 's0', s1 = 's1';
            select.from(new VarTable('bin', s0))
                .join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, s1))
                .on(new ExpEQ(new ExpField('id', s1), new ExpField('id', s0)));
        }
        statements.push(...buildSelectIdPhrases(this.context, buildSelectFrom));

        const varPhraseBudTable = buildPhraseBudTable(this.context); // factory.createVarTable();
        statements.push(varPhraseBudTable);
        statements.push(buildSelectPhraseBud(this.context));

        let expValue = new ExpField('value', 'b');
        let expCast = new ExpFuncCustom(factory.func_cast, expValue, new ExpDatePart('JSON'));
        this.buildGetScalarProps(statements, EnumSysTable.ixInt, expCast);

        statements.push(...buildSelectIxBuds(this.context));
        this.buildGetProps(statements);
        this.buildGetBinProps(statements);
    }

    private buildGetProps(statements: Statement[]) {
        const { factory } = this.context;
        let expValue = new ExpField('value', 'b');
        let expCast = new ExpFuncCustom(factory.func_cast, expValue, new ExpDatePart('JSON'));
        let expJSONQUOTE = new ExpFunc('JSON_QUOTE', expValue);
        this.buildGetScalarProps(statements, EnumSysTable.ixDec, expCast);
        this.buildGetScalarProps(statements, EnumSysTable.ixStr, expJSONQUOTE);
        this.buildGetScalarProps(statements, EnumSysTable.ixJson, expValue);
    }

    private buildGetScalarProps(statements: Statement[], sysTable: EnumSysTable, expValue: ExpVal) {
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
        select.column(new ExpField('id', a));
        select.column(new ExpField('x', b));
        select.column(expValue);
        select.from(new VarTable('bin', a))
            .join(JoinType.join, new EntityTable(sysTable, false, b))
            .on(new ExpEQ(new ExpField('id', a), new ExpField('i', b)));
    }

    private buildGetBinProps(statements: Statement[]) {
        const { main, details } = this.bizEntity;
        main.forEachBud(v => this.buildBinBud(statements, 'main', v));
        for (let detail of details) detail.bin.forEachBud(v => this.buildBinBud(statements, 'details', v));
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
            this.buildBinSysProp(statements, tbl, bud, sysBud);
        }
        if (sysNO === undefined) {
            this.buildBinSysProp(statements, tbl, bud, EnumSysBud.sheetNo);
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

    private buildBinSysProp(statements: Statement[], tbl: string, binBud: BizBud, sysBud: EnumSysBud) {
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

        select.column(new ExpField('value', b), 'id');
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
        select.from(new VarTable(tbl, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.ixInt, false, b))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('i', b), new ExpField('id', a)),
                new ExpEQ(new ExpField('x', b), new ExpNum(binBud.id)),
            ));

        let expId: ExpVal = new ExpField('value', b);
        if (tbl === 'details') {
            const t0 = 't0', t1 = 't1';
            /*
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizDetail, false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expId))
                .join(JoinType.join, new EntityTable('bud', false, t1))
                .on(new ExpEQ(new ExpField('id', t1), new ExpField('base', t0)));
            expId = new ExpField('base', t1);
            */
            select.join(JoinType.join, new EntityTable(EnumSysTable.bizBin, false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expId));
            expId = new ExpField('sheet', t0);
        }
        select.join(JoinType.join, new EntityTable(EnumSysTable.bizSheet, false, c))
            .on(new ExpEQ(new ExpField('id', c), expId));
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
        const expValue = new ExpField('value', c);
        let tblIxName: EnumSysTable
            , colValue: ExpVal = new ExpFuncCustom(factory.func_cast, expValue, new ExpDatePart('json'));
        switch (bud.dataType) {
            default:
                tblIxName = EnumSysTable.ixInt;
                break;
            case BudDataType.str:
            case BudDataType.char:
                tblIxName = EnumSysTable.ixStr;
                colValue = new ExpFunc('JSON_QUOTE', expValue);
                break;
            case BudDataType.dec:
                tblIxName = EnumSysTable.ixDec;
                break;
        }

        let expBin: ExpVal = new ExpField('value', b);
        select.column(expBin, 'id');
        select.column(new ExpField('x', c), 'phrase');
        select.column(colValue, 'value');
        select.from(new VarTable(tbl, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.ixInt, false, b))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('i', b), new ExpField('id', a)),
                new ExpEQ(new ExpField('x', b), new ExpNum(binBud.id)),
            ));

        if (upMain === true) {
            const t0 = 't0', t1 = 't1';
            select.join(JoinType.join, new EntityTable('detail', false, t0))
                .on(new ExpEQ(new ExpField('id', t0), expBin))
                .join(JoinType.join, new EntityTable('bud', false, t1))
                .on(new ExpEQ(new ExpField('id', t1), new ExpField('base', t0)));
            expBin = new ExpField('base', t1);
        }
        select.join(JoinType.join, new EntityTable(tblIxName, false, c))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('i', c), expBin),
                new ExpEQ(new ExpField('x', c), new ExpNum(bud.id))
            ));
    }

    private buildCallBin(statements: Statement[], bizBin: BizBin, tbl: string) {
        let { factory } = this.context;
        let insertBins = factory.createInsert();
        statements.push(insertBins);
        insertBins.table = new VarTableWithSchema(tempBinTable);
        insertBins.cols = [{ col: 'id', val: undefined }];
        let selectBins = factory.createSelect();
        insertBins.select = selectBins;
        selectBins.col('id');
        selectBins.from(new VarTableWithSchema(tbl));
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
        call.db = `${$site}.${this.context.site}`;
        call.procName = `${bizOut.id}`;
        call.params.push(
            {
                paramType: ProcParamType.in,
                value: new ExpAtVar(vName),
            }
        );
    }
}
