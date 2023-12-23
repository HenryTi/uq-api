import {
    BigInt, BizBin, BizSheet, JoinType
    , bigIntField, decField, idField, EnumSysTable, Char
} from "../../il";
import { $site } from "../consts";
import {
    ExpAnd, ExpEQ, ExpField, ExpFunc, ExpGT, ExpIsNotNull, ExpIsNull, ExpNum
    , ExpRoutineExists, ExpStr, ExpVal, ExpVar, Procedure, Statement
} from "../sql";
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
