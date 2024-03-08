import {
    BigInt, BizBud, BizBudArr, BizIOApp, BizIn, BizInOut, BizOut, BudDataType, Char, EnumSysTable, Field
    , IOAppID, IOAppIO, IOAppIn, IOAppOut, JoinType
    , JsonTableColumn, ProcParamType, bigIntField, charField, dateField
    , decField, intField, jsonField, tinyIntField
} from "../../il";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { DbContext } from "../dbContext";
import {
    ExpAnd, ExpDatePart, ExpEQ, ExpField, ExpFunc, ExpFuncCustom, ExpFuncInUq
    , ExpGT, ExpIsNotNull, ExpIsNull, ExpNull, ExpNum, ExpSelect, ExpStr
    , ExpVal, ExpVar, Procedure, SqlVarTable, Statement
} from "../sql";
import { Factory } from "../sql/factory";
import { LockType, Select } from "../sql/select";
import { EntityTable, VarTable, FromJsonTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";
import { JsonTrans } from "./JsonTrans/JsonTrans";
import { FuncAtomToNo, FuncNoToAtom, FuncUniqueFromNo, FuncUniqueToNo, IOStatementBuilder, JsonContext } from "./JsonTrans";

abstract class BBizInOut<T extends BizInOut> extends BBizEntity<T> {
}

export class BBizIn extends BBizInOut<BizIn> {
    static queueId = '$queueId';
    static inSite = '$inSite';
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }

    private buildSubmitProc(proc: Procedure) {
        const vJson = '$json';
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const { act, props } = this.bizEntity;
        let varJson = new ExpVar(vJson);
        parameters.push(
            bigIntField(BBizIn.queueId),       // IO queue id
            bigIntField(BBizIn.inSite),
            jsonField(vJson),
        );
        const declare = factory.createDeclare();
        statements.push(declare);
        let vars: Field[] = [
            bigIntField($site),
            bigIntField('$id'),
            bigIntField('$rowId'),
        ];
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(this.context.site));

        for (let [name, bud] of props) {
            const { dataType } = bud;
            if (dataType !== BudDataType.arr) {
                vars.push(this.fieldFromBud(bud));
                let set = factory.createSet();
                statements.push(set);
                let expVal: ExpVal = new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${name}"`));
                if (dataType === BudDataType.date) {
                    expVal = new ExpFuncCustom(factory.func_dateadd,
                        new ExpDatePart('day'),
                        expVal,
                        new ExpStr('1970-01-01')
                    );
                }
                set.equ(name, expVal);
            }
            else {
                let { name: arrName, props: arrProps } = bud as BizBudArr;
                let varTable = factory.createVarTable();
                statements.push(varTable);
                varTable.name = arrName;
                let idField = intField('$id');
                idField.autoInc = true;
                varTable.keys = [idField];
                varTable.fields = [idField];
                const { fields } = varTable;
                let insertArr = factory.createInsert();
                statements.push(insertArr);
                insertArr.table = new SqlVarTable(arrName);
                insertArr.cols = [];
                const { cols } = insertArr;
                let selectJsonArr = factory.createSelect();
                insertArr.select = selectJsonArr;
                let jsonColumns: JsonTableColumn[] = [];
                let jsonTable = new FromJsonTable('a', varJson, `$."${arrName}"[*]`, jsonColumns);
                selectJsonArr.from(jsonTable);
                selectJsonArr.lock = LockType.none;
                for (let [name, bud] of arrProps) {
                    let field = this.fieldFromBud(bud);
                    vars.push(field);
                    field.nullable = true;
                    fields.push(field);
                    cols.push({ col: name, val: new ExpField(name, 'a') });
                    selectJsonArr.column(new ExpField(name, 'a'));
                    jsonColumns.push({ field: this.fieldFromBud(bud), path: `$."${name}"` });
                }
            }
        }
        declare.vars(...vars);

        let sqls = new Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);

        this.buildDone(statements);
    }

    private fieldFromBud(bud: BizBud) {
        const { name } = bud;
        switch (bud.dataType) {
            default: debugger; return;
            case BudDataType.ID:
            case BudDataType.int: return bigIntField(name);
            case BudDataType.char: return charField(name, 200);
            case BudDataType.dec: return decField(name, 18, 6);
            case BudDataType.date: return dateField(name);
        }
    }

    private buildDone(statements: Statement[]) {
        const { factory } = this.context;
        const updateQueue = factory.createUpdate();
        statements.push(updateQueue);
        updateQueue.cols = [
            { col: 'done', val: ExpNum.num1 },
        ];
        updateQueue.table = new EntityTable(EnumSysTable.IOQueue, false);
        updateQueue.where = new ExpEQ(new ExpField('id'), new ExpVar(BBizIn.queueId));

        const delInOut = factory.createDelete();
        statements.push(delInOut);
        delInOut.tables = ['a'];
        delInOut.from(new EntityTable(EnumSysTable.IOInOut, false, 'a'));
        delInOut.where(new ExpAnd(
            new ExpEQ(new ExpField('i'), ExpNum.num1),
            new ExpEQ(new ExpField('x'), new ExpVar(BBizIn.queueId)),
        ));
    }
}

export class BBizOut extends BBizInOut<BizOut> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const proc = this.createProcedure(`${this.context.site}.${id}`);
        this.buildProc(proc);
    }

    private buildProc(proc: Procedure) {
        const json = '$json', out = '$out', endPoint = '$endPoint'
            , siteAtomApp = '$siteAtomApp'
            , queueId = '$queueId';
        const { id, ioAppOuts } = this.bizEntity;
        const { parameters, statements } = proc;
        const { factory, site } = this.context;
        parameters.push(
            jsonField(json),
        );
        if (ioAppOuts.length === 0) return;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField($site),
            bigIntField(out),
            bigIntField(endPoint),
            bigIntField(siteAtomApp),
            bigIntField(queueId),
        );

        let ioStatementBuilder = new IOStatementBuilder(factory);
        statements.push(ioStatementBuilder.transErrorTable());
        statements.push(ioStatementBuilder.transErrTruncate());
        statements.push(ioStatementBuilder.transErrorJsonInit());

        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(this.context.site));
        const setOut = factory.createSet();
        statements.push(setOut);
        setOut.equ(out, new ExpNum(id));

        for (let ioAppOut of ioAppOuts) {
            const { ioApp } = ioAppOut;
            for (let ioSite of ioApp.ioSites) {
                let memo = factory.createMemo();
                statements.push(memo);
                memo.text = `IOSite: ${ioSite.getJName()} IOApp: ${ioApp.getJName()} Out: ${ioAppOut.bizIO.getJName()}`;
                let call = factory.createCall();
                statements.push(call);
                call.db = '$site';
                call.procName = `${site}.${ioAppOut.id}`;
                call.params = [
                    { value: new ExpNum(ioSite.id) },
                    { value: new ExpVar(json) },
                ];
            }
        }
    }
}

export class BBizIOApp extends BBizEntity<BizIOApp> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { factory } = this.context;
        const funcAtomToNo = this.createFunction(`${this.context.site}.${toNO}`, new Char(100));
        new FuncAtomToNo(factory, funcAtomToNo).build();
        const funcNoToAtom = this.createFunction(`${this.context.site}.${fromNO}`, new BigInt());
        new FuncNoToAtom(factory, funcNoToAtom).build();

        const objConnect: { [prop: string]: any } = {};
        const { id, connect, ins, outs, IDs } = this.bizEntity;
        objConnect.type = connect.type;
        for (let ioAppID of IDs) {
            this.buildUniqueFunc(ioAppID);
        }
        for (let ioAppIn of ins) {
            const proc = this.createProcedure(`${this.context.site}.${ioAppIn.id}`);
            let ioProc = new IOProcIn(this.context, ioAppIn, proc);
            ioProc.buildProc();
        }
        let objOuts: { [out: string]: string } = {};
        for (let ioAppOut of outs) {
            const proc = this.createProcedure(`${this.context.site}.${ioAppOut.id}`);
            let ioProc = new IOProcOut(this.context, ioAppOut, proc);
            ioProc.buildProc();
            objOuts[ioAppOut.name] = ioAppOut.to;
        }
        objConnect.outs = objOuts;
        this.context.sqls.push(`
            INSERT INTO \`${this.context.dbName}\`.ioapp (id, connect) 
                VALUES (${id}, '${JSON.stringify(objConnect)}')
                ON DUPLICATE KEY UPDATE connect=VALUES(connect);
        `);
    }

    private buildUniqueFunc(ioAppID: IOAppID) {
        const { unique } = ioAppID;
        if (unique === undefined) return;
        const { factory, site } = this.context;
        const { id } = ioAppID;
        const funcUniqueToNo = this.createFunction(`${site}.${id}.${toNO}`, new Char(100));
        new FuncUniqueToNo(factory, funcUniqueToNo, ioAppID).build();
        const funcUniqueFromNo = this.createFunction(`${site}.${id}.${fromNO}`, new BigInt());
        new FuncUniqueFromNo(factory, funcUniqueFromNo, ioAppID).build();
    }
}

const toNO = 'TONO';
const fromNO = 'FROMNO';
abstract class IOProc<T extends IOAppIO> implements JsonContext {
    static atom = '$atom';
    static appID = '$appID';
    static ioSite = '$ioSite';
    static ioAppIO = '$ioAppIO';
    static vJson = '$json';
    static vRetJson = '$retJson';
    static jsonTable = 't';
    static siteAtomApp = '$siteAtomApp';
    static pSiteAtomApp = '$pSiteAtomApp';
    static queueId = '$queueId';
    static otherSite = '$otherSite';
    static endPoint = '$endPoint';
    static vDone = '$done';
    readonly context: DbContext;
    readonly factory: Factory;
    readonly expJson: ExpVal;
    protected readonly ioAppIO: T;
    protected readonly proc: Procedure;
    constructor(context: DbContext, ioAppIO: T, proc: Procedure) {
        this.context = context;
        this.factory = context.factory;
        this.ioAppIO = ioAppIO;
        this.proc = proc;
        this.expJson = new ExpVar(IOProc.vJson);
    }

    abstract get transFuncName(): string;

    abstract buildProc(): void;

    protected buildJsonTrans(): Select {
        const { bizIO, peers } = this.ioAppIO;
        const { props } = bizIO;
        let select = this.factory.createSelect();
        select.lock = LockType.none;
        let jsonTrans = new JsonTrans(this, peers);
        const jo = jsonTrans.build();
        select.column(jo);
        return select;
    }
}

const a = 'a', b = 'b', c = 'c';
class IOProcIn extends IOProc<IOAppIn> {
    readonly transFuncName = fromNO;

    override buildProc(): void {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        parameters.push(
            bigIntField(IOProc.queueId),
            bigIntField(IOProc.otherSite),
            jsonField(IOProc.vJson),
        );
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            jsonField(IOProc.vRetJson),
            bigIntField(IOProc.siteAtomApp),
            bigIntField(IOProc.endPoint),
            bigIntField(IOProc.ioAppIO),
        );

        let ioStatementBuilder = new IOStatementBuilder(factory);
        statements.push(ioStatementBuilder.transErrorTable());
        statements.push(ioStatementBuilder.transErrTruncate());
        statements.push(ioStatementBuilder.transErrorJsonInit());

        let selectSiteAtomApp = factory.createSelect();
        statements.push(selectSiteAtomApp);
        selectSiteAtomApp.toVar = true;
        selectSiteAtomApp.col('i', IOProc.siteAtomApp, b);
        selectSiteAtomApp.col('x', IOProc.ioAppIO, b);
        selectSiteAtomApp.from(new EntityTable(EnumSysTable.IOQueue, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.duo, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('endPoint', a)));
        selectSiteAtomApp.where(new ExpEQ(new ExpField('id', a), new ExpVar(IOProc.queueId)));

        let ifSiteAtomApp = factory.createIf();
        statements.push(ifSiteAtomApp);
        ifSiteAtomApp.cmp = new ExpIsNotNull(new ExpVar(IOProc.siteAtomApp));

        let set = factory.createSet();
        ifSiteAtomApp.then(set);
        set.equ(IOProc.vRetJson, new ExpSelect(this.buildJsonTrans()));

        ifSiteAtomApp.then(ioStatementBuilder.transErrMerge());
        let ifTransErr = factory.createIf();
        ifSiteAtomApp.then(ifTransErr);
        let selectTransErrCount = ioStatementBuilder.transErrCount();
        ifTransErr.cmp = new ExpGT(new ExpSelect(selectTransErrCount), ExpNum.num0);
        ifTransErr.then();
        let insertIODone = ioStatementBuilder.insertIOError(1);
        ifTransErr.then(...insertIODone);
        let delInOut = factory.createDelete();
        ifTransErr.then(delInOut);
        delInOut.from(new EntityTable(EnumSysTable.IOInOut, false, a));
        delInOut.tables = [a];
        delInOut.where(new ExpAnd(
            new ExpEQ(new ExpField('i', a), ExpNum.num1),
            new ExpEQ(new ExpField('x', a), new ExpVar(IOProc.queueId)),
        ));
        let delError = factory.createDelete();
        ifTransErr.else(delError);
        delError.from(new EntityTable(EnumSysTable.IOError, false, a));
        delError.tables = [a];
        delError.where(new ExpEQ(new ExpField('id'), new ExpVar(IOProc.queueId)));

        ioStatementBuilder.transSelect()

        let stats = this.buildAfterTrans();
        ifTransErr.else(...stats);
    }

    private buildAfterTrans(): Statement[] {
        let statements: Statement[] = [];
        let call = this.factory.createCall();
        statements.push(call);
        call.db = $site;
        call.procName = `${this.context.site}.${this.ioAppIO.bizIO.id}`;
        call.params = [
            { paramType: ProcParamType.in, value: new ExpVar(IOProc.queueId) },
            { paramType: ProcParamType.in, value: new ExpVar(IOProc.otherSite) },
            { paramType: ProcParamType.in, value: new ExpVar(IOProc.vRetJson) },
        ];
        return statements;
    }
}

class IOProcOut extends IOProc<IOAppOut> {
    readonly transFuncName = toNO;
    private buildParams(): Field[] {
        return [
            bigIntField(IOProc.ioSite),
            jsonField(IOProc.vJson),
        ];
    }

    override buildProc(): void {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        parameters.push(...this.buildParams());
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            jsonField(IOProc.vRetJson),
            bigIntField(IOProc.siteAtomApp),
            bigIntField(IOProc.pSiteAtomApp),
            bigIntField(IOProc.ioAppIO),
            bigIntField(IOProc.queueId),
            bigIntField(IOProc.endPoint),
            tinyIntField(IOProc.vDone),
        );

        let setIOAppIO = factory.createSet();
        statements.push(setIOAppIO);
        setIOAppIO.equ(IOProc.ioAppIO, new ExpNum(this.ioAppIO.id));

        let setP0 = factory.createSet();
        statements.push(setP0);
        setP0.equ(IOProc.pSiteAtomApp, ExpNum.num0);

        let loop = factory.createWhile();
        statements.push(loop);
        loop.no = 99;
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
        let setSiteAtomAppNull = factory.createSet();
        loop.statements.add(setSiteAtomAppNull);
        setSiteAtomAppNull.equ(IOProc.siteAtomApp, ExpNull.null);

        let ioStatementBuilder = new IOStatementBuilder(factory);
        let truncateTransErr = ioStatementBuilder.transErrTruncate();
        loop.statements.add(truncateTransErr);

        let selectSiteAtomApp = factory.createSelect();
        loop.statements.add(selectSiteAtomApp);
        selectSiteAtomApp.toVar = true;
        selectSiteAtomApp.col('id', IOProc.siteAtomApp, a);
        selectSiteAtomApp.from(new EntityTable(EnumSysTable.IOSiteAtomApp, false, a))
            .join(JoinType.join, new EntityTable(EnumSysTable.duo, false, b))
            .on(new ExpAnd(
                new ExpEQ(new ExpField('ioSiteAtom', a), new ExpField('id', b)),
                new ExpEQ(new ExpField('i', b), new ExpVar(IOProc.ioSite))
            ))
            .join(JoinType.join, new VarTable('$' + this.ioAppIO.bizIO.id + '$TO', c))
            .on(new ExpEQ(new ExpField('x', b), new ExpField('to', c)));
        selectSiteAtomApp.where(new ExpAnd(
            new ExpGT(
                new ExpField('id', a),
                new ExpVar(IOProc.pSiteAtomApp),
            ),
            new ExpEQ(new ExpField('ioApp', a), new ExpNum(this.ioAppIO.ioApp.id)),
        ));
        selectSiteAtomApp.order(new ExpField('id', a), 'asc');
        selectSiteAtomApp.limit(ExpNum.num1);

        let iffSiteAtomAppNull = factory.createIf();
        loop.statements.add(iffSiteAtomAppNull);
        iffSiteAtomAppNull.cmp = new ExpIsNull(new ExpVar(IOProc.siteAtomApp));
        let leave = factory.createBreak();
        iffSiteAtomAppNull.then(leave);
        leave.no = loop.no;
        let setP = factory.createSet();
        iffSiteAtomAppNull.else(setP);
        setP.equ(IOProc.pSiteAtomApp, new ExpVar(IOProc.siteAtomApp));

        let set = factory.createSet();
        loop.statements.add(set);
        set.equ(IOProc.vRetJson, new ExpSelect(this.buildJsonTrans()));

        let stats = this.buildAfterTrans();
        loop.statements.add(...stats);
    }

    private buildAfterTrans(): Statement[] {
        let statements: Statement[] = [];

        const selectEndPoint = this.factory.createSelect();
        statements.push(selectEndPoint);
        selectEndPoint.toVar = true;
        selectEndPoint.col('id', IOProc.endPoint);
        // selectEndPoint.from(new EntityTable(EnumSysTable.IOEndPoint, false));
        selectEndPoint.from(new EntityTable(EnumSysTable.duo, false));
        selectEndPoint.where(new ExpAnd(
            new ExpEQ(new ExpField('i'), new ExpVar(IOProc.siteAtomApp)),
            new ExpEQ(new ExpField('x'), new ExpVar(IOProc.ioAppIO)),
        ));

        const ifEndPoint = this.factory.createIf();
        statements.push(ifEndPoint);
        ifEndPoint.cmp = new ExpIsNotNull(new ExpVar(IOProc.endPoint));

        const setQueueId = this.factory.createSet();
        ifEndPoint.then(setQueueId);
        setQueueId.equ(IOProc.queueId, new ExpFuncInUq(
            'IOQueue$id',
            [ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNull.null, new ExpVar(IOProc.endPoint)],
            true
        ));

        let ioStatementBuilder = new IOStatementBuilder(this.factory);
        ifEndPoint.then(ioStatementBuilder.transErrMerge());

        let ifTransErr = this.factory.createIf();
        ifEndPoint.then(ifTransErr);
        let selectTransErrCount = ioStatementBuilder.transErrCount();
        ifTransErr.cmp = new ExpGT(new ExpSelect(selectTransErrCount), ExpNum.num0);

        let setDoneErrID = this.factory.createSet();
        ifTransErr.then(setDoneErrID);
        setDoneErrID.equ(IOProc.vDone, new ExpNum(31)); // EnumQueueDoneType.errorID

        let insertIODone = ioStatementBuilder.insertIOError(0);
        ifTransErr.then(...insertIODone);

        let setDonePending = this.factory.createSet();
        ifTransErr.else(setDonePending);
        setDonePending.equ(IOProc.vDone, new ExpNum(0)); // EnumQueueDoneType.pending

        const insert = this.factory.createInsert();
        ifTransErr.else(insert);
        insert.table = new EntityTable(EnumSysTable.IOInOut, false);
        insert.cols = [
            { col: 'i', val: ExpNum.num0 },
            { col: 'x', val: new ExpVar(IOProc.queueId) },
        ];

        const update = this.factory.createUpdate();
        ifEndPoint.then(update);
        update.table = new EntityTable(EnumSysTable.IOQueue, false);
        update.cols = [
            { col: 'value', val: new ExpVar(IOProc.vRetJson) },
            { col: 'done', val: new ExpVar(IOProc.vDone) },
        ];
        update.where = new ExpEQ(
            new ExpField('id'), new ExpVar(IOProc.queueId)
        );

        return statements;
    }
}
