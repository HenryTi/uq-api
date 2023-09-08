"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BForQueue = exports.BForSelect = exports.BForListWithVars = exports.BForArr = exports.BForList = void 0;
const bstatement_1 = require("./bstatement");
const sqls_1 = require("./sqls");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const dbContext_1 = require("../dbContext");
class BForList extends bstatement_1.BStatement {
    constructor(context, forEach) {
        super(context, forEach);
        this.forEach = forEach;
    }
    head(sqls) {
        sqls.head(this.forEach.statements.statements);
    }
    foot(sqls) {
        sqls.foot(this.forEach.statements.statements);
    }
}
exports.BForList = BForList;
class BForArr extends BForList {
    constructor(context, forEach, forArr) {
        super(context, forEach);
        this.forArr = forArr;
    }
    body(sqls) {
        this.context.forArr(this.forArr.arr, sqls, this.istatement.no, (body) => {
            let forSqls = new sqls_1.Sqls(sqls.context, body);
            forSqls.body(this.forEach.statements.statements);
        });
    }
}
exports.BForArr = BForArr;
class BForListWithVars extends BForList {
    constructor(context, forEach, forListWithVars) {
        super(context, forEach);
        this.forListWithVars = forListWithVars;
    }
    createDeclareVars(sqls) {
        let declare = this.context.factory.createDeclare();
        sqls.push(declare);
        let { vars } = this.forListWithVars;
        for (let v of vars) {
            declare.var(v.pointer.varName(v.name), v.dataType);
        }
    }
}
exports.BForListWithVars = BForListWithVars;
class BForSelect extends BForListWithVars {
    constructor(context, forEach, forSelect) {
        super(context, forEach, forSelect);
        this.forSelect = forSelect;
    }
    body(sqls) {
        this.buildForSelect(sqls);
    }
    buildForSelect(sqls) {
        let { select } = this.forSelect;
        this.createDeclareVars(sqls);
        let { no } = this.istatement;
        let { factory } = this.context;
        let declare = factory.createDeclare();
        sqls.push(declare);
        // 暂时都按inProc处理，所有的for 临时表都不删
        let varTable = factory.createForTable(this.forEach.isInProc);
        sqls.push(varTable);
        let vt = varTable.name = '$for_' + no;
        let vtKey = '$tbl_' + vt;
        declare.var(vtKey, new il_1.Int());
        let setAtTblKey = factory.createSet();
        sqls.push(setAtTblKey);
        setAtTblKey.equ(vtKey, new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpAtVar(vtKey), sql_1.ExpNum.num0), sql_1.ExpNum.num1));
        setAtTblKey.isAtVar = true;
        let setTblKey = factory.createSet();
        sqls.push(setTblKey);
        setTblKey.equ(vtKey, new sql_1.ExpAtVar(vtKey));
        let tblField = (0, il_1.intField)('$tbl');
        tblField.nullable = false;
        let idField = (0, il_1.intField)('$id');
        idField.autoInc = true;
        idField.nullable = false;
        let fields = varTable.fields = [tblField, idField];
        varTable.keys = [tblField, idField];
        let intoFields = [];
        for (let v of this.forSelect.vars) {
            let f = new il_1.Field();
            f.name = v.name;
            f.dataType = v.dataType;
            f.nullable = true;
            fields.push(f);
            intoFields.push(f);
        }
        intoFields.push(tblField);
        let selState = (0, select_1.convertSelect)(this.context, select);
        selState.column(new sql_1.ExpVar(vtKey), '$tbl');
        let vtName = varTable.name;
        selState.into = {
            name: vtName,
            jName: vtName,
            sName: vtName,
            fields: intoFields,
            needTable: true
        };
        sqls.push(selState);
        let row = '$row_' + no;
        let row_ok = '$row_ok_' + no;
        declare.vars((0, il_1.intField)(row));
        declare.vars((0, il_1.tinyIntField)(row_ok));
        let set = factory.createSet();
        sqls.push(set);
        set.equ(row, sql_1.ExpVal.num0);
        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new sql_1.ExpEQ(sql_1.ExpVal.num1, sql_1.ExpVal.num1);
        let rowOkNull = factory.createSet();
        forS.push(rowOkNull);
        rowOkNull.equ(row_ok, new sql_1.ExpNull());
        let incRow = factory.createSet();
        forS.push(incRow);
        incRow.equ(row, new sql_1.ExpAdd(new sql_1.ExpVar(row), sql_1.ExpVal.num1));
        let selInto = factory.createSelect();
        selInto.toVar = true;
        forS.push(selInto);
        selInto.column(sql_1.ExpNum.num1, row_ok);
        for (let v of this.forSelect.vars) {
            let n = v.name;
            selInto.col(n, v.pointer.varName(n));
        }
        let fromVarTable = new statementWithFrom_1.VarTable(varTable.name);
        selInto.from(fromVarTable);
        let expWhere = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('$id'), new sql_1.ExpVar(row)), new sql_1.ExpEQ(new sql_1.ExpField('$tbl'), new sql_1.ExpVar(vtKey)));
        selInto.where(expWhere);
        let iff = factory.createIf();
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(row_ok));
        forS.push(iff);
        let leave = factory.createBreak();
        leave.no = no;
        iff.then(leave);
        let forSqls = new sqls_1.Sqls(sqls.context, forS);
        forSqls.body(this.forEach.statements.statements);
    }
}
exports.BForSelect = BForSelect;
class BForQueue extends BForListWithVars {
    constructor(context, forEach, forQueue) {
        super(context, forEach, forQueue);
        this.forQueue = forQueue;
    }
    body(sqls) {
        this.createDeclareVars(sqls);
        let { factory, hasUnit, unitFieldName } = this.context;
        let { no } = this.istatement;
        let { vars, queue, ix } = this.forQueue;
        let { onceOnly, orderBy } = queue;
        let memo = factory.createMemo();
        memo.text = 'For Queue';
        sqls.push(memo);
        let expIx = ix === undefined ? sql_1.ExpNum.num0 : this.context.convertExp(ix);
        let queueEntityId = '$queue_entity' + no;
        let queueIx = '$queue_ix' + no;
        let queueValue = '$queue_value' + no;
        let queueLast = '$queue_last' + no;
        let queueCount = '$queue_count' + no;
        let queueTick = '$queue_tick' + no;
        let compileTick = '$compile_tick' + no;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars((0, il_1.bigIntField)(queueValue));
        declare.vars((0, il_1.bigIntField)(queueLast));
        declare.vars((0, il_1.bigIntField)(queueCount));
        declare.vars((0, il_1.bigIntField)(queueIx));
        declare.vars((0, il_1.intField)(queueEntityId));
        declare.vars((0, il_1.intField)(queueTick));
        declare.vars((0, il_1.intField)(compileTick));
        let selectQueueValueOrderBy;
        let expValueCmp;
        let expValInit;
        if (orderBy === 'desc') {
            expValInit = new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_max, new sql_1.ExpField('value', 'a')), sql_1.ExpNum.num1);
            selectQueueValueOrderBy = 'desc';
            expValueCmp = new sql_1.ExpLT(new sql_1.ExpField('value', 'a'), new sql_1.ExpVar(queueLast));
        }
        else {
            expValInit = new sql_1.ExpSub(new sql_1.ExpFunc(factory.func_min, new sql_1.ExpField('value', 'a')), sql_1.ExpNum.num1);
            selectQueueValueOrderBy = 'asc';
            expValueCmp = new sql_1.ExpGT(new sql_1.ExpField('value', 'a'), new sql_1.ExpVar(queueLast));
        }
        let selectEntity = factory.createSelect();
        sqls.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.col('id', queueEntityId, 'a');
        selectEntity.column(expIx, queueIx);
        selectEntity.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity, 'a'));
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name', 'a'), new sql_1.ExpStr(this.forQueue.queue.name)));
        selectEntity.lock = select_1.LockType.update;
        let sqlQueueLast = factory.createSet();
        sqls.push(sqlQueueLast);
        let queueInit = factory.createSelect();
        sqlQueueLast.equ(queueLast, new sql_1.ExpSelect(queueInit));
        queueInit.column(expValInit);
        queueInit.from(new statementWithFrom_1.EntityTable('$queue', hasUnit, 'a'));
        queueInit.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('queue', 'a'), new sql_1.ExpVar(queueEntityId)), new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpVar(queueIx))));
        queueInit.lock = select_1.LockType.update;
        let setQueueTick = factory.createSet();
        sqls.push(setQueueTick);
        setQueueTick.equ(queueTick, new sql_1.ExpFuncCustom(factory.func_unix_timestamp));
        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(queueLast));
        let setQueueValueNull = factory.createSet();
        forS.push(setQueueValueNull);
        setQueueValueNull.equ(queueValue, sql_1.ExpVal.null);
        let selectQueueValue = factory.createSelect();
        forS.push(selectQueueValue);
        selectQueueValue.toVar = true;
        selectQueueValue.col('value', queueValue, 'a');
        selectQueueValue.from(new statementWithFrom_1.EntityTable('$queue', hasUnit, 'a'));
        if (onceOnly === false) {
            selectQueueValue.col('count', queueCount, 'b');
            selectQueueValue.join(il_1.JoinType.left, new statementWithFrom_1.EntityTable('$queue$', hasUnit, 'b'))
                .on(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('queue', 'a'), new sql_1.ExpField('queue', 'b')), new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpField('ix', 'b')), new sql_1.ExpEQ(new sql_1.ExpField('value', 'a'), new sql_1.ExpField('value', 'b'))));
        }
        selectQueueValue.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('queue', 'a'), new sql_1.ExpVar(queueEntityId)), new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpVar(queueIx)), expValueCmp));
        selectQueueValue.order(new sql_1.ExpField('value', 'a'), selectQueueValueOrderBy);
        selectQueueValue.limit(sql_1.ExpNum.num1);
        selectQueueValue.lock = select_1.LockType.update;
        let ifQueueNull = factory.createIf();
        forS.push(ifQueueNull);
        ifQueueNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(queueValue));
        let queueNullBreak = factory.createBreak();
        ifQueueNull.then(queueNullBreak);
        queueNullBreak.no = no;
        let setVar = factory.createSet();
        forS.push(setVar);
        let var0 = vars[0];
        setVar.equ(var0.pointer.varName(var0.name), new sql_1.ExpVar(queueValue));
        let setQueueLast = factory.createSet();
        forS.push(setQueueLast);
        setQueueLast.equ(queueLast, new sql_1.ExpVar(queueValue));
        forS.push(factory.createTransaction());
        const blockLabel = '__$queue_body_label_' + no;
        let blockBegin = factory.createBlockBegin();
        forS.push(blockBegin);
        blockBegin.label = blockLabel;
        let ifCount = factory.createIf();
        forS.push(ifCount);
        ifCount.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(queueCount));
        let insert = factory.createInsert();
        ifCount.then(insert);
        insert.table = new statementWithFrom_1.EntityTable('$queue$', hasUnit);
        insert.cols = [
            { col: 'queue', val: new sql_1.ExpVar(queueEntityId) },
            { col: 'ix', val: new sql_1.ExpVar(queueIx) },
            { col: 'value', val: new sql_1.ExpVar(queueValue) },
        ];
        if (onceOnly === true) {
            let elseStatements = new sql_1.Statements();
            ifCount.elseIf(new sql_1.ExpGT(new sql_1.ExpVar(queueCount), sql_1.ExpNum.num0), elseStatements);
            let cantDoContinue = factory.createContinue();
            elseStatements.add(cantDoContinue);
            cantDoContinue.forQueueNo = String(no);
        }
        let update = factory.createUpdate();
        ifCount.else(update);
        update.table = new statementWithFrom_1.EntityTable('$queue$', hasUnit);
        let updateWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('queue'), new sql_1.ExpVar(queueEntityId)),
            new sql_1.ExpEQ(new sql_1.ExpField('ix'), new sql_1.ExpVar(queueIx)),
            new sql_1.ExpEQ(new sql_1.ExpField('value'), new sql_1.ExpVar(queueValue)),
        ];
        if (hasUnit === true) {
            updateWheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), new sql_1.ExpVar(unitFieldName)));
        }
        update.where = new sql_1.ExpAnd(...updateWheres);
        let expCount = new sql_1.ExpField('count');
        if (onceOnly === true) {
            expCount = new sql_1.ExpNeg(expCount);
        }
        update.cols = [
            {
                col: 'count', val: new sql_1.ExpAdd(expCount, sql_1.ExpNum.num1)
            }
        ];
        let forSqls = new sqls_1.Sqls(sqls.context, forS);
        forSqls.body(this.forEach.statements.statements);
        let blockEnd = factory.createBlockEnd();
        forS.push(blockEnd);
        blockEnd.label = blockLabel;
        let deleteQueueValue = factory.createDelete();
        forS.push(deleteQueueValue);
        deleteQueueValue.tables = ['a'];
        deleteQueueValue.from(new statementWithFrom_1.EntityTable('$queue', hasUnit, 'a'));
        let deleteQueueWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('queue', 'a'), new sql_1.ExpVar(queueEntityId)),
            new sql_1.ExpEQ(new sql_1.ExpField('ix', 'a'), new sql_1.ExpVar(queueIx)),
            new sql_1.ExpEQ(new sql_1.ExpField('value', 'a'), new sql_1.ExpVar(queueValue))
        ];
        if (hasUnit === true) {
            deleteQueueWheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), new sql_1.ExpVar(unitFieldName)));
        }
        deleteQueueValue.where(new sql_1.ExpAnd(...deleteQueueWheres));
        forS.push(factory.createCommit());
        let selectCompileTick = factory.createSelect();
        forS.push(selectCompileTick);
        selectCompileTick.toVar = true;
        selectCompileTick.col('value', compileTick);
        selectCompileTick.from(new statementWithFrom_1.EntityTable('$setting', false));
        let settingWheres = [];
        if (hasUnit === true)
            settingWheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), sql_1.ExpNum.num0));
        settingWheres.push(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('compileTick')));
        selectCompileTick.where(new sql_1.ExpAnd(...settingWheres));
        selectCompileTick.lock = select_1.LockType.update;
        let ifCompileTick = factory.createIf();
        forS.push(ifCompileTick);
        ifCompileTick.cmp = new sql_1.ExpLT(new sql_1.ExpVar(queueTick), new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpVar(compileTick), sql_1.ExpNum.num0));
        let breakIfCompileTick = factory.createBreak();
        ifCompileTick.then(breakIfCompileTick);
        breakIfCompileTick.no = no;
        let sleep = factory.createSleep();
        sleep.value = new sql_1.ExpNum(0.01);
        ifCompileTick.else(sleep);
    }
}
exports.BForQueue = BForQueue;
//# sourceMappingURL=for.js.map