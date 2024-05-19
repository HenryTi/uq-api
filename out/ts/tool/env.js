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
        this.serverId = Number(this.connection[this.server_id] ?? 0);
        delete this.connection[this.server_id]; // MySql connection 不允许多余的属性出现
        this.port = config.get('port');
        this.localPort = config.get('local-port');
        this.uniqueUnitInConfig = config.get('unique-unit') ?? 0;
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
        let conn;
        if (this.isDevelopment === true) {
            let uqApi = this.configDebugging?.['uq-api'];
            if (uqApi) {
                conn = this.configServers?.[uqApi];
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
        let conn;
        if (this.isDevelopment === true) {
            let unitx = this.configDebugging?.['unitx'];
            if (unitx) {
                let debugConfigName = unitx[dev]; // this.getDebugConfigName(unitx);
                if (debugConfigName) {
                    conn = this.configServers?.[debugConfigName];
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