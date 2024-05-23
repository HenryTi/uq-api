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
exports.buildRoleRouter = void 0;
function buildRoleRouter(router, rb) {
    rb.entityGet(router, 'role-admins', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let roles = yield runner.roleGetAdmins(unit, user);
        return roles;
    }));
    rb.entityGet(router, 'role-set-me-admin', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        yield runner.roleSetMeAdmin(unit, user);
    }));
    rb.entityPost(router, 'role-set-admin', '', (unit, $user, _name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { user, role, assigned } = body;
        yield runner.roleSetAdmin(unit, $user, user, role, assigned);
    }));
    rb.entityGet(router, 'role-is-admin', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        return yield runner.roleIsAdmin(unit, user);
    }));
    rb.entityPost(router, 'role-get-my', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let roles = yield runner.roleGetMy(unit, user);
        return roles;
    }));
    rb.entityPost(router, 'role-get-all-users', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        // row 0 返回 ixOfUsers
        let roles = yield runner.roleGetAllUsers(unit, user);
        return roles;
    }));
    rb.entityPost(router, 'role-delete-user', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { theUser } = body;
        yield runner.roleDeleteUser(unit, user, theUser);
        return;
    }));
    rb.entityPost(router, 'role-set-user', '', (unit, user, name, db, urlParams, runner, body, schema) => __awaiter(this, void 0, void 0, function* () {
        let { theUser, roles } = body;
        yield runner.roleSetUser(unit, user, theUser, roles);
        return;
    }));
}
exports.buildRoleRouter = buildRoleRouter;
//# sourceMappingURL=role.js.map