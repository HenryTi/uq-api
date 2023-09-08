"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRoleStatement = void 0;
const bstatement_1 = require("./bstatement");
const il_1 = require("../../il");
const sql_1 = require("../sql");
const select_1 = require("../sql/select");
const dbContext_1 = require("../dbContext");
class BRoleStatement extends bstatement_1.BStatement {
    body(sqls) {
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
    assertRole(sqls) {
        let { roles, isAdmin, isOwner } = this.istatement;
        let { factory } = this.context;
        let iff = factory.createIf();
        sqls.push(iff);
        let expNotAdmin = new sql_1.ExpNot(new sql_1.ExpExists(this.selectUserUnitId(undefined, il_1.EnumRole.Admin)));
        let cmp;
        if (isAdmin === true) {
            cmp = expNotAdmin;
        }
        else if (isOwner === true) {
            cmp = new sql_1.ExpNot(new sql_1.ExpExists(this.selectUserUnitId(undefined, il_1.EnumRole.Owner)));
        }
        else {
            let existsSelect = factory.createSelect();
            existsSelect.col('x');
            existsSelect.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixRole, 'a'))
                .join(il_1.JoinType.join, (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.phrase, 'b'))
                .on(new sql_1.ExpEQ(new sql_1.ExpField('id', 'b'), new sql_1.ExpField('x', 'a')));
            existsSelect.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpSelect(this.selectUserUnitId())), new sql_1.ExpOr(...roles.map(v => new sql_1.ExpEQ(new sql_1.ExpField('name', 'b'), this.context.expVal(v))))));
            existsSelect.lock = select_1.LockType.update;
            cmp = new sql_1.ExpAnd(expNotAdmin, new sql_1.ExpNot(new sql_1.ExpExists(existsSelect)));
        }
        iff.cmp = cmp;
        let signal = factory.createSignal();
        iff.then(signal);
        signal.text = new sql_1.ExpStr('role assert error!');
    }
    selectEntity() {
        let select = this.context.factory.createSelect();
        select.col('id');
        select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.entity));
        select.where(new sql_1.ExpEQ(new sql_1.ExpField('name'), new sql_1.ExpStr('$UserSite')));
        return select;
    }
    selectUserUnitId(expUser, adminOrOwner, toVar) {
        let { valSite } = this.istatement;
        let select = this.context.factory.createSelect();
        if (toVar)
            select.toVar = true;
        select.col('id', toVar);
        select.from((0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.userSite));
        let wheres = [
            new sql_1.ExpEQ(new sql_1.ExpField('site'), this.context.convertExp(valSite)),
            new sql_1.ExpEQ(new sql_1.ExpField('user'), expUser !== null && expUser !== void 0 ? expUser : new sql_1.ExpVar('$user')),
        ];
        if (adminOrOwner) {
            let num = new sql_1.ExpNum(adminOrOwner);
            wheres.push(new sql_1.ExpEQ(new sql_1.ExpBitAnd(new sql_1.ExpField('admin'), num), num));
        }
        select.where(new sql_1.ExpAnd(...wheres));
        select.lock = select_1.LockType.update;
        return select;
    }
    newIdNu() {
        return new sql_1.ExpFuncInUq('$idnu', [/*ExpNum.num0, */ new sql_1.ExpSelect(this.selectEntity())], true);
    }
    insertIgnoreUserUnit(expId, expUser, admin) {
        let { valSite: valUnit } = this.istatement;
        let { factory } = this.context;
        let insert = factory.createInsert();
        insert.ignore = true;
        insert.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.userSite);
        insert.cols = [
            { col: 'id', val: expId !== null && expId !== void 0 ? expId : this.newIdNu() },
            { col: 'site', val: this.context.convertExp(valUnit) },
            { col: 'user', val: expUser },
            { col: 'admin', val: new sql_1.ExpNum(admin) },
            { col: 'addBy', val: new sql_1.ExpVar('$user') },
        ];
        return insert;
    }
    updateUserUnit(expUser, expAdmin, and) {
        let { valSite } = this.istatement;
        let { factory } = this.context;
        let update = factory.createUpdate();
        update.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.userSite);
        update.cols = [
            { col: 'admin', val: expAdmin }
        ];
        update.where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('site'), this.context.expVal(valSite)), new sql_1.ExpEQ(new sql_1.ExpField('user'), expUser), and);
        return update;
    }
    updateUserUnitRemoveAdmin(expUser, adminOrOwner, and) {
        return this.updateUserUnit(expUser, new sql_1.ExpBitAnd(new sql_1.ExpField('admin'), new sql_1.ExpNum(~adminOrOwner)), and);
    }
    updateUserUnitAddOwner(expUser) {
        let { factory } = this.context;
        let adminAndOwner = il_1.EnumRole.Owner | il_1.EnumRole.Admin;
        let iff = factory.createIf();
        iff.cmp = new sql_1.ExpExists(this.selectUserUnitId(expUser));
        iff.then(this.updateUserUnitAddby());
        iff.then(this.updateUserUnit(expUser, new sql_1.ExpBitOr(new sql_1.ExpField('admin'), new sql_1.ExpNum(adminAndOwner))));
        iff.else(this.insertIgnoreUserUnit(undefined, expUser, adminAndOwner));
        return iff;
    }
    updateUserUnitAddby() {
        let { valSite } = this.istatement;
        let { factory } = this.context;
        let update = factory.createUpdate();
        update.cols = [
            { col: 'addBy', val: new sql_1.ExpVar('$user') }
        ];
        update.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.userSite);
        let expOwner = new sql_1.ExpNum(il_1.EnumRole.Admin | il_1.EnumRole.Owner);
        update.where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('site'), this.context.expVal(valSite)), new sql_1.ExpEQ(new sql_1.ExpField('user'), new sql_1.ExpVar('user')), new sql_1.ExpNE(new sql_1.ExpBitAnd(new sql_1.ExpField('admin'), expOwner), expOwner));
        return update;
    }
    updateUserUnitAddAdmin(expUser) {
        let iff = this.context.factory.createIf();
        iff.cmp = new sql_1.ExpExists(this.selectUserUnitId(expUser));
        iff.then(this.updateUserUnit(expUser, new sql_1.ExpBitOr(new sql_1.ExpField('admin'), new sql_1.ExpNum(il_1.EnumRole.Admin))));
        iff.else(this.insertIgnoreUserUnit(undefined, expUser, il_1.EnumRole.Admin));
        return iff;
    }
    owner(sqls, valOwner) {
        let { action } = this.istatement;
        let { factory } = this.context;
        let exp$User = new sql_1.ExpVar('$user');
        let expOwner = this.context.convertExp(valOwner);
        let iff = factory.createIf();
        sqls.push(iff);
        let select = this.selectUserUnitId(undefined, il_1.EnumRole.Owner);
        let cmp = new sql_1.ExpExists(select);
        if (valOwner !== null) {
            cmp = new sql_1.ExpAnd(cmp, new sql_1.ExpNot(new sql_1.ExpEQ(exp$User, expOwner)));
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
            let and = new sql_1.ExpEQ(new sql_1.ExpField('addBy'), exp$User);
            let update = this.updateUserUnitRemoveAdmin(expOwner, il_1.EnumRole.Owner, and);
            iff.then(update);
        }
    }
    admin(sqls) {
        let { action, valAdmin } = this.istatement;
        let { factory } = this.context;
        let expAdmin = this.context.convertExp(valAdmin);
        let iff = factory.createIf();
        sqls.push(iff);
        let select = this.selectUserUnitId(undefined, il_1.EnumRole.Owner);
        iff.cmp = new sql_1.ExpAnd(new sql_1.ExpExists(select), new sql_1.ExpNot(new sql_1.ExpEQ(new sql_1.ExpVar('$user'), expAdmin)));
        if (action === 'add') {
            let statement = this.updateUserUnitAddAdmin(expAdmin);
            iff.then(statement);
        }
        else if (action === 'del') {
            let update = this.updateUserUnitRemoveAdmin(expAdmin, il_1.EnumRole.Admin | il_1.EnumRole.Owner);
            iff.then(update);
        }
        iff.then(this.assigned(valAdmin));
    }
    user(sqls) {
        let { action, roles, valUser, no } = this.istatement;
        let { factory } = this.context;
        let expUser = this.context.convertExp(valUser);
        let iff = factory.createIf();
        sqls.push(iff);
        let select = this.selectUserUnitId(undefined, il_1.EnumRole.Admin);
        iff.cmp = new sql_1.ExpExists(select);
        switch (action) {
            case 'add':
                let nRoleUserUnit = '$role_userunit_' + no;
                let varRoleUserUnit = new sql_1.ExpVar(nRoleUserUnit);
                let declare = factory.createDeclare();
                iff.then(declare);
                declare.var(nRoleUserUnit, new il_1.BigInt());
                let selectId = this.selectUserUnitId(expUser, undefined, nRoleUserUnit);
                iff.then(selectId);
                selectId.toVar = true;
                let iffIdNull = factory.createIf();
                iff.then(iffIdNull);
                iffIdNull.cmp = new sql_1.ExpIsNull(new sql_1.ExpVar(nRoleUserUnit));
                let setNewId = factory.createSet();
                iffIdNull.then(setNewId);
                setNewId.equ(nRoleUserUnit, this.newIdNu());
                let insertUserUnit = this.insertIgnoreUserUnit(varRoleUserUnit, expUser, il_1.EnumRole.none);
                iffIdNull.then(insertUserUnit);
                if (roles) {
                    for (let role of roles) {
                        let insertIx = factory.createInsert();
                        iff.then(insertIx);
                        insertIx.ignore = true;
                        insertIx.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixRole);
                        insertIx.cols = [
                            { col: 'i', val: varRoleUserUnit },
                            { col: 'x', val: new sql_1.ExpFuncInUq('phraseid', [this.context.expVal(role)], true) }
                        ];
                    }
                }
                break;
            case 'del':
                if (roles) {
                    for (let role of roles) {
                        let del = factory.createDelete();
                        iff.then(del);
                        del.tables = [(0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixRole)];
                        del.where(new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpSelect(this.selectUserUnitId(expUser))), new sql_1.ExpEQ(new sql_1.ExpField('x'), new sql_1.ExpFuncInUq('phraseid', [this.context.expVal(role)], true))));
                    }
                }
                break;
            case 'clear':
                let clear = factory.createDelete();
                iff.then(clear);
                clear.tables = [(0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.ixRole)];
                clear.where(new sql_1.ExpEQ(new sql_1.ExpField('i'), new sql_1.ExpSelect(this.selectUserUnitId(expUser))));
                break;
        }
        iff.then(this.assigned(valUser));
    }
    assigned(valUser) {
        let { valSite: valUnit, valAssigned } = this.istatement;
        let { factory } = this.context;
        if (valAssigned === undefined)
            return;
        let expAssigned = (0, sql_1.convertExp)(this.context, valAssigned);
        let iff = factory.createIf();
        iff.cmp = new sql_1.ExpAnd(new sql_1.ExpIsNotNull(expAssigned), new sql_1.ExpFunc(factory.func_length, expAssigned));
        let update = factory.createUpdate();
        iff.then(update);
        update.table = (0, dbContext_1.sysTable)(dbContext_1.EnumSysTable.userSite);
        update.cols = [
            { col: 'assigned', val: expAssigned }
        ];
        update.where = new sql_1.ExpAnd(new sql_1.ExpEQ(new sql_1.ExpField('site'), (0, sql_1.convertExp)(this.context, valUnit)), new sql_1.ExpEQ(new sql_1.ExpField('user'), (0, sql_1.convertExp)(this.context, valUser)));
        return update;
    }
}
exports.BRoleStatement = BRoleStatement;
//# sourceMappingURL=role.js.map