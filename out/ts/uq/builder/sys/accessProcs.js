"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessProcedures = void 0;
const sql = require("../sql");
const statementWithFrom_1 = require("../sql/statementWithFrom");
const sql_1 = require("../sql");
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
class AccessProcedures extends sysProcedures_1.SysProcedures {
    build() {
        // 下面这个存储过程很重要，每次调用都需要的。
        this.getAccessProc(this.sysProc('$get_access'));
        this.getMyRolesProc(this.sysProc('$get_my_roles'));
        this.getAllRoleUsersProc(this.sysProc('$get_all_role_users'));
        this.setUserRolesProc(this.sysProc('$set_user_roles'));
        this.deleteUserRolesProc(this.sysProc('$delete_user_roles'));
        this.setUnitAdminProc(this.sysProc('$set_unit_admin'));
        this.getAdmins(this.sysProc('$get_admins'));
        this.setMeAdmin(this.sysProc('$set_me_admin'));
        this.setAdmin(this.sysProc('$set_admin'));
        this.isAdmin(this.sysProc('$is_admin'));
    }
    getAccessProc(p) {
        let unitFieldName = '$unit';
        p.parameters.push((0, il_1.intField)(unitFieldName));
        let { unitField, factory, hasUnit } = this.context;
        let stats = p.statements;
        let expCmpUnit;
        let selectUnit = factory.createSelect();
        selectUnit.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit));
        if (hasUnit === true) {
            selectUnit.col('unit');
            selectUnit.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar(unitFieldName)));
            expCmpUnit = new sql_1.ExpNot(new sql_1.ExpExists(selectUnit));
        }
        else {
            selectUnit.column(new sql_1.ExpFunc(factory.func_count, new sql_1.ExpField('unit')));
            selectUnit.limit(new sql_1.ExpNum(2));
            expCmpUnit = new sql_1.ExpEQ(new sql_1.ExpSelect(selectUnit), sql_1.ExpVal.num0);
        }
        let iffUnit = factory.createIf();
        stats.push(iffUnit);
        iffUnit.cmp = expCmpUnit;
        let upsertUnit = factory.createUpsert();
        iffUnit.then(upsertUnit);
        upsertUnit.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit);
        upsertUnit.cols.push({
            col: 'flag',
            val: sql_1.ExpVal.num1
        });
        upsertUnit.keys.push({
            col: 'unit',
            val: new sql_1.ExpVar(unitFieldName)
        });
        let upsertUnitSetting = factory.createUpsert();
        iffUnit.then(upsertUnitSetting);
        upsertUnitSetting.table = new statementWithFrom_1.EntityTable('$setting', hasUnit);
        upsertUnitSetting.cols.push({
            col: 'value',
            val: hasUnit === true ? new sql_1.ExpNull() : new sql_1.ExpVar(unitFieldName)
        });
        upsertUnitSetting.keys.push({
            col: 'name',
            val: new sql_1.ExpStr('uniqueUnit')
        });
        if (hasUnit === true) {
            upsertUnitSetting.keys.push({
                col: unitFieldName,
                val: sql_1.ExpVal.num0
            });
        }
        // 2020-01-15: 这个表没有意义。但是 uq-api 中引用了，所以暂且先放一个空表吧
        let selectAnyone = factory.createSelect();
        stats.push(selectAnyone);
        selectAnyone.column(new sql.ExpField('id'), 'entity');
        selectAnyone.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
        selectAnyone.where(new sql_1.ExpEQ(sql_1.ExpNum.num0, sql_1.ExpNum.num1));
        let selectEntities = factory.createSelect();
        stats.push(selectEntities);
        selectEntities.column(new sql.ExpField('id'), 'entity');
        selectEntities.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
    }
    getMyRolesProc(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam);
        //this.checkAdmin(statements);
        let selectAdmin = factory.createSelect();
        selectAdmin.column(new sql_1.ExpField('admin'));
        selectAdmin.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit));
        selectAdmin.where(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar('$unit')));
        let select = factory.createSelect();
        statements.push(select);
        select.column(new sql_1.ExpField('user', 'a'));
        select.column(new sql_1.ExpField('roles', 'a'));
        select.column(new sql_1.ExpSearchCase([
            new sql_1.ExpEQ(new sql_1.ExpSelect(selectAdmin), new sql_1.ExpVar('$user')),
            sql_1.ExpNum.num1
        ], sql_1.ExpNum.num0), 'admin');
        select.from(new statementWithFrom_1.EntityTable('$user_roles', false, 'a'));
        let wheres = [new sql_1.ExpEQ(new sql_1.ExpField('user', 'a'), new sql_1.ExpVar('$user'))];
        /*
        select 自动添加 where $unit
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField('$unit', 'a'), new ExpVar('$unit')))
        }
        */
        select.where(new sql_1.ExpAnd(...wheres));
    }
    checkAdmin(statements) {
        let { factory } = this.context;
        let iff = factory.createIf();
        statements.push(iff);
        let select = factory.createSelect();
        select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit));
        select.column(sql_1.ExpNum.num1);
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar('$unit')), new sql_1.ExpEQ(new sql_1.ExpField('admin'), new sql_1.ExpVar('$user'))));
        iff.cmp = new sql_1.ExpNot(new sql_1.ExpExists(select));
        let signal = factory.createSignal();
        signal.text = new sql_1.ExpStr('is not admin');
        iff.then(signal);
    }
    getAllRoleUsersProc(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam);
        //this.checkAdmin(statements);
        let select = factory.createSelect();
        statements.push(select);
        select.column(new sql_1.ExpField('user', 'a'));
        select.column(new sql_1.ExpField('roles', 'a'));
        select.from(new statementWithFrom_1.EntityTable('$user_roles', false, 'a'));
        let wheres = [new sql_1.ExpEQ(sql_1.ExpNum.num1, sql_1.ExpNum.num1)];
        select.where(new sql_1.ExpAnd(...wheres));
    }
    setUserRolesProc(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam, (0, il_1.idField)('theUser', 'big'), (0, il_1.textField)('roles'));
        //this.checkAdmin(statements);
        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.table = new statementWithFrom_1.EntityTable('$user_roles', false);
        upsert.keys = [
            { col: 'user', val: new sql_1.ExpVar('theUser') }
        ];
        this.context.add$UnitCol(upsert.keys);
        upsert.cols.push({ col: 'roles', val: new sql_1.ExpVar('roles') });
    }
    deleteUserRolesProc(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam, (0, il_1.idField)('theUser', 'big'));
        //this.checkAdmin(statements);
        let del = factory.createDelete();
        statements.push(del);
        del.tables = [new statementWithFrom_1.EntityTable('$user_roles', false)];
        let delWheres = [
            new sql.ExpEQ(new sql.ExpField('user'), new sql.ExpVar('theUser'))
        ];
        if (hasUnit === true) {
            delWheres.push(new sql.ExpEQ(new sql.ExpField(unitField.name), new sql.ExpVar(unitField.name)));
        }
        del.where(new sql.ExpAnd(...delWheres));
    }
    setUnitAdminProc(p) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, (0, il_1.idField)('theUser', 'big'));
        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.unit);
        upsert.keys = [
            { col: 'unit', val: new sql_1.ExpVar('$unit') }
        ];
        upsert.cols.push({ col: 'admin', val: new sql_1.ExpVar('theUser') });
    }
    // 如果我是admin，我可以取出所有的admin的用户
    getAdmins(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam);
        let selMe = factory.createSelect();
        selMe.col('id');
        selMe.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.admin));
        selMe.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name)));
        let select = factory.createSelect();
        statements.push(select);
        const ta = 'a';
        //const tb = 'b';
        select.column(new sql_1.ExpField('id', ta));
        select.column(new sql_1.ExpField('role', ta));
        select.column(new sql_1.ExpField('operator', ta));
        select.column(new sql_1.ExpField('assigned', ta));
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('create', ta)), 'create');
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update', ta)), 'update');
        /*
        select.column(new ExpField('user', tb));
        select.column(new ExpField('name', tb));
        select.column(new ExpField('nick', tb));
        select.column(new ExpField('icon', tb));
        select.column(new ExpField('assigned', tb));
        */
        select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.admin, ta));
        //select.join('left', new EntityTable('$user_roles', false, tb))
        //    .on(new ExpEQ(new ExpField('id', ta), new ExpField('user', tb)));
        // role = -1 and changed in 24 hours, should be returned
        let wheres = [
            new sql_1.ExpExists(selMe),
            new sql_1.ExpOr(new sql_1.ExpGT(new sql_1.ExpField('role', ta), sql_1.ExpNum.num0), new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('role', ta), sql_1.ExpNum.num_1), new sql_1.ExpGT(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update', ta)), new sql_1.ExpSub(new sql_1.ExpFuncCustom(factory.func_unix_timestamp), new sql_1.ExpNum(24 * 3600))))),
        ];
        select.where(new sql_1.ExpAnd(...wheres));
    }
    setMeAdmin(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam);
        let select = factory.createSelect();
        select.col('id');
        select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.admin));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name)), new sql_1.ExpOr(new sql_1.ExpEQ(new sql_1.ExpField('role'), sql_1.ExpNum.num1), new sql_1.ExpOr(new sql_1.ExpEQ(new sql_1.ExpField('role'), new sql_1.ExpNum(-1)), new sql_1.ExpGT(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update')), new sql_1.ExpSub(new sql_1.ExpFuncCustom(factory.func_unix_timestamp), new sql_1.ExpNum(24 * 3600)))))));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpExists(select);
        let update = factory.createUpdate();
        iff.then(update);
        update.cols = [
            { col: 'role', val: new sql_1.ExpNeg(new sql_1.ExpField('role')) }
        ];
        update.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.admin);
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name));
    }
    setAdmin(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam, (0, il_1.intField)('user'), (0, il_1.tinyIntField)('role'), (0, il_1.charField)('assigned', 100));
        let select = factory.createSelect();
        select.col('id');
        select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.admin));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name)), new sql_1.ExpEQ(new sql_1.ExpField('role'), sql_1.ExpNum.num1)));
        let selectUserSysAdmin = factory.createSelect();
        selectUserSysAdmin.col('id');
        selectUserSysAdmin.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.admin));
        selectUserSysAdmin.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar('user')), new sql_1.ExpEQ(new sql_1.ExpField('role'), sql_1.ExpNum.num1), new sql_1.ExpNE(new sql_1.ExpField('operator'), new sql_1.ExpVar(userParam.name))));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpOr(new sql_1.ExpNot(new sql_1.ExpExists(select)), // if i am not sys admin
        new sql_1.ExpEQ(new sql_1.ExpVar(userParam.name), new sql_1.ExpVar('user')), // if i am the user
        new sql_1.ExpExists(selectUserSysAdmin), // if the user is sys admin
        new sql_1.ExpNot(new sql_1.ExpOr(// role must be 1, 2, -1, -2
        new sql_1.ExpEQ(new sql_1.ExpVar('role'), sql_1.ExpNum.num1), new sql_1.ExpEQ(new sql_1.ExpVar('role'), sql_1.ExpNum.num2), new sql_1.ExpEQ(new sql_1.ExpVar('role'), sql_1.ExpNum.num_1), new sql_1.ExpEQ(new sql_1.ExpVar('role'), new sql_1.ExpNum(-2)))));
        let leave = factory.createLeaveProc();
        iff.then(leave);
        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.keys = [
            { col: 'id', val: new sql_1.ExpVar('user') },
        ];
        upsert.cols = [
            { col: 'role', val: new sql_1.ExpVar('role') },
            { col: 'operator', val: new sql_1.ExpVar(userParam.name) },
            { col: 'assigned', val: new sql_1.ExpVar('assigned') },
        ];
        upsert.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.admin);
        /*
        let iffAdd = factory.createIf();
        statements.push(iffAdd);
        iffAdd.cmp = new ExpGT(new ExpVar('role'), ExpNum.num0);
        let upsertNick = factory.createUpsert();
        iffAdd.then(upsertNick);
        upsertNick.keys = [
            { col: 'user', val: new ExpVar('user') },
        ];
        upsertNick.cols = [
            { col: 'name', val: new ExpVar('name') },
            { col: 'nick', val: new ExpVar('nick') },
            { col: 'icon', val: new ExpVar('icon') },
            { col: 'assigned', val: new ExpVar('assigned') },
        ];
        upsertNick.table = new EntityTable('$user_roles', false);
        */
    }
    isAdmin(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam);
        let select = factory.createSelect();
        statements.push(select);
        select.col('id');
        select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.admin));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name)), new sql_1.ExpGT(new sql_1.ExpField('role'), sql_1.ExpNum.num0)));
    }
}
exports.AccessProcedures = AccessProcedures;
//# sourceMappingURL=accessProcs.js.map