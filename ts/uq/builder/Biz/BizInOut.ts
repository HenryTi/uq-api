import {
    BigInt,
    BizBud,
    BizBudArr,
    BizBudIDIO,
    BizIOApp, BizIn, BizOut, BudDataType, Char, EnumSysTable, Field
    , IOAppIO, IOAppIn, IOAppOut, IOPeer, IOPeerArr, IOPeerID, JoinType
    , JsonTableColumn, ProcParamType, bigIntField, charField, dateField
    , decField, intField, jsonField
} from "../../il";
import { Sqls } from "../bstatement";
import { $site } from "../consts";
import { DbContext } from "../dbContext";
import {
    ExpAdd, ExpAnd, ExpEQ, ExpField, ExpFunc, ExpFuncDb, ExpFuncInUq
    , ExpGT, ExpIsNull, ExpLT, ExpNull, ExpNum, ExpSelect, ExpStr
    , ExpVal, ExpVar, Procedure, SqlVarTable, Statement
} from "../sql";
import { Factory } from "../sql/factory";
import { LockType, Select } from "../sql/select";
import { EntityTable, VarTable, FromJsonTable, VarTableWithDb } from "../sql/statementWithFrom";
import { BBizEntity } from "./BizEntity";

export class BBizIn extends BBizEntity<BizIn> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }

    private buildSubmitProc(proc: Procedure) {
        const vId = '$id';
        const vEndPoint = '$endPoint';
        const vJson = '$json';
        const vIn = '$in', vOuter = '$outer';
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const { act, props } = this.bizEntity;
        let varJson = new ExpVar(vJson);
        parameters.push(
            bigIntField(vId),
        );
        const declare = factory.createDeclare();
        statements.push(declare);
        let vars: Field[] = [
            bigIntField($site),
            bigIntField(vIn),
            bigIntField('$id'),
            bigIntField('$rowId'),
            bigIntField(vOuter),
            jsonField(vJson),
            bigIntField(vEndPoint),
        ];
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(this.context.site));
        let setIn = factory.createSet();
        statements.push(setIn);
        setIn.equ(vIn, new ExpNum(this.bizEntity.id));
        let selectQueue = factory.createSelect();
        statements.push(selectQueue);
        selectQueue.toVar = true;
        selectQueue.col('outer', vOuter, 'b');
        selectQueue.col('value', vJson, 'a');
        selectQueue.col('endPoint', vEndPoint, 'a');
        selectQueue.from(new EntityTable(EnumSysTable.IOQueue, false, 'a'))
            .join(JoinType.join, new EntityTable(EnumSysTable.IOEndPoint, false, 'b'))
            .on(new ExpEQ(new ExpField('id', 'b'), new ExpField('endPoint', 'a')));
        selectQueue.where(new ExpEQ(new ExpField('id'), new ExpVar(vId)));

        for (let [name, bud] of props) {
            if (bud.dataType !== BudDataType.arr) {
                vars.push(this.fieldFromBud(bud));
                let set = factory.createSet();
                statements.push(set);
                set.equ(name, new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$."${name}"`)));
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
                let jsonTable = new FromJsonTable('a', varJson, `$.${arrName}[*]`, jsonColumns);
                selectJsonArr.from(jsonTable);
                selectJsonArr.lock = LockType.none;
                for (let [name, bud] of arrProps) {
                    let field = this.fieldFromBud(bud);
                    vars.push(field);
                    field.nullable = true;
                    fields.push(field);
                    cols.push({ col: name, val: new ExpField(name, 'a') });
                    selectJsonArr.column(new ExpField(name, 'a'));
                    jsonColumns.push({ field: this.fieldFromBud(bud), path: `$.${name}` });
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
            case BudDataType.char: return charField(name, 200);
            case BudDataType.int: return intField(name);
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
        updateQueue.where = new ExpEQ(new ExpField('id'), new ExpVar('$id'));

        const delInOut = factory.createDelete();
        statements.push(delInOut);
        delInOut.tables = ['a'];
        delInOut.from(new EntityTable(EnumSysTable.IOInOut, false, 'a'));
        delInOut.where(new ExpAnd(
            new ExpEQ(new ExpField('i'), ExpNum.num1),
            new ExpEQ(new ExpField('x'), new ExpVar('$id')),
        ));
    }
}

const a = 'a', b = 'b';
export class BBizOut extends BBizEntity<BizOut> {
    override async buildProcedures(): Promise<void> {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const proc = this.createProcedure(`${this.context.site}.${id}`);
        this.buildProc(proc);
    }

    private buildProc(proc: Procedure) {
        const json = '$json', out = '$out', ret = '$ret', endPoint = '$endPoint'
            , outer = '$outer', prevEndPoint = '$prevEndPoint'
            , arrI = '$i', row = '$row', arrLen = '$len', queueId = '$queueId';
        const { id, props } = this.bizEntity;
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push(jsonField(json));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField($site),
            bigIntField(out),
            jsonField(ret),
            bigIntField(endPoint),
            bigIntField(outer),
            bigIntField(prevEndPoint),
            intField(arrI),
            jsonField(row),
            intField(arrLen),
            bigIntField(queueId),
        );
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ($site, new ExpNum(this.context.site));
        const setOut = factory.createSet();
        statements.push(setOut);
        setOut.equ(out, new ExpNum(id));
        const setPrevOuter0 = factory.createSet();
        statements.push(setPrevOuter0);
        setPrevOuter0.equ(prevEndPoint, ExpNum.num0);

        const varOuter = new ExpVar(outer);
        const varEndPoint = new ExpVar(endPoint);

        // 针对所有的outer循环写
        const loop = factory.createWhile();
        statements.push(loop);
        loop.no = 97;
        const { statements: loopStats } = loop;
        const setOuter = factory.createSet();
        loopStats.add(setOuter);
        setOuter.equ(outer, ExpNull.null);
        const selectOuter = factory.createSelect();
        loopStats.add(selectOuter);
        selectOuter.toVar = true;
        selectOuter.col('outer', outer);
        selectOuter.col('id', endPoint);
        selectOuter.from(new EntityTable(EnumSysTable.IOEndPoint, false));
        selectOuter.where(new ExpAnd(
            new ExpEQ(new ExpField('inout'), new ExpVar(out)),
            new ExpGT(new ExpField('id'), new ExpVar(prevEndPoint)),
        ));
        selectOuter.order(new ExpField('id'), 'asc');
        selectOuter.limit(ExpNum.num1);

        const ifOuterNull = factory.createIf();
        loopStats.add(ifOuterNull);
        ifOuterNull.cmp = new ExpIsNull(varOuter);
        const leave = factory.createBreak();
        ifOuterNull.then(leave);
        leave.no = loop.no;

        const setPrevOuter = factory.createSet();
        loopStats.add(setPrevOuter);
        setPrevOuter.equ(prevEndPoint, varEndPoint);

        const params: ExpVal[] = [];
        const varJson = new ExpVar(json);
        const varRet = new ExpVar(ret);
        const varRow = new ExpVar(row);

        for (let [name, bud] of props) {
            if (bud.dataType !== BudDataType.arr) {
                params.push(
                    new ExpStr(name),
                    new ExpFunc('JSON_VALUE', varJson, new ExpStr(`$.${name}`)),
                );
            }
            else {
                const arrParams: ExpVal[] = [];
                const { name: arrName, props: arrProps } = bud as BizBudArr;
                declare.vars(jsonField(arrName));
                const varArrJson = new ExpVar(arrName);
                const setArrJson = factory.createSet();
                loopStats.add(setArrJson);
                setArrJson.equ(arrName, new ExpFunc('JSON_ARRAY'));
                const setI0 = factory.createSet();
                loopStats.add(setI0);
                setI0.equ(arrI, ExpNum.num0);
                const setLen = factory.createSet();
                loopStats.add(setLen);
                setLen.equ(arrLen, new ExpFunc('JSON_LENGTH', new ExpStr(`$.${arrName}`)));
                const loopArr = factory.createWhile();
                loopStats.add(loopArr);
                loopArr.no = 98;
                loopArr.cmp = new ExpLT(new ExpVar(arrI), new ExpVar(arrLen));
                const { statements: laStats } = loopArr;
                const setRow = factory.createSet();
                laStats.add(setRow);
                setRow.equ(row, new ExpFunc('JSON_UNQUOTE',
                    new ExpFunc(
                        'JSON_EXTRACT',
                        varJson,
                        new ExpFunc(
                            factory.func_concat,
                            new ExpStr(`$.${arrName}[`), new ExpVar(arrI), new ExpStr(']')
                        ),
                    )
                ));
                const setIInc = factory.createSet();
                laStats.add(setIInc);
                setIInc.equ(arrI, new ExpAdd(new ExpVar(arrI), ExpNum.num1));
                for (let [name, bud] of arrProps) {
                    arrParams.push(new ExpStr(name));
                    arrParams.push(new ExpFunc('JSON_VALUE', varRow, new ExpStr(`$.${name}`)));
                }
                const appendArrJson = factory.createSet();
                laStats.add(appendArrJson);
                appendArrJson.equ(arrName, new ExpFunc(
                    'JSON_ARRAY_APPEND',
                    varArrJson,
                    new ExpStr('$'),
                    new ExpFunc('JSON_OBJECT', ...arrParams),
                ));
                params.push(new ExpStr(arrName), new ExpVar(arrName));
            }
        }
        const setRet = factory.createSet();
        loopStats.add(setRet);
        setRet.equ(ret, new ExpFunc('JSON_OBJECT', ...params));

        const setQueueId = factory.createSet();
        loopStats.add(setQueueId);
        setQueueId.equ(queueId, new ExpFuncInUq('ioqueue$id', [
            new ExpVar($site), ExpNum.num0, ExpNum.num1, ExpNull.null,
            varEndPoint
        ], true));
        const update = factory.createUpdate();
        loopStats.add(update);
        update.table = new EntityTable(EnumSysTable.IOQueue, false);
        update.cols = [
            { col: 'value', val: varRet },
        ];
        update.where = new ExpEQ(new ExpField('id'), new ExpVar(queueId));
        const insertPending = factory.createInsert();
        loopStats.add(insertPending);
        insertPending.ignore = true;
        insertPending.table = new EntityTable(EnumSysTable.IOInOut, false);
        insertPending.cols = [
            { col: 'i', val: ExpNum.num0 },
            { col: 'x', val: new ExpVar(queueId) },
        ];
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

        const { ins, outs } = this.bizEntity;
        for (let ioAppIn of ins) {
            const proc = this.createProcedure(`${this.context.site}.${ioAppIn.id}`);
            let ioProc = new IOProcIn(this.context, ioAppIn, proc);
            ioProc.buildProc();
        }
        for (let ioAppOut of outs) {
            const proc = this.createProcedure(`${this.context.site}.${ioAppOut.id}`);
            let ioProc = new IOProcOut(this.context, ioAppOut, proc);
            ioProc.buildProc();
        }
    }
}

abstract class FuncTo {
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
            bigIntField('appID'),
            this.fromField(),
        );
        let declare = this.factory.createDeclare();
        statements.push(declare);
        declare.vars(this.toField());

        let select = this.factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.lock = LockType.none;
        select.col(this.toName, this.toName);
        select.from(new EntityTable(EnumSysTable.IOAppAtom, false));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('appID'), new ExpVar('appID')),
            new ExpEQ(new ExpField(this.fromName), new ExpVar(this.param)),
        ));
        let iff = this.factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpIsNull(new ExpVar(this.toName));
        const insertErr = this.factory.createInsert();
        iff.then(insertErr);
        insertErr.ignore = true;
        insertErr.table = new VarTableWithDb($site, 'transerr');
        insertErr.cols = [
            { col: 'appID', val: new ExpVar('appID') },
            { col: this.fromName, val: new ExpVar(this.param) },
        ];
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
    static outer = '$outer';
    static ioAppIO = '$ioAppIO';
    static vJson = '$json';
    static vRet = '$ret';
    static jsonTable = 't';
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

    protected abstract transID(peer: IOPeerID, val: ExpVal): ExpVal;

    buildProc() {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        let outField = jsonField(IOProc.vRet);
        outField.paramType = ProcParamType.out;
        parameters.push(
            bigIntField(IOProc.outer),
            jsonField(IOProc.vJson),
            outField,
        );
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            bigIntField(IOProc.ioAppIO)
        );
        let setIOAppIO = factory.createSet();
        statements.push(setIOAppIO);
        setIOAppIO.equ(IOProc.ioAppIO, new ExpNum(this.ioAppIO.id));

        let set = factory.createSet();
        statements.push(set);
        set.equ(IOProc.vRet, new ExpSelect(this.buildJsonTrans()));
    }

    private buildJsonTrans(): Select {
        const { bizIO, peers } = this.ioAppIO;
        const { props } = bizIO;
        let select = this.factory.createSelect();
        select.lock = LockType.none;
        select.column(this.buidlJsonObj(props, peers, this.buildVal));
        return select;
    }

    private buildVal = (bud: BizBud) => {
        return new ExpFunc('JSON_VALUE', this.expJson, new ExpStr(`$.${bud.name}`));
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
                    val = this.transID(peer as IOPeerID, func(bud));
                    break;
            }
            objParams.push(
                new ExpStr(peer === undefined ? name : peer.to),
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
                    path: `$.${name}`,
                };
                return ret;
            }
        );
        select.column(new ExpFunc('JSON_ARRAYAGG', this.buidlJsonObj(props, peers, this.buildValInArr)));
        select.from(new FromJsonTable(IOProc.jsonTable, this.expJson, `$.${arrName}[*]`, columns));
        return new ExpSelect(select);
    }
}

class IOProcIn extends IOProc<IOAppIn> {
    protected override transID(peer: IOPeerID, val: ExpVal): ExpVal {
        return new ExpFuncDb('$site',
            `${this.context.site}.notoatom`,
            new ExpNum(peer.id.id),
            val);
    }
}

class IOProcOut extends IOProc<IOAppOut> {
    protected override transID(peer: IOPeerID, val: ExpVal): ExpVal {
        return new ExpFuncDb('$site',
            `${this.context.site}.atomtono`,
            new ExpNum(peer.id.id),
            val
        );
    }
}
