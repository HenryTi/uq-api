import { BStatement } from "./bstatement";
import { Sqls } from "./sqls";
import { EnumSysTable, BigInt, EnumRole, JoinType, RoleStatement, ValueExpression } from "../../il";
import {
    convertExp, ExpAnd, ExpBitAnd, ExpBitOr, ExpCmp, ExpEQ, ExpExists
    , ExpField, ExpFunc, ExpFuncInUq, ExpIsNotNull, ExpIsNull, ExpNE, ExpNot
    , ExpNum, ExpOr, ExpSelect, ExpStr, ExpVal, ExpVar
} from "../sql";
import { LockType } from "../sql/select";
import { sysTable } from "../dbContext";

export class BRoleStatement extends BStatement {
    protected istatement: RoleStatement;
    body(sqls: Sqls) {
        let { action, valAdmin, valOwner } = this.istatement;
        if (action === 'assert') {
            this.assertRole(sqls);
        }
        else if (valOwner !== undefined) {
            // add or del owner
            this.owner(sqls, valOwner);
        }
        else if (valAdmin !== undefined) {
            // add or del admin
            this.admin(sqls);
        }
        else {
            // add or del or clear user role
            this.user(sqls);
        }
    }

    private assertRole(sqls: Sqls) {
        let { roles, isAdmin, isOwner } = this.istatement;
        let { factory } = this.context;
        let iff = factory.createIf();
        sqls.push(iff);
        let expNotAdmin = new ExpNot(new ExpExists(this.selectUserUnitId(undefined, EnumRole.Admin)));
        let cmp: ExpCmp;
        if (isAdmin === true) {
            cmp = expNotAdmin;
        }
        else if (isOwner === true) {
            cmp = new ExpNot(new ExpExists(this.selectUserUnitId(undefined, EnumRole.Owner)));
        }
        else {
            let existsSelect = factory.createSelect();
            existsSelect.col('x');
            existsSelect.from(sysTable(EnumSysTable.ixRole, 'a'))
                .join(JoinType.join, sysTable(EnumSysTable.phrase, 'b'))
                .on(new ExpEQ(new ExpField('id', 'b'), new ExpField('x', 'a')));
            existsSelect.where(new ExpAnd(
                new ExpEQ(new ExpField('i'), new ExpSelect(this.selectUserUnitId())),
                new ExpOr(
                    ...roles.map(v => new ExpEQ(
                        new ExpField('name', 'b'),
                        this.context.expVal(v),
                    ))
                )
            ));
            existsSelect.lock = LockType.update;
            cmp = new ExpAnd(
                expNotAdmin,
                new ExpNot(new ExpExists(existsSelect))
            );
        }
        iff.cmp = cmp;
        let signal = factory.createSignal();
        iff.then(signal);
        signal.text = new ExpStr('role assert error!');
    }

    private selectEntity() {
        let select = this.context.factory.createSelect();
        select.col('id');
        select.from(sysTable(EnumSysTable.entity));
        select.where(new ExpEQ(new ExpField('name'), new ExpStr('$UserSite')));
        return select;
    }

    private selectUserUnitId(expUser?: ExpVal, adminOrOwner?: EnumRole, toVar?: string) {
        let { valSite } = this.istatement;
        let select = this.context.factory.createSelect();
        if (toVar) select.toVar = true;
        select.col('id', toVar);
        select.from(sysTable(EnumSysTable.userSite));
        let wheres: ExpCmp[] = [
            new ExpEQ(new ExpField('site'), this.context.convertExp(valSite) as ExpVal),
            new ExpEQ(new ExpField('user'), expUser ?? new ExpVar('$user')),
        ]
        if (adminOrOwner) {
            let num = new ExpNum(adminOrOwner);
            wheres.push(
                new ExpEQ(new ExpBitAnd(new ExpField('admin'), num), num),
            );
        }
        select.where(new ExpAnd(...wheres));
        select.lock = LockType.update;
        return select;
    }

    private newIdNu() {
        return new ExpFuncInUq('$idnu', [/*ExpNum.num0, */new ExpSelect(this.selectEntity())], true);
    }

    private insertIgnoreUserUnit(expId: ExpVal, expUser: ExpVal, admin: EnumRole) {
        let { valSite: valUnit } = this.istatement;
        let { factory } = this.context;
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = sysTable(EnumSysTable.userSite);
        insert.cols = [
            { col: 'id', val: expId ?? this.newIdNu() },
            { col: 'site', val: this.context.convertExp(valUnit) as ExpVal },
            { col: 'user', val: expUser },
            { col: 'admin', val: new ExpNum(admin) },
            { col: 'addBy', val: new ExpVar('$user') },
        ];
        return insert;
    }

    private updateUserUnit(expUser: ExpVal, expAdmin: ExpVal, and?: ExpCmp) {
        let { valSite } = this.istatement;
        let { factory } = this.context;
        let update = factory.createUpdate();
        update.table = sysTable(EnumSysTable.userSite);
        update.cols = [
            { col: 'admin', val: expAdmin }
        ]
        update.where = new ExpAnd(
            new ExpEQ(new ExpField('site'), this.context.expVal(valSite)),
            new ExpEQ(new ExpField('user'), expUser),
            and,
        );
        return update;
    }

    private updateUserUnitRemoveAdmin(expUser: ExpVal, adminOrOwner: EnumRole, and?: ExpCmp) {
        return this.updateUserUnit(expUser, new ExpBitAnd(new ExpField('admin'), new ExpNum(~adminOrOwner)), and);
    }

    private updateUserUnitAddOwner(expUser: ExpVal) {
        let { factory } = this.context;
        let adminAndOwner = EnumRole.Owner | EnumRole.Admin;
        let iff = factory.createIf();
        iff.cmp = new ExpExists(this.selectUserUnitId(expUser));
        iff.then(this.updateUserUnitAddby());
        iff.then(this.updateUserUnit(expUser, new ExpBitOr(new ExpField('admin'), new ExpNum(adminAndOwner))));
        iff.else(this.insertIgnoreUserUnit(undefined, expUser, adminAndOwner));
        return iff;
    }

    private updateUserUnitAddby() {
        let { valSite } = this.istatement;
        let { factory } = this.context;
        let update = factory.createUpdate();
        update.cols = [
            { col: 'addBy', val: new ExpVar('$user') }
        ]
        update.table = sysTable(EnumSysTable.userSite);
        let expOwner = new ExpNum(EnumRole.Admin | EnumRole.Owner);
        update.where = new ExpAnd(
            new ExpEQ(new ExpField('site'), this.context.expVal(valSite)),
            new ExpEQ(new ExpField('user'), new ExpVar('user')),
            new ExpNE(new ExpBitAnd(new ExpField('admin'), expOwner), expOwner)
        );
        return update;
    }

    private updateUserUnitAddAdmin(expUser: ExpVal) {
        let iff = this.context.factory.createIf();
        iff.cmp = new ExpExists(this.selectUserUnitId(expUser));
        iff.then(this.updateUserUnit(expUser, new ExpBitOr(new ExpField('admin'), new ExpNum(EnumRole.Admin))));
        iff.else(this.insertIgnoreUserUnit(undefined, expUser, EnumRole.Admin));
        return iff;
    }

    private owner(sqls: Sqls, valOwner: ValueExpression) {
        let { action } = this.istatement;
        let { factory } = this.context;
        let exp$User = new ExpVar('$user');
        let expOwner = this.context.convertExp(valOwner) as ExpVal;
        let iff = factory.createIf();
        sqls.push(iff);
        let select = this.selectUserUnitId(undefined, EnumRole.Owner);
        let cmp: ExpCmp = new ExpExists(select);
        if (valOwner !== null) {
            cmp = new ExpAnd(
                cmp,
                new ExpNot(new ExpEQ(exp$User, expOwner)),
            );
        }
        iff.cmp = cmp;
        if (action === 'add') {
            let insert = this.updateUserUnitAddOwner(expOwner);
            iff.then(insert);
        }
        else if (action === 'del') {
            if (valOwner === null) {
                expOwner = exp$User;
            }
            let and = new ExpEQ(new ExpField('addBy'), exp$User);
            let update = this.updateUserUnitRemoveAdmin(expOwner, EnumRole.Owner, and);
            iff.then(update);
        }
    }

    private admin(sqls: Sqls) {
        let { action, valAdmin } = this.istatement;
        let { factory } = this.context;
        let expAdmin = this.context.convertExp(valAdmin) as ExpVal;
        let iff = factory.createIf();
        sqls.push(iff);
        let select = this.selectUserUnitId(undefined, EnumRole.Owner);
        iff.cmp = new ExpAnd(
            new ExpExists(select),
            new ExpNot(new ExpEQ(new ExpVar('$user'), expAdmin)),
        );
        if (action === 'add') {
            let statement = this.updateUserUnitAddAdmin(expAdmin);
            iff.then(statement);
        }
        else if (action === 'del') {
            let update = this.updateUserUnitRemoveAdmin(expAdmin, EnumRole.Admin | EnumRole.Owner);
            iff.then(update);
        }
        iff.then(this.assigned(valAdmin));
    }

    private user(sqls: Sqls) {
        let { action, roles, valUser, no } = this.istatement;
        let { factory } = this.context;
        let expUser = this.context.convertExp(valUser) as ExpVal;
        let iff = factory.createIf();
        sqls.push(iff);
        let select = this.selectUserUnitId(undefined, EnumRole.Admin);
        iff.cmp = new ExpExists(select);
        switch (action) {
            case 'add':
                let nRoleUserUnit = '$role_userunit_' + no;
                let varRoleUserUnit = new ExpVar(nRoleUserUnit);
                let declare = factory.createDeclare();
                iff.then(declare);
                declare.var(nRoleUserUnit, new BigInt());
                let selectId = this.selectUserUnitId(expUser, undefined, nRoleUserUnit);
                iff.then(selectId);
                selectId.toVar = true;
                let iffIdNull = factory.createIf();
                iff.then(iffIdNull);
                iffIdNull.cmp = new ExpIsNull(new ExpVar(nRoleUserUnit));
                let setNewId = factory.createSet();
                iffIdNull.then(setNewId);
                setNewId.equ(nRoleUserUnit, this.newIdNu());
                let insertUserUnit = this.insertIgnoreUserUnit(varRoleUserUnit, expUser, EnumRole.none);
                iffIdNull.then(insertUserUnit);
                if (roles) {
                    for (let role of roles) {
                        let insertIx = factory.createInsert();
                        iff.then(insertIx);
                        insertIx.ignore = true;
                        insertIx.table = sysTable(EnumSysTable.ixRole);
                        insertIx.cols = [
                            { col: 'i', val: varRoleUserUnit },
                            { col: 'x', val: new ExpFuncInUq('phraseid', [this.context.expVal(role)], true) }
                        ];
                    }
                }
                break;
            case 'del':
                if (roles) {
                    for (let role of roles) {
                        let del = factory.createDelete();
                        iff.then(del);
                        del.tables = [sysTable(EnumSysTable.ixRole)];
                        del.where(new ExpAnd(
                            new ExpEQ(new ExpField('i'), new ExpSelect(this.selectUserUnitId(expUser))),
                            new ExpEQ(new ExpField('x'), new ExpFuncInUq('phraseid', [this.context.expVal(role)], true))
                        ));
                    }
                }
                break;
            case 'clear':
                let clear = factory.createDelete();
                iff.then(clear);
                clear.tables = [sysTable(EnumSysTable.ixRole)];
                clear.where(new ExpEQ(new ExpField('i'), new ExpSelect(this.selectUserUnitId(expUser))));
                break;
        }
        iff.then(this.assigned(valUser));
    }

    private assigned(valUser: ValueExpression) {
        let { valSite: valUnit, valAssigned } = this.istatement;
        let { factory } = this.context;
        if (valAssigned === undefined) return;
        let expAssigned = convertExp(this.context, valAssigned) as ExpVal;
        let iff = factory.createIf();
        iff.cmp = new ExpAnd(
            new ExpIsNotNull(expAssigned),
            new ExpFunc(factory.func_length, expAssigned)
        );
        let update = factory.createUpdate();
        iff.then(update);
        update.table = sysTable(EnumSysTable.userSite);
        update.cols = [
            { col: 'assigned', val: expAssigned }
        ];
        update.where = new ExpAnd(
            new ExpEQ(new ExpField('site'), convertExp(this.context, valUnit) as ExpVal),
            new ExpEQ(new ExpField('user'), convertExp(this.context, valUser) as ExpVal),
        );
        return update;
    }
}
