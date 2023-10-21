import * as sql from '../sql';
import { EntityTable, VarTable } from '../sql/statementWithFrom';
import {
    ExpEQ, ExpField, ExpVar, ExpNum, ExpStr, ExpFunc, ExpIsNull,
    ExpBitRight, ExpLT, ExpAdd, ExpGT, ExpAnd, ExpCmp, ExpSub,
    ExpLE, ExpGE, ExpNeg, ExpOr, ExpBitLeft, ExpAtEQ, ExpAtVar,
    ExpFuncCustom, ExpDiv, ExpDatePart, ExpVal, ExpNot, ExpNull,
    ExpSelect,
    ExpFuncInUq,
    ExpEQBinary
} from '../sql';
import { SysProcedures } from './sysProcedures';
import {
    bigIntField, EnumSysTable, charField, BigInt, Int, intField, textField
    , Char, DDate, SmallInt, idField, Text, IdDataType, tinyIntField
    , Bin, JoinType
} from '../../il';
import { LockType } from '../sql/select';
import { DbContext, sysTable } from '../dbContext';
import { Statements, Statement } from '../sql';
import { minteIdOf2020_01_01, settingIDLocalSeed } from '../consts';
import { unitFieldName } from '../sql/sqlBuilder';
import { EnumIdType } from '../../il';

// const idMin = 1<<20;
const idMin = 4294967296;

export class IDProcedures extends SysProcedures {
    build() {
        this.getIDSectionProc(this.sysProc('$id_section_get'));
        this.setIDSectionProc(this.sysProc('$id_section_set'));

        this.buildExecSqlProc(this.coreProc('$exec_sql_trans'), true);
        this.buildExecSqlProc(this.coreProc('$exec_sql'), false);

        this.idSetEntity(this.coreFunc('$id_set_entity', new BigInt()));
        this.noFunc(this.coreFunc('$no', new Char()));
        this.idFunc(this.coreFunc('$id', new BigInt()));
        this.idLocalFunc(this.coreFunc('$id_local', new BigInt()));
        this.idMinuteFunc(this.coreFunc('$id_minute', new BigInt()));
        this.idUUFunc(this.coreFunc('$iduu', new BigInt()));
        this.idUUMFunc(this.coreFunc('$iduum', new BigInt()));
        this.idNUFunc(this.coreFunc('$idnu', new BigInt()));
        this.idMUFunc(this.coreFunc('$idmu', new BigInt()));
        this.textIdFunc(this.coreFunc('$textid', new Int()));
        this.idTextFunc(this.coreFunc('$idtext', new Char()));
        this.uuid_to_bin(this.coreFunc('$uuid_to_bin', new Bin(50)));
        this.phraseId(this.coreFunc('phraseid', new BigInt));
        this.phraseOfId(this.coreFunc('phraseofid', new Char(200)));
        // this.me(this.coreFunc('me', new BigInt()));

        this.ixValues(this.coreProc('$ix_values'));
    }

    private getIDSectionProc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('p', new BigInt());

        let selectID = factory.createSelect();
        p.statements.push(selectID);
        selectID.toVar = true;
        selectID.column(new ExpField('big'), 'p');
        selectID.from(new EntityTable('$setting', false));
        let wheres: ExpCmp[] = [new ExpEQ(new ExpField('name'), new ExpStr('ID'))];
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField('$unit'), ExpNum.num0));
        }
        selectID.where(new ExpAnd(...wheres));

        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new ExpIsNull(new ExpVar('p'))
        let setP0 = factory.createSet();
        iff.then(setP0);
        setP0.equ('p', ExpNum.num0);

        let select = factory.createSelect();
        p.statements.push(select);
        select.column(
            new ExpFunc(factory.func_max, new ExpField('section', 'a')),
            'section',
        );
        select.column(
            new ExpSub(
                new ExpNum(8),
                new ExpFunc(factory.func_count, ExpNum.num1)
            ),
            'sectionCount'
        );
        select.from(new EntityTable('$id_section', false, 'a'));
        select.where(new ExpGT(new ExpField('section', 'a'), new ExpBitRight(new ExpVar('p'), new ExpNum(16))));
    }

    private setIDSectionProc(p: sql.Procedure) {
        let { factory, hasUnit, unitField } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            bigIntField('section'),
            intField('count'),
        );

        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('i', new BigInt());
        declare.var('end', new BigInt());
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpGT(new ExpVar('count'), new ExpNum(8));
        let setCount8 = factory.createSet();
        iff.then(setCount8);
        setCount8.equ('count', new ExpNum(8));
        let trans = factory.createTransaction();
        statements.push(trans);
        let selectMax = factory.createSelect();
        selectMax.toVar = true;
        statements.push(selectMax);
        selectMax.column(
            new ExpFunc(factory.func_ifnull,
                new ExpFunc(factory.func_max, new sql.ExpField('section', 'a')),
                ExpNum.num0
            ),
            'i');
        selectMax.from(new EntityTable('$id_section', false, 'a'));
        selectMax.lock = LockType.update;

        let iffMax = factory.createIf();
        statements.push(iffMax);
        iffMax.cmp = new ExpLT(new ExpVar('i'), new ExpVar('section'));
        let setISection = factory.createSet();
        iffMax.then(setISection);
        setISection.equ('i', new ExpVar('section'));
        let setEnd = factory.createSet();
        iffMax.then(setEnd);
        setEnd.equ('end', new ExpAdd(new ExpVar('section'), new ExpVar('count')));
        iffMax.else(factory.createCommit());
        iffMax.else(factory.createLeaveProc());

        let loop = factory.createWhile();
        loop.no = 100;
        statements.push(loop);
        loop.cmp = new ExpLT(new ExpVar('i'), new ExpVar('end'));
        let insert = factory.createInsert();
        loop.statements.add(insert);
        insert.table = new EntityTable('$id_section', false);
        insert.cols = [
            { col: 'section', val: new ExpVar('i') }
        ];
        let setIInc = factory.createSet();
        loop.statements.add(setIInc);
        setIInc.equ('i', new ExpAdd(new ExpVar('i'), ExpNum.num1));
        statements.push(factory.createCommit());
    }

    private idSetEntity(p: sql.Procedure) {
        let { factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(bigIntField('id'));
        parameters.push(charField('entity', 100));
        let selectEntity = factory.createSelect();
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.col('id');
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpVar('entity')));
        selectEntity.lock = LockType.update;
        let update = factory.createUpdate();
        statements.push(update);
        update.table = sysTable(EnumSysTable.id_u);
        update.cols = [{
            col: 'entity', val: new ExpSelect(selectEntity)
        }];
        update.where = new ExpEQ(new ExpField('id'), new ExpVar('id'));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.expVal = new ExpVar('id');
    }

    private noFunc(p: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        p.addUnitParameter();
        parameters.push(charField('entity', 100));
        parameters.push(intField('stamp'));

        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('entityId', new Int());
        declare.var('docDate', new DDate());
        declare.var('no', new Int());
        declare.var('date', new DDate());
        declare.var('ret', new Char());
        declare.var('len', new SmallInt());
        let vLen = new ExpVar('len');
        let vNo = new ExpVar('no');

        let setToday = factory.createSet();
        statements.push(setToday);
        setToday.equ('date', new ExpFunc(
            factory.func_if,
            new ExpIsNull(new ExpVar('stamp')),
            new ExpFunc('curdate'),
            new ExpFunc(factory.func_from_unixtime, new ExpVar('stamp'))
        ));
        let selectEntity = factory.createSelect();
        statements.push(selectEntity);
        selectEntity.toVar = true;
        selectEntity.from(sysTable(EnumSysTable.entity));
        selectEntity.col('id', 'entityId');
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpVar('entity')));
        selectEntity.lock = LockType.update;

        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new ExpField('date', 'a'), 'docDate');
        select.column(new ExpField('no', 'a'), 'no');
        select.from(new EntityTable('$no', hasUnit, 'a'));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('sheet', 'a'), new ExpVar('entityId')),
            new ExpGE(new ExpField('date', 'a'), new ExpVar('date'))
        ));
        select.lock = LockType.update;

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpOr(
            new ExpIsNull(new ExpVar('docDate')),
            new ExpIsNull(vNo)
        );
        let setDate = factory.createSet();
        iff.then(setDate);
        setDate.equ('docDate', new ExpVar('date'));
        let setNo = factory.createSet();
        iff.then(setNo);
        setNo.equ('no', ExpNum.num1);

        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.table = new EntityTable('$no', hasUnit);
        upsert.keys.push({ col: 'sheet', val: new ExpVar('entityId') });
        if (hasUnit === true) {
            upsert.keys.push({ col: '$unit', val: new ExpVar('$unit') });
        }
        upsert.cols.push(
            { col: 'date', val: new ExpVar('docDate') },
            { col: 'no', val: new ExpAdd(vNo, ExpNum.num1) },
        );

        let ifLen = factory.createIf();
        statements.push(ifLen);
        ifLen.cmp = new ExpLT(vNo, new ExpNum(10000));
        let setLen4 = factory.createSet();
        setLen4.equ('len', new ExpNum(4));
        ifLen.then(setLen4);
        let setLen6 = factory.createSet();
        setLen6.equ('len', new ExpNum(6));
        let elseStats6 = new Statements();
        elseStats6.add(setLen6);
        ifLen.elseIf(new ExpLT(vNo, new ExpNum(1000000)), elseStats6);
        let setLen8 = factory.createSet();
        setLen8.equ('len', new ExpNum(8));
        ifLen.else(setLen8);

        let setRet = factory.createSet();
        statements.push(setRet);
        setRet.equ('ret', new ExpFunc(
            factory.func_concat,
            new ExpFunc('DATE_FORMAT', new ExpVar('date'), new ExpStr('%y%m%d')),
            new ExpFunc('LPAD', vNo, vLen, new ExpStr('0'))
        ));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'ret';
    }

    private textIdFunc(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(charField('text', 100));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('$id', new Int());
        let select = factory.createSelect();
        p.statements.push(select);
        select.toVar = true;
        select.col('id', '$id');
        select.from(new EntityTable('$text_id', false));
        select.where(new ExpEQBinary(new ExpField('text'), new ExpVar('text')));
        select.lock = LockType.update;

        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new ExpIsNull(new ExpVar('$id'));
        let insert = factory.createInsert();
        iff.then(insert);
        insert.table = new EntityTable('$text_id', false);
        insert.cols = [
            { col: 'id', val: ExpVal.null },
            { col: 'text', val: new ExpVar('text') }
        ];

        let setLastinsertid = factory.createSet();
        iff.then(setLastinsertid);
        setLastinsertid.equ('$id', new ExpFunc(factory.func_lastinsertid));

        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = '$id';
    }

    private idTextFunc(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(intField('id'));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('$text', new Char(100));
        let select = factory.createSelect();
        p.statements.push(select);
        select.toVar = true;
        select.col('text', '$text');
        select.from(new EntityTable('$text_id', false));
        select.where(new ExpEQ(new ExpField('id'), new ExpVar('id')));
        select.lock = LockType.update;
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = '$text';
    }

    private uuid_to_bin(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(charField('uuid', 50));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = new ExpFunc('UNHEX', new ExpFunc(
            'REPLACE',
            new ExpVar('uuid'),
            new ExpStr('-'),
            new ExpStr('')
        ));
    }

    private buildExecSqlProc(p: sql.Procedure, trans: boolean) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
            textField('sql'),
        );
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(
            intField('c'),
            intField('p'),
            intField('len'),
            intField('i'),
            textField('stat'),
            charField('sep', 6),
        );

        let setUnit = factory.createSet();
        statements.push(setUnit);
        setUnit.isAtVar = true;
        setUnit.equ('unit', new ExpVar('$unit'));

        let setUser = factory.createSet();
        statements.push(setUser);
        setUser.isAtVar = true;
        setUser.equ('user', new ExpVar('$user'));

        let setSep = factory.createSet();
        statements.push(setSep);
        setSep.equ('sep', new ExpFunc('CHAR', new ExpNum(12)));

        let iffSqlNull = factory.createIf();
        statements.push(iffSqlNull);
        iffSqlNull.cmp = new ExpIsNull(new ExpVar('sql'));
        iffSqlNull.then(p.createLeaveProc());

        if (trans === true) {
            statements.push(p.createTransaction());
        }
        let setI1 = factory.createSet();
        statements.push(setI1);
        setI1.equ('i', ExpNum.num1);
        let setC1 = factory.createSet();
        statements.push(setC1);
        setC1.equ('c', ExpNum.num1);
        let setLen = factory.createSet();
        statements.push(setLen);
        setLen.equ('len', new ExpFunc(factory.func_length, new ExpVar('sql')));

        let loop = factory.createWhile();
        loop.no = 100;
        statements.push(loop);
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
        let lstats = loop.statements;

        let setPIndex = factory.createSet();
        lstats.add(setPIndex);
        setPIndex.equ('p', new ExpFunc(factory.func_charindex, new ExpVar('sep'), new ExpVar('sql'), new ExpVar('c')));

        let ifP0 = factory.createIf();
        lstats.add(ifP0);
        ifP0.cmp = new ExpLE(new ExpVar('p'), ExpNum.num0);
        let setPEnd = factory.createSet();
        ifP0.then(setPEnd);
        setPEnd.equ('p', new ExpAdd(new ExpVar('len'), ExpNum.num1));

        let setStat = factory.createSet();
        lstats.add(setStat);
        setStat.equ('stat', new ExpFunc(factory.func_substr, new ExpVar('sql'), new ExpVar('c'),
            new ExpAdd(new ExpVar('p'), ExpNum.num1, new ExpNeg(new ExpVar('c')))));

        let execSql = factory.createExecSql();
        execSql.sql = new ExpVar('stat');
        lstats.add(execSql);

        let setCInc = factory.createSet();
        lstats.add(setCInc);
        setCInc.equ('c', new ExpAdd(new ExpVar('p'), ExpNum.num1));

        let iffEnd = factory.createIf();
        lstats.add(iffEnd);
        iffEnd.cmp = new ExpGT(new ExpVar('c'), new ExpSub(new ExpVar('len'), new ExpNum(4)));
        let leave = factory.createBreak();
        iffEnd.then(leave);
        leave.no = loop.no;

        let incI = factory.createSet();
        lstats.add(incI);
        incI.equ('i', new ExpAdd(new ExpVar('i'), ExpNum.num1));

        let iffI = factory.createIf();
        lstats.add(iffI);
        iffI.cmp = new ExpGT(new ExpVar('i'), new ExpNum(10000));
        iffI.then(leave);

        if (trans === true) {
            statements.push(p.createCommit());
        }
    }

    private idFunc(p: sql.Procedure) {
        let func = new IDFunc(this.context);
        func.buildIdFunc(p);
    }

    private idLocalFunc(p: sql.Procedure) {
        let { parameters, statements } = p;
        parameters.push(
            this.context.unitField,
            intField('entity')
        )
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(bigIntField('ret'));
        let update = factory.createUpdate();
        statements.push(update);
        update.table = new EntityTable('$setting', hasUnit);
        update.where = new ExpEQ(new ExpField('name'), new ExpStr(settingIDLocalSeed));
        update.cols = [
            {
                col: 'big',
                val: new ExpAtEQ(
                    'id',
                    new ExpAdd(new ExpField('big'), ExpNum.num1)
                )
            }
        ];
        let set = factory.createSet();
        statements.push(set);
        set.equ('ret', new ExpAtVar('id'));
        let insert = factory.createInsert();
        statements.push(insert);
        insert.table = new EntityTable('$id_local', false);
        insert.cols = [
            { col: 'id', val: new ExpVar('ret') },
            { col: 'entity', val: new ExpVar('entity') },
        ]
        if (hasUnit === true) {
            insert.cols.push({ col: 'unit', val: new ExpVar(unitFieldName) });
        }
        let ret = factory.createReturn();
        ret.returnVar = 'ret';
        statements.push(ret);
    }

    private idMinuteFunc(p: sql.Procedure) {
        let { parameters, statements } = p;
        parameters.push(
            this.context.unitField,
            intField('entity'),
            intField('stamp'),
        )
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(bigIntField('ret'));
        const idminute = '$idminute';
        const idminute0 = idminute + '0';
        declare.vars(bigIntField(idminute), bigIntField(idminute0));

        let ifStampNull = factory.createIf();
        statements.push(ifStampNull);
        ifStampNull.cmp = new ExpIsNull(new ExpVar('stamp'));
        let setStampUnix = factory.createSet();
        ifStampNull.then(setStampUnix);
        setStampUnix.equ('stamp', new ExpFuncCustom(factory.func_unix_timestamp));

        let setMinStamp = factory.createSet();
        statements.push(setMinStamp);
        setMinStamp.equ('stamp', new ExpSub(
            new ExpDiv(new ExpVar('stamp'), new ExpNum(60)),
            new ExpNum(minteIdOf2020_01_01)	// 2020-1-1 0:0:0 utc的分钟数
        ));

        let setIdMinute0 = factory.createSet();
        statements.push(setIdMinute0);
        setIdMinute0.equ(idminute0, new ExpFunc(factory.func_if,
            new ExpLT(new ExpVar('stamp'), ExpNum.num0),
            new ExpNeg(new ExpBitLeft(new ExpNeg(new ExpVar('stamp')), new ExpNum(20))),
            new ExpBitLeft(new ExpVar('stamp'), new ExpNum(20)),
        ));
        const idName = 'id';
        const idField = new ExpField(idName);
        //const idHasUnit = false; // this.context.hasUnit && !this.entity.global;
        let selectMaxId = factory.createSelect();
        statements.push(selectMaxId);
        selectMaxId.column(
            new ExpAdd(
                new ExpFunc(factory.func_max, idField),
                ExpNum.num1
            ),
            idminute
        );
        selectMaxId.toVar = true;
        selectMaxId.lock = LockType.update;
        selectMaxId.from(new EntityTable('$id_minute', false));
        let wheres = [
            new ExpGE(idField, new ExpVar(idminute0)),
            new ExpLT(idField,
                new ExpAdd(
                    new ExpVar(idminute0),
                    new ExpFuncCustom(factory.func_cast, new ExpBitLeft(ExpNum.num1, new ExpNum(20)), new ExpDatePart('signed'))
                )
            ),
        ];
        selectMaxId.where(new ExpAnd(...wheres));

        let setRetMinute = factory.createSet();
        statements.push(setRetMinute);
        setRetMinute.equ('ret', new ExpFunc(factory.func_ifnull, new ExpVar(idminute), new ExpVar(idminute0)));

        let insert = factory.createInsert();
        statements.push(insert);
        insert.table = new EntityTable('$id_minute', false);
        insert.cols = [
            { col: 'id', val: new ExpVar('ret') },
            { col: 'entity', val: new ExpVar('entity') },
        ]
        if (hasUnit === true) {
            insert.cols.push({ col: 'unit', val: new ExpVar(unitFieldName) });
        }
        let ret = factory.createReturn();
        ret.returnVar = 'ret';
        statements.push(ret);
    }

    private idUUFunc(proc: sql.Procedure) {
        proc.parameters.push(
            // bigIntField('$user'),
            intField('entity'),
            charField('uuid', 100)
        );
        this.idUStates(proc);
        this.idUUidInsert(proc);
        this.idUInsert(proc);
    }

    private idUUMFunc(proc: sql.Procedure) {
        proc.parameters.push(
            // bigIntField('$user'),
            intField('entity'),
            charField('uuid', 100),
            bigIntField('stamp')
        );
        this.idMinStates(proc);
        this.idUUidInsert(proc);
        this.idUInsert(proc);
    }

    private idNUFunc(proc: sql.Procedure) {
        proc.parameters.push(
            //bigIntField('$user'),
            intField('entity')
        );
        this.idUStates(proc);
        this.idUInsert(proc);
    }

    private idMUFunc(proc: sql.Procedure) {
        proc.parameters.push(
            intField('entity'),
            bigIntField('stamp')
        );
        this.idMinStates(proc);
        this.idUInsert(proc);
    }

    private idUUidInsert(proc: sql.Procedure) {
        let { factory } = this.context;
        let iff = factory.createIf();
        proc.statements.push(iff);
        iff.cmp = new ExpIsNull(new ExpVar('uuid'));
        let setUUId = factory.createSet();
        iff.then(setUUId);
        setUUId.equ('uuid', new ExpFunc('uuid'));
        let insert = factory.createInsert();
        proc.statements.push(insert);
        insert.table = sysTable(EnumSysTable.id_uu);
        insert.cols = [
            { col: 'id', val: new ExpVar('id') },
            { col: 'uuid', val: new ExpFuncInUq('$uuid_to_bin', [new ExpVar('uuid')], true) },
        ]
    }

    private idMinStates(proc: sql.Procedure) {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        proc.statements.push(declare);
        declare.var('id', new BigInt());
        let iffStampNull = factory.createIf();
        proc.statements.push(iffStampNull);
        iffStampNull.cmp = new ExpIsNull(new ExpVar('stamp'));
        let setStamp = factory.createSet();
        iffStampNull.then(setStamp);
        setStamp.equ('stamp', new ExpFuncCustom(factory.func_unix_timestamp));
        let setMinute = factory.createSet();
        proc.statements.push(setMinute);
        setMinute.equ('stamp', new ExpDiv(new ExpVar('stamp'), new ExpNum(60)));
        let setId = factory.createSet();
        proc.statements.push(setId);
        setId.equ('id', new ExpBitLeft(new ExpVar('stamp'), new ExpNum(20)));

        let selectMaxId = factory.createSelect();
        selectMaxId.column(new ExpFunc(factory.func_max, new ExpField('id'))),
            selectMaxId.from(sysTable(EnumSysTable.id_u));
        selectMaxId.where(new ExpAnd(
            new ExpGE(new ExpField('id'), new ExpVar('id')),
            new ExpLT(new ExpField('id'), new ExpAdd(new ExpVar('id'), new ExpNum(0x100000))),
        ));
        selectMaxId.lock = LockType.update;
        let setIdGreatest = factory.createSet();
        proc.statements.push(setIdGreatest);

        // 550628229120 = (unix_timestamp('1971-1-1') / 60) << 20;
        setIdGreatest.equ('id', new ExpFunc(
            factory.func_greatest,
            new ExpNum(550628229120),
            new ExpVar('id'),
            new ExpAdd(
                new ExpFunc(factory.func_ifnull, new ExpSelect(selectMaxId), ExpNum.num0)
                , ExpNum.num1),
        )
        );
    }

    private idUStates(proc: sql.Procedure) {
        let { factory, hasUnit } = this.context;
        let declare = factory.createDeclare();
        proc.statements.push(declare);
        declare.var('id', new BigInt());

        let select = factory.createSelect();
        proc.statements.push(select);
        select.toVar = true;
        select.column(new ExpAdd(new ExpField('big'), ExpNum.num1), 'id');
        select.from(new EntityTable('$setting', false));
        let wheres = [new ExpEQ(new ExpField('name'), new ExpStr('id-u'))];
        if (hasUnit === true) {
            wheres.push(new ExpEQ(
                new ExpField('$unit'), ExpNum.num0
            ));
        }
        select.where(new ExpAnd(...wheres));
        select.lock = LockType.update;
        let iff = factory.createIf();
        proc.statements.push(iff);
        iff.cmp = new ExpOr(new ExpIsNull(new ExpVar('id')), new ExpLT(new ExpVar('id'), new ExpNum(idMin + 1)));
        let setId = factory.createSet();
        iff.then(setId);
        setId.equ('id', new ExpNum(idMin + 1));
        let insert = factory.createInsertOnDuplicate();
        proc.statements.push(insert);
        insert.table = new EntityTable('$setting', false);
        insert.cols = [{ col: 'big', val: new ExpVar('id') }];
        insert.keys = [{ col: 'name', val: new ExpStr('id-u') }];
        if (hasUnit === true) {
            insert.keys.push({
                col: '$unit', val: ExpNum.num0
            });
        }
    }

    private idUInsert(proc: sql.Procedure) {
        let { factory } = this.context;
        let iff = factory.createIf();
        proc.statements.push(iff);
        iff.cmp = new ExpGT(new ExpVar('entity'), ExpNum.num0);
        let insert = factory.createInsert();
        iff.then(insert);
        insert.table = sysTable(EnumSysTable.id_u);
        insert.cols = [
            { col: 'id', val: new ExpVar('id') },
            { col: 'entity', val: new ExpVar('entity') }
        ];
        let ret = factory.createReturn();
        proc.statements.push(ret);
        ret.returnVar = 'id';
    }

    private phraseId(proc: sql.Procedure) {
        let { parameters, statements } = proc;
        let { factory } = this.context;
        parameters.push(charField('phrase', 200));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('id', new BigInt());

        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.col('id', 'id');
        select.from(sysTable(EnumSysTable.phrase));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('name'), new ExpVar('phrase')),
            new ExpEQ(new ExpField('valid'), ExpNum.num1),
        ));

        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'id';
    }

    private phraseOfId(proc: sql.Procedure) {
        let { parameters, statements } = proc;
        let { factory } = this.context;
        parameters.push(bigIntField('id'));
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('phrase', new Char(200));

        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.col('name', 'phrase');
        select.from(sysTable(EnumSysTable.phrase));
        select.where(new ExpEQ(new ExpField('id'), new ExpVar('id')));

        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'phrase';
    }

    private me(proc: sql.Procedure) {
        let { parameters, statements } = proc;
        let { factory, unitField, userParam } = this.context;
        parameters.push(
            unitField,
            userParam
        );
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('id', new BigInt());

        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.col('id', 'id');
        select.from(sysTable(EnumSysTable.userSite));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('site'), new ExpVar(unitField.name)),
            new ExpEQ(new ExpField('user'), new ExpVar(userParam.name)),
        ));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.returnVar = 'id';
    }

    private ixValues(proc: sql.Procedure) {
        let { factory } = this.context;
        let { parameters, statements } = proc;
        let declare = factory.createDeclare();
        statements.push(declare);
        parameters.push(
            this.context.unitField,
            this.context.userParam,
            charField('IXEntity', 100),
            tinyIntField('xiType'), 	// 1: global, 2: local, 3: minute
            idField('ix', 'big'),
            idField('start', 'big'),
            intField('size'),
            charField('order', 20),
        );
        let varTable = factory.createVarTable();
        statements.push(varTable);
        varTable.name = 'xis';
        let $idField = intField('$id');
        $idField.autoInc = true;
        let xiField = idField('xi', 'big');
        let typeField = charField('type', 50);
        typeField.nullable = true;
        let valueField = textField('value');
        valueField.nullable = true;
        varTable.fields = [$idField, xiField, typeField, valueField];
        varTable.keys = [$idField];

        declare.vars(textField('sql'));
        let setSql = factory.createSet();
        statements.push(setSql);
        let parts: ExpVal[] = [
            new ExpStr('insert into _xis (xi) select xi from ' + this.context.twProfix),
            new ExpFunc('LOWER', new ExpVar('IXEntity')),
            new ExpStr(' where ix=IFNULL(@ix, @user) and xi'),
        ];
        setSql.equ('sql', new ExpFunc(factory.func_concat, ...parts));

        let ifOrder = factory.createIf();
        statements.push(ifOrder);
        let vOrder = new ExpVar('order');
        ifOrder.cmp = new ExpOr(
            new ExpIsNull(vOrder),
            new ExpAnd(
                new ExpNot(new ExpEQ(vOrder, new ExpStr('asc'))),
                new ExpNot(new ExpEQ(vOrder, new ExpStr('desc'))),
            ),
        );
        let setOrderAsc = factory.createSet();
        ifOrder.then(setOrderAsc);
        setOrderAsc.equ('order', new ExpStr('asc'));

        let ifOrderWhere = factory.createIf();
        statements.push(ifOrderWhere);
        ifOrderWhere.cmp = new ExpEQ(new ExpVar('order'), new ExpStr('asc'));
        let setWhenAsc = factory.createSet();
        ifOrderWhere.then(setWhenAsc);
        setWhenAsc.equ('sql', new ExpFunc(
            factory.func_concat,
            new ExpVar('sql'),
            new ExpStr('>ifnull(@start, -9223372036854775808) '),
        ));

        let setWhenDesc = factory.createSet();
        ifOrderWhere.else(setWhenDesc);
        setWhenDesc.equ('sql', new ExpFunc(
            factory.func_concat,
            new ExpVar('sql'),
            new ExpStr('<ifnull(@start, 9223372036854775808) '),
        ));

        let setStartValue = factory.createSet();
        setStartValue.equ('sql', new ExpFunc(
            factory.func_concat,
            new ExpVar('sql'),
            new ExpStr(' _start '),
        ));

        let setAddOrder = factory.createSet();
        statements.push(setAddOrder);
        setAddOrder.equ('sql', new ExpFunc(
            factory.func_concat,
            new ExpVar('sql'),
            new ExpStr(' order by xi '),
            new ExpVar('order'),
        ));

        let ifLimit = factory.createIf();
        statements.push(ifLimit);
        ifLimit.cmp = new ExpIsNull(new ExpVar('size'));
        let setLimit1000 = factory.createSet();
        ifLimit.then(setLimit1000);
        setLimit1000.equ('size', new ExpNum(1000));
        let setLimitSize = factory.createSet();
        statements.push(setLimitSize);
        setLimitSize.equ('sql', new ExpFunc(
            factory.func_concat,
            new ExpVar('sql'),
            new ExpStr(' limit '),
            new ExpVar('size'),
        ));

        let setAtIx = factory.createSet();
        statements.push(setAtIx);
        setAtIx.equ('ix', new ExpVar('ix'));
        setAtIx.isAtVar = true;

        let setAtStart = factory.createSet();
        statements.push(setAtStart);
        setAtStart.equ('start', new ExpVar('start'));
        setAtStart.isAtVar = true;

        let setAtUser = factory.createSet();
        statements.push(setAtUser);
        setAtUser.equ('user', new ExpVar('$user'));
        setAtUser.isAtVar = true;

        let execSql = factory.createExecSql();
        statements.push(execSql);
        execSql.sql = new ExpVar('sql');

        declare.var('$id', new Int());
        declare.var('p', new Int());
        declare.var('xi', new IdDataType());
        declare.var('entity', new Char(100));
        declare.var('sql_value', new Text());
        let set$Id0 = factory.createSet();
        statements.push(set$Id0);
        set$Id0.equ('$id', ExpNum.num0);
        let loop = factory.createWhile();
        loop.no = 99;
        statements.push(loop);
        let loops = loop.statements;
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
        let setPNull = factory.createSet();
        loops.add(setPNull);
        setPNull.equ('p', ExpVal.null);
        let selectP = factory.createSelect();
        loops.add(selectP);
        selectP.toVar = true;
        selectP.col('$id', 'p');
        selectP.col('xi', 'xi');
        selectP.from(new VarTable('xis'));
        selectP.where(new ExpGT(new ExpField('$id'), new ExpVar('$id')));
        selectP.order(new ExpField('$id'), 'asc');
        selectP.limit(ExpNum.num1);
        let ifNull = factory.createIf();
        loops.add(ifNull);
        ifNull.cmp = new ExpIsNull(new ExpVar('p'));
        let leave = factory.createBreak();
        ifNull.then(leave);
        leave.no = loop.no;
        let set$IdP = factory.createSet();
        loops.add(set$IdP);
        set$IdP.equ('$id', new ExpVar('p'));

        let ifXiType = factory.createIf();
        loops.add(ifXiType);

        let vXiType = new ExpVar('xiType');

        ifXiType.cmp = new ExpOr(
            new ExpEQ(vXiType, new ExpNum(EnumIdType.None)),
            new ExpEQ(vXiType, new ExpNum(EnumIdType.UID)),
            new ExpEQ(vXiType, new ExpNum(EnumIdType.UUID)),
            new ExpEQ(vXiType, new ExpNum(EnumIdType.ULocal)),
            //new ExpEQ(vXiType, new ExpNum(EnumIdType.UMinute)),
        );
        ifXiType.then(this.selectTypeFromId('_u'));
        let xiType1 = new Statements();
        xiType1.add(this.selectTypeFromId(''));
        ifXiType.elseIf(new ExpEQ(new ExpVar('xiType'), new ExpNum(EnumIdType.Global)), xiType1);
        let xiType2 = new Statements();
        xiType2.add(this.selectTypeFromId('_local'));
        ifXiType.elseIf(new ExpEQ(new ExpVar('xiType'), new ExpNum(EnumIdType.Local)), xiType2);
        let xiType3 = new Statements();
        xiType3.add(this.selectTypeFromId('_minute'));
        ifXiType.elseIf(new ExpEQ(new ExpVar('xiType'), new ExpNum(EnumIdType.Minute)), xiType3);
        let cont = factory.createContinue();
        ifXiType.else(cont);
        cont.no = loop.no;

        let ifEntity = factory.createIf();
        loops.add(ifEntity);
        ifEntity.cmp = new ExpIsNull(new ExpVar('entity'));
        ifEntity.then(cont);

        let setAtXi = factory.createSet();
        loops.add(setAtXi);
        setAtXi.equ('xi', new ExpVar('xi'));
        setAtXi.isAtVar = true;

        let setSqlValue = factory.createSet();
        loops.add(setSqlValue);
        setSqlValue.equ(
            `sql_value`,
            new ExpFunc(
                factory.func_concat,
                new ExpStr('select ' + this.context.twProfix),
                new ExpVar(`entity`),
                new ExpStr(`$value(@xi) into @value`)
            )
        );
        let execSqlValue = factory.createExecSql();
        loops.add(execSqlValue);
        execSqlValue.sql = new ExpVar(`sql_value`);

        let update = factory.createUpdate();
        loops.add(update);
        update.cols = [
            { col: 'type', val: new ExpVar('entity') },
            { col: 'value', val: new ExpAtVar('value') }
        ];
        update.table = new VarTable('xis');
        update.where = new ExpEQ(new ExpField('xi'), new ExpVar('xi'));

        let retSelect = factory.createSelect();
        statements.push(retSelect);
        retSelect.col('xi');
        retSelect.col('type');
        retSelect.col('value');
        retSelect.from(new VarTable('xis'));
        retSelect.order(new ExpField('$id'), 'asc');
    }

    private selectTypeFromId(idType: '_u' | '' | '_local' | '_minute'): Statement {
        let { factory } = this.context;
        let select = factory.createSelect();
        select.toVar = true;
        select.column(new ExpField('name', 'b'), 'entity');
        select.from(new EntityTable('$id' + idType, false, 'a'));
        select.join(JoinType.join, sysTable(EnumSysTable.entity, 'b'))
            .on(new ExpEQ(new ExpField('entity', 'a'), new ExpField('id', 'b')));
        select.where(new ExpEQ(new ExpField('id', 'a'), new ExpVar('xi')));
        return select;
    }
}

class IDFunc {
    protected context: DbContext;
    constructor(context: DbContext) {
        this.context = context;
    }

    protected initId(): sql.Statement[] {
        let { factory } = this.context;
        let select = factory.createSelect();
        select.toVar = true;
        select.column(
            new ExpBitLeft(
                new ExpFunc(factory.func_min, new ExpField('section')),
                new ExpNum(16)
            ),
            '$id'
        );
        select.from(new EntityTable('$id_section', false));
        select.lock = LockType.update;
        return [select];
    }
    protected adjustId(): sql.Statement[] {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        declare.vars(intField('$section'), intField('$next'));
        let setSection = factory.createSet();
        setSection.equ('$section', new ExpBitRight(new ExpVar('$id'), new ExpNum(16)));
        let selectNext = factory.createSelect();
        selectNext.toVar = true;
        selectNext.column(new ExpFunc(factory.func_min, new ExpField('section')), '$next');
        selectNext.from(new EntityTable('$id_section', false));
        selectNext.where(new ExpGE(new ExpField('section'), new ExpVar('$section')));
        selectNext.lock = LockType.update;

        let iff = factory.createIf();
        iff.cmp = new ExpLT(new ExpVar('$section'), new ExpVar('$next'));
        let setNext = factory.createSet();
        iff.then(setNext);
        setNext.equ('$id', new ExpBitLeft(new ExpVar('$next'), new ExpNum(16)));

        return [declare, setSection, selectNext, iff];
    }

    buildIdFunc(p: sql.Procedure) {
        let idMax = 'id-max';
        let { parameters, statements } = p;
        parameters.push(
            this.context.unitField,
            intField('entity')
        )
        let { factory, hasUnit, unitFieldName } = this.context;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(bigIntField('$id'));
        const settingTable = new EntityTable('$setting', false);

        let select = factory.createSelect();
        statements.push(select);
        select.toVar = true;
        select.column(new ExpAdd(new ExpField('big'), ExpNum.num1), '$id');
        select.from(settingTable);
        let wheres: ExpCmp[] = [new ExpEQ(new ExpField('name'), new ExpStr(idMax))];
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField(unitFieldName), ExpNum.num0));
        }
        select.where(new ExpAnd(...wheres));
        select.lock = LockType.update;

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpIsNull(new ExpVar('$id'));
        this.initId().forEach(v => iff.then(v));
        let insert = factory.createInsert();
        iff.then(insert);
        insert.table = settingTable;
        insert.cols = [
            { col: 'name', val: new ExpStr(idMax) },
            { col: 'big', val: new ExpVar('$id') }
        ];
        if (hasUnit === true) {
            insert.cols.push({ col: unitFieldName, val: ExpNum.num0 });
        }

        this.adjustId().forEach(v => iff.else(v));
        let update = factory.createUpdate();
        update.cols = [{ col: 'big', val: new ExpVar('$id') }];
        update.table = settingTable;
        update.where = new ExpAnd(...wheres);
        iff.else(update);

        let insertId = factory.createInsert();
        statements.push(insertId);
        insertId.cols = [
            { col: 'id', val: new ExpVar('$id') },
            { col: 'entity', val: new ExpVar('entity') },
        ]
        if (hasUnit === true) {
            insertId.cols.push({ col: 'unit', val: new ExpVar(unitFieldName) });
        }
        insertId.ignore = true;
        insertId.table = new EntityTable('$id', hasUnit);

        let ret = factory.createReturn();
        ret.returnVar = '$id';
        statements.push(ret);
    }
}
