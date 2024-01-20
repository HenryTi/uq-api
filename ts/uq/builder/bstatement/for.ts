import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import {
    EnumSysTable, ForEach, Field, Int, intField, ForArr
    , ForSelect, ForQueue, ForListWithVars, bigIntField, tinyIntField, JoinType
} from '../../il';
import {
    ExpNeg, ExpIsNull, ExpNum, ExpVar, ExpEQ, ExpFunc, ExpIsNotNull
    , ExpVal, ExpAdd, ExpField, ExpStr, Statement, ExpLT, ExpSelect
    , ExpAnd, ExpGT, ExpFuncCustom, ExpCmp, ExpSub
    , Statements,
    ExpNull,
    ExpAtVar
} from '../sql';
import { convertSelect, LockType } from '../sql/select';
import { EntityTable, VarTable as FromVarTable } from '../sql/statementWithFrom';
import { DbContext, sysTable } from "../dbContext";

export abstract class BForList extends BStatement {
    readonly forEach: ForEach;
    constructor(context: DbContext, forEach: ForEach) {
        super(context, forEach);
        this.forEach = forEach;
    }
    head(sqls: Sqls) {
        sqls.head(this.forEach.statements.statements);
    }
    foot(sqls: Sqls) {
        sqls.foot(this.forEach.statements.statements);
    }
}

export class BForArr extends BForList {
    readonly forArr: ForArr;
    constructor(context: DbContext, forEach: ForEach, forArr: ForArr) {
        super(context, forEach);
        this.forArr = forArr;
    }
    body(sqls: Sqls) {
        this.context.forArr(this.forArr.arr, sqls, this.istatement.no, (body: Statement[]) => {
            let forSqls = new Sqls(sqls.context, body);
            forSqls.body(this.forEach.statements.statements);
        });
    }
}

export abstract class BForListWithVars extends BForList {
    readonly forListWithVars: ForListWithVars;
    constructor(context: DbContext, forEach: ForEach, forListWithVars: ForListWithVars) {
        super(context, forEach);
        this.forListWithVars = forListWithVars;
    }
    protected createDeclareVars(sqls: Sqls) {
        let declare = this.context.factory.createDeclare();
        sqls.push(declare);
        let { vars } = this.forListWithVars;
        for (let v of vars) {
            declare.var(v.pointer.varName(v.name), v.dataType);
        }
    }
}

export class BForSelect extends BForListWithVars {
    readonly forSelect: ForSelect;
    constructor(context: DbContext, forEach: ForEach, forSelect: ForSelect) {
        super(context, forEach, forSelect);
        this.forSelect = forSelect;
    }

    body(sqls: Sqls) {
        this.buildForSelect(sqls);
    }

    private buildForSelect(sqls: Sqls) {
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
        declare.var(vtKey, new Int());
        let setAtTblKey = factory.createSet();
        sqls.push(setAtTblKey);
        setAtTblKey.equ(vtKey,
            new ExpAdd(
                new ExpFunc(factory.func_ifnull, new ExpAtVar(vtKey), ExpNum.num0),
                ExpNum.num1
            )
        );
        setAtTblKey.isAtVar = true;

        let setTblKey = factory.createSet();
        sqls.push(setTblKey);
        setTblKey.equ(vtKey, new ExpAtVar(vtKey));

        let tblField = intField('$tbl');
        tblField.nullable = false;
        let idField = intField('$id');
        idField.autoInc = true;
        idField.nullable = false;

        let fields = varTable.fields = [tblField, idField];
        varTable.keys = [tblField, idField];
        let intoFields: Field[] = [];
        for (let v of this.forSelect.vars) {
            let f = new Field();
            f.name = v.name;
            f.dataType = v.dataType;
            f.nullable = true;
            fields.push(f);
            intoFields.push(f);
        }
        intoFields.push(tblField);
        let selState = convertSelect(this.context, select);
        selState.column(new ExpVar(vtKey), '$tbl');
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
        declare.vars(intField(row));
        declare.vars(tinyIntField(row_ok));
        let set = factory.createSet();
        sqls.push(set);
        set.equ(row, ExpVal.num0);
        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new ExpEQ(ExpVal.num1, ExpVal.num1);

        let rowOkNull = factory.createSet();
        forS.push(rowOkNull);
        rowOkNull.equ(row_ok, ExpVal.null);
        let incRow = factory.createSet();
        forS.push(incRow);
        incRow.equ(row, new ExpAdd(new ExpVar(row), ExpVal.num1));

        let selInto = factory.createSelect();
        selInto.toVar = true;
        forS.push(selInto);
        selInto.column(ExpNum.num1, row_ok);
        for (let v of this.forSelect.vars) {
            let n = v.name;
            selInto.col(n, v.pointer.varName(n));
        }
        let fromVarTable = new FromVarTable(varTable.name);
        selInto.from(fromVarTable);
        let expWhere = new ExpAnd(
            new ExpEQ(new ExpField('$id'), new ExpVar(row)),
            new ExpEQ(new ExpField('$tbl'), new ExpVar(vtKey)),
        );
        selInto.where(expWhere);

        let iff = factory.createIf();
        iff.cmp = new ExpIsNull(new ExpVar(row_ok));
        forS.push(iff);
        let leave = factory.createBreak();
        leave.no = no;
        iff.then(leave);

        let forSqls = new Sqls(sqls.context, forS);
        forSqls.body(this.forEach.statements.statements);
    }
}

export class BForQueue extends BForListWithVars {
    readonly forQueue: ForQueue;
    constructor(context: DbContext, forEach: ForEach, forQueue: ForQueue) {
        super(context, forEach, forQueue);
        this.forQueue = forQueue;
    }
    body(sqls: Sqls) {
        this.createDeclareVars(sqls);

        let { factory, hasUnit, unitFieldName } = this.context;
        let { no } = this.istatement;
        let { vars, queue, ix } = this.forQueue;
        let { onceOnly, orderBy } = queue;
        let memo = factory.createMemo();
        memo.text = 'For Queue';
        sqls.push(memo);

        let expIx = ix === undefined ? ExpNum.num0 : this.context.convertExp(ix) as ExpVal;
        let queueEntityId = '$queue_entity' + no;
        let queueIx = '$queue_ix' + no;
        let queueValue = '$queue_value' + no;
        let queueLast = '$queue_last' + no;
        let queueCount = '$queue_count' + no;
        let queueTick = '$queue_tick' + no;
        let compileTick = '$compile_tick' + no;
        let declare = factory.createDeclare();
        sqls.push(declare);
        declare.vars(bigIntField(queueValue));
        declare.vars(bigIntField(queueLast));
        declare.vars(bigIntField(queueCount));
        declare.vars(bigIntField(queueIx));
        declare.vars(intField(queueEntityId));
        declare.vars(intField(queueTick));
        declare.vars(intField(compileTick));

        let selectQueueValueOrderBy: 'asc' | 'desc';
        let expValueCmp: ExpCmp;
        let expValInit: ExpVal;
        if (orderBy === 'desc') {
            expValInit = new ExpAdd(new ExpFunc(factory.func_max, new ExpField('value', 'a')), ExpNum.num1);
            selectQueueValueOrderBy = 'desc';
            expValueCmp = new ExpLT(new ExpField('value', 'a'), new ExpVar(queueLast));
        }
        else {
            expValInit = new ExpSub(new ExpFunc(factory.func_min, new ExpField('value', 'a')), ExpNum.num1);
            selectQueueValueOrderBy = 'asc';
            expValueCmp = new ExpGT(new ExpField('value', 'a'), new ExpVar(queueLast));
        }

        let selectEntity = factory.createSelect();
        sqls.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.col('id', queueEntityId, 'a');
        selectEntity.column(expIx, queueIx);
        selectEntity.from(sysTable(EnumSysTable.entity, 'a'));
        selectEntity.where(new ExpEQ(new ExpField('name', 'a'), new ExpStr(this.forQueue.queue.name)));
        selectEntity.lock = LockType.update;

        let sqlQueueLast = factory.createSet();
        sqls.push(sqlQueueLast);
        let queueInit = factory.createSelect();
        sqlQueueLast.equ(queueLast, new ExpSelect(queueInit));
        queueInit.column(expValInit);
        queueInit.from(new EntityTable('$queue', hasUnit, 'a'));
        queueInit.where(new ExpAnd(
            new ExpEQ(new ExpField('queue', 'a'), new ExpVar(queueEntityId)),
            new ExpEQ(new ExpField('ix', 'a'), new ExpVar(queueIx)),
        ));
        queueInit.lock = LockType.update;

        let setQueueTick = factory.createSet();
        sqls.push(setQueueTick);
        setQueueTick.equ(queueTick, new ExpFuncCustom(factory.func_unix_timestamp));

        let _for = factory.createWhile();
        let forS = _for.statements.statements;
        sqls.push(_for);
        _for.no = no;
        _for.cmp = new ExpIsNotNull(new ExpVar(queueLast));
        let setQueueValueNull = factory.createSet();
        forS.push(setQueueValueNull);
        setQueueValueNull.equ(queueValue, ExpVal.null);

        let selectQueueValue = factory.createSelect();
        forS.push(selectQueueValue);
        selectQueueValue.toVar = true;
        selectQueueValue.col('value', queueValue, 'a');
        selectQueueValue.from(new EntityTable('$queue', hasUnit, 'a'));
        if (onceOnly === false) {
            selectQueueValue.col('count', queueCount, 'b');
            selectQueueValue.join(JoinType.left, new EntityTable('$queue$', hasUnit, 'b'))
                .on(new ExpAnd(
                    new ExpEQ(new ExpField('queue', 'a'), new ExpField('queue', 'b')),
                    new ExpEQ(new ExpField('ix', 'a'), new ExpField('ix', 'b')),
                    new ExpEQ(new ExpField('value', 'a'), new ExpField('value', 'b')),
                ));
        }

        selectQueueValue.where(new ExpAnd(
            new ExpEQ(new ExpField('queue', 'a'), new ExpVar(queueEntityId)),
            new ExpEQ(new ExpField('ix', 'a'), new ExpVar(queueIx)),
            expValueCmp
        ));
        selectQueueValue.order(new ExpField('value', 'a'), selectQueueValueOrderBy);
        selectQueueValue.limit(ExpNum.num1);
        selectQueueValue.lock = LockType.update;

        let ifQueueNull = factory.createIf();
        forS.push(ifQueueNull);
        ifQueueNull.cmp = new ExpIsNull(new ExpVar(queueValue));
        let queueNullBreak = factory.createBreak();
        ifQueueNull.then(queueNullBreak);
        queueNullBreak.no = no;

        let setVar = factory.createSet();
        forS.push(setVar);
        let var0 = vars[0];
        setVar.equ(var0.pointer.varName(var0.name), new ExpVar(queueValue));

        let setQueueLast = factory.createSet();
        forS.push(setQueueLast);
        setQueueLast.equ(queueLast, new ExpVar(queueValue));

        forS.push(factory.createTransaction());
        const blockLabel = '__$queue_body_label_' + no;
        let blockBegin = factory.createBlockBegin();
        forS.push(blockBegin);
        blockBegin.label = blockLabel;
        let ifCount = factory.createIf();
        forS.push(ifCount);
        ifCount.cmp = new ExpIsNull(new ExpVar(queueCount));
        let insert = factory.createInsert();
        ifCount.then(insert);
        insert.table = new EntityTable('$queue$', hasUnit);
        insert.cols = [
            { col: 'queue', val: new ExpVar(queueEntityId) },
            { col: 'ix', val: new ExpVar(queueIx) },
            { col: 'value', val: new ExpVar(queueValue) },
        ];
        if (onceOnly === true) {
            let elseStatements = new Statements();
            ifCount.elseIf(new ExpGT(new ExpVar(queueCount), ExpNum.num0), elseStatements);
            let cantDoContinue = factory.createContinue();
            elseStatements.add(cantDoContinue);
            cantDoContinue.forQueueNo = String(no);
        }
        let update = factory.createUpdate();
        ifCount.else(update);
        update.table = new EntityTable('$queue$', hasUnit);
        let updateWheres = [
            new ExpEQ(new ExpField('queue'), new ExpVar(queueEntityId)),
            new ExpEQ(new ExpField('ix'), new ExpVar(queueIx)),
            new ExpEQ(new ExpField('value'), new ExpVar(queueValue)),
        ];
        if (hasUnit === true) {
            updateWheres.push(new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)));
        }
        update.where = new ExpAnd(...updateWheres);
        let expCount: ExpVal = new ExpField('count');
        if (onceOnly === true) {
            expCount = new ExpNeg(expCount);
        }
        update.cols = [
            {
                col: 'count', val: new ExpAdd(expCount, ExpNum.num1)
            }
        ];

        let forSqls = new Sqls(sqls.context, forS);
        forSqls.body(this.forEach.statements.statements);
        let blockEnd = factory.createBlockEnd();
        forS.push(blockEnd);
        blockEnd.label = blockLabel;

        let deleteQueueValue = factory.createDelete();
        forS.push(deleteQueueValue);
        deleteQueueValue.tables = ['a'];
        deleteQueueValue.from(new EntityTable('$queue', hasUnit, 'a'));
        let deleteQueueWheres = [
            new ExpEQ(new ExpField('queue', 'a'), new ExpVar(queueEntityId)),
            new ExpEQ(new ExpField('ix', 'a'), new ExpVar(queueIx)),
            new ExpEQ(new ExpField('value', 'a'), new ExpVar(queueValue))
        ]
        if (hasUnit === true) {
            deleteQueueWheres.push(new ExpEQ(new ExpField(unitFieldName), new ExpVar(unitFieldName)));
        }
        deleteQueueValue.where(new ExpAnd(...deleteQueueWheres));
        forS.push(factory.createCommit());

        let selectCompileTick = factory.createSelect();
        forS.push(selectCompileTick);
        selectCompileTick.toVar = true;
        selectCompileTick.col('value', compileTick);
        selectCompileTick.from(new EntityTable('$setting', false));
        let settingWheres: ExpCmp[] = [];
        if (hasUnit === true) settingWheres.push(new ExpEQ(new ExpField(unitFieldName), ExpNum.num0));
        settingWheres.push(new ExpEQ(new ExpField('name'), new ExpStr('compileTick')));
        selectCompileTick.where(new ExpAnd(...settingWheres));
        selectCompileTick.lock = LockType.update;

        let ifCompileTick = factory.createIf();
        forS.push(ifCompileTick);
        ifCompileTick.cmp = new ExpLT(
            new ExpVar(queueTick),
            new ExpFunc(factory.func_ifnull, new ExpVar(compileTick), ExpNum.num0)
        );
        let breakIfCompileTick = factory.createBreak();
        ifCompileTick.then(breakIfCompileTick);
        breakIfCompileTick.no = no;
        let sleep = factory.createSleep();
        sleep.value = new ExpNum(0.01);
        ifCompileTick.else(sleep);
    }
}
