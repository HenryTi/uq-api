import { env } from "../../../tool";
import { consts } from "../../consts";
import { Db$Unitx } from "../Db";
import { MyDbUq } from "./MyDbUq";

abstract class MyDb$Unitx extends MyDbUq implements Db$Unitx {
    readonly serverId: number;

    constructor(dbName: string) {
        super(dbName);
        this.serverId = this.dbConfig[env.server_id];
    }

    protected override connectionConfig() {
        let conn: any;
        if (env.isDevelopment === true) {
            let unitx = env.configDebugging?.['unitx'];
            if (unitx) {
                let debugConfigName = this.getDebugConfigName(unitx);
                if (debugConfigName) {
                    conn = env.configServers?.[debugConfigName];
                }
            }
        }
        if (!conn) {
            conn = env.connection;
        }
        conn = Object.assign({}, conn);
        delete conn[env.server_id];
        return conn;
    }

    protected abstract getDebugConfigName(unitx: any): string;
}

export class MyDb$UnitxProd extends MyDb$Unitx {
    constructor() {
        super(consts.$unitx);
    }
    protected getDebugConfigName(unitx: any): string { return unitx.prod }
}

export class MyDb$UnitxTest extends MyDb$Unitx {
    constructor() {
        super(consts.$unitx + consts.$test);
    }
    protected getDebugConfigName(unitx: any): string { return unitx.test }
}
