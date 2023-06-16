"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAccessRouter = void 0;
const tool_1 = require("../tool");
const accessType = 'access';
function buildAccessRouter(router, rb) {
    rb.entityGet(router, accessType, '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        try {
            let { acc } = body;
            let accs = undefined;
            if (acc !== undefined) {
                accs = acc.split('|');
                if (accs.length === 1 && accs[0].trim().length === 0)
                    accs = undefined;
            }
            tool_1.logger.debug('getAccesses: ' + runner.dbName);
            let access = await runner.getAccesses(unit, user, accs);
            return access;
        }
        catch (err) {
            tool_1.logger.error('/access&name=', name, '&db=', db, err);
            debugger;
        }
    });
    rb.entityGet(router, 'entities', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let entities = await runner.getEntities(unit);
        return entities;
    });
    rb.entityGet(router, 'all-schemas', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let entities = await runner.getAllSchemas();
        return entities;
    });
    rb.entityGet(router, 'get-admins', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let roles = await runner.getAdmins(unit, user);
        return roles;
    });
    rb.entityGet(router, 'set-me-admin', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        await runner.setMeAdmin(unit, user);
    });
    rb.entityPost(router, 'set-admin', '', async (unit, $user, _name, db, urlParams, runner, body, schema) => {
        let { user, role, assigned } = body;
        await runner.setAdmin(unit, $user, user, role, assigned);
    });
    rb.entityGet(router, 'is-admin', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        return await runner.isAdmin(unit, user);
    });
    rb.entityGet(router, 'get-roles', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let roles = await runner.getMyRoles(unit, user);
        return roles;
    });
    rb.entityGet(router, 'get-all-role-users', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        // row 0 返回 ixOfUsers
        let roles = await runner.getAllRoleUsers(unit, user);
        return roles;
    });
    rb.entityGet(router, 'delete-user-roles', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { theUser } = body;
        await runner.deleteUserRoles(unit, user, theUser);
        return;
    });
    rb.entityPost(router, 'set-user-roles', '', async (unit, user, name, db, urlParams, runner, body, schema) => {
        let { theUser, roles } = body;
        await runner.setUserRoles(unit, user, theUser, roles);
        return;
    });
}
exports.buildAccessRouter = buildAccessRouter;
//# sourceMappingURL=access.js.map