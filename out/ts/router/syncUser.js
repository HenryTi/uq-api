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
exports.buildSyncUserRouter = void 0;
const core_1 = require("../core");
const syncUserType = '/sync-user';
function buildSyncUserRouter(router, rb) {
    rb.post(router, syncUserType, (runner, body) => __awaiter(this, void 0, void 0, function* () {
        let { user: theUser } = body;
        let ret = yield runner.getUser(theUser);
        if (ret !== undefined) {
            let retUser = yield core_1.centerApi.userFromId(ret.tonwaUser);
            if (retUser !== undefined) {
                let { id, name, nick, icon } = retUser;
                yield runner.saveUser(id, name, nick, icon);
                Object.assign(ret, { name, nick, icon });
            }
        }
        return ret;
    }));
}
exports.buildSyncUserRouter = buildSyncUserRouter;
//# sourceMappingURL=syncUser.js.map