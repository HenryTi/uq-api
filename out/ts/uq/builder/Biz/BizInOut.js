"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizIOApp = exports.BBizOut = exports.BBizIn = void 0;
const il_1 = require("../../il");
const bstatement_1 = require("../bstatement");
const consts_1 = require("../consts");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const BizEntity_1 = require("./BizEntity");
class BBizIn extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const procSubmit = this.createProcedure(`${this.context.site}.${id}`);
        this.buildSubmitProc(procSubmit);
    }
    buildSubmitProc(proc) {
        const vId = '$id';
        const vEndPoint = '$endPoint';
        const vJson = '$json';
        const vIn = '$in', vOuter = '$outer';
        const { parameters, statements } = proc;
        const { factory } = this.context;
        const { act, props } = this.bizEntity;
        let varJson = new sql_1.ExpVar(vJson);
        parameters.push((0, il_1.bigIntField)(vId));
        const declare = factory.createDeclare();
        statements.push(declare);
        let vars = [
            (0, il_1.bigIntField)(consts_1.$site),
            (0, il_1.bigIntField)(vIn),
            (0, il_1.bigIntField)('$id'),
            (0, il_1.bigIntField)('$rowId'),
            (0, il_1.bigIntField)(vOuter),
            (0, il_1.jsonField)(vJson),
            (0, il_1.bigIntField)(vEndPoint),
        ];
        let setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(this.context.site));
        let setIn = factory.createSet();
        statements.push(setIn);
        setIn.equ(vIn, new sql_1.ExpNum(this.bizEntity.id));
        let selectQueue = factory.createSelect();
        statements.push(selectQueue);
        selectQueue.toVar = true;
        selectQueue.col('outer', vOuter, 'b');
        selectQueue.col('value', vJson, 'a');
        selectQueue.col('endPoint', vEndPoint, 'a');
        selectQueue.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOQueue, false, 'a'))
            .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOEndPoint, false, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', 'b'), new sql_1.ExpField('endPoint', 'a')));
        selectQueue.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(vId)));
        for (let [name, bud] of props) {
            if (bud.dataType !== il_1.BudDataType.arr) {
                vars.push(this.fieldFromBud(bud));
                let set = factory.createSet();
                statements.push(set);
                set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`)));
            }
            else {
                let { name: arrName, props: arrProps } = bud;
                let varTable = factory.createVarTable();
                statements.push(varTable);
                varTable.name = arrName;
                let idField = (0, il_1.intField)('$id');
                idField.autoInc = true;
                varTable.keys = [idField];
                varTable.fields = [idField];
                const { fields } = varTable;
                let insertArr = factory.createInsert();
                statements.push(insertArr);
                insertArr.table = new sql_1.SqlVarTable(arrName);
                insertArr.cols = [];
                const { cols } = insertArr;
                let selectJsonArr = factory.createSelect();
                insertArr.select = selectJsonArr;
                let jsonColumns = [];
                let jsonTable = new statementWithFrom_1.FromJsonTable('a', varJson, `$.${arrName}[*]`, jsonColumns);
                selectJsonArr.from(jsonTable);
                selectJsonArr.lock = select_1.LockType.none;
                for (let [name, bud] of arrProps) {
                    let field = this.fieldFromBud(bud);
                    vars.push(field);
                    field.nullable = true;
                    fields.push(field);
                    cols.push({ col: name, val: new sql_1.ExpField(name, 'a') });
                    selectJsonArr.column(new sql_1.ExpField(name, 'a'));
                    jsonColumns.push({ field: this.fieldFromBud(bud), path: `$.${name}` });
                }
            }
        }
        declare.vars(...vars);
        let sqls = new bstatement_1.Sqls(this.context, statements);
        let { statements: actStatements } = act.statement;
        sqls.head(actStatements);
        sqls.body(actStatements);
        sqls.foot(actStatements);
        this.buildDone(statements);
    }
    fieldFromBud(bud) {
        const { name } = bud;
        switch (bud.dataType) {
            default:
                debugger;
                return;
            case il_1.BudDataType.char: return (0, il_1.charField)(name, 200);
            case il_1.BudDataType.int: return (0, il_1.intField)(name);
            case il_1.BudDataType.dec: return (0, il_1.decField)(name, 18, 6);
            case il_1.BudDataType.date: return (0, il_1.dateField)(name);
        }
    }
    buildDone(statements) {
        const { factory } = this.context;
        const updateQueue = factory.createUpdate();
        statements.push(updateQueue);
        updateQueue.cols = [
            { col: 'done', val: sql_1.ExpNum.num1 },
        ];
        updateQueue.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOQueue, false);
        updateQueue.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('$id'));
        const delInOut = factory.createDelete();
        statements.push(delInOut);
        delInOut.tables = ['a'];
        delInOut.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOInOut, false, 'a'));
        delInOut.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), sql_1.ExpNum.num1), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpVar('$id'))));
    }
}
exports.BBizIn = BBizIn;
const a = 'a', b = 'b';
class BBizOut extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { id } = this.bizEntity;
        const proc = this.createProcedure(`${this.context.site}.${id}`);
        this.buildProc(proc);
    }
    buildProc(proc) {
        const json = '$json', out = '$out', endPoint = '$endPoint', outer = '$outer', prevEndPoint = '$prevEndPoint'
        // , arrI = '$i', row = '$row', arrLen = '$len', ret = '$ret'
        , queueId = '$queueId';
        const { id, ioAppOuts } = this.bizEntity;
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push((0, il_1.jsonField)(json));
        if (ioAppOuts.length === 0)
            return;
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)(consts_1.$site), (0, il_1.bigIntField)(out), (0, il_1.bigIntField)(endPoint), (0, il_1.bigIntField)(outer), (0, il_1.bigIntField)(prevEndPoint), (0, il_1.bigIntField)(queueId));
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(this.context.site));
        const setOut = factory.createSet();
        statements.push(setOut);
        setOut.equ(out, new sql_1.ExpNum(id));
        const setPrevOuter0 = factory.createSet();
        statements.push(setPrevOuter0);
        setPrevOuter0.equ(prevEndPoint, sql_1.ExpNum.num0);
        const varOuter = new sql_1.ExpVar(outer);
        const varEndPoint = new sql_1.ExpVar(endPoint);
        // 针对所有的outer循环写
        const loop = factory.createWhile();
        statements.push(loop);
        loop.no = 97;
        const { statements: loopStats } = loop;
        const setOuter = factory.createSet();
        loopStats.add(setOuter);
        setOuter.equ(outer, sql_1.ExpNull.null);
        const selectOuter = factory.createSelect();
        loopStats.add(selectOuter);
        selectOuter.toVar = true;
        selectOuter.col('outer', outer);
        selectOuter.col('id', endPoint);
        selectOuter.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOEndPoint, false));
        selectOuter.where(new sql_1.ExpAnd(new sql_1.ExpIn(new sql_1.ExpField('appIO'), ...ioAppOuts.map(v => new sql_1.ExpNum(v.id))), new sql_1.ExpGT(new sql_1.ExpField('id'), new sql_1.ExpVar(prevEndPoint))));
        selectOuter.order(new sql_1.ExpField('id'), 'asc');
        selectOuter.limit(sql_1.ExpNum.num1);
        const ifOuterNull = factory.createIf();
        loopStats.add(ifOuterNull);
        ifOuterNull.cmp = new sql_1.ExpIsNull(varOuter);
        const leave = factory.createBreak();
        ifOuterNull.then(leave);
        leave.no = loop.no;
        const setPrevEndPoint = factory.createSet();
        loopStats.add(setPrevEndPoint);
        setPrevEndPoint.equ(prevEndPoint, varEndPoint);
        /*
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
        */
        const setQueueId = factory.createSet();
        loopStats.add(setQueueId);
        setQueueId.equ(queueId, new sql_1.ExpFuncInUq('ioqueue$id', [
            new sql_1.ExpVar(consts_1.$site), sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null,
            varEndPoint
        ], true));
        const update = factory.createUpdate();
        loopStats.add(update);
        update.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOQueue, false);
        update.cols = [
            { col: 'value', val: new sql_1.ExpVar(json) },
        ];
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(queueId));
        const insertPending = factory.createInsert();
        loopStats.add(insertPending);
        insertPending.ignore = true;
        insertPending.table = new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOInOut, false);
        insertPending.cols = [
            { col: 'i', val: sql_1.ExpNum.num0 },
            { col: 'x', val: new sql_1.ExpVar(queueId) },
        ];
    }
}
exports.BBizOut = BBizOut;
class BBizIOApp extends BizEntity_1.BBizEntity {
    async buildProcedures() {
        super.buildProcedures();
        const { factory } = this.context;
        const funcAtomToNo = this.createFunction(`${this.context.site}.ATOMTONO`, new il_1.Char(100));
        new FuncAtomToNo(factory, funcAtomToNo).build();
        const funcNoToAtom = this.createFunction(`${this.context.site}.NOTOATOM`, new il_1.BigInt());
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
exports.BBizIOApp = BBizIOApp;
class FuncTo {
    constructor(factory, func) {
        this.param = 'param';
        this.factory = factory;
        this.func = func;
    }
    build() {
        const { parameters, statements } = this.func;
        parameters.push((0, il_1.bigIntField)('appID'), this.fromField());
        let declare = this.factory.createDeclare();
        statements.push(declare);
        declare.vars(this.toField());
        let select = this.factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.lock = select_1.LockType.none;
        select.col(this.toName, this.toName);
        select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOAppAtom, false));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('appID'), new sql_1.ExpVar('appID')), new sql_1.ExpEQ(new sql_1.ExpField(this.fromName), new sql_1.ExpVar(this.param))));
        let iff = this.factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(this.toName));
        const insertErr = this.factory.createInsert();
        iff.then(insertErr);
        insertErr.ignore = true;
        insertErr.table = new statementWithFrom_1.VarTableWithDb(consts_1.$site, 'transerr');
        insertErr.cols = [
            { col: 'appID', val: new sql_1.ExpVar('appID') },
            { col: this.fromName, val: new sql_1.ExpVar(this.param) },
        ];
        let ret = this.factory.createReturn();
        statements.push(ret);
        ret.returnVar = this.toName;
    }
}
class FuncNoToAtom extends FuncTo {
    constructor() {
        super(...arguments);
        this.fromName = 'no';
        this.toName = 'atom';
    }
    fromField() { return (0, il_1.charField)(this.param, 100); }
    toField() { return (0, il_1.bigIntField)(this.toName); }
}
class FuncAtomToNo extends FuncTo {
    constructor() {
        super(...arguments);
        this.fromName = 'atom';
        this.toName = 'no';
    }
    fromField() { return (0, il_1.bigIntField)(this.param); }
    toField() { return (0, il_1.charField)(this.toName, 100); }
}
class IOProc {
    constructor(context, ioAppIO, proc) {
        this.buildVal = (bud) => {
            return new sql_1.ExpFunc('JSON_VALUE', this.expJson, new sql_1.ExpStr(`$.${bud.name}`));
        };
        this.buildValInArr = (bud) => {
            const { name } = bud;
            return new sql_1.ExpField(name, IOProc.jsonTable);
        };
        this.context = context;
        this.factory = context.factory;
        this.ioAppIO = ioAppIO;
        this.proc = proc;
        this.expJson = new sql_1.ExpVar(IOProc.vJson);
    }
    buildProc() {
        const { factory } = this;
        const { parameters, statements } = this.proc;
        let outField = (0, il_1.jsonField)(IOProc.vRet);
        outField.paramType = il_1.ProcParamType.out;
        parameters.push((0, il_1.bigIntField)(IOProc.outer), (0, il_1.jsonField)(IOProc.vJson), outField);
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)(IOProc.ioAppIO));
        let setIOAppIO = factory.createSet();
        statements.push(setIOAppIO);
        setIOAppIO.equ(IOProc.ioAppIO, new sql_1.ExpNum(this.ioAppIO.id));
        let set = factory.createSet();
        statements.push(set);
        set.equ(IOProc.vRet, new sql_1.ExpSelect(this.buildJsonTrans()));
    }
    buildJsonTrans() {
        const { bizIO, peers } = this.ioAppIO;
        const { props } = bizIO;
        let select = this.factory.createSelect();
        select.lock = select_1.LockType.none;
        select.column(this.buidlJsonObj(props, peers, this.buildVal));
        return select;
    }
    buidlJsonObj(props, peers, func) {
        let objParams = [];
        for (let [name, bud] of props) {
            let peer = peers[name];
            let val;
            switch (bud.dataType) {
                default:
                    val = func(bud);
                    break;
                case il_1.BudDataType.arr:
                    val = this.buidlJsonArr(name, bud.props, peer.peers);
                    break;
                case il_1.BudDataType.ID:
                    val = this.transID(peer, func(bud));
                    break;
            }
            objParams.push(new sql_1.ExpStr(peer === undefined ? name : peer.to), bud.dataType !== il_1.BudDataType.arr ?
                val
                :
                    this.buidlJsonArr(name, bud.props, peer.peers));
        }
        return new sql_1.ExpFunc('JSON_OBJECT', ...objParams);
    }
    buidlJsonArr(arrName, props, peers) {
        let select = this.factory.createSelect();
        select.lock = select_1.LockType.none;
        const columns = Array.from(props).map(([name, bud]) => {
            let field;
            switch (bud.dataType) {
                default:
                    debugger;
                    break;
                case il_1.BudDataType.ID:
                case il_1.BudDataType.date:
                case il_1.BudDataType.int:
                    field = (0, il_1.bigIntField)(name);
                    break;
                case il_1.BudDataType.dec:
                    field = (0, il_1.decField)(name, 24, 6);
                    break;
                case il_1.BudDataType.arr:
                    field = (0, il_1.jsonField)(name);
                    break;
                case il_1.BudDataType.char:
                case il_1.BudDataType.str:
                    field = (0, il_1.charField)(name, 400);
                    break;
            }
            let ret = {
                field,
                path: `$.${name}`,
            };
            return ret;
        });
        select.column(new sql_1.ExpFunc('JSON_ARRAYAGG', this.buidlJsonObj(props, peers, this.buildValInArr)));
        select.from(new statementWithFrom_1.FromJsonTable(IOProc.jsonTable, this.expJson, `$.${arrName}[*]`, columns));
        return new sql_1.ExpSelect(select);
    }
}
IOProc.outer = '$outer';
IOProc.ioAppIO = '$ioAppIO';
IOProc.vJson = '$json';
IOProc.vRet = '$ret';
IOProc.jsonTable = 't';
class IOProcIn extends IOProc {
    transID(peer, val) {
        return new sql_1.ExpFuncDb('$site', `${this.context.site}.notoatom`, new sql_1.ExpNum(peer.id.id), val);
    }
}
class IOProcOut extends IOProc {
    transID(peer, val) {
        return new sql_1.ExpFuncDb('$site', `${this.context.site}.atomtono`, new sql_1.ExpNum(peer.id.id), val);
    }
}
//# sourceMappingURL=BizInOut.js.map