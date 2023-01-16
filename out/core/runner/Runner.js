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
exports.Runner = void 0;
const centerApi_1 = require("../centerApi");
class Runner {
    constructor(db) {
        this.db = db;
    }
    getDb() { return this.db.getDbName(); }
    syncCenterUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield centerApi_1.centerApi.userFromId(userId);
            let { id, name, nick, icon } = user;
            yield this.db.call('$set_user', [id, name, nick, icon]);
            return user;
        });
    }
}
exports.Runner = Runner;
//# sourceMappingURL=Runner.js.map