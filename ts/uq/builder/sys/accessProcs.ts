import * as sql from '../sql';
import { EntityTable } from '../sql/statementWithFrom';
import {
    ExpEQ, ExpField, ExpVar, ExpExists, ExpNeg
    , ExpNot, ExpNull, ExpAnd, ExpNum, ExpStr
    , ExpCmp, ExpFunc, ExpSelect, ExpVal, ExpSub
    , ExpSearchCase, ExpOr, ExpGT, ExpFuncCustom, ExpLT, ExpNE
} from '../sql';
import { SysProcedures } from './sysProcedures';
import { EnumSysTable, charField, idField, intField, textField, tinyIntField } from '../../il';
import { sysTable } from '../dbContext';

export class AccessProcedures extends SysProcedures {
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

    private getAccessProc(p: sql.Procedure) {
        let unitFieldName = '$unit';

        p.parameters.push(intField(unitFieldName));
        let { unitField, factory, hasUnit } = this.context;
        let stats = p.statements;
        let expCmpUnit: ExpCmp;
        let selectUnit = factory.createSelect();
        selectUnit.from(sysTable(EnumSysTable.unit));
        if (hasUnit === true) {
            selectUnit.col('unit');
            selectUnit.where(new ExpEQ(new ExpField('unit'), new ExpVar(unitFieldName)));
            expCmpUnit = new ExpNot(new ExpExists(selectUnit));
        }
        else {
            selectUnit.column(new ExpFunc(factory.func_count, new ExpField('unit')));
            selectUnit.limit(new ExpNum(2));
            expCmpUnit = new ExpEQ(new ExpSelect(selectUnit), ExpVal.num0);
        }
        let iffUnit = factory.createIf();
        stats.push(iffUnit);
        iffUnit.cmp = expCmpUnit;
        let upsertUnit = factory.createInsert();
        iffUnit.then(upsertUnit);
        upsertUnit.table = sysTable(EnumSysTable.unit);
        upsertUnit.cols.push({
            col: 'flag',
            val: ExpVal.num1
        });
        upsertUnit.keys.push({
            col: 'unit',
            val: new ExpVar(unitFieldName)
        });

        let upsertUnitSetting = factory.createInsert();
        iffUnit.then(upsertUnitSetting);
        upsertUnitSetting.table = new EntityTable('$setting', hasUnit);
        upsertUnitSetting.cols.push({
            col: 'value',
            val: hasUnit === true ? ExpVal.null : new ExpVar(unitFieldName)
        });
        upsertUnitSetting.keys.push({
            col: 'name',
            val: new ExpStr('uniqueUnit')
        });
        if (hasUnit === true) {
            upsertUnitSetting.keys.push({
                col: unitFieldName,
                val: ExpVal.num0
            });
        }

        // 2020-01-15: 这个表没有意义。但是 uq-api 中引用了，所以暂且先放一个空表吧
        let selectAnyone = factory.createSelect();
        stats.push(selectAnyone);
        selectAnyone.column(new sql.ExpField('id'), 'entity');
        selectAnyone.from(sysTable(EnumSysTable.entity));
        selectAnyone.where(new ExpEQ(ExpNum.num0, ExpNum.num1));

        let selectEntities = factory.createSelect();
        stats.push(selectEntities);
        selectEntities.column(new sql.ExpField('id'), 'entity');
        selectEntities.from(sysTable(EnumSysTable.entity));
    }

    private getMyRolesProc(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
        );
        //this.checkAdmin(statements);
        let selectAdmin = factory.createSelect();
        selectAdmin.column(new ExpField('admin'));
        selectAdmin.from(sysTable(EnumSysTable.unit));
        selectAdmin.where(new ExpEQ(new ExpField('unit'), new ExpVar('$unit')));

        let select = factory.createSelect();
        statements.push(select);
        select.column(new ExpField('user', 'a'));
        select.column(new ExpField('roles', 'a'));
        select.column(new ExpSearchCase(
            [
                new ExpEQ(new ExpSelect(selectAdmin), new ExpVar('$user')),
                ExpNum.num1
            ],
            ExpNum.num0),
            'admin'
        );
        select.from(new EntityTable('$user_roles', false, 'a'));
        let wheres: ExpCmp[] = [new ExpEQ(new ExpField('user', 'a'), new ExpVar('$user'))];
        /*
        select 自动添加 where $unit
        if (hasUnit === true) {
            wheres.push(new ExpEQ(new ExpField('$unit', 'a'), new ExpVar('$unit')))
        }
        */
        select.where(new ExpAnd(...wheres));
    }

    private checkAdmin(statements: sql.Statement[]) {
        let { factory } = this.context;
        let iff = factory.createIf();
        statements.push(iff);
        let select = factory.createSelect();
        select.from(sysTable(EnumSysTable.unit));
        select.column(ExpNum.num1);
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('unit'), new ExpVar('$unit')),
            new ExpEQ(new ExpField('admin'), new ExpVar('$user')),
        ));
        iff.cmp = new ExpNot(new ExpExists(select));
        let signal = factory.createSignal();
        signal.text = new ExpStr('is not admin');
        iff.then(signal);
    }

    private getAllRoleUsersProc(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
        );
        //this.checkAdmin(statements);
        let select = factory.createSelect();
        statements.push(select);
        select.column(new ExpField('user', 'a'));
        select.column(new ExpField('roles', 'a'));
        select.from(new EntityTable('$user_roles', false, 'a'));
        let wheres: ExpCmp[] = [new ExpEQ(ExpNum.num1, ExpNum.num1)];
        select.where(new ExpAnd(...wheres));
    }

    private setUserRolesProc(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
            idField('theUser', 'big'),
            textField('roles'),
        );
        //this.checkAdmin(statements);
        let upsert = factory.createInsert();
        statements.push(upsert);
        upsert.table = new EntityTable('$user_roles', false);
        upsert.keys = [
            { col: 'user', val: new ExpVar('theUser') }
        ];
        this.context.add$UnitCol(upsert.keys);
        upsert.cols.push(
            { col: 'roles', val: new ExpVar('roles') },
        );
    }

    private deleteUserRolesProc(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
            idField('theUser', 'big'),
        );
        //this.checkAdmin(statements);
        let del = factory.createDelete();
        statements.push(del);
        del.tables = [new EntityTable('$user_roles', false)];
        let delWheres: ExpCmp[] = [
            new sql.ExpEQ(new sql.ExpField('user'), new sql.ExpVar('theUser'))
        ];
        if (hasUnit === true) {
            delWheres.push(
                new sql.ExpEQ(new sql.ExpField(unitField.name), new sql.ExpVar(unitField.name))
            );
        }
        del.where(new sql.ExpAnd(...delWheres));
    }

    private setUnitAdminProc(p: sql.Procedure) {
        let { unitField, userParam, factory } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            idField('theUser', 'big'),
        );
        let upsert = factory.createInsert();
        statements.push(upsert);
        upsert.table = sysTable(EnumSysTable.unit);
        upsert.keys = [
            { col: 'unit', val: new ExpVar('$unit') }
        ];
        upsert.cols.push(
            { col: 'admin', val: new ExpVar('theUser') },
        );
    }

    // 如果我是admin，我可以取出所有的admin的用户
    private getAdmins(p: sql.Procedure) {
        let { unitField, userParam, factory, hasUnit } = this.context;
        let { parameters, statements } = p;
        parameters.push(
            unitField,
            userParam,
        );
        let selMe = factory.createSelect();
        selMe.col('id');
        selMe.from(sysTable(EnumSysTable.admin));
        selMe.where(new ExpEQ(new ExpField('id'), new ExpVar(userParam.name)));
        let select = factory.createSelect();
        statements.push(select);
        const ta = 'a';
        //const tb = 'b';
        select.column(new ExpField('id', ta));
        select.column(new ExpField('role', ta));
        select.column(new ExpField('operator', ta));
        select.column(new ExpField('assigned', ta));
        select.column(new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('create', ta)), 'create');
        select.column(new ExpFuncCustom(factory.func_unix_timestamp, new ExpField('update', ta)), 'update');
        /*
        select.column(new ExpField('user', tb));
        select.column(new ExpField('name', tb));
        select.column(new ExpField('nick', tb));
        select.column(new ExpField('icon', tb));
        select.column(new ExpField('assigned', tb));
        */
        select.from(sysTable(EnumSysTable.admin, ta));
        //select.join('left', new EntityTable('$user_roles', false, tb))
        //    .on(new ExpEQ(new ExpField('id', ta), new ExpField('user', tb)));
        // role = -1 and changed in 24 hours, should be returned
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
        parameters.push(
            unitField,
            userParam,
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
        parameters.push(
            unitField,
            userParam,
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

        let upsert = factory.createInsert();
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
        parameters.push(
            unitField,
            userParam,
        );
        let select = factory.createSelect();
        statements.push(select);
        select.col('id');
        select.from(sysTable(EnumSysTable.admin));
        select.where(new ExpAnd(
            new ExpEQ(new ExpField('id'), new ExpVar(userParam.name)),
            new ExpGT(new ExpField('role'), ExpNum.num0),
        ));
    }
}
