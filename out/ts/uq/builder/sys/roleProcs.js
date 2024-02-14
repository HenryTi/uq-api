"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleProcedures = void 0;
const sql = require("../sql");
const sql_1 = require("../sql");
const sysProcedures_1 = require("./sysProcedures");
const il_1 = require("../../il");
const dbContext_1 = require("../dbContext");
class RoleProcedures extends sysProcedures_1.SysProcedures {
    build() {
        this.getMyRolesProc(this.sysProc('$role_my_roles'));
        this.getAllRoleUsersProc(this.sysProc('$role_all_role_users'));
        this.setUserRoleProc(this.sysProc('$role_set_user_role'));
        this.deleteUserRoleProc(this.sysProc('$role_delete_user_role'));
        this.setUnitAdminProc(this.sysProc('$role_set_unit_admin'));
        this.getAdmins(this.sysProc('$role_get_admins'));
        this.setMeAdmin(this.sysProc('$role_set_me_admin'));
        this.setAdmin(this.sysProc('$role_set_admin'));
        this.isAdmin(this.sysProc('$role_is_admin'));
    }
    getMyRolesProc(p) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(unitField, userParam);
        let a = 'a';
        let selectAdmin = factory.createSelect();
        statements.push(selectAdmin);
        selectAdmin.column(new sql_1.ExpField('id', a));
        selectAdmin.column(new sql_1.ExpField('site', a));
        selectAdmin.column(new sql_1.ExpField('user', a));
        selectAdmin.column(new sql_1.ExpField('admin', a));
        selectAdmin.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.userSite, a));
        let adminWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('user', a), new sql_1.ExpVar('$user'))
        ];
        selectAdmin.where(new sql_1.ExpAnd(...adminWheres));
        let selectRole = factory.createSelect();
        statements.push(selectRole);
        selectRole.column(new sql_1.ExpField('id', a));
        selectRole.column(new sql_1.ExpField('site', a));
        selectRole.column(new sql_1.ExpField('user', a));
        selectRole.column(new sql_1.ExpField('name', 'c'), 'role');
        selectRole.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.ixRole, a))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.ixRole, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('id', 'b')))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.const, 'c'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('role', 'b'), new sql_1.ExpField('id', 'c')));
        let roleWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('user', a), new sql_1.ExpVar('$user'))
        ];
        selectRole.where(new sql_1.ExpAnd(...roleWheres));
    }
    expExistsAdmin() {
        let { factory } = this.context;
        let selectAdmin = factory.createSelect();
        selectAdmin.col('id');
        selectAdmin.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.userSite));
        selectAdmin.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('site'), new sql_1.ExpVar('unit')), new sql_1.ExpEQ(new sql_1.ExpField('user'), new sql_1.ExpVar('$user')), new sql_1.ExpEQ(new sql_1.ExpBitAnd(new sql_1.ExpField('admin'), sql_1.ExpNum.num2), sql_1.ExpNum.num2)));
        return new sql_1.ExpExists(selectAdmin);
    }
    selectRoleEntity() {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        declare.var('roleId', new il_1.Int());
        let selectEntity = factory.createSelect();
        selectEntity.toVar = true;
        selectEntity.col('id', 'roleId');
        selectEntity.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpVar('role')));
        return [declare, selectEntity];
    }
    createSelectUserUnit() {
        let { factory } = this.context;
        let selectUserUnit = factory.createSelect();
        selectUserUnit.col('id');
        selectUserUnit.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.userSite));
        selectUserUnit.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('user'), new sql_1.ExpVar('theUser')), new sql_1.ExpEQ(new sql_1.ExpField('unit'), new sql_1.ExpVar('unit'))));
        return selectUserUnit;
    }
    getAllRoleUsersProc(p) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = (0, il_1.idField)('unit', 'big');
        parameters.push(unitField, userParam, uqUnitField);
        const a = 'a';
        let selectRole = factory.createSelect();
        statements.push(selectRole);
        selectRole.column(new sql_1.ExpField('id', a));
        selectRole.column(new sql_1.ExpField('unit', a));
        selectRole.column(new sql_1.ExpField('user', a));
        selectRole.column(new sql_1.ExpField('role', 'b'));
        selectRole.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.userSite, a))
            .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(il_1.EnumSysTable.ixRole, 'b'))
            .on(new sql_1.ExpEQ(new sql_1.ExpField('id', a), new sql_1.ExpField('id', 'b')));
        let roleWheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('unit', a), new sql_1.ExpVar('unit')),
            this.expExistsAdmin(),
        ];
        selectRole.where(new sql_1.ExpAnd(...roleWheres));
    }
    setUserRoleProc(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = (0, il_1.idField)('unit', 'big');
        parameters.push(unitField, userParam, uqUnitField, (0, il_1.idField)('theUser', 'big'), (0, il_1.charField)('role', 100));
        statements.push(...this.selectRoleEntity());
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpAnd(this.expExistsAdmin(), new sql_1.ExpIsNotNull(new sql_1.ExpVar('roleId')));
        let upsert = factory.createInsert();
        iff.then(upsert);
        upsert.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.ixRole);
        upsert.keys = [
            { col: 'id', val: new sql_1.ExpVar('userunit') },
        ];
        upsert.cols.push({ col: 'role', val: new sql_1.ExpVar('roleId') });
    }
    deleteUserRoleProc(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = (0, il_1.idField)('unit', 'big');
        parameters.push(unitField, userParam, uqUnitField, (0, il_1.idField)('theUser', 'big'), (0, il_1.charField)('role', 100));
        statements.push(...this.selectRoleEntity());
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpAnd(this.expExistsAdmin(), new sql_1.ExpIsNotNull(new sql_1.ExpVar('roleId')));
        let del = factory.createDelete();
        iff.then(del);
        let selectUserUnit = this.createSelectUserUnit();
        del.tables = [(0, dbContext_1.sysTable)(il_1.EnumSysTable.ixRole)];
        let delWheres = [
            new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpSelect(selectUserUnit))
        ];
        del.where(new sql.ExpAnd(...delWheres));
    }
    setUnitAdminProc(p) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = (0, il_1.idField)('unit', 'big');
        parameters.push(unitField, userParam, uqUnitField, (0, il_1.idField)('theUser', 'big'));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = this.expExistsAdmin();
        let upsert = factory.createInsert();
        iff.then(upsert);
        upsert.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.ixRole);
        upsert.keys = [
            { col: 'id', val: new sql_1.ExpSelect(this.createSelectUserUnit()) }
        ];
        upsert.cols.push({
            col: 'admin',
            val: new sql_1.ExpBitOr(new sql_1.ExpField('admin'), sql_1.ExpNum.num2)
        });
    }
    // 如果我是admin，我可以取出所有的admin的用户
    getAdmins(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = (0, il_1.idField)('unit', 'big');
        parameters.push(unitField, userParam, uqUnitField);
        let selMe = factory.createSelect();
        selMe.col('id');
        selMe.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.admin));
        selMe.where(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name)));
        let select = factory.createSelect();
        statements.push(select);
        const ta = 'a';
        select.column(new sql_1.ExpField('id', ta));
        select.column(new sql_1.ExpField('role', ta));
        select.column(new sql_1.ExpField('operator', ta));
        select.column(new sql_1.ExpField('assigned', ta));
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('create', ta)), 'create');
        select.column(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update', ta)), 'update');
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.admin, ta));
        let wheres = [
            new sql_1.ExpExists(selMe),
            new sql_1.ExpOr(new sql_1.ExpGT(new sql_1.ExpField('role', ta), sql_1.ExpNum.num0), new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('role', ta), sql_1.ExpNum.num_1), new sql_1.ExpGT(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update', ta)), new sql_1.ExpSub(new sql_1.ExpFuncCustom(factory.func_unix_timestamp), new sql_1.ExpNum(24 * 3600))))),
        ];
        select.where(new sql_1.ExpAnd(...wheres));
    }
    setMeAdmin(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = (0, il_1.idField)('unit', 'big');
        parameters.push(unitField, userParam, uqUnitField);
        let select = factory.createSelect();
        select.col('id');
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.admin));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name)), new sql_1.ExpOr(new sql_1.ExpEQ(new sql_1.ExpField('role'), sql_1.ExpNum.num1), new sql_1.ExpOr(new sql_1.ExpEQ(new sql_1.ExpField('role'), new sql_1.ExpNum(-1)), new sql_1.ExpGT(new sql_1.ExpFuncCustom(factory.func_unix_timestamp, new sql_1.ExpField('update')), new sql_1.ExpSub(new sql_1.ExpFuncCustom(factory.func_unix_timestamp), new sql_1.ExpNum(24 * 3600)))))));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new sql_1.ExpExists(select);
        let update = factory.createUpdate();
        iff.then(update);
        update.cols = [
            { col: 'role', val: new sql_1.ExpNeg(new sql_1.ExpField('role')) }
        ];
        update.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.admin);
        update.where = new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name));
    }
    setAdmin(p) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = (0, il_1.idField)('unit', 'big');
        parameters.push(unitField, userParam, uqUnitField, (0, il_1.intField)('user'), (0, il_1.tinyIntField)('role'), (0, il_1.charField)('assigned', 100));
        let select = factory.createSelect();
        select.col('id');
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.admin));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpVar(userParam.name)), new sql_1.ExpEQ(new sql_1.ExpField('role'), sql_1.ExpNum.num1)));
        let selectUserSysAdmin = factory.createSelect();
        selectUserSysAdmin.col('id');
        selectUserSysAdmin.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.admin));
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
        let upsert = factory.createInsert();
        statements.push(upsert);
        upsert.keys = [
            { col: 'id', val: new sql_1.ExpVar('user') },
        ];
        upsert.cols = [
            { col: 'role', val: new sql_1.ExpVar('role') },
            { col: 'operator', val: new sql_1.ExpVar(userParam.name) },
            { col: 'assigned', val: new sql_1.ExpVar('assigned') },
        ];
        upsert.table = (0, dbContext_1.sysTable)(il_1.EnumSysTable.admin);
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
        let uqUnitField = (0, il_1.idField)('unit', 'big');
        parameters.push(unitField, userParam, uqUnitField);
        let select = factory.createSelect();
        statements.push(select);
        select.col('id');
        select.from((0, dbContext_1.sysTable)(il_1.EnumSysTable.userSite));
        select.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('id'), new sql_1.ExpSelect(this.createSelectUserUnit())), new sql_1.ExpEQ(new sql_1.ExpBitAnd(new sql_1.ExpField('admin'), sql_1.ExpNum.num2), sql_1.ExpNum.num2)));
    }
}
exports.RoleProcedures = RoleProcedures;
//# sourceMappingURL=roleProcs.js.map