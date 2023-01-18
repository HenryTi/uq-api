import { env } from "../../tool";
/*
import { DbContainer } from "./DbContainer";

export abstract class UnitxDbContainer extends DbContainer {
    serverId: number;

    protected init() {
        super.init();
        this.serverId = this.unitxConn[env.server_id];
    }

    protected getDbConfig() {
        let ret = this.getUnitxConnection();
        return ret;
    }

    private unitxConn: any;
    private getUnitxConnection(): any {
        if (this.unitxConn) return this.unitxConn;
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
        this.unitxConn = Object.assign({}, conn);
        delete this.unitxConn[env.server_id];
        return this.unitxConn;
    }

    protected abstract getDebugConfigName(unitx: any): string;
}

export class UnitxProdDbContainer extends UnitxDbContainer {
    protected getDebugConfigName(unitx: any): string { return unitx.prod }
}

export class UnitxTestDbContainer extends UnitxDbContainer {
    protected getDebugConfigName(unitx: any): string { return unitx.test }
}
*/