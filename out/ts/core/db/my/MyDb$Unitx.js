"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDb$Unitx = void 0;
const consts_1 = require("../../consts");
const tool_1 = require("../../../tool");
const MyDbUq_1 = require("./MyDbUq");
class MyDb$Unitx extends MyDbUq_1.MyDbUq {
    constructor(myDbs, isTesting) {
        const { $unitx, $test } = consts_1.consts;
        super(myDbs, isTesting === true ? $unitx + $test : $unitx);
    }
    initConfig(dbName) {
        super.initConfig(dbName);
        let conn;
        if (tool_1.env.isDevelopment === true) {
            let unitx = tool_1.env.configDebugging?.['unitx'];
            if (unitx) {
                let debugConfigName = this.getDebugConfigName(unitx);
                if (debugConfigName) {
                    conn = tool_1.env.configServers?.[debugConfigName];
                }
            }
        }
        if (!conn) {
            conn = tool_1.env.connection;
        }
        conn = Object.assign({}, conn);
        this.serverId = conn[tool_1.env.server_id];
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