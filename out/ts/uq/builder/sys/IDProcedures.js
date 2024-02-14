"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDProcedures = void 0;
const sql = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sql_1 = require("../sql");
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const select_1 = require("../sql/select");
const dbContext_1 = require("../dbContext");
const sql_2 = require("../sql");
const consts_1 = require("../consts");
const sqlBuilder_1 = require("../sql/sqlBuilder");
const il_2 = require("../../il");
// const idMin = 1<<20;
const idMin = 4294967296;
class IDProcedures extends sysProcedures_1.SysProcedures {
    build() {
        this.getIDSectionProc(this.sysProc('$id_section_get'));
        this.setIDSectionProc(this.sysProc('$id_section_set'));
        this.buildExecSqlProc(this.coreProc('$exec_sql_trans'), true);
        this.buildExecSqlProc(this.coreProc('$exec_sql'), false);
        this.idSetEntity(this.coreFunc('$id_set_entity', new il_1.BigInt()));
        this.noFunc(this.coreFunc('$no', new il_1.Char()));
        this.idFunc(this.coreFunc('$id', new il_1.BigInt()));
        this.idLocalFunc(this.coreFunc('$id_local', new il_1.BigInt()));
        this.idMinuteFunc(this.coreFunc('$id_minute', new il_1.BigInt()));
        this.idUUFunc(this.coreFunc('$iduu', new il_1.BigInt()));
        this.idUUMFunc(this.coreFunc('$iduum', new il_1.BigInt()));
        this.idNUFunc(this.coreFunc('$idnu', new il_1.BigInt()));
        this.idMUFunc(this.coreFunc('$idmu', new il_1.BigInt()));
        this.textIdFunc(this.coreFunc('$textid', new il_1.Int()));
        this.idTextFunc(this.coreFunc('$idtext', new il_1.Char()));
        this.uuid_to_bin(this.coreFunc('$uuid_to_bin', new il_1.Bin(50)));
        this.phraseId(this.coreFunc('phraseid', new il_1.BigInt));
        this.phraseOfId(this.coreFunc('phraseofid', new il_1.Char(200)));
        // this.me(this.coreFunc('me', new BigInt()));
        this.ixValues(this.coreProc('$ix_values'));
    }
    getIDSectionProc(p) {
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('p', new il_1.BigInt());
        let selectID = factory.createSelect();
        p.statements.push(selectID);
        selectID.toVar = true;
        selectID.column(new sql_1.ExpField('big'), 'p');
        selectID.from(new statementWithFrom_1.EntityTable('$setting', false));
        let wheres = [new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('ID'))];
        if (hasUnit === true) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), sql_1.ExpNum.num0));
        }
        selectID.where(new sql_1.ExpAnd(...wheres));
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('p'));
        let setP0 = factory.createSet();
        iff.then(setP0);
        setP0.equ('p', sql_1.ExpNum.num0);
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql_1.ExpFunc(factory.func_max, new sql_1.ExpField('section', 'a')), 'section');
        select.column(new sql_1.ExpSub(new sql_1.ExpNum(8), new sql_1.ExpFunc(factory.func_count, sql_1.ExpNum.num1)), 'sectionCount');
        select.from(new statementWithFrom_1.EntityTable('$id_section', false, 'a'));
        select.where(new sql_1.ExpGT(new sql_1.ExpField('section', 'a'), new sql_1.ExpBitRight(new sql_1.ExpVar('p'), new sql_1.ExpNum(16))));
    }
    setIDSectionProc(p) {
        let { factory, hasUnit, unitField } = this.context;
        let { parameters, statements } = p;
        parameters.push((0, il_1.bigIntField)('section'), (0, il_1.intField)('count'));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('i', new il_1.BigInt());
        declare.var('end', new il_1.BigInt());
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpGT(new sql_1.ExpVar('count'), new sql_1.ExpNum(8));
        let setCount8 = factory.createSet();
        iff.then(setCount8);
        setCount8.equ('count', new sql_1.ExpNum(8));
        let trans = factory.createTransaction();
        statements.push(trans);
        let selectMax = factory.createSelect();
        selectMax.toVar = true;
        statements.push(selectMax);
        selectMax.column(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpFunc(factory.func_max, new sql.ExpField('section', 'a')), sql_1.ExpNum.num0), 'i');
        selectMax.from(new statementWithFrom_1.EntityTable('$id_section', false, 'a'));
        selectMax.lock = select_1.LockType.update;
        let iffMax = factory.createIf();
        statements.push(iffMax);
        iffMax.cmp = new sql_1.ExpLT(new sql_1.ExpVar('i'), new sql_1.ExpVar('section'));
        let setISection = factory.createSet();
        iffMax.then(setISection);
        setISection.equ('i', new sql_1.ExpVar('section'));
        let setEnd = factory.createSet();
        iffMax.then(setEnd);
        setEnd.equ('end', new sql_1.ExpAdd(new sql_1.ExpVar('section'), new sql_1.ExpVar('count')));
        iffMax.else(factory.createCommit());
        iffMax.else(factory.createLeaveProc());
        let loop = factory.createWhile();
        loop.no = 100;
        statements.push(loop);
        loop.cmp = new sql_1.ExpLT(new sql_1.ExpVar('i'), new sql_1.ExpVar('end'));
        let insert = factory.createInsert();
        loop.statements.add(insert);
        insert.table = new statementWithFrom_1.EntityTable('$id_section', false);
        insert.cols = [
            { col: 'section', val: new sql_1.ExpVar('i') }
        ];
        let setIInc = factory.createSet();
        loop.statements.add(setIInc);
        setIInc.equ('i', new sql_1.ExpAdd(new sql_1.ExpVar('i'), sql_1.ExpNum.num1));
        statements.push(factory.createCommit());
    }
    idSetEntity(p) {
        let { factory } = this.context;
        let { parameters, statements } = p;
        parameters.push((0, il_1.bigIntField)('id'));
        parameters.push((0, il_1.charField)('entity', 100));
        let selectEntity = factory.createSelect();
        selectEntity.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectEntity.col('id');
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('entity')));
        selectEntity.lock = select_1.LockType.update;
        let update = factory.createUpdate();
        statements.push(update);
        update.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.id_u);
        update.cols = [{
                col: 'entity', val: new sql_1.ExpSelect(selectEntity)
            }];
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id'));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.expVal = new sql_1.ExpVar('id');
    }
    noFunc(p) {
        let { factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        p.addUnitParameter();
        parameters.push((0, il_1.charField)('entity', 100));
        parameters.push((0, il_1.intField)('stamp'));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('entityId', new il_1.Int());
        declare.var('docDate', new il_1.DDate());
        declare.var('no', new il_1.Int());
        declare.var('date', new il_1.DDate());
        declare.var('ret', new il_1.Char());
        declare.var('len', new il_1.SmallInt());
        let vLen = new sql_1.ExpVar('len');
        let vNo = new sql_1.ExpVar('no');
        let setToday = factory.createSet();
        statements.push(setToday);
        setToday.equ('date', new sql_1.ExpFunc(factory.func_if, new sql_1.ExpIsNull(new sql_1.ExpVar('stamp')), new sql_1.ExpFunc('curdate'), new sql_1.ExpFunc(factory.func_from_unixtime, new sql_1.ExpVar('stamp'))));
        let selectEntity = factory.createSelect();
        statements.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.entity));
        selectEntity.col('id', 'entityId');
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('entity')));
        selectEntity.lock = select_1.LockType.update;
        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpField('date', 'a'), 'docDate');
        select.column(new sql_1.ExpField('no', 'a'), 'no');
        select.from(new statementWithFrom_1.EntityTable('$no', hasUnit, 'a'));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('sheet', 'a'), new sql_1.ExpVar('entityId')), new sql_1.ExpGE(new sql_1.ExpField('date', 'a'), new sql_1.ExpVar('date'))));
        select.lock = select_1.LockType.update;
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpOr(new sql_1.ExpIsNull(new sql_1.ExpVar('docDate')), new sql_1.ExpIsNull(vNo));
        let setDate = factory.createSet();
        iff.then(setDate);
        setDate.equ('docDate', new sql_1.ExpVar('date'));
        let setNo = factory.createSet();
        iff.then(setNo);
        setNo.equ('no', sql_1.ExpNum.num1);
        let upsert = factory.createInsert();
        statements.push(upsert);
        upsert.table = new statementWithFrom_1.EntityTable('$no', hasUnit);
        upsert.keys.push({ col: 'sheet', val: new sql_1.ExpVar('entityId') });
        if (hasUnit === true) {
            upsert.keys.push({ col: '$unit', val: new sql_1.ExpVar('$unit') });
        }
        upsert.cols.push({ col: 'date', val: new sql_1.ExpVar('docDate') }, { col: 'no', val: new sql_1.ExpAdd(vNo, sql_1.ExpNum.num1) });
        let ifLen = factory.createIf();
        statements.push(ifLen);
        ifLen.cmp = new sql_1.ExpLT(vNo, new sql_1.ExpNum(10000));
        let setLen4 = factory.createSet();
        setLen4.equ('len', new sql_1.ExpNum(4));
        ifLen.then(setLen4);
        let setLen6 = factory.createSet();
        setLen6.equ('len', new sql_1.ExpNum(6));
        let elseStats6 = new sql_2.Statements();
        elseStats6.add(setLen6);
        ifLen.elseIf(new sql_1.ExpLT(vNo, new sql_1.ExpNum(1000000)), elseStats6);
        let setLen8 = factory.createSet();
        setLen8.equ('len', new sql_1.ExpNum(8));
        ifLen.else(setLen8);
        let setRet = factory.createSet();
        statements.push(setRet);
        setRet.equ('ret', new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpFunc('DATE_FORMAT', new sql_1.ExpVar('date'), new sql_1.ExpStr('%y%m%d')), new sql_1.ExpFunc('LPAD', vNo, vLen, new sql_1.ExpStr('0'))));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'ret';
    }
    textIdFunc(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.charField)('text', 100));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('$id', new il_1.Int());
        let select = factory.createSelect();
        p.statements.push(select);
        select.toVar = true;
        select.col('id', '$id');
        select.from(new statementWithFrom_1.EntityTable('$text_id', false));
        select.where(new sql_1.ExpEQBinary(new sql_1.ExpField('text'), new sql_1.ExpVar('text')));
        select.lock = select_1.LockType.update;
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('$id'));
        let insert = factory.createInsert();
        iff.then(insert);
        insert.table = new statementWithFrom_1.EntityTable('$text_id', false);
        insert.cols = [
            { col: 'id', val: sql_1.ExpVal.null },
            { col: 'text', val: new sql_1.ExpVar('text') }
        ];
        let setLastinsertid = factory.createSet();
        iff.then(setLastinsertid);
        setLastinsertid.equ('$id', new sql_1.ExpFunc(factory.func_lastinsertid));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = '$id';
    }
    idTextFunc(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.intField)('id'));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('$text', new il_1.Char(100));
        let select = factory.createSelect();
        p.statements.push(select);
        select.toVar = true;
        select.col('text', '$text');
        select.from(new statementWithFrom_1.EntityTable('$text_id', false));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')));
        select.lock = select_1.LockType.update;
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = '$text';
    }
    uuid_to_bin(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.charField)('uuid', 50));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = new sql_1.ExpFunc('UNHEX', new sql_1.ExpFunc('REPLACE', new sql_1.ExpVar('uuid'), new sql_1.ExpStr('-'), new sql_1.ExpStr('')));
    }
    buildExecSqlProc(p, trans) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam, (0, il_1.textField)('sql'));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.intField)('c'), (0, il_1.intField)('p'), (0, il_1.intField)('len'), (0, il_1.intField)('i'), (0, il_1.textField)('stat'), (0, il_1.charField)('sep', 6));
        let setUnit = factory.createSet();
        statements.push(setUnit);
        setUnit.isAtVar = true;
        setUnit.equ('unit', new sql_1.ExpVar('$unit'));
        let setUser = factory.createSet();
        statements.push(setUser);
        setUser.isAtVar = true;
        setUser.equ('user', new sql_1.ExpVar('$user'));
        let setSep = factory.createSet();
        statements.push(setSep);
        setSep.equ('sep', new sql_1.ExpFunc('CHAR', new sql_1.ExpNum(12)));
        let iffSqlNull = factory.createIf();
        statements.push(iffSqlNull);
        iffSqlNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('sql'));
        iffSqlNull.then(p.createLeaveProc());
        if (trans === true) {
            statements.push(p.createTransaction());
        }
        let setI1 = factory.createSet();
        statements.push(setI1);
        setI1.equ('i', sql_1.ExpNum.num1);
        let setC1 = factory.createSet();
        statements.push(setC1);
        setC1.equ('c', sql_1.ExpNum.num1);
        let setLen = factory.createSet();
        statements.push(setLen);
        setLen.equ('len', new sql_1.ExpFunc(factory.func_length, new sql_1.ExpVar('sql')));
        let loop = factory.createWhile();
        loop.no = 100;
        statements.push(loop);
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
        let lstats = loop.statements;
        let setPIndex = factory.createSet();
        lstats.add(setPIndex);
        setPIndex.equ('p', new sql_1.ExpFunc(factory.func_charindex, new sql_1.ExpVar('sep'), new sql_1.ExpVar('sql'), new sql_1.ExpVar('c')));
        let ifP0 = factory.createIf();
        lstats.add(ifP0);
        ifP0.cmp = new sql_1.ExpLE(new sql_1.ExpVar('p'), sql_1.ExpNum.num0);
        let setPEnd = factory.createSet();
        ifP0.then(setPEnd);
        setPEnd.equ('p', new sql_1.ExpAdd(new sql_1.ExpVar('len'), sql_1.ExpNum.num1));
        let setStat = factory.createSet();
        lstats.add(setStat);
        setStat.equ('stat', new sql_1.ExpFunc(factory.func_substr, new sql_1.ExpVar('sql'), new sql_1.ExpVar('c'), new sql_1.ExpAdd(new sql_1.ExpVar('p'), sql_1.ExpNum.num1, new sql_1.ExpNeg(new sql_1.ExpVar('c')))));
        let execSql = factory.createExecSql();
        execSql.no = 1;
        execSql.sql = new sql_1.ExpVar('stat');
        lstats.add(execSql);
        let setCInc = factory.createSet();
        lstats.add(setCInc);
        setCInc.equ('c', new sql_1.ExpAdd(new sql_1.ExpVar('p'), sql_1.ExpNum.num1));
        let iffEnd = factory.createIf();
        lstats.add(iffEnd);
        iffEnd.cmp = new sql_1.ExpGT(new sql_1.ExpVar('c'), new sql_1.ExpSub(new sql_1.ExpVar('len'), new sql_1.ExpNum(4)));
        let leave = factory.createBreak();
        iffEnd.then(leave);
        leave.no = loop.no;
        let incI = factory.createSet();
        lstats.add(incI);
        incI.equ('i', new sql_1.ExpAdd(new sql_1.ExpVar('i'), sql_1.ExpNum.num1));
        let iffI = factory.createIf();
        lstats.add(iffI);
        iffI.cmp = new sql_1.ExpGT(new sql_1.ExpVar('i'), new sql_1.ExpNum(10000));
        iffI.then(leave);
        if (trans === true) {
            statements.push(p.createCommit());
        }
    }
    idFunc(p) {
        let func = new IDFunc(this.context);
        func.buildIdFunc(p);
    }
    idLocalFunc(p) {
        let { parameters, statements } = p;
        parameters.push(this.context.unitField, (0, il_1.intField)('entity'));
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)('ret'));
        let update = factory.createUpdate();
        statements.push(update);
        update.table = new statementWithFrom_1.EntityTable('$setting', hasUnit);
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(consts_1.settingIDLocalSeed));
        update.cols = [
            {
                col: 'big',
                val: new sql_1.ExpAtEQ('id', new sql_1.ExpAdd(new sql_1.ExpField('big'), sql_1.ExpNum.num1))
            }
        ];
        let set = factory.createSet();
        statements.push(set);
        set.equ('ret', new sql_1.ExpAtVar('id'));
        let insert = factory.createInsert();
        statements.push(insert);
        insert.table = new statementWithFrom_1.EntityTable('$id_local', false);
        insert.cols = [
            { col: 'id', val: new sql_1.ExpVar('ret') },
            { col: 'entity', val: new sql_1.ExpVar('entity') },
        ];
        if (hasUnit === true) {
            insert.cols.push({ col: 'unit', val: new sql_1.ExpVar(sqlBuilder_1.unitFieldName) });
        }
        let ret = factory.createReturn();
        ret.returnVar = 'ret';
        statements.push(ret);
    }
    idMinuteFunc(p) {
        let { parameters, statements } = p;
        parameters.push(this.context.unitField, (0, il_1.intField)('entity'), (0, il_1.intField)('stamp'));
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)('ret'));
        const idminute = '$idminute';
        const idminute0 = idminute + '0';
        declare.vars((0, il_1.bigIntField)(idminute), (0, il_1.bigIntField)(idminute0));
        let ifStampNull = factory.createIf();
        statements.push(ifStampNull);
        ifStampNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('stamp'));
        let setStampUnix = factory.createSet();
        ifStampNull.then(setStampUnix);
        setStampUnix.equ('stamp', new sql_1.ExpFuncCustom(factory.func_unix_timestamp));
        let setMinStamp = factory.createSet();
        statements.push(setMinStamp);
        setMinStamp.equ('stamp', new sql_1.ExpSub(new sql_1.ExpDiv(new sql_1.ExpVar('stamp'), new sql_1.ExpNum(60)), new sql_1.ExpNum(consts_1.minteIdOf2020_01_01) // 2020-1-1 0:0:0 utc的分钟数
        ));
        let setIdMinute0 = factory.createSet();
        statements.push(setIdMinute0);
        setIdMinute0.equ(idminute0, new sql_1.ExpFunc(factory.func_if, new sql_1.ExpLT(new sql_1.ExpVar('stamp'), sql_1.ExpNum.num0), new sql_1.ExpNeg(new sql_1.ExpBitLeft(new sql_1.ExpNeg(new sql_1.ExpVar('stamp')), new sql_1.ExpNum(20))), new sql_1.ExpBitLeft(new sql_1.ExpVar('stamp'), new sql_1.ExpNum(20))));
        const idName = 'id';
        const idField = new sql_1.ExpField(idName);
        //const idHasUnit = false; // this.context.hasUnit && !this.entity.global;
        let selectMaxId = factory.createSelect();
        statements.push(selectMaxId);
        selectMaxId.column(new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_max, idField), sql_1.ExpNum.num1), idminute);
        selectMaxId.toVar = true;
        selectMaxId.lock = select_1.LockType.update;
        selectMaxId.from(new statementWithFrom_1.EntityTable('$id_minute', false));
        let wheres = [
            new sql_1.ExpGE(idField, new sql_1.ExpVar(idminute0)),
            new sql_1.ExpLT(idField, new sql_1.ExpAdd(new sql_1.ExpVar(idminute0), new sql_1.ExpFuncCustom(factory.func_cast, new sql_1.ExpBitLeft(sql_1.ExpNum.num1, new sql_1.ExpNum(20)), new sql_1.ExpDatePart('signed')))),
        ];
        selectMaxId.where(new sql_1.ExpAnd(...wheres));
        let setRetMinute = factory.createSet();
        statements.push(setRetMinute);
        setRetMinute.equ('ret', new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpVar(idminute), new sql_1.ExpVar(idminute0)));
        let insert = factory.createInsert();
        statements.push(insert);
        insert.table = new statementWithFrom_1.EntityTable('$id_minute', false);
        insert.cols = [
            { col: 'id', val: new sql_1.ExpVar('ret') },
            { col: 'entity', val: new sql_1.ExpVar('entity') },
        ];
        if (hasUnit === true) {
            insert.cols.push({ col: 'unit', val: new sql_1.ExpVar(sqlBuilder_1.unitFieldName) });
        }
        let ret = factory.createReturn();
        ret.returnVar = 'ret';
        statements.push(ret);
    }
    idUUFunc(proc) {
        proc.parameters.push(
        // bigIntField('$user'),
        (0, il_1.intField)('entity'), (0, il_1.charField)('uuid', 100));
        this.idUStates(proc);
        this.idUUidInsert(proc);
        this.idUInsert(proc);
    }
    idUUMFunc(proc) {
        proc.parameters.push(
        // bigIntField('$user'),
        (0, il_1.intField)('entity'), (0, il_1.charField)('uuid', 100), (0, il_1.bigIntField)('stamp'));
        this.idMinStates(proc);
        this.idUUidInsert(proc);
        this.idUInsert(proc);
    }
    idNUFunc(proc) {
        proc.parameters.push(
        //bigIntField('$user'),
        (0, il_1.intField)('entity'));
        this.idUStates(proc);
        this.idUInsert(proc);
    }
    idMUFunc(proc) {
        proc.parameters.push((0, il_1.intField)('entity'), (0, il_1.bigIntField)('stamp'));
        this.idMinStates(proc);
        this.idUInsert(proc);
    }
    idUUidInsert(proc) {
        let { factory } = this.context;
        let iff = factory.createIf();
        proc.statements.push(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('uuid'));
        let setUUId = factory.createSet();
        iff.then(setUUId);
        setUUId.equ('uuid', new sql_1.ExpFunc('uuid'));
        let insert = factory.createInsert();
        proc.statements.push(insert);
        insert.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.id_uu);
        insert.cols = [
            { col: 'id', val: new sql_1.ExpVar('id') },
            { col: 'uuid', val: new sql_1.ExpFuncInUq('$uuid_to_bin', [new sql_1.ExpVar('uuid')], true) },
        ];
    }
    idMinStates(proc) {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        proc.statements.push(declare);
        declare.var('id', new il_1.BigInt());
        let iffStampNull = factory.createIf();
        proc.statements.push(iffStampNull);
        iffStampNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('stamp'));
        let setStamp = factory.createSet();
        iffStampNull.then(setStamp);
        setStamp.equ('stamp', new sql_1.ExpFuncCustom(factory.func_unix_timestamp));
        let setMinute = factory.createSet();
        proc.statements.push(setMinute);
        setMinute.equ('stamp', new sql_1.ExpDiv(new sql_1.ExpVar('stamp'), new sql_1.ExpNum(60)));
        let setId = factory.createSet();
        proc.statements.push(setId);
        setId.equ('id', new sql_1.ExpBitLeft(new sql_1.ExpVar('stamp'), new sql_1.ExpNum(20)));
        let selectMaxId = factory.createSelect();
        selectMaxId.column(new sql_1.ExpFunc(factory.func_max, new sql_1.ExpField('id'))),
            selectMaxId.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.id_u));
        selectMaxId.where(new sql_1.ExpAnd(new sql_1.ExpGE(new sql_1.ExpField('id'), new sql_1.ExpVar('id')), new sql_1.ExpLT(new sql_1.ExpField('id'), new sql_1.ExpAdd(new sql_1.ExpVar('id'), new sql_1.ExpNum(0x100000)))));
        selectMaxId.lock = select_1.LockType.update;
        let setIdGreatest = factory.createSet();
        proc.statements.push(setIdGreatest);
        // 550628229120 = (unix_timestamp('1971-1-1') / 60) << 20;
        setIdGreatest.equ('id', new sql_1.ExpFunc(factory.func_greatest, new sql_1.ExpNum(550628229120), new sql_1.ExpVar('id'), new sql_1.ExpAdd(new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpSelect(selectMaxId), sql_1.ExpNum.num0), sql_1.ExpNum.num1)));
    }
    idUStates(proc) {
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        proc.statements.push(declare);
        declare.var('id', new il_1.BigInt());
        let select = factory.createSelect();
        proc.statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpAdd(new sql_1.ExpField('big'), sql_1.ExpNum.num1), 'id');
        select.from(new statementWithFrom_1.EntityTable('$setting', false));
        let wheres = [new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('id-u'))];
        if (hasUnit === true) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField('$unit'), sql_1.ExpNum.num0));
        }
        select.where(new sql_1.ExpAnd(...wheres));
        select.lock = select_1.LockType.update;
        let iff = factory.createIf();
        proc.statements.push(iff);
        iff.cmp = new sql_1.ExpOr(new sql_1.ExpIsNull(new sql_1.ExpVar('id')), new sql_1.ExpLT(new sql_1.ExpVar('id'), new sql_1.ExpNum(idMin + 1)));
        let setId = factory.createSet();
        iff.then(setId);
        setId.equ('id', new sql_1.ExpNum(idMin + 1));
        let insert = factory.createInsertOnDuplicate();
        proc.statements.push(insert);
        insert.table = new statementWithFrom_1.EntityTable('$setting', false);
        insert.cols = [{ col: 'big', val: new sql_1.ExpVar('id') }];
        insert.keys = [{ col: 'name', val: new sql_1.ExpStr('id-u') }];
        if (hasUnit === true) {
            insert.keys.push({
                col: '$unit', val: sql_1.ExpNum.num0
            });
        }
    }
    idUInsert(proc) {
        let { factory } = this.context;
        let iff = factory.createIf();
        proc.statements.push(iff);
        iff.cmp = new sql_1.ExpGT(new sql_1.ExpVar('entity'), sql_1.ExpNum.num0);
        let insert = factory.createInsert();
        iff.then(insert);
        insert.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.id_u);
        insert.cols = [
            { col: 'id', val: new sql_1.ExpVar('id') },
            { col: 'entity', val: new sql_1.ExpVar('entity') }
        ];
        let ret = factory.createReturn();
        proc.statements.push(ret);
        ret.returnVar = 'id';
    }
    phraseId(proc) {
        let { parameters, statements } = proc;
        let { factory } = this.context;
        parameters.push((0, il_1.charField)('phrase', 200));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('id', new il_1.BigInt());
        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.col('id', 'id');
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.phrase));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('phrase')), new sql_1.ExpEQ(new sql_1.ExpField('valid'), sql_1.ExpNum.num1)));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'id';
    }
    phraseOfId(proc) {
        let { parameters, statements } = proc;
        let { factory } = this.context;
        parameters.push((0, il_1.bigIntField)('id'));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('phrase', new il_1.Char(200));
        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.col('name', 'phrase');
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.phrase));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('id')));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'phrase';
    }
    me(proc) {
        let { parameters, statements } = proc;
        let { factory, unitField, userParam } = this.context;
        parameters.push(unitField, userParam);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('id', new il_1.BigInt());
        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.col('id', 'id');
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.userSite));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('site'), new sql_1.ExpVar(unitField.name)), new sql_1.ExpEQ(new sql_1.ExpField('user'), new sql_1.ExpVar(userParam.name))));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'id';
    }
    ixValues(proc) {
        let { factory } = this.context;
        let { parameters, statements } = proc;
        let declare = factory.createDeclare();
        statements.push(declare);
        parameters.push(this.context.unitField, this.context.userParam, (0, il_1.charField)('IXEntity', 100), (0, il_1.tinyIntField)('xiType'), // 1: global, 2: local, 3: minute
        (0, il_1.idField)('ix', 'big'), (0, il_1.idField)('start', 'big'), (0, il_1.intField)('size'), (0, il_1.charField)('order', 20));
        let varTable = factory.createVarTable();
        statements.push(varTable);
        varTable.name = 'xis';
        let $idField = (0, il_1.intField)('$id');
        $idField.autoInc = true;
        let xiField = (0, il_1.idField)('xi', 'big');
        let typeField = (0, il_1.charField)('type', 50);
        typeField.nullable = true;
        let valueField = (0, il_1.textField)('value');
        valueField.nullable = true;
        varTable.fields = [$idField, xiField, typeField, valueField];
        varTable.keys = [$idField];
        declare.vars((0, il_1.textField)('sql'));
        let setSql = factory.createSet();
        statements.push(setSql);
        let parts = [
            new sql_1.ExpStr('insert into _xis (xi) select xi from ' + this.context.twProfix),
            new sql_1.ExpFunc('LOWER', new sql_1.ExpVar('IXEntity')),
            new sql_1.ExpStr(' where ix=IFNULL(@ix, @user) and xi'),
        ];
        setSql.equ('sql', new sql_1.ExpFunc(factory.func_concat, ...parts));
        let ifOrder = factory.createIf();
        statements.push(ifOrder);
        let vOrder = new sql_1.ExpVar('order');
        ifOrder.cmp = new sql_1.ExpOr(new sql_1.ExpIsNull(vOrder), new sql_1.ExpAnd(new sql_1.ExpNot(new sql_1.ExpEQ(vOrder, new sql_1.ExpStr('asc'))), new sql_1.ExpNot(new sql_1.ExpEQ(vOrder, new sql_1.ExpStr('desc')))));
        let setOrderAsc = factory.createSet();
        ifOrder.then(setOrderAsc);
        setOrderAsc.equ('order', new sql_1.ExpStr('asc'));
        let ifOrderWhere = factory.createIf();
        statements.push(ifOrderWhere);
        ifOrderWhere.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('order'), new sql_1.ExpStr('asc'));
        let setWhenAsc = factory.createSet();
        ifOrderWhere.then(setWhenAsc);
        setWhenAsc.equ('sql', new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar('sql'), new sql_1.ExpStr('>ifnull(@start, -9223372036854775808) ')));
        let setWhenDesc = factory.createSet();
        ifOrderWhere.else(setWhenDesc);
        setWhenDesc.equ('sql', new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar('sql'), new sql_1.ExpStr('<ifnull(@start, 9223372036854775808) ')));
        let setStartValue = factory.createSet();
        setStartValue.equ('sql', new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar('sql'), new sql_1.ExpStr(' _start ')));
        let setAddOrder = factory.createSet();
        statements.push(setAddOrder);
        setAddOrder.equ('sql', new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar('sql'), new sql_1.ExpStr(' order by xi '), new sql_1.ExpVar('order')));
        let ifLimit = factory.createIf();
        statements.push(ifLimit);
        ifLimit.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('size'));
        let setLimit1000 = factory.createSet();
        ifLimit.then(setLimit1000);
        setLimit1000.equ('size', new sql_1.ExpNum(1000));
        let setLimitSize = factory.createSet();
        statements.push(setLimitSize);
        setLimitSize.equ('sql', new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpVar('sql'), new sql_1.ExpStr(' limit '), new sql_1.ExpVar('size')));
        let setAtIx = factory.createSet();
        statements.push(setAtIx);
        setAtIx.equ('ix', new sql_1.ExpVar('ix'));
        setAtIx.isAtVar = true;
        let setAtStart = factory.createSet();
        statements.push(setAtStart);
        setAtStart.equ('start', new sql_1.ExpVar('start'));
        setAtStart.isAtVar = true;
        let setAtUser = factory.createSet();
        statements.push(setAtUser);
        setAtUser.equ('user', new sql_1.ExpVar('$user'));
        setAtUser.isAtVar = true;
        let execSql = factory.createExecSql();
        statements.push(execSql);
        execSql.no = 2;
        execSql.sql = new sql_1.ExpVar('sql');
        declare.var('$id', new il_1.Int());
        declare.var('p', new il_1.Int());
        declare.var('xi', new il_1.IdDataType());
        declare.var('entity', new il_1.Char(100));
        declare.var('sql_value', new il_1.Text());
        let set$Id0 = factory.createSet();
        statements.push(set$Id0);
        set$Id0.equ('$id', sql_1.ExpNum.num0);
        let loop = factory.createWhile();
        loop.no = 99;
        statements.push(loop);
        let loops = loop.statements;
        loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
        let setPNull = factory.createSet();
        loops.add(setPNull);
        setPNull.equ('p', sql_1.ExpVal.null);
        let selectP = factory.createSelect();
        loops.add(selectP);
        selectP.toVar = true;
        selectP.col('$id', 'p');
        selectP.col('xi', 'xi');
        selectP.from(new statementWithFrom_1.VarTable('xis'));
        selectP.where(new sql_1.ExpGT(new sql_1.ExpField('$id'), new sql_1.ExpVar('$id')));
        selectP.order(new sql_1.ExpField('$id'), 'asc');
        selectP.limit(sql_1.ExpNum.num1);
        let ifNull = factory.createIf();
        loops.add(ifNull);
        ifNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('p'));
        let leave = factory.createBreak();
        ifNull.then(leave);
        leave.no = loop.no;
        let set$IdP = factory.createSet();
        loops.add(set$IdP);
        set$IdP.equ('$id', new sql_1.ExpVar('p'));
        let ifXiType = factory.createIf();
        loops.add(ifXiType);
        let vXiType = new sql_1.ExpVar('xiType');
        ifXiType.cmp = new sql_1.ExpOr(new sql_1.ExpEQ(vXiType, new sql_1.ExpNum(il_2.EnumIdType.None)), new sql_1.ExpEQ(vXiType, new sql_1.ExpNum(il_2.EnumIdType.UID)), new sql_1.ExpEQ(vXiType, new sql_1.ExpNum(il_2.EnumIdType.UUID)), new sql_1.ExpEQ(vXiType, new sql_1.ExpNum(il_2.EnumIdType.ULocal)));
        ifXiType.then(this.selectTypeFromId('_u'));
        let xiType1 = new sql_2.Statements();
        xiType1.add(this.selectTypeFromId(''));
        ifXiType.elseIf(new sql_1.ExpEQ(new sql_1.ExpVar('xiType'), new sql_1.ExpNum(il_2.EnumIdType.Global)), xiType1);
        let xiType2 = new sql_2.Statements();
        xiType2.add(this.selectTypeFromId('_local'));
        ifXiType.elseIf(new sql_1.ExpEQ(new sql_1.ExpVar('xiType'), new sql_1.ExpNum(il_2.EnumIdType.Local)), xiType2);
        let xiType3 = new sql_2.Statements();
        xiType3.add(this.selectTypeFromId('_minute'));
        ifXiType.elseIf(new sql_1.ExpEQ(new sql_1.ExpVar('xiType'), new sql_1.ExpNum(il_2.EnumIdType.Minute)), xiType3);
        let cont = factory.createContinue();
        ifXiType.else(cont);
        cont.no = loop.no;
        let ifEntity = factory.createIf();
        loops.add(ifEntity);
        ifEntity.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('entity'));
        ifEntity.then(cont);
        let setAtXi = factory.createSet();
        loops.add(setAtXi);
        setAtXi.equ('xi', new sql_1.ExpVar('xi'));
        setAtXi.isAtVar = true;
        let setSqlValue = factory.createSet();
        loops.add(setSqlValue);
        setSqlValue.equ(`sql_value`, new sql_1.ExpFunc(factory.func_concat, new sql_1.ExpStr('select ' + this.context.twProfix), new sql_1.ExpVar(`entity`), new sql_1.ExpStr(`$value(@xi) into @value`)));
        let execSqlValue = factory.createExecSql();
        loops.add(execSqlValue);
        execSql.no = 3;
        execSqlValue.sql = new sql_1.ExpVar(`sql_value`);
        let update = factory.createUpdate();
        loops.add(update);
        update.cols = [
            { col: 'type', val: new sql_1.ExpVar('entity') },
            { col: 'value', val: new sql_1.ExpAtVar('value') }
        ];
        update.table = new statementWithFrom_1.VarTable('xis');
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('xi'), new sql_1.ExpVar('xi'));
        let retSelect = factory.createSelect();
        statements.push(retSelect);
        retSelect.col('xi');
        retSelect.col('type');
        retSelect.col('value');
        retSelect.from(new statementWithFrom_1.VarTable('xis'));
        retSelect.order(new sql_1.ExpField('$id'), 'asc');
    }
    selectTypeFromId(idType) {
        let { factory } = this.context;
        let select = factory.createSelect();
        select.toVar = true;
        select.column(new sql_1.ExpField('name', 'b'), 'entity');
        select.from(new statementWithFrom_1.EntityTable('$id' + idType, false, 'a'));
        select.join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.entity, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('entity', 'a'), new sql_1.ExpField('id', 'b')));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id', 'a'), new sql_1.ExpVar('xi')));
        return select;
    }
}
exports.IDProcedures = IDProcedures;
class IDFunc {
    constructor(context) {
        this.context = context;
    }
    initId() {
        let { factory } = this.context;
        let select = factory.createSelect();
        select.toVar = true;
        select.column(new sql_1.ExpBitLeft(new sql_1.ExpFunc(factory.func_min, new sql_1.ExpField('section')), new sql_1.ExpNum(16)), '$id');
        select.from(new statementWithFrom_1.EntityTable('$id_section', false));
        select.lock = select_1.LockType.update;
        return [select];
    }
    adjustId() {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        declare.vars((0, il_1.intField)('$section'), (0, il_1.intField)('$next'));
        let setSection = factory.createSet();
        setSection.equ('$section', new sql_1.ExpBitRight(new sql_1.ExpVar('$id'), new sql_1.ExpNum(16)));
        let selectNext = factory.createSelect();
        selectNext.toVar = true;
        selectNext.column(new sql_1.ExpFunc(factory.func_min, new sql_1.ExpField('section')), '$next');
        selectNext.from(new statementWithFrom_1.EntityTable('$id_section', false));
        selectNext.where(new sql_1.ExpGE(new sql_1.ExpField('section'), new sql_1.ExpVar('$section')));
        selectNext.lock = select_1.LockType.update;
        let iff = factory.createIf();
        iff.cmp = new sql_1.ExpLT(new sql_1.ExpVar('$section'), new sql_1.ExpVar('$next'));
        let setNext = factory.createSet();
        iff.then(setNext);
        setNext.equ('$id', new sql_1.ExpBitLeft(new sql_1.ExpVar('$next'), new sql_1.ExpNum(16)));
        return [declare, setSection, selectNext, iff];
    }
    buildIdFunc(p) {
        let idMax = 'id-max';
        let { parameters, statements } = p;
        parameters.push(this.context.unitField, (0, il_1.intField)('entity'));
        let { factory, hasUnit, unitFieldName } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.bigIntField)('$id'));
        const settingTable = new statementWithFrom_1.EntityTable('$setting', false);
        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new sql_1.ExpAdd(new sql_1.ExpField('big'), sql_1.ExpNum.num1), '$id');
        select.from(settingTable);
        let wheres = [new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr(idMax))];
        if (hasUnit === true) {
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpField(unitFieldName), sql_1.ExpNum.num0));
        }
        select.where(new sql_1.ExpAnd(...wheres));
        select.lock = select_1.LockType.update;
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar('$id'));
        this.initId().forEach(v => iff.then(v));
        let insert = factory.createInsert();
        iff.then(insert);
        insert.table = settingTable;
        insert.cols = [
            { col: 'name', val: new sql_1.ExpStr(idMax) },
            { col: 'big', val: new sql_1.ExpVar('$id') }
        ];
        if (hasUnit === true) {
            insert.cols.push({ col: unitFieldName, val: sql_1.ExpNum.num0 });
        }
        this.adjustId().forEach(v => iff.else(v));
        let update = factory.createUpdate();
        update.cols = [{ col: 'big', val: new sql_1.ExpVar('$id') }];
        update.table = settingTable;
        update.where = new sql_1.ExpAnd(...wheres);
        iff.else(update);
        let insertId = factory.createInsert();
        statements.push(insertId);
        insertId.cols = [
            { col: 'id', val: new sql_1.ExpVar('$id') },
            { col: 'entity', val: new sql_1.ExpVar('entity') },
        ];
        if (hasUnit === true) {
            insertId.cols.push({ col: 'unit', val: new sql_1.ExpVar(unitFieldName) });
        }
        insertId.ignore = true;
        insertId.table = new statementWithFrom_1.EntityTable('$id', hasUnit);
        let ret = factory.createReturn();
        ret.returnVar = '$id';
        statements.push(ret);
    }
}
//# sourceMappingURL=IDProcedures.js.map