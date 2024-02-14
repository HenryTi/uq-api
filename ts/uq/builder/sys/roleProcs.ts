import * as sql from '../sql';
import { EntityTable } from '../sql/statementWithFrom';
import {
    ExpEQ, ExpField, ExpVar, ExpExists, ExpNeg
    , ExpNot, ExpNull, ExpAnd, ExpNum, ExpStr
    , ExpCmp, ExpFunc, ExpSelect, ExpVal, ExpSub
    , ExpSearchCase, ExpOr, ExpGT, ExpFuncCustom, ExpLT, ExpNE, ExpBitAnd, ExpIsNotNull, ExpBitOr
} from '../sql';
import { SysProcedures } from './sysProcedures';
import { charField, EnumSysTable, idField, Int, intField, JoinType, textField, tinyIntField } from '../../il';
import { sysTable } from '../dbContext';

export class RoleProcedures extends SysProcedures {
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

    private getMyRolesProc(p: sql.Procedure) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
        );
        let a = 'a';
        let selectAdmin = factory.createSelect();
        statements.push(selectAdmin);
        selectAdmin.column(new ExpField('id', a))
        selectAdmin.column(new ExpField('site', a));
        selectAdmin.column(new ExpField('user', a));
        selectAdmin.column(new ExpField('admin', a));
        selectAdmin.from(sysTable(EnumSysTable.userSite, a));
        let adminWheres: ExpCmp[] = [
            new ExpEQ(new ExpField('user', a), new ExpVar('$user'))
        ];
        selectAdmin.where(new ExpAnd(...adminWheres));

        let selectRole = factory.createSelect();
        statements.push(selectRole);
        selectRole.column(new ExpField('id', a))
        selectRole.column(new ExpField('site', a));
        selectRole.column(new ExpField('user', a));
        selectRole.column(new ExpField('name', 'c'), 'role');
        selectRole.from(sysTable(EnumSysTable.ixRole, a))
            .join(JoinType.join, sysTable(EnumSysTable.ixRole, 'b'))
            .on(new ExpEQ(new ExpField('id', a), new ExpField('id', 'b')))
            .join(JoinType.join, sysTable(EnumSysTable.const, 'c'))
            .on(new ExpEQ(new ExpField('role', 'b'), new ExpField('id', 'c')));
        let roleWheres: ExpCmp[] = [
            new ExpEQ(new ExpField('user', a), new ExpVar('$user'))
        ];
        selectRole.where(new ExpAnd(...roleWheres));
    }

    private expExistsAdmin() {
        let { factory } = this.context;
        let selectAdmin = factory.createSelect();
        selectAdmin.col('id');
        selectAdmin.from(sysTable(EnumSysTable.userSite));
        selectAdmin.where(new ExpAnd(
            new ExpEQ(new ExpField('site'), new ExpVar('unit')),
            new ExpEQ(new ExpField('user'), new ExpVar('$user')),
            new ExpEQ(new ExpBitAnd(new ExpField('admin'), ExpNum.num2), ExpNum.num2)
        ));
        return new ExpExists(selectAdmin);
    }

    private selectRoleEntity() {
        let { factory } = this.context;
        let declare = factory.createDeclare();
        declare.var('roleId', new Int());

        let selectEntity = factory.createSelect();
        selectEntity.toVar = true;
        selectEntity.col('id', 'roleId');
        selectEntity.where(new ExpEQ(new ExpField('name'), new ExpVar('role')));

        return [declare, selectEntity];
    }

    private createSelectUserUnit() {
        let { factory } = this.context;
        let selectUserUnit = factory.createSelect();
        selectUserUnit.col('id');
        selectUserUnit.from(sysTable(EnumSysTable.userSite));
        selectUserUnit.where(new ExpAnd(
            new ExpEQ(new ExpField('user'), new ExpVar('theUser')),
            new ExpEQ(new ExpField('unit'), new ExpVar('unit')),
        ));
        return selectUserUnit;
    }

    private getAllRoleUsersProc(p: sql.Procedure) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = idField('unit', 'big');
        parameters.push(
            unitField,
            userParam,
            uqUnitField,
        );

        const a = 'a';
        let selectRole = factory.createSelect();
        statements.push(selectRole);
        selectRole.column(new ExpField('id', a))
        selectRole.column(new ExpField('unit', a));
        selectRole.column(new ExpField('user', a));
        selectRole.column(new ExpField('role', 'b'));
        selectRole.from(sysTable(EnumSysTable.userSite, a))
            .join(JoinType.join, sysTable(EnumSysTable.ixRole, 'b'))
            .on(new ExpEQ(new ExpField('id', a), new ExpField('id', 'b')));
        let roleWheres: ExpCmp[] = [
            new ExpEQ(new ExpField('unit', a), new ExpVar('unit')),
            this.expExistsAdmin(),
        ];
        selectRole.where(new ExpAnd(...roleWheres));
    }

    private setUserRoleProc(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = idField('unit', 'big');
        parameters.push(
            unitField,
            userParam,
            uqUnitField,
            idField('theUser', 'big'),
            charField('role', 100),
        );

        statements.push(...this.selectRoleEntity());

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpAnd(
            this.expExistsAdmin(),
            new ExpIsNotNull(new ExpVar('roleId'))
        );
        let upsert = factory.createUpsert();
        iff.then(upsert);
        upsert.table = sysTable(EnumSysTable.ixRole);
        upsert.keys = [
            { col: 'id', val: new ExpVar('userunit') },
        ];
        upsert.cols.push(
            { col: 'role', val: new ExpVar('roleId') },
        );
    }

    private deleteUserRoleProc(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = idField('unit', 'big');
        parameters.push(
            unitField,
            userParam,
            uqUnitField,
            idField('theUser', 'big'),
            charField('role', 100),
        );
        statements.push(...this.selectRoleEntity());

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpAnd(
            this.expExistsAdmin(),
            new ExpIsNotNull(new ExpVar('roleId'))
        );

        let del = factory.createDelete();
        iff.then(del);

        let selectUserUnit = this.createSelectUserUnit();
        del.tables = [sysTable(EnumSysTable.ixRole)];
        let delWheres: ExpCmp[] = [
            new sql.ExpEQ(new sql.ExpField('id'), new sql.ExpSelect(selectUserUnit))
        ];
        del.where(new sql.ExpAnd(...delWheres));
    }

    private setUnitAdminProc(p: sql.Procedure) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = idField('unit', 'big');
        parameters.push(
            unitField,
            userParam,
            uqUnitField,
            idField('theUser', 'big'),
        );

        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = this.expExistsAdmin();

        let upsert = factory.createUpsert();
        iff.then(upsert);
        upsert.table = sysTable(EnumSysTable.ixRole);
        upsert.keys = [
            { col: 'id', val: new ExpSelect(this.createSelectUserUnit()) }
        ];
        upsert.cols.push(
            {
                col: 'admin',
                val: new ExpBitOr(new ExpField('admin'), ExpNum.num2)
            },
        );
    }

    // 如果我是admin，我可以取出所有的admin的用户
    private getAdmins(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = idField('unit', 'big');
        parameters.push(
            unitField,
            userParam,
            uqUnitField,
        );
        let selMe = factory.createSelect();
        selMe.col('id');
        selMe.from(sysTable(EnumSysTable.admin));
        selMe.where(new ExpEQ(new ExpField('id'), new ExpVar(userParam.name)));
        let select = factory.createSelect();
        statements.push(select);
        const ta = 'a';
        select.column(new ExpField('id', ta));
        select.column(new ExpField('role', ta));
        select.column(new ExpField('operator', ta));
        select.column(new ExpField('assigned', ta));
        select.column(new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('create', ta)), 'create');
        select.column(new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update', ta)), 'update');
        select.from(sysTable(EnumSysTable.admin, ta));
        let wheres: ExpCmp[] = [
            new ExpExists(selMe),
            new ExpOr(
                new ExpGT(new ExpField('role', ta), ExpNum.num0),
                new ExpAnd(
                    new ExpEQ(new ExpField('role', ta), ExpNum.num_1),
                    new ExpGT(
                        new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update', ta)),
                        new ExpSub(new ExpFuncCustom(factory.func_unix_timestamp), new ExpNum(24 * 3600))
                    )
                ),
            ),
        ];
        select.where(new ExpAnd(...wheres));
    }

    private setMeAdmin(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = idField('unit', 'big');
        parameters.push(
            unitField,
            userParam,
            uqUnitField,
        );
        let select = factory.createSelect();
        select.col('id');
        select.from(sysTable(EnumSysTable.admin));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar(userParam.name)),
            new ExpOr(
                new ExpEQ(new ExpField('role'), ExpNum.num1),
                new ExpOr(
                    new ExpEQ(new ExpField('role'), new ExpNum(-1)),
                    new ExpGT(
                        new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update')),
                        new ExpSub(new ExpFuncCustom(factory.func_unix_timestamp), new ExpNum(24 * 3600))
                    )
                )
            ),
        ));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpExists(select);
        let update = factory.createUpdate();
        iff.then(update);
        update.cols = [
            { col: 'role', val: new ExpNeg(new ExpField('role')) }
        ]
        update.table = sysTable(EnumSysTable.admin);
        update.where = new ExpEQ(new ExpField('id'), new ExpVar(userParam.name));
    }

    private setAdmin(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = idField('unit', 'big');
        parameters.push(
            unitField,
            userParam,
            uqUnitField,
            intField('user'),
            tinyIntField('role'),
            charField('assigned', 100),
        );
        let select = factory.createSelect();
        select.col('id');
        select.from(sysTable(EnumSysTable.admin));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar(userParam.name)),
            new ExpEQ(new ExpField('role'), ExpNum.num1),
        ));
        let selectUserSysAdmin = factory.createSelect();
        selectUserSysAdmin.col('id');
        selectUserSysAdmin.from(sysTable(EnumSysTable.admin));
        selectUserSysAdmin.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar('user')),
            new ExpEQ(new ExpField('role'), ExpNum.num1),
            new ExpNE(new ExpField('operator'), new ExpVar(userParam.name)),
            /*
            new ExpOr(
                new ExpLT(
                    new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update')),
                    new ExpSub(new ExpFuncCustom(factory.func_unix_timestamp), new ExpNum(24 * 3600))
                )
            ),
            */
        ));
        let iff = factory.createIf();
        statements.push(iff);
        iff.cmp = new ExpOr(
            new ExpNot(new ExpExists(select)),     // if i am not sys admin
            new ExpEQ(new ExpVar(userParam.name), new ExpVar('user')),  // if i am the user
            new ExpExists(selectUserSysAdmin),      // if the user is sys admin
            new ExpNot(
                new ExpOr(                             // role must be 1, 2, -1, -2
                    new ExpEQ(new ExpVar('role'), ExpNum.num1),
                    new ExpEQ(new ExpVar('role'), ExpNum.num2),
                    new ExpEQ(new ExpVar('role'), ExpNum.num_1),
                    new ExpEQ(new ExpVar('role'), new ExpNum(-2)),
                )
            )
        );
        let leave = factory.createLeaveProc();
        iff.then(leave);

        let upsert = factory.createUpsert();
        statements.push(upsert);
        upsert.keys = [
            { col: 'id', val: new ExpVar('user') },
        ];
        upsert.cols = [
            { col: 'role', val: new ExpVar('role') },
            { col: 'operator', val: new ExpVar(userParam.name) },
            { col: 'assigned', val: new ExpVar('assigned') },
        ];
        upsert.table = sysTable(EnumSysTable.admin);
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

    private isAdmin(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        let uqUnitField = idField('unit', 'big');
        parameters.push(
            unitField,
            userParam,
            uqUnitField,
        );
        let select = factory.createSelect();
        statements.push(select);
        select.col('id');
        select.from(sysTable(EnumSysTable.userSite));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpSelect(this.createSelectUserUnit())),
            new ExpEQ(new ExpBitAnd(new ExpField('admin'), ExpNum.num2), ExpNum.num2),
        ));
    }
}
