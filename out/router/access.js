"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAccessRouter = void 0;
const tool_1 = require("../tool");
const accessType = 'access';
function buildAccessRouter(router, rb) {
    rb.entityGet(router, accessType, '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        try {
            let { acc } = body;
            let accs = undefined;
            if (acc !== undefined) {
                accs = acc.split('|');
                if (accs.length === 1 && accs[0].trim().length === 0)
                    accs = undefined;
            }
            tool_1.logger.debug('getAccesses: ' + runner.getDb());
            let access = yield runner.getAccesses(unit, user, accs);
            return access;
        }
        catch (err) {
            tool_1.logger.error('/access&name=', name, '&db=', db, err);
            debugger;
        }
    }));
    rb.entityGet(router, 'entities', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let entities = yield runner.getEntities(unit);
        return entities;
    }));
    rb.entityGet(router, 'all-schemas', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let entities = yield runner.getAllSchemas();
        return entities;
    }));
    rb.entityGet(router, 'get-admins', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let roles = yield runner.getAdmins(unit, user);
        return roles;
    }));
    rb.entityGet(router, 'set-me-admin', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        yield runner.setMeAdmin(unit, user);
    }));
    rb.entityPost(router, 'set-admin', '', (unit, $user, _name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { user, role, name, nick, icon, assigned } = body;
        yield runner.setAdmin(unit, $user, user, role, name, nick, icon, assigned);
    }));
    rb.entityGet(router, 'is-admin', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.isAdmin(unit, user);
    }));
    rb.entityGet(router, 'get-roles', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let roles = yield runner.getMyRoles(unit, user);
        return roles;
    }));
    rb.entityGet(router, 'get-all-role-users', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        // row 0 返回 ixOfUsers
        let roles = yield runner.getAllRoleUsers(unit, user);
        return roles;
    }));
    rb.entityGet(router, 'delete-user-roles', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { theUser } = body;
        yield runner.deleteUserRoles(unit, user, theUser);
        return;
    }));
    rb.entityPost(router, 'set-user-roles', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { theUser, roles } = body;
        yield runner.setUserRoles(unit, user, theUser, roles);
        return;
    }));
}
exports.buildAccessRouter = buildAccessRouter;
//# sourceMappingURL=access.js.map