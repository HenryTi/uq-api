import * as config from 'config';

interface ConfigDebugging {
    "unitx": {
        test: string;
        prod: string;
    };
    "uq-api": string;
    "uqs": string[];
}

interface DbConnection {
    user: string;
    host: string;
    flags: string;
}

export enum SqlType {
    mysql, mssql,
}

class Env {
    private static const_connection = 'connection';
    private static const_development = 'development';
    private static const_devdo = 'devdo';
    readonly server_id: string = 'server-id';

    readonly isDevelopment: boolean = false;
    readonly isDevdo: boolean = false;
    readonly configDebugging: ConfigDebugging;
    readonly configServers: { [name: string]: any };
    readonly localhost: string;
    readonly connection: DbConnection;
    readonly unitxTestConnection: DbConnection;
    readonly unitxProdConnection: DbConnection;
    readonly sqlType: SqlType;
    readonly serverId: number;
    readonly port: number;
    readonly localPort: number;
    // 整个服务器，可以单独设置一个unit id。跟老版本兼容。
    // 新版本会去掉uq里面的唯一unit的概念。
    readonly uniqueUnitInConfig: number;
    readonly uploadPath: string;
    readonly resFilesPath: string;

    constructor() {
        let nodeEnv = process.env.NODE_ENV as string;
        if (!nodeEnv) return;
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

        this.port = config.get<number>('port');
        this.localPort = config.get<number>('local-port');
        this.uniqueUnitInConfig = config.get<number>('unique-unit') ?? 0;
        this.uploadPath = config.get<string>("uploadPath");

        const resPath = 'res-path';
        if (config.has(resPath) === true) {
            this.resFilesPath = config.get<string>(resPath);
        }
    }

    private loadSqlType(): SqlType {
        console.error('config.util.getConfigSources()', config.util.getConfigSources());
        switch (config.get<string>('sqlType')) {
            default:
            case 'mysql': return SqlType.mysql;
            case 'mssql': return SqlType.mssql;
        }
    }

    private loadConnection(): DbConnection {
        let conn: DbConnection;
        if (this.isDevelopment === true) {
            let uqApi = this.configDebugging?.['uq-api'];
            if (uqApi) {
                conn = this.configServers?.[uqApi];
            }
        }

        if (!conn) {
            if (config.has(Env.const_connection) === true) {
                conn = config.get<any>(Env.const_connection);
            }
        }
        if (!conn) {
            throw `connection need to be defined in config.json`;
        }
        conn = Object.assign({}, conn);
        conn.flags = '-FOUND_ROWS';
        return conn;
    }

    private loadUnitxConnection(dev: 'test' | 'prod'): DbConnection {
        let conn: DbConnection;
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

export const env = new Env();
