"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSyncUserRouter = void 0;
const core_1 = require("../core");
const syncUserType = '/sync-user';
function buildSyncUserRouter(router, rb) {
    rb.post(router, syncUserType, async (runner, body) => {
        let { user: theUser } = body;
        let ret = await runner.getUser(theUser);
        if (ret !== undefined) {
            let retUser = await core_1.centerApi.userFromId(ret.tonwaUser);
            if (retUser !== undefined) {
                let { id, name, nick, icon } = retUser;
                await runner.saveUser(id, name, nick, icon);
                Object.assign(ret, { name, nick, icon });
            }
        }
        return ret;
    });
}
exports.buildSyncUserRouter = buildSyncUserRouter;
//# sourceMappingURL=syncUser.js.map