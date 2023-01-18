"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDb$UnitxTest = exports.MyDb$UnitxProd = void 0;
const tool_1 = require("../../../tool");
const consts_1 = require("../../consts");
const MyDbUq_1 = require("./MyDbUq");
class MyDb$Unitx extends MyDbUq_1.MyDbUq {
    constructor(dbName, isTesting) {
        super(dbName, isTesting);
        this.serverId = this.dbConfig[tool_1.env.server_id];
    }
    connectionConfig() {
        var _a, _b;
        let conn;
        if (tool_1.env.isDevelopment === true) {
            let unitx = (_a = tool_1.env.configDebugging) === null || _a === void 0 ? void 0 : _a['unitx'];
            if (unitx) {
                let debugConfigName = this.getDebugConfigName(unitx);
                if (debugConfigName) {
                    conn = (_b = tool_1.env.configServers) === null || _b === void 0 ? void 0 : _b[debugConfigName];
                }
            }
        }
        if (!conn) {
            conn = tool_1.env.connection;
        }
        conn = Object.assign({}, conn);
        delete conn[tool_1.env.server_id];
        return conn;
    }
}
class MyDb$UnitxProd extends MyDb$Unitx {
    constructor() {
        super(consts_1.consts.$unitx, false);
    }
    getDebugConfigName(unitx) { return unitx.prod; }
}
exports.MyDb$UnitxProd = MyDb$UnitxProd;
class MyDb$UnitxTest extends MyDb$Unitx {
    constructor() {
        super(consts_1.consts.$unitx + consts_1.consts.$test, true);
    }
    getDebugConfigName(unitx) { return unitx.test; }
}
exports.MyDb$UnitxTest = MyDb$UnitxTest;
//# sourceMappingURL=MyDb$Unitx.js.map