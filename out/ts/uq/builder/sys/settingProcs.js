"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingProcedures = void 0;
const sql = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sql_1 = require("../sql");
const il = require("../../il");
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const consts_1 = require("../consts");
const select_1 = require("../sql/select");
const __1 = require("..");
class SettingProcedures extends sysProcedures_1.SysProcedures {
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
        this.timezoneFunc(this.func('$timezone', new il_1.TinyInt()));
        this.bizMonthFunc(this.func('$biz_month_offset', new il_1.TinyInt()));
        this.bizDateFunc(this.func('$biz_date_offset', new il_1.TinyInt()));
        this.bizMonthIdFunc(this.func('$biz_month_id', new il_1.DDate()));
        this.bizYearIdFunc(this.func('$biz_year_id', new il_1.DDate()));
        this.minuteIdFromDate(this.coreFunc('$minute_id_from_date', new il_1.BigInt()));
        this.minuteIdDate(this.coreFunc('$minute_id_date', new il_1.DDate()));
        this.minuteIdMonth(this.coreFunc('$minute_id_month', new il_1.DDate()));
        this.minuteIdPeriod(this.coreFunc('$minute_id_period', new il_1.DDate()));
        this.minuteIdTime(this.coreFunc('$minute_id_time', new il_1.DateTime()));
        this.uminuteFromTime(this.coreFunc('$uminute_from_time', new il_1.BigInt()));
        this.uminuteStamp(this.coreFunc('$uminute_stamp', new il_1.Int()));
        this.uminuteDate(this.coreFunc('$uminute_date', new il_1.DDate()));
        this.uminuteTime(this.coreFunc('$uminute_time', new il_1.DateTime()));
        this.me(this.coreFunc('$me', new il_1.BigInt()));
    }
    setBusQueueSeed(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.charField)('table', 100), (0, il_1.bigIntField)('seed'));
        let setTableSeed = factory.createSetTableSeed();
        setTableSeed.table = new sql_1.ExpVar('table');
        setTableSeed.seed = new sql_1.ExpVar('seed');
        p.statements.push(setTableSeed);
    }
    getTableSeed(p) {
        let factory = this.context.factory;
        p.parameters.push((0, il_1.charField)('table', 100));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('seed', new il_1.BigInt());
        let getTableSeed = factory.createGetTableSeed();
        getTableSeed.table = new sql_1.ExpVar('table');
        getTableSeed.seed = new sql_1.ExpVar('seed');
        p.statements.push(getTableSeed);
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql_1.ExpVar('seed'), 'seed');
    }
    finishBuildDb(p) {
        let { factory } = this.context;
        let { parameters, statements } = p;
        parameters.push((0, il_1.bigIntField)('$user'));
        let declare = factory.createDeclare();
        statements.push(declare);
        const vUserSite = 'userunit';
        declare.var('$unit', new il_1.BigInt());
        declare.var(vUserSite, new il_1.BigInt());
        // build default site '$$$'
        statements.push(...this.buildDefaultSite());
        let setUnit0 = factory.createSet();
        statements.push(setUnit0);
        setUnit0.equ('$unit', sql_1.ExpNum.num0);
        this.context.buildBiz$User(statements);
        let setUserSite = factory.createSet();
        statements.push(setUserSite);
        setUserSite.equ(vUserSite, new sql_1.ExpFuncInUq('$UserSite$id', [
            sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num0, new sql_1.ExpVar('$user')
        ], true));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(vUserSite));
        let setNewUserUnit = factory.createSet();
        iff.then(setNewUserUnit);
        setNewUserUnit.equ(vUserSite, new sql_1.ExpFuncInUq('$UserSite$id', [
            sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNum.num0, new sql_1.ExpVar('$user')
        ], true));
        let updateAdmin = factory.createUpdate();
        iff.then(updateAdmin);
        updateAdmin.cols = [
            { col: 'admin', val: sql_1.ExpNum.num3 }
        ];
        updateAdmin.table = (0, __1.sysTable)(il.EnumSysTable.userSite);
        updateAdmin.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(vUserSite));
        let select = factory.createSelect();
        statements.push(select);
        select.col('id');
        select.from((0, __1.sysTable)(il.EnumSysTable.user));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('$user')));
    }
    // build default site '$$$'
    buildDefaultSite() {
        const { factory } = this.context;
        const declare = factory.createDeclare();
        declare.var('$siteId', new il_1.BigInt());
        const uniqueUnit = '$uniqueUnit';
        declare.var(uniqueUnit, new il_1.BigInt());
        const selectUqDocType = factory.createSelect();
        selectUqDocType.col('name');
        selectUqDocType.from((0, __1.sysTable)(il.EnumSysTable.setting));
        selectUqDocType.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('uq-doc-type')), new sql.ExpGE(new sql_1.ExpField('value'), sql_1.ExpNum.num2)));
        let iff = factory.createIf();
        iff.cmp = new sql.ExpExists(selectUqDocType);
        let setDoc2DefaultSite = factory.createSet();
        iff.then(setDoc2DefaultSite);
        setDoc2DefaultSite.equ('$siteId', new sql_1.ExpFuncInUq('$site$id', [sql_1.ExpNum.num0, sql_1.ExpNum.num0, sql_1.ExpNum.num1, sql_1.ExpNull.null, new sql_1.ExpStr('$$$')], true));
        let selectUniqueUnit = factory.createSelect();
        iff.else(selectUniqueUnit);
        selectUniqueUnit.toVar = true;
        selectUniqueUnit.col('value', uniqueUnit);
        selectUniqueUnit.from((0, __1.sysTable)(il.EnumSysTable.setting));
        selectUniqueUnit.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('uniqueunit')));
        // 24=第一个在用的unit
        let set24 = factory.createSet();
        iff.else(set24);
        set24.equ(uniqueUnit, new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpVar(uniqueUnit), new sql_1.ExpNum(24)));
        let insertUniqueUnit = factory.createInsert();
        iff.else(insertUniqueUnit);
        insertUniqueUnit.ignore = true;
        insertUniqueUnit.table = (0, __1.sysTable)(il.EnumSysTable.site);
        insertUniqueUnit.cols = [
            { col: 'id', val: new sql_1.ExpVar(uniqueUnit) },
            { col: 'no', val: new sql_1.ExpStr('$$$') },
        ];
        return [declare, iff];
    }
    setUser(p) {
        let { factory } = this.context;
        let { parameters, statements } = p;
        parameters.push((0, il_1.bigIntField)('id'), // tonwaUserId
        (0, il_1.charField)('name', 100), (0, il_1.charField)('nick', 100), (0, il_1.charField)('icon', 200));
        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.cols = [
            { col: 'name', val: new sql_1.ExpVar('name') },
            { col: 'nick', val: new sql_1.ExpVar('nick') },
            { col: 'icon', val: new sql_1.ExpVar('icon') },
        ];
        upsert.keys = [
            { col: 'tonwauser', val: new sql_1.ExpVar('id') },
        ];
        upsert.table = (0, __1.sysTable)(il.EnumSysTable.user);
    }
    initSettingProc(p) {
        let { factory, hasUnit, unitField } = this.context;
        function createInitSetting(keyName, col, val) {
            let insert = factory.createInsert();
            insert.ignore = true;
            insert.table = (0, __1.sysTable)(il.EnumSysTable.setting, undefined, hasUnit);
            insert.cols = [
                { col: 'name', val: new sql_1.ExpStr(keyName) },
                { col: col, val: val }
            ];
            if (hasUnit === true)
                insert.cols.push({
                    col: unitField.name, val: sql_1.ExpVal.num0
                });
            return [insert];
        }
        p.statements.push(...createInitSetting(consts_1.settingQueueSeed, 'big', sql_1.ExpVal.num0), ...createInitSetting(consts_1.settingQueueInSeed, 'big', sql_1.ExpVal.num0), ...createInitSetting(consts_1.settingQueueInSeed, 'big', sql_1.ExpVal.num0), ...createInitSetting(consts_1.settingIDLocalSeed, 'big', sql_1.ExpVal.num0));
        let selectSheetSeed = factory.createSelect();
        selectSheetSeed.column(new sql_1.ExpFunc(factory.func_max, new sql_1.ExpField('id')));
        // il.EnumSysTable.sheet 是带$unit字段的。
        // 但是，这里是取全局sheet max id，所以不能带$unit比较
        // 所以，需要改成下面这个语句
        // selectSheetSeed.from(this.context.sysTable(il.EnumSysTable.sheet));
        selectSheetSeed.from((0, __1.sysTable)(il.EnumSysTable.sheet));
        p.statements.push(...createInitSetting(consts_1.settingSheetSeed, 'big', new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpSelect(selectSheetSeed), sql_1.ExpVal.num0)));
        p.statements.push(...createInitSetting(consts_1.settingTimezone, 'int', new sql_1.ExpNum(8)));
    }
    setSettingProc(p) {
        let { factory, hasUnit, unitField } = this.context;
        let name = new il.Field;
        name.name = 'name';
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
        upsert.cols.push({ col: value.name, val: new sql.ExpVar(value.name) });
        if (hasUnit === true) {
            upsert.keys.push({ col: unitField.name, val: new sql.ExpVar(unitField.name) });
        }
        upsert.keys.push({ col: name.name, val: new sql.ExpVar(name.name) });
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('name'), new sql_1.ExpStr('uniqueunit'));
        let insertUnit = factory.createInsert();
        iff.then(insertUnit);
        insertUnit.table = (0, __1.sysTable)(il.EnumSysTable.unit);
        insertUnit.ignore = true;
        insertUnit.cols = [
            { col: 'unit', val: new sql_1.ExpVar('value') }
        ];
    }
    getSettingProc(p) {
        p.addUnitParameter();
        let nameField = (0, il_1.charField)('name', 50);
        p.parameters.push(nameField);
        let { factory, unitField, hasUnit } = this.context;
        let select = factory.createSelect();
        p.statements.push(select);
        select.column(new sql.ExpField('value', 'a'));
        select.from(new statementWithFrom_1.EntityTable('$setting', false, 'a'));
        let eqName = new sql.ExpEQ(new sql.ExpField('name', 'a'), new sql.ExpVar('name'));
        let where;
        if (hasUnit === true) {
            where = new sql.ExpAnd(eqName, new sql.ExpEQ(new sql.ExpField(unitField.name, 'a'), new sql.ExpVar(unitField.name)));
        }
        else {
            where = eqName;
        }
        select.where(where);
    }
    constStrsProc(p) {
        let factory = this.context.factory;
        let select = factory.createSelect();
        p.statements.push(select);
        select.from((0, __1.sysTable)(il.EnumSysTable.const));
        select.column(new sql.ExpField('id')).column(new sql.ExpField('name'));
    }
    constStrProc(p) {
        let param = 'name';
        const tblConst = (0, __1.sysTable)(il.EnumSysTable.const);
        let { parameters, statements } = p;
        parameters.push((0, il_1.textField)(param));
        let { factory } = this.context;
        let declare = factory.createDeclare();
        declare.var('ret', new il_1.Int());
        statements.push(declare);
        let varTable = this.splitIdsTable(p.statements, param, '\t', new il_1.Char(100));
        let selectNames = factory.createSelect();
        selectNames.col('id', 'name');
        selectNames.from(new statementWithFrom_1.VarTable(varTable.name));
        let insert = factory.createInsert();
        statements.push(insert);
        insert.ignore = true;
        insert.table = tblConst;
        insert.cols = [
            { col: 'name', val: undefined },
        ];
        insert.select = selectNames;
        let taNames = new statementWithFrom_1.VarTable(varTable.name, 'a');
        let tbConst = (0, __1.sysTable)(il.EnumSysTable.const, 'b');
        let selectRet = factory.createSelect();
        statements.push(selectRet);
        selectRet.col('id', undefined, 'b');
        selectRet.col('name', undefined, 'b');
        selectRet.from(taNames)
            .join(il_1.JoinType.join, tbConst)
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', 'a'), new sql_1.ExpField('name', 'b')));
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
    savePhrasesProc(p) {
        const param = 'phrases';
        const tblPhrase = (0, __1.sysTable)(il.EnumSysTable.phrase);
        let { parameters, statements } = p;
        parameters.push((0, il_1.textField)(param));
        let { factory } = this.context;
        let declare = factory.createDeclare();
        const pName = '$pname';
        const $name = '$name';
        const $caption = '$caption';
        const $base = '$base';
        const $ownerId = '$ownerId';
        const $type = '$type';
        const varName = new sql_1.ExpVar($name);
        declare.var('ret', new il_1.Int());
        declare.var(pName, new il_1.Char(200));
        declare.var($base, new il_1.BigInt());
        declare.var($ownerId, new il_1.BigInt());
        statements.push(declare);
        let fields = [
            (0, il_1.charField)('name', 200),
            (0, il_1.charField)('caption', 200),
            (0, il_1.charField)('basename', 200),
            (0, il_1.tinyIntField)('type'),
        ];
        let varTable = this.strToTable(p.statements, param, '\\n', '\\t', fields);
        let updateInvalid = factory.createUpdate();
        statements.push(updateInvalid);
        updateInvalid.table = tblPhrase;
        updateInvalid.cols = [
            { col: 'valid', val: sql_1.ExpNum.num0 }
        ];
        updateInvalid.where = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
        let taNames = new statementWithFrom_1.VarTable(varTable.name, 'a');
        let tbPhrase = (0, __1.sysTable)(il.EnumSysTable.phrase, 'b');
        // 第一次循环, 保存id
        {
            let setPNameEmpty = factory.createSet();
            statements.push(setPNameEmpty);
            setPNameEmpty.equ(pName, new sql_1.ExpStr(''));
            let loop = factory.createWhile();
            statements.push(loop);
            loop.no = 999;
            loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
            let lstats = loop.statements;
            let setNameNull = factory.createSet();
            lstats.add(setNameNull);
            setNameNull.equ($name, sql_1.ExpVal.null);
            let selectName = factory.createSelect();
            lstats.add(selectName);
            selectName.toVar = true;
            selectName.col('name', $name);
            selectName.column(new sql_1.ExpSearchCase([
                new sql_1.ExpEQ(new sql_1.ExpFunc(factory.func_length, new sql_1.ExpField('caption')), sql_1.ExpNum.num0),
                sql_1.ExpVal.null,
            ], new sql_1.ExpField('caption')), $caption);
            selectName.col('type', $type);
            selectName.from(new statementWithFrom_1.VarTable(varTable.name));
            selectName.where(new sql_1.ExpGT(new sql_1.ExpField('name'), new sql_1.ExpVar(pName)));
            selectName.order(new sql_1.ExpField('name'), 'asc');
            selectName.limit(sql_1.ExpNum.num1);
            let ifNameNull = factory.createIf();
            lstats.add(ifNameNull);
            ifNameNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar($name));
            let leave = factory.createBreak();
            ifNameNull.then(leave);
            leave.no = loop.no;
            let update = factory.createUpdate();
            lstats.add(update);
            update.table = tblPhrase;
            update.cols = [
                { col: 'caption', val: new sql_1.ExpVar($caption) },
                { col: 'type', val: new sql_1.ExpVar($type) },
                { col: 'valid', val: sql_1.ExpNum.num1 },
            ];
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar($name));
            let if0 = factory.createIf();
            lstats.add(if0);
            if0.cmp = new sql_1.ExpEQ(new sql_1.ExpFunc(factory.func_rowCount), sql_1.ExpNum.num0);
            let insert = factory.createInsert();
            if0.then(insert);
            insert.table = tblPhrase;
            insert.cols = [
                { col: 'id', val: new sql_1.ExpFuncInUq('$IDNU', [sql_1.ExpNum.num0], true) },
                { col: 'name', val: new sql_1.ExpVar($name) },
                { col: 'caption', val: new sql_1.ExpVar($caption) },
                { col: 'type', val: new sql_1.ExpVar($type) },
            ];
            let setPName = factory.createSet();
            lstats.add(setPName);
            setPName.equ(pName, new sql_1.ExpVar($name));
        }
        // 第二次循环, 保存owner
        {
            let setPNameEmpty = factory.createSet();
            statements.push(setPNameEmpty);
            setPNameEmpty.equ(pName, new sql_1.ExpStr(''));
            let loop = factory.createWhile();
            statements.push(loop);
            loop.no = 997;
            loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
            let lstats = loop.statements;
            let setNameNull = factory.createSet();
            lstats.add(setNameNull);
            setNameNull.equ($name, sql_1.ExpVal.null);
            let selectName = factory.createSelect();
            lstats.add(selectName);
            selectName.toVar = true;
            selectName.column(new sql_1.ExpField('name'), $name);
            selectName.column(new sql_1.ExpField('id'), $base);
            selectName.from(tbPhrase);
            selectName.where(new sql_1.ExpGT(new sql_1.ExpField('name'), new sql_1.ExpVar(pName)));
            selectName.order(new sql_1.ExpField('name'), 'asc');
            selectName.limit(sql_1.ExpNum.num1);
            let ifNameNull = factory.createIf();
            lstats.add(ifNameNull);
            ifNameNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar($name));
            let leave = factory.createBreak();
            ifNameNull.then(leave);
            leave.no = loop.no;
            let selectOwnerId = factory.createSelect();
            selectOwnerId.col('id');
            selectOwnerId.from(tblPhrase);
            selectOwnerId.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpFunc(factory.func_substr, varName, sql_1.ExpNum.num1, new sql_1.ExpSub(new sql_1.ExpFunc(factory.func_length, varName), new sql_1.ExpFunc(factory.func_length, new sql_1.ExpFunc(factory.func_substring_index, varName, new sql_1.ExpStr('.'), sql_1.ExpNum.num_1)), sql_1.ExpNum.num1))));
            let setOwnerId = factory.createSet();
            lstats.add(setOwnerId);
            setOwnerId.equ($ownerId, new sql_1.ExpFunc(factory.func_ifnull, new sql_1.ExpSelect(selectOwnerId), sql_1.ExpNum.num0));
            let updateOwner = factory.createUpdate();
            lstats.add(updateOwner);
            updateOwner.table = tblPhrase;
            updateOwner.cols = [
                { col: 'owner', val: new sql_1.ExpVar($ownerId) }
            ];
            updateOwner.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar($base));
            let setPName = factory.createSet();
            lstats.add(setPName);
            setPName.equ(pName, new sql_1.ExpVar($name));
        }
        // 第三次循环, 保存base
        {
            let setPNameEmpty = factory.createSet();
            statements.push(setPNameEmpty);
            setPNameEmpty.equ(pName, new sql_1.ExpStr(''));
            let loop = factory.createWhile();
            statements.push(loop);
            loop.no = 998;
            loop.cmp = new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1);
            let lstats = loop.statements;
            let setNameNull = factory.createSet();
            lstats.add(setNameNull);
            setNameNull.equ($name, sql_1.ExpVal.null);
            let selectName = factory.createSelect();
            lstats.add(selectName);
            selectName.toVar = true;
            selectName.column(new sql_1.ExpField('name', 'a'), $name);
            selectName.column(new sql_1.ExpField('id', 'b'), $base);
            selectName.from(new statementWithFrom_1.VarTable(varTable.name, 'a'))
                .join(il_1.JoinType.left, (0, __1.sysTable)(il.EnumSysTable.phrase, 'b'))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('basename', 'a'), new sql_1.ExpField('name', 'b')));
            selectName.where(new sql_1.ExpGT(new sql_1.ExpField('name', 'a'), new sql_1.ExpVar(pName)));
            selectName.order(new sql_1.ExpField('name', 'a'), 'asc');
            selectName.limit(sql_1.ExpNum.num1);
            let ifNameNull = factory.createIf();
            lstats.add(ifNameNull);
            ifNameNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar($name));
            let leave = factory.createBreak();
            ifNameNull.then(leave);
            leave.no = loop.no;
            let ifBaseNull = factory.createIf();
            lstats.add(ifBaseNull);
            ifBaseNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar($base));
            let setBase0 = factory.createSet();
            ifBaseNull.then(setBase0);
            setBase0.equ($base, sql_1.ExpNum.num0);
            let update = factory.createUpdate();
            lstats.add(update);
            update.table = tblPhrase;
            update.cols = [
                { col: 'base', val: new sql_1.ExpVar($base) },
            ];
            update.where = new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar($name));
            let setPName = factory.createSet();
            lstats.add(setPName);
            setPName.equ(pName, new sql_1.ExpVar($name));
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
            .join(il_1.JoinType.join, tbPhrase)
            .on(new sql_1.ExpEQ(new sql_1.ExpField('name', 'a'), new sql_1.ExpField('name', 'b')));
        selectRet.where(new sql_1.ExpGT(new sql_1.ExpField('valid', 'b'), sql_1.ExpNum.num0));
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
`;
    }
    timezoneFunc(p) {
        let { factory, unitField, userParam, unitFieldName, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam);
        let userParamName = userParam.name;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('tz', new il_1.TinyInt());
        declare.var('tzUser', new il_1.TinyInt());
        let selectTzUnit = factory.createSelect();
        statements.push(selectTzUnit);
        selectTzUnit.toVar = true;
        selectTzUnit.lock = select_1.LockType.update;
        selectTzUnit.column(new sql_1.ExpField('timezone'), 'tz');
        selectTzUnit.from((0, __1.sysTable)(il.EnumSysTable.unit));
        selectTzUnit.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar(unitFieldName)));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar(userParamName));
        let selectTzUser = factory.createSelect();
        iff.then(selectTzUser);
        selectTzUser.toVar = true;
        selectTzUser.lock = select_1.LockType.update;
        selectTzUser.column(new sql_1.ExpField('timezone'), 'tzUser');
        selectTzUser.from((0, __1.sysTable)(il.EnumSysTable.user));
        selectTzUser.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParamName))));
        let iffTzUser = factory.createIf();
        iff.then(iffTzUser);
        iffTzUser.cmp = new sql_1.ExpIsNotNull(new sql_1.ExpVar('tzUser'));
        let setTz = factory.createSet();
        iffTzUser.then(setTz);
        setTz.equ('tz', new sql_1.ExpVar('tzUser'));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.expVal = new sql_1.ExpVar('tz');
    }
    bizMonthFunc(p) {
        let { factory, unitField, unitFieldName } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('ret', new il_1.TinyInt());
        let selectTzUnit = factory.createSelect();
        statements.push(selectTzUnit);
        selectTzUnit.toVar = true;
        selectTzUnit.lock = select_1.LockType.update;
        selectTzUnit.column(new sql_1.ExpField('bizmonth'), 'ret');
        selectTzUnit.from((0, __1.sysTable)(il.EnumSysTable.unit));
        selectTzUnit.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar(unitFieldName)));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.expVal = new sql_1.ExpVar('ret');
    }
    bizDateFunc(p) {
        let { factory, unitField, unitFieldName } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField);
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('ret', new il_1.TinyInt());
        let selectTzUnit = factory.createSelect();
        statements.push(selectTzUnit);
        selectTzUnit.toVar = true;
        selectTzUnit.lock = select_1.LockType.update;
        selectTzUnit.column(new sql_1.ExpField('bizdate'), 'ret');
        selectTzUnit.from((0, __1.sysTable)(il.EnumSysTable.unit));
        selectTzUnit.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar(unitFieldName)));
        let ret = factory.createReturn();
        statements.push(ret);
        ret.expVal = new sql_1.ExpVar('ret');
    }
    bizMonthIdFunc(p) {
        let { parameters, statements } = p;
        parameters.push((0, il_1.dateField)('date'), (0, il_1.intField)('bizDate'));
        let builder = new BizMonthIdBuilder(this.context, statements);
        builder.build();
    }
    bizYearIdFunc(p) {
        let { parameters, statements } = p;
        parameters.push((0, il_1.dateField)('date'), (0, il_1.intField)('bizMonth'), (0, il_1.intField)('bizDate'));
        let builder = new BizYearIdBuilder(this.context, statements);
        builder.build();
    }
    minuteIdDate(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.bigIntField)('minuteId'), (0, il_1.tinyIntField)('timeZone'));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('ret', new il_1.DDate());
        let set = factory.createSet();
        p.statements.push(set);
        set.equ('ret', this.expDate());
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = 'ret';
    }
    minuteIdTime(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.bigIntField)('minuteId'), (0, il_1.tinyIntField)('timeZone'));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('ret', new il_1.DateTime());
        let set = factory.createSet();
        p.statements.push(set);
        set.equ('ret', this.expTime());
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = 'ret';
    }
    minuteIdMonth(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.bigIntField)('minuteId'), (0, il_1.tinyIntField)('timeZone'));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('ret', new il_1.DDate());
        let set = factory.createSet();
        p.statements.push(set);
        set.equ('ret', this.expDate());
        let setMonth = factory.createSet();
        p.statements.push(setMonth);
        setMonth.equ('ret', new sql_1.ExpFuncCustom(factory.func_dateadd, new sql_1.ExpDatePart('day'), new sql_1.ExpAdd(new sql_1.ExpNeg(new sql_1.ExpFunc('dayofmonth', new sql_1.ExpVar('ret'))), sql_1.ExpNum.num1), new sql_1.ExpVar('ret')));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = 'ret';
    }
    minuteIdPeriod(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.bigIntField)('minuteId'), (0, il_1.tinyIntField)('timeZone'), (0, il_1.tinyIntField)('period'));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        const ret = 'date';
        declare.var(ret, new il_1.DDate());
        declare.var('bizDate', new il_1.TinyInt());
        let setBzDate = factory.createSet();
        p.statements.push(setBzDate);
        setBzDate.equ('bizDate', new sql_1.ExpVar('period'));
        let set = factory.createSet();
        p.statements.push(set);
        set.equ(ret, this.expDate());
        let iff = factory.createIf();
        p.statements.push(iff);
        iff.cmp = new sql_1.ExpGT(new sql_1.ExpVar('period'), sql_1.ExpNum.num0);
        let then = [];
        let mip = new MinuteIdPeriod(this.context, then);
        mip.build();
        iff.then(...then);
        let retn = factory.createReturn();
        p.statements.push(retn);
        retn.returnVar = ret;
    }
    expTime() {
        let { factory } = this.context;
        return new sql_1.ExpFunc(factory.func_from_unixtime, new sql_1.ExpMul(new sql_1.ExpAdd(new sql_1.ExpNum(consts_1.minteIdOf2020_01_01), new sql_1.ExpFunc(factory.func_timestampdiff, new sql_1.ExpDatePart('minute'), new sql_1.ExpFunc(factory.func_now), new sql_1.ExpFuncCustom(factory.func_utc_timestamp)), new sql_1.ExpFunc(factory.func_if, new sql_1.ExpLT(new sql_1.ExpVar('minuteId'), sql_1.ExpNum.num0), new sql_1.ExpNeg(new sql_1.ExpBitRight(new sql_1.ExpNeg(new sql_1.ExpVar('minuteId')), new sql_1.ExpNum(20))), new sql_1.ExpBitRight(new sql_1.ExpVar('minuteId'), new sql_1.ExpNum(20))), new sql_1.ExpMul(new sql_1.ExpVar('timeZone'), new sql_1.ExpNum(60))), new sql_1.ExpNum(60)));
    }
    expDate() {
        let { factory } = this.context;
        return new sql_1.ExpFunc(factory.func_date, this.expTime());
    }
    minuteIdFromDate(p) {
        let { factory } = this.context;
        // (TIMESTAMPDIFF( minute , '2020-1-1', '2021-9-1')<<20)
        p.parameters.push((0, il_1.dateField)('date'), (0, il_1.tinyIntField)('timeZone'));
        let declare = factory.createDeclare();
        p.statements.push(declare);
        declare.var('ret', new il_1.BigInt());
        let set = factory.createSet();
        p.statements.push(set);
        set.equ('ret', new sql_1.ExpAdd(new sql_1.ExpDiv(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpVar('date')), new sql_1.ExpNum(60)), new sql_1.ExpFunc(factory.func_timestampdiff, new sql_1.ExpDatePart('minute'), new sql_1.ExpFuncCustom(factory.func_utc_timestamp), new sql_1.ExpFunc(factory.func_now)), new sql_1.ExpNeg(new sql_1.ExpNum(consts_1.minteIdOf2020_01_01)), new sql_1.ExpNeg(new sql_1.ExpMul(new sql_1.ExpVar('timeZone'), new sql_1.ExpNum(60)))));
        let setBitLeft = factory.createSet();
        p.statements.push(setBitLeft);
        setBitLeft.equ('ret', new sql_1.ExpFunc(factory.func_if, new sql_1.ExpLT(new sql_1.ExpVar('ret'), sql_1.ExpNum.num0), new sql_1.ExpNeg(new sql_1.ExpBitLeft(new sql_1.ExpNeg(new sql_1.ExpVar('ret')), new sql_1.ExpNum(20))), new sql_1.ExpBitLeft(new sql_1.ExpVar('ret'), new sql_1.ExpNum(20))));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.returnVar = 'ret';
    }
    expTimeOfUMinut() {
        let { factory } = this.context;
        const uminute = 'uminute';
        const varUMinute = new sql_1.ExpVar(uminute);
        const varTimeZone = new sql_1.ExpVar('timeZone');
        return new sql_1.ExpFunc(factory.func_from_unixtime, new sql_1.ExpMul(new sql_1.ExpAdd(new sql_1.ExpBitRight(varUMinute, new sql_1.ExpNum(20)), new sql_1.ExpFunc(factory.func_timestampdiff, new sql_1.ExpDatePart('minute'), new sql_1.ExpFunc(factory.func_now), new sql_1.ExpFuncCustom(factory.func_utc_timestamp)), new sql_1.ExpMul(varTimeZone, new sql_1.ExpNum(60))), new sql_1.ExpNum(60)));
    }
    expDateOfUMinut() {
        let { factory } = this.context;
        return new sql_1.ExpFunc(factory.func_date, this.expTimeOfUMinut());
    }
    uminute(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.intField)('stamp'));
        let val = new sql_1.ExpFuncInUq('$idmu', [
            // ExpNum.num0, 
            sql_1.ExpNum.num0, new sql_1.ExpVar('stamp')
        ], true);
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = val;
    }
    uminuteFromTime(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.dateTimeField)('time'), (0, il_1.tinyIntField)('timeZone'));
        let val = new sql_1.ExpBitLeft(new sql_1.ExpSub(new sql_1.ExpDiv(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpVar('time')), new sql_1.ExpNum(60)), new sql_1.ExpFunc(factory.func_timestampdiff, new sql_1.ExpDatePart('minute'), new sql_1.ExpFunc(factory.func_now), new sql_1.ExpFuncCustom(factory.func_utc_timestamp)), new sql_1.ExpMul(new sql_1.ExpVar('timeZone'), new sql_1.ExpNum(60))), new sql_1.ExpNum(20));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = val;
    }
    uminuteDate(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.bigIntField)('uminute'), (0, il_1.tinyIntField)('timeZone'));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = this.expDateOfUMinut();
    }
    uminuteTime(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.bigIntField)('uminute'), (0, il_1.tinyIntField)('timeZone'));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = this.expTimeOfUMinut();
    }
    uminuteStamp(p) {
        let { factory } = this.context;
        p.parameters.push((0, il_1.bigIntField)('minuteId'));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = new sql_1.ExpMul(new sql_1.ExpBitRight(new sql_1.ExpVar('minuteId'), new sql_1.ExpNum(20)), new sql_1.ExpNum(60));
    }
    me(p) {
        let { factory } = this.context;
        const $site = '$site', $user = '$user';
        const varSite = new sql_1.ExpVar($site), varUser = new sql_1.ExpVar($user);
        p.parameters.push((0, il_1.bigIntField)($site), (0, il_1.bigIntField)($user));
        let ret = factory.createReturn();
        p.statements.push(ret);
        ret.expVal = new sql_1.ExpFuncInUq('$usersite$id', [varSite, varUser, sql_1.ExpNum.num1, varSite, varUser], true);
    }
}
exports.SettingProcedures = SettingProcedures;
class BizIdBuilder {
    constructor(context, statements) {
        this.context = context;
        this.statements = statements;
    }
    build() {
        this.buildCheckParam();
        this.buildPre();
        this.buildMid();
        this.buildRet();
    }
    buildCheckParam() {
    }
    buildPre() {
        let { factory } = this.context;
        let { statements } = this;
        let vDate = new sql_1.ExpVar('date');
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.vars((0, il_1.intField)('yr'), (0, il_1.intField)('mn'), (0, il_1.intField)('dt'));
        let setYr = factory.createSet();
        statements.push(setYr);
        setYr.equ('yr', new sql_1.ExpFunc(factory.func_year, vDate));
        let setMn = factory.createSet();
        statements.push(setMn);
        setMn.equ('mn', new sql_1.ExpSub(new sql_1.ExpFunc(factory.func_month, vDate), sql_1.ExpNum.num1));
        let setDt = factory.createSet();
        statements.push(setDt);
        setDt.equ('dt', new sql_1.ExpFunc('DAYOFMONTH', vDate));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpLT(new sql_1.ExpVar('dt'), new sql_1.ExpVar('bizDate'));
        let decMn = factory.createSet();
        iff.then(decMn);
        decMn.equ('mn', new sql_1.ExpSub(new sql_1.ExpVar('mn'), sql_1.ExpNum.num1));
        let iffMnNeg = factory.createIf();
        statements.push(iffMnNeg);
        iffMnNeg.cmp = new sql_1.ExpLT(new sql_1.ExpVar('mn'), sql_1.ExpNum.num0);
        let setMn11 = factory.createSet();
        iffMnNeg.then(setMn11);
        setMn11.equ('mn', new sql_1.ExpNum(11));
        let decYr = factory.createSet();
        iffMnNeg.then(decYr);
        decYr.equ('yr', new sql_1.ExpSub(new sql_1.ExpVar('yr'), sql_1.ExpNum.num1));
    }
    buildMid() {
    }
    buildDateExp() {
        let { factory } = this.context;
        return new sql_1.ExpFuncCustom(factory.func_dateadd, new sql_1.ExpDatePart('day'), new sql_1.ExpSub(new sql_1.ExpVar('bizDate'), sql_1.ExpNum.num1), new sql_1.ExpFuncCustom(factory.func_dateadd, new sql_1.ExpDatePart('month'), this.expRetMonth, new sql_1.ExpFunc('makedate', new sql_1.ExpVar('yr'), sql_1.ExpNum.num1)));
    }
    buildRet() {
        // RETURN DATE_ADD(DATE_ADD(MAKEDATE(yr, 1), INTERVAL mn-1 MONTH), INTERVAL _bizDate-1 DAY)
        let { factory } = this.context;
        let ret = factory.createReturn();
        this.statements.push(ret);
        ret.expVal = this.buildDateExp();
    }
}
class BizMonthIdBuilder extends BizIdBuilder {
    get expRetMonth() {
        return new sql_1.ExpVar('mn');
    }
    ;
    buildCheckParam() {
        let { factory } = this.context;
        let ifBizDate0 = factory.createIf();
        this.statements.push(ifBizDate0);
        ifBizDate0.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('bizDate'), sql_1.ExpNum.num0);
        let retDate = factory.createReturn();
        ifBizDate0.then(retDate);
        retDate.expVal = new sql_1.ExpVar('date');
    }
}
class BizYearIdBuilder extends BizIdBuilder {
    buildMid() {
        let { factory } = this.context;
        let ifMnBizMonth = factory.createIf();
        this.statements.push(ifMnBizMonth);
        ifMnBizMonth.cmp = new sql_1.ExpLT(new sql_1.ExpVar('mn'), new sql_1.ExpVar('bizMonth'));
        let decYr = factory.createSet();
        ifMnBizMonth.then(decYr);
        decYr.equ('yr', new sql_1.ExpSub(new sql_1.ExpVar('yr'), sql_1.ExpNum.num1));
    }
    get expRetMonth() {
        return new sql_1.ExpSub(new sql_1.ExpVar('bizMonth'), sql_1.ExpNum.num1);
    }
    ;
    buildCheckParam() {
        let { factory } = this.context;
        let ifBizDate0 = factory.createIf();
        this.statements.push(ifBizDate0);
        ifBizDate0.cmp = new sql_1.ExpEQ(new sql_1.ExpVar('bizMonth'), sql_1.ExpNum.num0);
        let retDate = factory.createReturn();
        ifBizDate0.then(retDate);
        retDate.expVal = new sql_1.ExpFunc(this.context.twProfix + '$biz_month_id', new sql_1.ExpVar('date'), new sql_1.ExpVar('bizDate'));
    }
}
class MinuteIdPeriod extends BizIdBuilder {
    get expRetMonth() {
        return new sql_1.ExpVar('mn');
    }
    ;
    build() {
        this.buildPre();
        let { factory } = this.context;
        let set = factory.createSet();
        this.statements.push(set);
        set.equ('date', this.buildDateExp());
    }
}
//# sourceMappingURL=settingProcs.js.map