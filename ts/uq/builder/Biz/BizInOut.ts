import { delimiter } from "path";
import {
    BigInt, BizBud, BizBudArr, BizIOApp, BizIn, BizInOut, BizOut, BudDataType, Char, EnumSysTable, Field
    , IOAppID, IOAppIO, IOAppIn, IOAppOut, IOPeer, IOPeerArr, IOPeerID, JoinType
    , JsonTableColumn, ProcParamType, bigIntField, charField, dateField
    , decField, intField, jsonField, tinyIntField
} from "../../il";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { DbContext } from "../dbContext";
import {
    ExpAdd,
    ExpAnd, ExpComplex, ExpDatePart, ExpEQ, ExpExists, ExpField, ExpFunc, ExpFuncCustom, ExpFuncDb, ExpFuncInUq
    , ExpGT, ExpIsNotNull, ExpIsNull, ExpNull, ExpNum, ExpSelect, ExpStar, ExpStr
    , ExpVal, ExpVar, Procedure, SqlVarTable, Statement
} from "../sql";
import { Factory } from "../sql/factory";
import { LockType, Select } from "../sql/select";
import { EntityTable, VarTable, FromJsonTable } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

abstract class BBizInOut<T extends BizInOut> extends BBizEntity<T> {
}

export class BBizIn extends BBizInOut<BizIn> {
    static queueId = '$queueId';
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
                        new ExpDatePart('second'),
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
            case BudDataType.int: return intField(name);
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

type BuildVal = (bud: BizBud) => ExpVal;
export class BBizIOApp extends BBizEntity<BizIOApp> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { factory } = this.context;
        const funcAtomToNo = this.createFunction(`${this.context.site}.ATOMTONO`, new Char(100));
        new FuncAtomToNo(factory, funcAtomToNo).build();
        const funcNoToAtom = this.createFunction(`${this.context.site}.NOTOATOM`, new BigInt());
        new FuncNoToAtom(factory, funcNoToAtom).build();

        const objConnect: { [prop: string]: any } = {};
        const { id, connect, ins, outs } = this.bizEntity;
        objConnect.type = connect.type;
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
}

abstract class FuncTo {
    static appID = 'appID';
    protected readonly param = 'param';
    protected readonly factory: Factory;
    protected readonly func: Procedure;
    constructor(factory: Factory, func: Procedure) {
        this.factory = factory;
        this.func = func;
    }

    protected abstract get fromName(): string;
    protected abstract get toName(): string;
    protected abstract fromField(): Field;
    protected abstract toField(): Field;

    build() {
        const { parameters, statements } = this.func;
        parameters.push(
            bigIntField(FuncTo.appID),             // IOApp.ID
            this.fromField(),
        );
        let declare = this.factory.createDeclare();
        statements.push(declare);
        declare.vars(this.toField());
        let ifParamNotNull = this.factory.createIf();
        statements.push(ifParamNotNull);
        ifParamNotNull.cmp = new ExpIsNotNull(new ExpVar(this.param));
        let select = this.factory.createSelect();
        ifParamNotNull.then(select);
        select.toVar = true;
        select.lock = LockType.none;
        select.col(this.toName, this.toName);
        select.from(new EntityTable(EnumSysTable.IOAppAtom, false));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('appID'), new ExpVar(FuncTo.appID)),
            new ExpEQ(new ExpField(this.fromName), new ExpVar(this.param)),
        ));
        let iff = this.factory.createIf();
        ifParamNotNull.then(iff);
        iff.cmp = new ExpIsNull(new ExpVar(this.toName));
        let ioStatementBuilder = new IOStatementBuilder(this.factory);
        const insertErr = ioStatementBuilder.transErrorInsert(new ExpVar('appID'), this.fromName, this.param);
        iff.then(insertErr);
        let ret = this.factory.createReturn();
        statements.push(ret);
        ret.returnVar = this.toName;
    }
}
class FuncNoToAtom extends FuncTo {
    protected fromName = 'no';
    protected toName = 'atom';
    protected fromField(): Field { return charField(this.param, 100); }
    protected toField(): Field { return bigIntField(this.toName); }
}
class FuncAtomToNo extends FuncTo {
    protected fromName = 'atom';
    protected toName = 'no';
    protected fromField(): Field { return bigIntField(this.param); }
    protected toField(): Field { return charField(this.toName, 100); }
}

abstract class IOProc<T extends IOAppIO> {
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
    static endPoint = '$endPoint';
    static vDone = '$done';
    protected readonly context: DbContext;
    protected readonly factory: Factory;
    protected readonly ioAppIO: T;
    protected readonly proc: Procedure;
    protected readonly expJson: ExpVal;
    constructor(context: DbContext, ioAppIO: T, proc: Procedure) {
        this.context = context;
        this.factory = context.factory;
        this.ioAppIO = ioAppIO;
        this.proc = proc;
        this.expJson = new ExpVar(IOProc.vJson);
    }

    protected abstract get transFuncName(): string;

    protected transID(ioAppID: IOAppID, val: ExpVal): ExpVal {
        if (ioAppID === undefined) {
            return val;
        }
        return new ExpFuncDb('$site',
            `${this.context.site}.${this.transFuncName}`,
            new ExpFuncInUq('duo$id',
                [
                    ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNull.null,
                    new ExpVar(IOProc.siteAtomApp), new ExpNum(ioAppID.id),
                ],
                true
            ),
            val);
    }

    abstract buildProc(): void;

    protected buildJsonTrans(): Select {
        const { bizIO, peers } = this.ioAppIO;
        const { props } = bizIO;
        let select = this.factory.createSelect();
        select.lock = LockType.none;
        select.column(this.buidlJsonObj(props, peers, this.buildVal));
        return select;
    }

    private buildVal = (bud: BizBud) => {
        let suffix: string;
        switch (bud.dataType) {
            default: debugger; throw new Error('unknown data type ' + bud.dataType);
            case BudDataType.char:
            case BudDataType.str:
                suffix = undefined;
                break;
            case BudDataType.date:
            case BudDataType.int:
            case BudDataType.ID:
                suffix = 'RETURNING SIGNED';
                break;
            case BudDataType.dec:
                suffix = 'RETURNING DECIMAL';
                break;
        }
        return new ExpFunc('JSON_VALUE', this.expJson, new ExpComplex(new ExpStr(`$."${bud.name}"`), undefined, suffix));
    }

    private buidlJsonObj(props: Map<string, BizBud>, peers: { [name: string]: IOPeer }, func: BuildVal): ExpVal {
        let objParams: ExpVal[] = [];
        for (let [name, bud] of props) {
            let peer = peers[name];
            let val: ExpVal;
            switch (bud.dataType) {
                default:
                    val = func(bud);
                    break;
                case BudDataType.arr:
                    val = this.buidlJsonArr(name, (bud as BizBudArr).props, (peer as IOPeerArr).peers);
                    break;
                case BudDataType.ID:
                    val = this.transID((peer as IOPeerID).id, func(bud));
                    break;
            }
            let objName: string;
            if (peer === undefined) {
                objName = name;
            }
            else {
                const { to, name: peerName } = peer;
                objName = to ?? peerName;
            }
            objParams.push(
                new ExpStr(objName),
                bud.dataType !== BudDataType.arr ?
                    val
                    :
                    this.buidlJsonArr(name, (bud as BizBudArr).props, (peer as IOPeerArr).peers)
            );
        }
        return new ExpFunc('JSON_OBJECT', ...objParams);
    }

    private buildValInArr = (bud: BizBud) => {
        const { name } = bud;
        return new ExpField(name, IOProc.jsonTable);
    }

    private buidlJsonArr(arrName: string, props: Map<string, BizBud>, peers: { [name: string]: IOPeer }): ExpVal {
        let select = this.factory.createSelect();
        select.lock = LockType.none;
        const columns: JsonTableColumn[] = Array.from(props).map(
            ([name, bud]) => {
                let field: Field;
                switch (bud.dataType) {
                    default: debugger; break;
                    case BudDataType.ID:
                    case BudDataType.date:
                    case BudDataType.int: field = bigIntField(name); break;
                    case BudDataType.dec: field = decField(name, 24, 6); break;
                    case BudDataType.arr: field = jsonField(name); break;
                    case BudDataType.char:
                    case BudDataType.str: field = charField(name, 400); break;
                }
                let ret: JsonTableColumn = {
                    field,
                    path: `$."${name}"`,
                };
                return ret;
            }
        );
        select.column(new ExpFunc('JSON_ARRAYAGG', this.buidlJsonObj(props, peers, this.buildValInArr)));
        select.from(new FromJsonTable(IOProc.jsonTable, this.expJson, `$."${arrName}"[*]`, columns));
        return new ExpSelect(select);
    }
}

const a = 'a', b = 'b', c = 'c';
class IOProcIn extends IOProc<IOAppIn> {
    protected readonly transFuncName = 'NoToAtom';

    override buildProc(): void {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        parameters.push(
            bigIntField(IOProc.queueId),
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

        let selectSiteAtomApp = factory.createSelect();
        statements.push(selectSiteAtomApp);
        selectSiteAtomApp.toVar = true;
        selectSiteAtomApp.col('i', IOProc.siteAtomApp, b);
        selectSiteAtomApp.col('x', IOProc.ioAppIO, b);
        selectSiteAtomApp.from(new EntityTable(EnumSysTable.IOQueue, false, a))
            // .join(JoinType.join, new EntityTable(EnumSysTable.IOEndPoint, false, b))
            .join(JoinType.join, new EntityTable(EnumSysTable.duo, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('endPoint', a)));
        selectSiteAtomApp.where(new ExpEQ(new ExpField('id', a), new ExpVar(IOProc.queueId)));

        let ifSiteAtomApp = factory.createIf();
        statements.push(ifSiteAtomApp);
        ifSiteAtomApp.cmp = new ExpIsNotNull(new ExpVar(IOProc.siteAtomApp));

        let set = factory.createSet();
        ifSiteAtomApp.then(set);
        set.equ(IOProc.vRetJson, new ExpSelect(this.buildJsonTrans()));

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
            { paramType: ProcParamType.in, value: new ExpVar(IOProc.vRetJson) },
        ];
        return statements;
    }
}

class IOProcOut extends IOProc<IOAppOut> {
    protected readonly transFuncName = 'AtomToNo';
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

class IOStatementBuilder {
    static transerr = '$transerr';
    private readonly factory: Factory;
    constructor(factory: Factory) {
        this.factory = factory;
    }

    transErrorTable() {
        let vtTransErr = this.factory.createVarTable();
        vtTransErr.noDrop = true;
        vtTransErr.name = IOStatementBuilder.transerr;
        const transErrIdField = intField('id');
        transErrIdField.autoInc = true;
        const atomField = bigIntField('atom');
        atomField.nullable = true;
        const noField = charField('no', 100);
        noField.nullable = true;
        vtTransErr.keys = [
            transErrIdField,
        ];
        vtTransErr.fields = [
            transErrIdField, bigIntField('appID'), atomField, noField,
        ];
        return vtTransErr;
    }

    transErrorInsert(varAppID: ExpVal, fromField: string, fromVar: string) {
        const insertErr = this.factory.createInsert();
        insertErr.ignore = true;
        insertErr.table = new VarTable(IOStatementBuilder.transerr);
        insertErr.cols = [
            { col: 'appID', val: varAppID },
            { col: fromField, val: new ExpVar(fromVar) },
        ];
        return insertErr;
    }

    transErrTruncate() {
        let truncateTransErr = this.factory.createTruncate();
        truncateTransErr.table = new VarTable(IOStatementBuilder.transerr);
        return truncateTransErr;
    }

    transErrCount() {
        let tblTransErr = new VarTable(IOStatementBuilder.transerr, a);
        let selectTransErrCount = this.factory.createSelect();
        selectTransErrCount.from(tblTransErr);
        selectTransErrCount.column(new ExpFunc(this.factory.func_count, new ExpStar()));
        selectTransErrCount.limit(ExpNum.num1);
        return selectTransErrCount;
    }

    transSelect() {
        let tblTransErr = new VarTable(IOStatementBuilder.transerr, a);
        let selectTranErr = this.factory.createSelect();
        selectTranErr.from(tblTransErr)
            .join(JoinType.join, new EntityTable(EnumSysTable.duo, false, b))
            .on(new ExpEQ(new ExpField('id', b), new ExpField('appID', a)));
        selectTranErr.column(
            new ExpFunc('JSON_ARRAYAGG',
                new ExpFunc('JSON_OBJECT',
                    new ExpStr('siteAtomApp'), new ExpField('i', b),
                    new ExpStr('ID'), new ExpField('x', b),
                    new ExpStr('atom'), new ExpField('atom', a),
                    new ExpStr('no'), new ExpField('no', a),
                )
            ),
            'v'
        );
        return selectTranErr;
    }

    insertIOError(inOut: 0 | 1) {
        let select = this.factory.createSelect();
        select.from(new EntityTable(EnumSysTable.IOError, false));
        select.col('id');
        select.where(new ExpEQ(new ExpField('id'), new ExpVar(IOProc.queueId)));

        let selectTranErr = this.transSelect();

        let iff = this.factory.createIf();
        iff.cmp = new ExpExists(select);
        let update = this.factory.createUpdate();
        iff.then(update);
        update.table = new EntityTable(EnumSysTable.IOError, false);
        update.cols = [
            { col: 'result', val: new ExpSelect(selectTranErr) },
            { col: 'times', val: new ExpAdd(new ExpField('times'), ExpNum.num1) },
        ];
        update.where = new ExpEQ(new ExpField('id'), new ExpVar(IOProc.queueId));

        let insertIOError = this.factory.createInsert();
        iff.else(insertIOError);
        insertIOError.table = new EntityTable(EnumSysTable.IOError, false);
        insertIOError.cols = [
            { col: 'id', val: new ExpVar(IOProc.queueId) },
            { col: 'siteAtomApp', val: new ExpVar(IOProc.siteAtomApp) },
            { col: 'appIO', val: new ExpVar(IOProc.ioAppIO) },
            { col: 'result', val: new ExpSelect(selectTranErr) },
            { col: 'inout', val: new ExpNum(inOut) },
        ];
        return [insertIOError];
    }
}