"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRoleRouter = void 0;
function buildRoleRouter(router, rb) {
    rb.entityGet(router, 'role-admins', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let roles = await runner.roleGetAdmins(unit, user);
        return roles;
    });
    rb.entityGet(router, 'role-set-me-admin', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        await runner.roleSetMeAdmin(unit, user);
    });
    rb.entityPost(router, 'role-set-admin', '', async (unit, $user, _name, db, urlParams, runner, body, schema) => {
        let { user, role, assigned } = body;
        await runner.roleSetAdmin(unit, $user, user, role, assigned);
    });
    rb.entityGet(router, 'role-is-admin', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        return await runner.roleIsAdmin(unit, user);
    });
    rb.entityPost(router, 'role-get-my', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let roles = await runner.roleGetMy(unit, user);
        return roles;
    });
    rb.entityPost(router, 'role-get-all-users', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        // row 0 返回 ixOfUsers
        let roles = await runner.roleGetAllUsers(unit, user);
        return roles;
    });
    rb.entityPost(router, 'role-delete-user', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { theUser } = body;
        await runner.roleDeleteUser(unit, user, theUser);
        return;
    });
    rb.entityPost(router, 'role-set-user', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { theUser, roles } = body;
        await runner.roleSetUser(unit, user, theUser, roles);
        return;
    });
}
exports.buildRoleRouter = buildRoleRouter;
//# sourceMappingURL=role.js.map