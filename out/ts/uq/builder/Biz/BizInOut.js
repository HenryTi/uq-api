"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBizOut = exports.BBizIn = void 0;
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
        const { act, props, arrs } = this.bizEntity;
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
            vars.push(this.fieldFromBud(bud));
            let set = factory.createSet();
            statements.push(set);
            set.equ(name, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$."${name}"`)));
        }
        for (let i in arrs) {
            let { name: arrName, props } = arrs[i];
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
            for (let [name, bud] of props) {
                let field = this.fieldFromBud(bud);
                vars.push(field);
                field.nullable = true;
                fields.push(field);
                cols.push({ col: name, val: new sql_1.ExpField(name, 'a') });
                selectJsonArr.column(new sql_1.ExpField(name, 'a'));
                jsonColumns.push({ field: this.fieldFromBud(bud), path: `$.${name}` });
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
        const json = '$json', out = '$out', ret = '$ret', endPoint = '$endPoint', outer = '$outer', prevOuter = '$prevOuter', arrI = '$i', row = '$row', arrLen = '$len', queueId = '$queueId';
        const { id, props, arrs } = this.bizEntity;
        const { parameters, statements } = proc;
        const { factory } = this.context;
        parameters.push((0, il_1.jsonField)(json));
        const declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)(consts_1.$site), (0, il_1.bigIntField)(out), (0, il_1.jsonField)(ret), (0, il_1.bigIntField)(endPoint), (0, il_1.bigIntField)(outer), (0, il_1.bigIntField)(prevOuter), (0, il_1.intField)(arrI), (0, il_1.jsonField)(row), (0, il_1.intField)(arrLen), (0, il_1.bigIntField)(queueId));
        const setSite = factory.createSet();
        statements.push(setSite);
        setSite.equ(consts_1.$site, new sql_1.ExpNum(this.context.site));
        const setOut = factory.createSet();
        statements.push(setOut);
        setOut.equ(out, new sql_1.ExpNum(id));
        const setPrevOuter0 = factory.createSet();
        statements.push(setPrevOuter0);
        setPrevOuter0.equ(prevOuter, sql_1.ExpNum.num0);
        const varOuter = new sql_1.ExpVar(outer);
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
        selectOuter.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('inout'), new sql_1.ExpVar(out)), new sql_1.ExpGT(new sql_1.ExpField('outer'), new sql_1.ExpVar(prevOuter))));
        selectOuter.order(new sql_1.ExpField('outer'), 'asc');
        selectOuter.limit(sql_1.ExpNum.num1);
        const ifOuterNull = factory.createIf();
        loopStats.add(ifOuterNull);
        ifOuterNull.cmp = new sql_1.ExpIsNull(varOuter);
        const leave = factory.createBreak();
        ifOuterNull.then(leave);
        leave.no = loop.no;
        const setPrevOuter = factory.createSet();
        loopStats.add(setPrevOuter);
        setPrevOuter.equ(prevOuter, varOuter);
        const params = [];
        const varJson = new sql_1.ExpVar(json);
        const varRet = new sql_1.ExpVar(ret);
        const varRow = new sql_1.ExpVar(row);
        function getBudVal(bud, val) {
            if (bud.dataType !== il_1.BudDataType.ID)
                return val;
            let select = factory.createSelect();
            select.col('no', undefined, a);
            select.from(new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOAtom, false, a))
                .join(il_1.JoinType.join, new statementWithFrom_1.EntityTable(il_1.EnumSysTable.IOAtomType, false, b))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', b), new sql_1.ExpField('type', a)));
            select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('outer', b), varOuter), new sql_1.ExpEQ(new sql_1.ExpField('atom', a), val)));
            return new sql_1.ExpSelect(select);
        }
        for (let [name, bud] of props) {
            params.push(new sql_1.ExpStr(name), getBudVal(bud, new sql_1.ExpFunc('JSON_VALUE', varJson, new sql_1.ExpStr(`$.${name}`))));
        }
        for (let i in arrs) {
            const arrParams = [];
            const arr = arrs[i];
            const { name: arrName, props: arrProps } = arr;
            declare.vars((0, il_1.jsonField)(arrName));
            const varArrJson = new sql_1.ExpVar(arrName);
            const setArrJson = factory.createSet();
            loopStats.add(setArrJson);
            setArrJson.equ(arrName, new sql_1.ExpFunc('JSON_ARRAY'));
            const setI0 = factory.createSet();
            loopStats.add(setI0);
            setI0.equ(arrI, sql_1.ExpNum.num0);
            const setLen = factory.createSet();
            loopStats.add(setLen);
            setLen.equ(arrLen, new sql_1.ExpFunc('JSON_LENGTH', new sql_1.ExpStr(`$.${arrName}`)));
            const loopArr = factory.createWhile();
            loopStats.add(loopArr);
            loopArr.no = 98;
            loopArr.cmp = new sql_1.ExpLT(new sql_1.ExpVar(arrI), new sql_1.ExpVar(arrLen));
            const { statements: laStats } = loopArr;
            const setRow = factory.createSet();
            laStats.add(setRow);
            setRow.equ(row, new sql_1.ExpFunc('JSON_UNQUOTE', new sql_1.ExpFunc('JSON_EXTRACT', varJson, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr(`$.${arrName}[`), new sql_1.ExpVar(arrI), new sql_1.ExpStr(']')))));
            const setIInc = factory.createSet();
            laStats.add(setIInc);
            setIInc.equ(arrI, new sql_1.ExpAdd(new sql_1.ExpVar(arrI), sql_1.ExpNum.num1));
            for (let [name, bud] of arrProps) {
                arrParams.push(new sql_1.ExpStr(name));
                arrParams.push(getBudVal(bud, new sql_1.ExpFunc('JSON_VALUE', varRow, new sql_1.ExpStr(`$.${name}`))));
            }
            const appendArrJson = factory.createSet();
            laStats.add(appendArrJson);
            appendArrJson.equ(arrName, new sql_1.ExpFunc('JSON_ARRAY_APPEND', varArrJson, new sql_1.ExpStr('$'), new sql_1.ExpFunc('JSON_OBJECT', ...arrParams)));
            params.push(new sql_1.ExpStr(arrName), new sql_1.ExpVar(arrName));
        }
        const setRet = factory.createSet();
        loopStats.add(setRet);
        setRet.equ(ret, new sql_1.ExpFunc('JSON_OBJECT', ...params));
        const varEndPoint = new sql_1.ExpVar(endPoint);
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
            { col: 'value', val: varRet },
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
//# sourceMappingURL=BizInOut.js.map