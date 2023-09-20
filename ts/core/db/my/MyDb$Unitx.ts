import { consts } from "../../consts";
import { env } from "../../../tool";
import { Db$Unitx } from "../Db";
import { MyDbUq } from "./MyDbUq";
import { MyDbs } from "./MyDbs";

export class MyDb$Unitx extends MyDbUq implements Db$Unitx {
    serverId: number;

    constructor(myDbs: MyDbs, isTesting: boolean) {
        const { $unitx, $test } = consts;
        super(myDbs, isTesting === true ? $unitx + $test : $unitx);
    }

    protected override initConfig(dbName: string) {
        super.initConfig(dbName);
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
        this.serverId = conn[env.server_id];
        delete conn[env.server_id];
        return conn;
    }

    protected getDebugConfigName(unitx: any): string {
        if (this.isTesting === true) return unitx.test;
        return unitx.prod;
    }

}
