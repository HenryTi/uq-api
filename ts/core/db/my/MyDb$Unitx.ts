import { consts } from "../../consts";
import { env } from "../../../tool";
import { Db$Unitx } from "../Db";
import { MyDbUq } from "./MyDbUq";

export class MyDb$Unitx extends MyDbUq implements Db$Unitx {
    readonly serverId: number;

    constructor(isTesting: boolean) {
        const { $unitx, $test } = consts;
        super(isTesting === true ? $unitx + $test : $unitx);
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

    protected getDebugConfigName(unitx: any): string {
        if (this.isTesting === true) return unitx.test;
        return unitx.prod;
    }

}
