import * as sql from '../sql';
import { EntityTable, VarTable as FromVarTable } from '../sql/statementWithFrom';
import {
    ExpEQ, ExpField, ExpVar, ExpNum, ExpStr, ExpVal, ExpSelect, ExpFunc, ExpIsNull
    , ExpNeg, ExpMul, ExpLT, ExpAdd, ExpFuncCustom, ExpAnd, ExpCmp, ExpSub, ExpNot
    , ExpIsNotNull, ExpDatePart, ExpDiv, ExpBitRight, ExpBitLeft, ExpGT, ExpFuncInUq, VarTable, ExpNull, ExpSearchCase
} from '../sql';
import * as il from '../../il';
import { SysProcedures } from './sysProcedures';
import { bigIntField, charField, BigInt, Int, intField, Dec, decField, textField, TinyInt, dateField, DateTime, DDate, TimeStamp, tinyIntField, dateTimeField, Char, JoinType, Field } from '../../il';
import { Statement } from '../sql';
import {
    settingQueueSeed, settingQueueInSeed, settingSheetSeed, settingIDLocalSeed, settingTimezone
    , minteIdOf2020_01_01
} from '../consts';
import { LockType } from '../sql/select';
import { DbContext, sysTable } from '..';

export class SettingProcedures extends SysProcedures {
    build() {
        this.initSettingProc(this.coreProc('$init_setting'));
        this.setSettingProc(this.coreProc('$set_setting'));
        this.getSettingProc(this.coreProc('$get_setting'));
        this.constStrsProc(this.coreProc('$const_strs'));
        this.constStrProc(this.coreProc('$const_str'));
        this.savePhrasesProc(this.coreProc('$save_phrases'));
        // this.saveRoleIxPhraseProc(this.coreProc('$save_ixphrases_role'));
        this.finishBuildDb(this.coreProc('$finish_build_db'));
        this.setUser(this.coreProc('$set_user'));

        this.setBusQueueSeed(this.sysProc('$set_bus_queue_seed'));
        this.getTableSeed(this.sysProc('$get_table_seed'));

        this.timezoneFunc(this.func('$timezone', new TinyInt()));
        this.bizMonthFunc(this.func('$biz_month_offset', new TinyInt()));
        this.bizDateFunc(this.func('$biz_date_offset', new TinyInt()));
        this.bizMonthIdFunc(this.func('$biz_month_id', new DDate()));
        this.bizYearIdFunc(this.func('$biz_year_id', new DDate()));

        this.minuteIdFromDate(this.coreFunc('$minute_id_from_date', new BigInt()));
        this.minuteIdDate(this.coreFunc('$minute_id_date', new DDate()));
        this.minuteIdMonth(this.coreFunc('$minute_id_month', new DDate()));
        this.minuteIdPeriod(this.coreFunc('$minute_id_period', new DDate()));
        this.minuteIdTime(this.coreFunc('$minute_id_time', new DateTime()));

        this.uminuteFromTime(this.coreFunc('$uminute_from_time', new BigInt()));
        this.uminuteStamp(this.coreFunc('$uminute_stamp', new Int()));
        this.uminuteDate(this.coreFunc('$uminute_date', new DDate()));
        this.uminuteTime(this.coreFunc('$uminute_time', new DateTime()));
        this.me(this.coreFunc('$me', new BigInt()));
    }

    private setBusQueueSeed(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            charField('table', 100),
            bigIntField('seed'),
        );
        let setTableSeed = factory.createSetTableSeed();
        setTableSeed.table = new ExpVar('table');
        setTableSeed.seed = new ExpVar('seed');
        p.statements.push(setTableSeed);
    }

    private getTableSeed(p: sql.Procedure) {
        let factory = this.context.factory;
        p.parameters.push(
            charField('table', 100),
        );
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('seed', new BigInt());
        let getTableSeed = factory.createGetTableSeed();
        getTableSeed.table = new ExpVar('table');
        getTableSeed.seed = new ExpVar('seed');
        p.statements.push(getTableSeed);
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new ExpVar('seed'), 'seed');
    }

    private finishBuildDb(p: sql.Procedure) {
        let { factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(bigIntField('$user'));
        let declare = factory.createDeclare();
        statements.push(declare);
        const vUserSite = 'userunit';
        declare.var('$unit', new BigInt());
        declare.var(vUserSite, new BigInt());

        // build default site '$$$'
        statements.push(...this.buildDefaultSite());

        let setUnit0 = factory.createSet();
        statements.push(setUnit0);
        setUnit0.equ('$unit', ExpNum.num0);
        this.context.buildBiz$User(statements);

        let setUserSite = factory.createSet();
        statements.push(setUserSite);
        setUserSite.equ(vUserSite, new ExpFuncInUq('$UserSite$id', [
            ExpNum.num0, ExpNum.num0, ExpNum.num0, ExpNum.num0, new ExpVar('$user')
        ], true));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpIsNull(new ExpVar(vUserSite));
        let setNewUserUnit = factory.createSet();
        iff.then(setNewUserUnit);
        setNewUserUnit.equ(vUserSite, new ExpFuncInUq('$UserSite$id', [
            ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNum.num0, new ExpVar('$user')
        ], true));
        let updateAdmin = factory.createUpdate();
        iff.then(updateAdmin);
        updateAdmin.cols = [
            { col: 'admin', val: ExpNum.num3 }
        ];
        updateAdmin.table = sysTable(il.EnumSysTable.userSite);
        updateAdmin.where = new ExpEQ(new ExpField('id'), new ExpVar(vUserSite));
        let select = factory.createSelect();
        statements.push(select);
        select.col('id');
        select.from(sysTable(il.EnumSysTable.user));
        select.where(new ExpEQ(new ExpField('id'), new ExpVar('$user')));
    }

    // build default site '$$$'
    private buildDefaultSite(): sql.Statement[] {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        declare.var('$siteId', new BigInt());
        const uniqueUnit = '$uniqueUnit';
        declare.var(uniqueUnit, new BigInt());
        const selectUqDocType = factory.createSelect();
        selectUqDocType.col('name');
        selectUqDocType.from(sysTable(il.EnumSysTable.setting));
        selectUqDocType.where(new ExpAnd(
            new ExpEQ(new ExpField('name'), new ExpStr('uq-doc-type')),
            new sql.ExpGE(new ExpField('value'), ExpNum.num2),
        ));
        let iff = factory.createIf();
        iff.cmp = new sql.ExpExists(selectUqDocType);
        let setDoc2DefaultSite = factory.createSet();
        iff.then(setDoc2DefaultSite);
        setDoc2DefaultSite.equ('$siteId', new ExpFuncInUq(
            '$site$id', [ExpNum.num0, ExpNum.num0, ExpNum.num1, ExpNull.null, new ExpStr('$$$')], true
        ));
        let selectUniqueUnit = factory.createSelect();
        iff.else(selectUniqueUnit);
        selectUniqueUnit.toVar = true;
        selectUniqueUnit.col('value', uniqueUnit);
        selectUniqueUnit.from(sysTable(il.EnumSysTable.setting));
        selectUniqueUnit.where(new ExpEQ(new ExpField('name'), new ExpStr('uniqueunit')));
        // 24=第一个在用的unit
        let set24 = factory.createSet();
        iff.else(set24);
        set24.equ(uniqueUnit, new ExpFunc(factory.func_ifnull, new ExpVar(uniqueUnit), new ExpNum(24)));

        let insertUniqueUnit = factory.createInsert();
        iff.else(insertUniqueUnit);
        insertUniqueUnit.ignore = true;
        insertUniqueUnit.table = sysTable(il.EnumSysTable.site);
        insertUniqueUnit.cols = [
            { col: 'id', val: new ExpVar(uniqueUnit) },
            { col: 'no', val: new ExpStr('$$$') },
        ]
        return [declare, iff];
    }

    private setUser(p: sql.Procedure) {
        let { factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            bigIntField('id'),          // tonwaUserId
            charField('name', 100),
            charField('nick', 100),
            charField('icon', 200),
        );
        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.cols = [
            { col: 'name', val: new ExpVar('name') },
            { col: 'nick', val: new ExpVar('nick') },
            { col: 'icon', val: new ExpVar('icon') },
        ];
        upsert.keys = [
            { col: 'tonwauser', val: new ExpVar('id') },
        ];
        upsert.table = sysTable(il.EnumSysTable.user);
    }

    private initSettingProc(p: sql.Procedure) {
        let { factory, hasUnit, unitField } = this.context;
        function createInitSetting(keyName: string, col: string, val: ExpVal): Statement[] {
            let insert = factory.createInsert();
            insert.ignore = true;
            insert.table = sysTable(il.EnumSysTable.setting, undefined, hasUnit);
            insert.cols = [
                { col: 'name', val: new ExpStr(keyName) },
                { col: col, val: val }
            ];
            if (hasUnit === true) insert.cols.push({
                col: unitField.name, val: ExpVal.num0
            })
            return [insert];
        }
        p.statements.push(...createInitSetting(settingQueueSeed, 'big', ExpVal.num0));
        p.statements.push(...createInitSetting(settingQueueInSeed, 'big', ExpVal.num0));
        p.statements.push(...createInitSetting(settingQueueInSeed, 'big', ExpVal.num0));
        p.statements.push(...createInitSetting(settingIDLocalSeed, 'big', ExpVal.num0));

        let selectSheetSeed = factory.createSelect();
        selectSheetSeed.column(new ExpFunc(factory.func_max, new ExpField('id')));
        // il.EnumSysTable.sheet 是带$unit字段的。
        // 但是，这里是取全局sheet max id，所以不能带$unit比较
        // 所以，需要改成下面这个语句
        // selectSheetSeed.from(this.context.sysTable(il.EnumSysTable.sheet));
        selectSheetSeed.from(sysTable(il.EnumSysTable.sheet));

        p.statements.push(...createInitSetting(settingSheetSeed,
            'big',
            new ExpFunc(factory.func_ifnull, new ExpSelect(selectSheetSeed), ExpVal.num0)
        ));

        p.statements.push(...createInitSetting(settingTimezone, 'int', new ExpNum(8)));
    }

    private setSettingProc(p: sql.Procedure) {
        let { factory, hasUnit, unitField } = this.context;
        let name = new il.Field;
        name.name = 'name'
        let dt = name.dataType = new il.Char();
        dt.size = 50;
        let value = new il.Field;
        value.name = 'value';
        dt = value.dataType = new il.Char();
        dt.size = 1000;
        p.addUnitParameter();
        p.parameters.push(name, value);

        let upsert = factory.createUpsert();
        p.statements.push(upsert);
        upsert.table = new sql.SqlSysTable('$setting');
        upsert.cols.push(
            { col: value.name, val: new sql.ExpVar(value.name) },
        );
        if (hasUnit === true) {
            upsert.keys.push({ col: unitField.name, val: new sql.ExpVar(unitField.name) });
        }
        upsert.keys.push({ col: name.name, val: new sql.ExpVar(name.name) });

        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new ExpEQ(new ExpVar('name'), new ExpStr('uniqueunit'));
        let insertUnit = factory.createInsert();
        iff.then(insertUnit);
        insertUnit.table = sysTable(il.EnumSysTable.unit);
        insertUnit.ignore = true;
        insertUnit.cols = [
            { col: 'unit', val: new ExpVar('value') }
        ];
    }

    private getSettingProc(p: sql.Procedure) {
        p.addUnitParameter();
        let nameField = charField('name', 50);
        p.parameters.push(nameField);
        let { factory, unitField, hasUnit } = this.context;
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql.ExpField('value', 'a'));
        select.from(new EntityTable('$setting', false, 'a'));
        let eqName = new sql.ExpEQ(new sql.ExpField('name', 'a'), new sql.ExpVar('name'));
        let where: sql.ExpCmp;
        if (hasUnit === true) {
            where = new sql.ExpAnd(
                eqName,
                new sql.ExpEQ(new sql.ExpField(unitField.name, 'a'), new sql.ExpVar(unitField.name))
            );
        }
        else {
            where = eqName;
        }
        select.where(where);
    }

    private constStrsProc(p: sql.Procedure) {
        let factory = this.context.factory;
        let select = factory.createSelect();
        p.statements.push(select);
        select.from(sysTable(il.EnumSysTable.const));
        select.column(new sql.ExpField('id')).column(new sql.ExpField('name'));
    }

    private constStrProc(p: sql.Procedure) {
        let param = 'name';
        const tblConst = sysTable(il.EnumSysTable.const);

        let { parameters, statements } = p;
        parameters.push(
            textField(param)
        );
        let { factory } = this.context;
        let declare = factory.createDeclare();
        declare.var('ret', new Int());
        statements.push(declare);
        let varTable = this.splitIdsTable(p.statements, param, '\t', new Char(100));

        let selectNames = factory.createSelect();
        selectNames.col('id', 'name');
        selectNames.from(new FromVarTable(varTable.name));

        let insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = tblConst;
        insert.cols = [
            { col: 'name', val: undefined },
        ];
        insert.select = selectNames;

        let taNames = new FromVarTable(varTable.name, 'a');
        let tbConst = sysTable(il.EnumSysTable.const, 'b');

        let selectRet = factory.createSelect();
        statements.push(selectRet);
        selectRet.col('id', undefined, 'b');
        selectRet.col('name', undefined, 'b');
        selectRet.from(taNames)
            .join(JoinType.join, tbConst)
            .on(new ExpEQ(new ExpField('id', 'a'), new ExpField('name', 'b')));
    }

    /*
    private saveRoleIxPhraseProc(p: sql.Procedure) {
        let { factory } = this.context;
        let { parameters, statements } = p;
        const param = 'phrases';
        parameters.push(
            textField(param),
        );

        let declare = factory.createDeclare();
        let vRoleId = 'roleId';
        let vPermitId = 'permitId';
        declare.var('id', new Int());
        declare.var('role', new Char(200));
        declare.var('permit', new Char(200));
        declare.var(vRoleId, new BigInt());
        declare.var(vPermitId, new BigInt());
        statements.push(declare);
        let idField = intField('$id');
        idField.autoInc = true;
        let fields: Field[] = [
            idField,
            charField('role', 200),
            charField('permit', 200),
        ];

        let setId0 = factory.createSet();
        statements.push(setId0);
        setId0.equ('id', ExpNum.num0);

        let varTable = this.strToTable(statements, param, '\\n', '\\t', fields);

        // 循环, 保存$ixphrase
        let loop = factory.createWhile();
        statements.push(loop);
        loop.no = 999;
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
        let lstats = loop.statements;

        let setRoleNull = factory.createSet();
        lstats.add(setRoleNull);
        setRoleNull.equ('role', ExpVal.null);

        let selectRole = factory.createSelect();
        lstats.add(selectRole);
        selectRole.toVar = true;
        selectRole.col('$id', 'id');
        selectRole.col('role', 'role');
        selectRole.col('permit', 'permit');
        selectRole.from(new FromVarTable(varTable.name));
        selectRole.where(new ExpGT(new ExpField('$id'), new ExpVar('id')));
        selectRole.order(new ExpField('$id'), 'asc');
        selectRole.limit(ExpNum.num1);

        let ifRoleNull = factory.createIf();
        lstats.add(ifRoleNull);
        ifRoleNull.cmp = new ExpIsNull(new ExpVar('role'));
        let leave = factory.createBreak();
        ifRoleNull.then(leave);
        leave.no = loop.no;

        let tblPhrase = sysTable(il.EnumSysTable.phrase);
        let selectRoleId = factory.createSelect();
        lstats.add(selectRoleId);
        selectRoleId.toVar = true;
        selectRoleId.from(tblPhrase);
        selectRoleId.col('id', vRoleId);
        selectRoleId.where(new ExpEQ(new ExpField('name'), new ExpVar('role')));

        let selectPermitId = factory.createSelect();
        lstats.add(selectPermitId);
        selectPermitId.toVar = true;
        selectPermitId.from(tblPhrase);
        selectPermitId.col('id', vPermitId);
        selectPermitId.where(new ExpEQ(new ExpField('name'), new ExpVar('permit')));
    }
    */

    private savePhrasesProc(p: sql.Procedure) {
        const param = 'phrases';
        const tblPhrase = sysTable(il.EnumSysTable.phrase);
        let { parameters, statements } = p;
        parameters.push(
            textField(param)
        );
        let { factory } = this.context;
        let declare = factory.createDeclare();
        const pName = '$pname';
        const $name = '$name';
        const $caption = '$caption';
        const $base = '$base';
        const $ownerId = '$ownerId';
        const $type = '$type';

        const varName = new ExpVar($name);

        declare.var('ret', new Int());
        declare.var(pName, new Char(200));
        declare.var($base, new BigInt());
        declare.var($ownerId, new BigInt());
        statements.push(declare);
        let fields: Field[] = [
            charField('name', 200),
            charField('caption', 200),
            charField('basename', 200),
            tinyIntField('type'),
        ];
        let varTable = this.strToTable(p.statements, param, '\\n', '\\t', fields);

        let updateInvalid = factory.createUpdate();
        statements.push(updateInvalid);
        updateInvalid.table = tblPhrase;
        updateInvalid.cols = [
            { col: 'valid', val: ExpNum.num0 }
        ];
        updateInvalid.where = new ExpEQ(ExpNum.num1, ExpNum.num1);

        let taNames = new FromVarTable(varTable.name, 'a');
        let tbPhrase = sysTable(il.EnumSysTable.phrase, 'b');

        // 第一次循环, 保存id
        {
            let setPNameEmpty = factory.createSet();
            statements.push(setPNameEmpty);
            setPNameEmpty.equ(pName, new ExpStr(''));

            let loop = factory.createWhile();
            statements.push(loop);
            loop.no = 999;
            loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
            let lstats = loop.statements;

            let setNameNull = factory.createSet();
            lstats.add(setNameNull);
            setNameNull.equ($name, ExpVal.null);

            let selectName = factory.createSelect();
            lstats.add(selectName);
            selectName.toVar = true;
            selectName.col('name', $name);
            selectName.column(new ExpSearchCase(
                [
                    new ExpEQ(new ExpFunc(factory.func_length, new ExpField('caption')), ExpNum.num0),
                    ExpVal.null,
                ],
                new ExpField('caption'),
            ), $caption);
            selectName.col('type', $type);
            selectName.from(new FromVarTable(varTable.name));
            selectName.where(new ExpGT(new ExpField('name'), new ExpVar(pName)));
            selectName.order(new ExpField('name'), 'asc');
            selectName.limit(ExpNum.num1);

            let ifNameNull = factory.createIf();
            lstats.add(ifNameNull);
            ifNameNull.cmp = new ExpIsNull(new ExpVar($name));
            let leave = factory.createBreak();
            ifNameNull.then(leave);
            leave.no = loop.no;

            let update = factory.createUpdate();
            lstats.add(update);
            update.table = tblPhrase;
            update.cols = [
                { col: 'caption', val: new ExpVar($caption) },
                { col: 'type', val: new ExpVar($type) },
                { col: 'valid', val: ExpNum.num1 },
            ];
            update.where = new ExpEQ(new ExpField('name'), new ExpVar($name));

            let if0 = factory.createIf();
            lstats.add(if0);
            if0.cmp = new ExpEQ(new ExpFunc(factory.func_rowCount), ExpNum.num0);
            let insert = factory.createInsert();
            if0.then(insert);
            insert.table = tblPhrase;
            insert.cols = [
                { col: 'id', val: new ExpFuncInUq('$IDNU', [ExpNum.num0], true) },
                { col: 'name', val: new ExpVar($name) },
                { col: 'caption', val: new ExpVar($caption) },
                { col: 'type', val: new ExpVar($type) },
            ];

            let setPName = factory.createSet();
            lstats.add(setPName);
            setPName.equ(pName, new ExpVar($name));
        }

        // 第二次循环, 保存owner
        {
            let setPNameEmpty = factory.createSet();
            statements.push(setPNameEmpty);
            setPNameEmpty.equ(pName, new ExpStr(''));

            let loop = factory.createWhile();
            statements.push(loop);
            loop.no = 997;
            loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
            let lstats = loop.statements;

            let setNameNull = factory.createSet();
            lstats.add(setNameNull);
            setNameNull.equ($name, ExpVal.null);

            let selectName = factory.createSelect();
            lstats.add(selectName);
            selectName.toVar = true;
            selectName.column(new ExpField('name'), $name);
            selectName.column(new ExpField('id'), $base);
            selectName.from(tbPhrase)
            selectName.where(new ExpGT(new ExpField('name'), new ExpVar(pName)));
            selectName.order(new ExpField('name'), 'asc');
            selectName.limit(ExpNum.num1);

            let ifNameNull = factory.createIf();
            lstats.add(ifNameNull);
            ifNameNull.cmp = new ExpIsNull(new ExpVar($name));
            let leave = factory.createBreak();
            ifNameNull.then(leave);
            leave.no = loop.no;

            let selectOwnerId = factory.createSelect();
            selectOwnerId.col('id');
            selectOwnerId.from(tblPhrase);
            selectOwnerId.where(new ExpEQ(
                new ExpField('name'),
                new ExpFunc(
                    factory.func_substr,
                    varName,
                    ExpNum.num1,
                    new ExpSub(
                        new ExpFunc(factory.func_length, varName),
                        new ExpFunc(
                            factory.func_length,
                            new ExpFunc(factory.func_substring_index, varName, new ExpStr('.'), ExpNum.num_1)
                        ),
                        ExpNum.num1,
                    ),
                ),
            ));
            let setOwnerId = factory.createSet();
            lstats.add(setOwnerId);
            setOwnerId.equ($ownerId, new ExpFunc(factory.func_ifnull, new ExpSelect(selectOwnerId), ExpNum.num0));

            let updateOwner = factory.createUpdate();
            lstats.add(updateOwner);
            updateOwner.table = tblPhrase;
            updateOwner.cols = [
                { col: 'owner', val: new ExpVar($ownerId) }
            ];
            updateOwner.where = new ExpEQ(new ExpField('id'), new ExpVar($base));

            let setPName = factory.createSet();
            lstats.add(setPName);
            setPName.equ(pName, new ExpVar($name));
        }

        // 第三次循环, 保存base
        {
            let setPNameEmpty = factory.createSet();
            statements.push(setPNameEmpty);
            setPNameEmpty.equ(pName, new ExpStr(''));

            let loop = factory.createWhile();
            statements.push(loop);
            loop.no = 998;
            loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
            let lstats = loop.statements;

            let setNameNull = factory.createSet();
            lstats.add(setNameNull);
            setNameNull.equ($name, ExpVal.null);

            let selectName = factory.createSelect();
            lstats.add(selectName);
            selectName.toVar = true;
            selectName.column(new ExpField('name', 'a'), $name);
            selectName.column(new ExpField('id', 'b'), $base);
            selectName.from(new FromVarTable(varTable.name, 'a'))
                .join(JoinType.left, sysTable(il.EnumSysTable.phrase, 'b'))
                .on(new ExpEQ(new ExpField('basename', 'a'), new ExpField('name', 'b')));
            selectName.where(new ExpGT(new ExpField('name', 'a'), new ExpVar(pName)));
            selectName.order(new ExpField('name', 'a'), 'asc');
            selectName.limit(ExpNum.num1);

            let ifNameNull = factory.createIf();
            lstats.add(ifNameNull);
            ifNameNull.cmp = new ExpIsNull(new ExpVar($name));
            let leave = factory.createBreak();
            ifNameNull.then(leave);
            leave.no = loop.no;

            let ifBaseNull = factory.createIf();
            lstats.add(ifBaseNull);
            ifBaseNull.cmp = new ExpIsNull(new ExpVar($base));
            let setBase0 = factory.createSet();
            ifBaseNull.then(setBase0);
            setBase0.equ($base, ExpNum.num0);

            let update = factory.createUpdate();
            lstats.add(update);
            update.table = tblPhrase;
            update.cols = [
                { col: 'base', val: new ExpVar($base) },
            ];
            update.where = new ExpEQ(new ExpField('name'), new ExpVar($name));

            let setPName = factory.createSet();
            lstats.add(setPName);
            setPName.equ(pName, new ExpVar($name));
        }

        // 生成$ixphrase
        /*
        const tblIxPhrase = sysTable(il.EnumSysTable.ixPhrase);
        let delIxPhrase = factory.createDelete();
        statements.push(delIxPhrase);
        delIxPhrase.tables = [tblIxPhrase];
        delIxPhrase.where(new ExpEQ(ExpNum.num1, ExpNum.num1));
        let insertIxPhrase = factory.createInsert();
        statements.push(insertIxPhrase);
        insertIxPhrase.table = tblIxPhrase;
        insertIxPhrase.cols = [
            { col: 'i', val: ExpNum.num0 },
            { col: 'x', val: ExpNum.num0 },
            { col: 'type', val: ExpNum.num0 },
        ];
        */
        /*
        let selectCTE = factory.createSelect();
        selectCTE.column(new ExpField('id', 'a'), 'i');
        selectCTE.column(new ExpField('id', 'a1'), 'x');
        selectCTE.column(new ExpField('type', 'a1'));
        selectCTE.column(new ExpField('base', 'a'));
        selectCTE.from(sysTable(il.EnumSysTable.phrase, 'a'))
            .join(JoinType.join, sysTable(il.EnumSysTable.phrase, 'a1'))
            .on(new ExpEQ(new ExpField('owner', 'a1'), new ExpField('id', 'a')))
            .where(new ExpEQ(new ExpField('valid', 'a'), ExpNum.num1));
        let selectCTEUnion = factory.createSelect();
        selectCTE.unions = [
            selectCTEUnion
        ];
        selectCTEUnion.col('i', 'i', 'b');
        selectCTEUnion.col('id', 'x', 'c1');
        selectCTEUnion.col('type', undefined, 'c1');
        selectCTEUnion.col('base', undefined, 'c');
        selectCTEUnion.from(sysTable(il.EnumSysTable.phrase, 'c'))
            .join(JoinType.join, new FromVarTable('tbl', 'b'))
            .on(new ExpEQ(new ExpField('id', 'c'), new ExpField('base', 'b')))
            .join(JoinType.join, sysTable(il.EnumSysTable.phrase, 'c1'))
            .on(new ExpEQ(new ExpField('owner', 'c1'), new ExpField('id', 'c')));
        selectCTEUnion.where(new ExpEQ(new ExpField('valid', 'c'), ExpNum.num1));
        */
        /*
        let selectIx = factory.createSelect();
        insertIxPhrase.select = selectIx;
        selectIx.cte = {
            alias: 'tbl',
            recursive: true,
            select: selectCTE,
        };
        selectIx.col('i');
        selectIx.col('x');
        selectIx.col('type');
        selectIx.from(new FromVarTable('tbl'));
        */
        let selectRet = factory.createSelect();
        statements.push(selectRet);
        selectRet.col('id', undefined, 'b');
        selectRet.col('name', undefined, 'b');
        selectRet.from(taNames)
            .join(JoinType.join, tbPhrase)
            .on(new ExpEQ(new ExpField('name', 'a'), new ExpField('name', 'b')));
        selectRet.where(new ExpGT(new ExpField('valid', 'b'), ExpNum.num0));
        `
WITH RECURSIVE tbl(i, X, TYPE, base) AS (
	SELECT a.id AS i, a1.id AS X, a1.TYPE, a.base 
		FROM $phrase AS a JOIN $phrase AS a1 ON a1.owner=a.id
		WHERE a.valid=1 -- AND a.NAME='atom.SpecialMedicineChinese'
	UNION
	SELECT b.i AS i, c1.id AS X, c1.type, c.base
		FROM $phrase AS c join tbl AS b ON c.id=b.base
			JOIN $phrase AS c1 ON c1.owner=c.id
		WHERE c.valid=1
)
SELECT i, X, TYPE, base FROM tbl;
`
    }

    private timezoneFunc(p: sql.Procedure) {
        let { factory, unitField, userParam, unitFieldName, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
        );
        let userParamName = userParam.name;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('tz', new TinyInt());
        declare.var('tzUser', new TinyInt());
        let selectTzUnit = factory.createSelect();
        statements.push(selectTzUnit);
        selectTzUnit.toVar = true;
        selectTzUnit.lock = LockType.update;
        selectTzUnit.column(new ExpField('timezone'), 'tz');
        selectTzUnit.from(sysTable(il.EnumSysTable.unit));
        selectTzUnit.where(new ExpEQ(new ExpField('unit'), new ExpVar(unitFieldName)));

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpIsNotNull(new ExpVar(userParamName));
        let selectTzUser = factory.createSelect();
        iff.then(selectTzUser);
        selectTzUser.toVar = true;
        selectTzUser.lock = LockType.update;
        selectTzUser.column(new ExpField('timezone'), 'tzUser');
        selectTzUser.from(sysTable(il.EnumSysTable.user));
        selectTzUser.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar(userParamName)),
        ));
        let iffTzUser = factory.createIf();
        iff.then(iffTzUser);
        iffTzUser.cmp = new ExpIsNotNull(new ExpVar('tzUser'));
        let setTz = factory.createSet();
        iffTzUser.then(setTz);
        setTz.equ('tz', new ExpVar('tzUser'));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.expVal = new ExpVar('tz');
    }

    private bizMonthFunc(p: sql.Procedure) {
        let { factory, unitField, unitFieldName } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
        );
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('ret', new TinyInt());
        let selectTzUnit = factory.createSelect();
        statements.push(selectTzUnit);
        selectTzUnit.toVar = true;
        selectTzUnit.lock = LockType.update;
        selectTzUnit.column(new ExpField('bizmonth'), 'ret');
        selectTzUnit.from(sysTable(il.EnumSysTable.unit));
        selectTzUnit.where(new ExpEQ(new ExpField('unit'), new ExpVar(unitFieldName)));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.expVal = new ExpVar('ret');
    }

    private bizDateFunc(p: sql.Procedure) {
        let { factory, unitField, unitFieldName } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
        );
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('ret', new TinyInt());
        let selectTzUnit = factory.createSelect();
        statements.push(selectTzUnit);
        selectTzUnit.toVar = true;
        selectTzUnit.lock = LockType.update;
        selectTzUnit.column(new ExpField('bizdate'), 'ret');
        selectTzUnit.from(sysTable(il.EnumSysTable.unit));
        selectTzUnit.where(new ExpEQ(new ExpField('unit'), new ExpVar(unitFieldName)));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.expVal = new ExpVar('ret');
    }

    private bizMonthIdFunc(p: sql.Procedure) {
        let { parameters, statements } = p;
        parameters.push(
            dateField('date'),
            intField('bizDate'),
        );
        let builder = new BizMonthIdBuilder(this.context, statements);
        builder.build();
    }

    private bizYearIdFunc(p: sql.Procedure) {
        let { parameters, statements } = p;
        parameters.push(
            dateField('date'),
            intField('bizMonth'),
            intField('bizDate'),
        );
        let builder = new BizYearIdBuilder(this.context, statements);
        builder.build();
    }

    private minuteIdDate(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            bigIntField('minuteId'),
            tinyIntField('timeZone'),
        );
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('ret', new DDate());

        let set = factory.createSet();
        p.statements.push(set);
        set.equ('ret', this.expDate());

        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = 'ret';
    }

    private minuteIdTime(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            bigIntField('minuteId'),
            tinyIntField('timeZone'),
        );
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('ret', new DateTime());

        let set = factory.createSet();
        p.statements.push(set);
        set.equ('ret', this.expTime());

        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = 'ret';
    }

    private minuteIdMonth(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            bigIntField('minuteId'),
            tinyIntField('timeZone'),
        );
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('ret', new DDate());

        let set = factory.createSet();
        p.statements.push(set);
        set.equ('ret', this.expDate());

        let setMonth = factory.createSet();
        p.statements.push(setMonth);
        setMonth.equ('ret',
            new ExpFuncCustom(factory.func_dateadd,
                new ExpDatePart('day'),
                new ExpAdd(
                    new ExpNeg(new ExpFunc('dayofmonth', new ExpVar('ret'))),
                    ExpNum.num1
                ),
                new ExpVar('ret')
            )
        );

        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = 'ret';
    }

    private minuteIdPeriod(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            bigIntField('minuteId'),
            tinyIntField('timeZone'),
            tinyIntField('period'),     // month biz start date, 0 = day
        );
        let declare = factory.createDeclare();
        p.statements.push(declare);
        const ret = 'date';
        declare.var(ret, new DDate());
        declare.var('bizDate', new TinyInt());
        let setBzDate = factory.createSet();
        p.statements.push(setBzDate);
        setBzDate.equ('bizDate', new ExpVar('period'));

        let set = factory.createSet();
        p.statements.push(set);
        set.equ(ret, this.expDate());
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new ExpGT(new ExpVar('period'), ExpNum.num0);
        let then: Statement[] = [];
        let mip = new MinuteIdPeriod(this.context, then);
        mip.build();
        iff.then(...then);
        let retn = factory.createReturn();
        p.statements.push(retn);
        retn.returnVar = ret;
    }

    private expTime() {
        let { factory } = this.context;
        return new ExpFunc(factory.func_from_unixtime,
            new ExpMul(
                new ExpAdd(
                    new ExpNum(minteIdOf2020_01_01),
                    new ExpFunc(
                        factory.func_timestampdiff,
                        new ExpDatePart('minute'),
                        new ExpFunc(factory.func_now),
                        new ExpFuncCustom(factory.func_utc_timestamp),
                    ),
                    new ExpFunc(
                        factory.func_if,
                        new ExpLT(new ExpVar('minuteId'), ExpNum.num0),
                        new ExpNeg(new ExpBitRight(new ExpNeg(new ExpVar('minuteId')), new ExpNum(20))),
                        new ExpBitRight(new ExpVar('minuteId'), new ExpNum(20)),
                    ),
                    new ExpMul(new ExpVar('timeZone'), new ExpNum(60))
                ),
                new ExpNum(60),
            )
        );
    }

    private expDate() {
        let { factory } = this.context;
        return new ExpFunc(factory.func_date, this.expTime());
    }

    private minuteIdFromDate(p: sql.Procedure) {
        let { factory } = this.context;
        // (TIMESTAMPDIFF( minute , '2020-1-1', '2021-9-1')<<20)
        p.parameters.push(
            dateField('date'),
            tinyIntField('timeZone'),
        );
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('ret', new BigInt());

        let set = factory.createSet();
        p.statements.push(set);
        set.equ('ret',
            new ExpAdd(
                new ExpDiv(
                    new ExpFuncCustom(factory.func_unix_timestamp, new ExpVar('date')),
                    new ExpNum(60),
                ),
                new ExpFunc(
                    factory.func_timestampdiff,
                    new ExpDatePart('minute'),
                    new ExpFuncCustom(factory.func_utc_timestamp),
                    new ExpFunc(factory.func_now),
                ),
                new ExpNeg(new ExpNum(minteIdOf2020_01_01)),
                new ExpNeg(new ExpMul(new ExpVar('timeZone'), new ExpNum(60)))
            ),
        );
        let setBitLeft = factory.createSet();
        p.statements.push(setBitLeft);
        setBitLeft.equ('ret',
            new ExpFunc(
                factory.func_if,
                new ExpLT(new ExpVar('ret'), ExpNum.num0),
                new ExpNeg(new ExpBitLeft(new ExpNeg(new ExpVar('ret')), new ExpNum(20))),
                new ExpBitLeft(new ExpVar('ret'), new ExpNum(20)),
            )
        );

        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = 'ret';
    }

    private expTimeOfUMinut() {
        let { factory } = this.context;
        const uminute = 'uminute';
        const varUMinute = new ExpVar(uminute);
        const varTimeZone = new ExpVar('timeZone');
        return new ExpFunc(factory.func_from_unixtime,
            new ExpMul(
                new ExpAdd(
                    new ExpBitRight(varUMinute, new ExpNum(20)),
                    new ExpFunc(
                        factory.func_timestampdiff,
                        new ExpDatePart('minute'),
                        new ExpFunc(factory.func_now),
                        new ExpFuncCustom(factory.func_utc_timestamp),
                    ),
                    new ExpMul(varTimeZone, new ExpNum(60))
                ),
                new ExpNum(60),
            )
        );
    }

    private expDateOfUMinut() {
        let { factory } = this.context;
        return new ExpFunc(factory.func_date, this.expTimeOfUMinut());
    }

    private uminute(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            intField('stamp'),
        );
        let val = new ExpFuncInUq('$idmu', [
            // ExpNum.num0, 
            ExpNum.num0, new ExpVar('stamp')
        ], true);

        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = val;
    }

    private uminuteFromTime(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            dateTimeField('time'),
            tinyIntField('timeZone'),
        );
        let val = new ExpBitLeft(
            new ExpSub(
                new ExpDiv(
                    new ExpFuncCustom(factory.func_unix_timestamp, new ExpVar('time')),
                    new ExpNum(60)
                ),
                new ExpFunc(
                    factory.func_timestampdiff,
                    new ExpDatePart('minute'),
                    new ExpFunc(factory.func_now),
                    new ExpFuncCustom(factory.func_utc_timestamp),
                ),
                new ExpMul(new ExpVar('timeZone'), new ExpNum(60))
            ),
            new ExpNum(20),
        );

        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = val;
    }

    private uminuteDate(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            bigIntField('uminute'),
            tinyIntField('timeZone'),
        );
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = this.expDateOfUMinut();
    }

    private uminuteTime(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            bigIntField('uminute'),
            tinyIntField('timeZone'),
        );
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = this.expTimeOfUMinut();
    }

    private uminuteStamp(p: sql.Procedure) {
        let { factory } = this.context;
        p.parameters.push(
            bigIntField('minuteId'),
        );
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = new ExpMul(
            new ExpBitRight(new ExpVar('minuteId'), new ExpNum(20)),
            new ExpNum(60)
        );
    }

    private me(p: sql.Procedure) {
        let { factory } = this.context;
        const $site = '$site', $user = '$user';
        const varSite = new ExpVar($site), varUser = new ExpVar($user);
        p.parameters.push(
            bigIntField($site),
            bigIntField($user),
        );
        let ret = factory.createReturn();
        p.statements.push(ret);

        ret.expVal = new ExpFuncInUq(
            '$usersite$id',
            [varSite, varUser, ExpNum.num1, varSite, varUser],
            true,
        );
    }
}

abstract class BizIdBuilder {
    protected readonly context: DbContext;
    protected readonly statements: sql.Statement[];
    constructor(context: DbContext, statements: sql.Statement[]) {
        this.context = context;
        this.statements = statements;
    }
    build(): void {
        this.buildCheckParam();
        this.buildPre();
        this.buildMid();
        this.buildRet();
    }
    protected buildCheckParam(): void {
    }
    protected buildPre() {
        let { factory } = this.context;
        let { statements } = this;
        let vDate = new ExpVar('date');
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars(intField('yr'), intField('mn'), intField('dt'));

        let setYr = factory.createSet();
        statements.push(setYr);
        setYr.equ('yr', new ExpFunc(factory.func_year, vDate));
        let setMn = factory.createSet();
        statements.push(setMn);
        setMn.equ('mn', new ExpSub(new ExpFunc(factory.func_month, vDate), ExpNum.num1));
        let setDt = factory.createSet();
        statements.push(setDt);
        setDt.equ('dt', new ExpFunc('DAYOFMONTH', vDate));

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpLT(new ExpVar('dt'), new ExpVar('bizDate'));
        let decMn = factory.createSet();
        iff.then(decMn);
        decMn.equ('mn', new ExpSub(new ExpVar('mn'), ExpNum.num1));
        let iffMnNeg = factory.createIf();
        statements.push(iffMnNeg);
        iffMnNeg.cmp = new ExpLT(new ExpVar('mn'), ExpNum.num0);
        let setMn11 = factory.createSet();
        iffMnNeg.then(setMn11);
        setMn11.equ('mn', new ExpNum(11));
        let decYr = factory.createSet();
        iffMnNeg.then(decYr);
        decYr.equ('yr', new ExpSub(new ExpVar('yr'), ExpNum.num1));
    }
    protected buildMid() {
    }
    protected buildDateExp(): ExpVal {
        let { factory } = this.context;
        return new ExpFuncCustom(
            factory.func_dateadd,
            new ExpDatePart('day'),
            new ExpSub(new ExpVar('bizDate'), ExpNum.num1),
            new ExpFuncCustom(
                factory.func_dateadd,
                new ExpDatePart('month'),
                this.expRetMonth,
                new ExpFunc('makedate', new ExpVar('yr'), ExpNum.num1)
            )
        )
    }
    protected buildRet() {
        // RETURN DATE_ADD(DATE_ADD(MAKEDATE(yr, 1), INTERVAL mn-1 MONTH), INTERVAL _bizDate-1 DAY)
        let { factory } = this.context;
        let ret = factory.createReturn();
        this.statements.push(ret);
        ret.expVal = this.buildDateExp();
    }
    protected abstract get expRetMonth(): ExpVal;
}

class BizMonthIdBuilder extends BizIdBuilder {
    protected get expRetMonth(): ExpVal {
        return new ExpVar('mn')
    };

    protected buildCheckParam(): void {
        let { factory } = this.context;
        let ifBizDate0 = factory.createIf();
        this.statements.push(ifBizDate0);
        ifBizDate0.cmp = new ExpEQ(new ExpVar('bizDate'), ExpNum.num0);
        let retDate = factory.createReturn();
        ifBizDate0.then(retDate);
        retDate.expVal = new ExpVar('date');
    }
}

class BizYearIdBuilder extends BizIdBuilder {
    protected buildMid() {
        let { factory } = this.context;
        let ifMnBizMonth = factory.createIf();
        this.statements.push(ifMnBizMonth);
        ifMnBizMonth.cmp = new ExpLT(new ExpVar('mn'), new ExpVar('bizMonth'));
        let decYr = factory.createSet();
        ifMnBizMonth.then(decYr);
        decYr.equ('yr', new ExpSub(new ExpVar('yr'), ExpNum.num1));
    }
    protected get expRetMonth(): ExpVal {
        return new ExpSub(new ExpVar('bizMonth'), ExpNum.num1);
    };

    protected buildCheckParam(): void {
        let { factory } = this.context;
        let ifBizDate0 = factory.createIf();
        this.statements.push(ifBizDate0);
        ifBizDate0.cmp = new ExpEQ(new ExpVar('bizMonth'), ExpNum.num0);
        let retDate = factory.createReturn();
        ifBizDate0.then(retDate);
        retDate.expVal = new ExpFunc(
            this.context.twProfix + '$biz_month_id'
            , new ExpVar('date')
            , new ExpVar('bizDate'));
    }
}

class MinuteIdPeriod extends BizIdBuilder {
    protected get expRetMonth(): ExpVal {
        return new ExpVar('mn')
    };

    build(): void {
        this.buildPre();
        let { factory } = this.context;
        let set = factory.createSet();
        this.statements.push(set);
        set.equ('date', this.buildDateExp());
    }
}
