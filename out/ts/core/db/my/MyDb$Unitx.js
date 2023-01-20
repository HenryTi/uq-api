"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDb$Unitx = void 0;
const consts_1 = require("../../consts");
const tool_1 = require("../../../tool");
const MyDbUq_1 = require("./MyDbUq");
class MyDb$Unitx extends MyDbUq_1.MyDbUq {
    constructor(isTesting) {
        const { $unitx, $test } = consts_1.consts;
        super(isTesting === true ? $unitx + $test : $unitx);
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
    getDebugConfigName(unitx) {
        if (this.isTesting === true)
            return unitx.test;
        return unitx.prod;
    }
}
exports.MyDb$Unitx = MyDb$Unitx;
//# sourceMappingURL=MyDb$Unitx.js.map