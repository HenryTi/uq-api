import { env, SqlType } from "../../tool";
import { Db$Res, Db$Unitx, Db$Uq, DbUq, DbNoName, Db$Site } from "./Db";
import { MyDbs } from "./my";
const { version: uq_api_version } = require('../../../package.json');

export interface Dbs {
    readonly db$Uq: Db$Uq;
    readonly db$Res: Db$Res;
    readonly db$Site: Db$Site;
    readonly db$UnitxTest: Db$Unitx;
    readonly db$UnitxProd: Db$Unitx;
    readonly dbNoName: DbNoName;
    readonly dbUqs: { [name: string]: DbUq };
    readonly dbBiz: DbUq;

    start(): Promise<void>;
    getDbUq(dbName: string): Promise<DbUq>;      // dbName = uqName [+ $test]
    get uq_api_version(): string;

    createSiteDb(siteId: number): Promise<void>;
}

let dbs: Dbs;

export function getDbs(): Dbs {
    if (dbs !== undefined) return dbs;
    switch (env.sqlType) {
        default:
        case SqlType.mssql:
            throw new Error('sqltype mssql not implemented');
        case SqlType.mysql:
            dbs = new MyDbs(uq_api_version);
    }
    return dbs;
}
