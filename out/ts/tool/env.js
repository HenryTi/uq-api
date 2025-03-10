"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.SqlType = void 0;
const config = require("config");
var SqlType;
(function (SqlType) {
    SqlType[SqlType["mysql"] = 0] = "mysql";
    SqlType[SqlType["mssql"] = 1] = "mssql";
})(SqlType || (exports.SqlType = SqlType = {}));
class Env {
    constructor() {
        var _a, _b;
        this.server_id = 'server-id';
        this.isDevelopment = false;
        this.isDevdo = false;
        let nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv)
            return;
        switch (nodeEnv.toLowerCase()) {
            case Env.const_development:
                this.isDevelopment = true;
                this.configDebugging = config.get('debugging');
                this.localhost = 'localhost:' + config.get('port');
                this.configServers = config.get('servers');
                break;
            case Env.const_devdo:
                this.isDevdo = true;
                break;
        }
        this.sqlType = this.loadSqlType();
        this.connection = this.loadConnection();
        this.unitxTestConnection = this.loadUnitxConnection('test');
        this.unitxProdConnection = this.loadUnitxConnection('prod');
        if (this.connection.host === '0.0.0.0') {
            // show error message
            this.connection = null;
        }
        this.serverId = Number((_a = this.connection[this.server_id]) !== null && _a !== void 0 ? _a : 0);
        delete this.connection[this.server_id]; // MySql connection 不允许多余的属性出现
        if (config.has('log') === true) {
            this.log = config.get('log');
        }
        else {
            this.log = true;
        }
        this.port = config.get('port');
        this.localPort = config.get('local-port');
        this.uniqueUnitInConfig = (_b = config.get('unique-unit')) !== null && _b !== void 0 ? _b : 0;
        this.uploadPath = config.get("uploadPath");
        const resPath = 'res-path';
        if (config.has(resPath) === true) {
            this.resFilesPath = config.get(resPath);
        }
    }
    loadSqlType() {
        switch (config.get('sqlType')) {
            default:
            case 'mysql': return SqlType.mysql;
            case 'mssql': return SqlType.mssql;
        }
    }
    loadConnection() {
        var _a, _b;
        let conn;
        if (this.isDevelopment === true) {
            let uqApi = (_a = this.configDebugging) === null || _a === void 0 ? void 0 : _a['uq-api'];
            if (uqApi) {
                conn = (_b = this.configServers) === null || _b === void 0 ? void 0 : _b[uqApi];
            }
        }
        if (!conn) {
            if (config.has(Env.const_connection) === true) {
                conn = config.get(Env.const_connection);
            }
        }
        if (!conn) {
            throw `connection need to be defined in config.json`;
        }
        conn = Object.assign({}, conn);
        conn.flags = '-FOUND_ROWS';
        return conn;
    }
    loadUnitxConnection(dev) {
        var _a, _b;
        let conn;
        if (this.isDevelopment === true) {
            let unitx = (_a = this.configDebugging) === null || _a === void 0 ? void 0 : _a['unitx'];
            if (unitx) {
                let debugConfigName = unitx[dev]; // this.getDebugConfigName(unitx);
                if (debugConfigName) {
                    conn = (_b = this.configServers) === null || _b === void 0 ? void 0 : _b[debugConfigName];
                }
            }
        }
        if (!conn) {
            conn = this.connection;
        }
        return conn;
    }
}
Env.const_connection = 'connection';
Env.const_development = 'development';
Env.const_devdo = 'devdo';
exports.env = new Env();
//# sourceMappingURL=env.js.map