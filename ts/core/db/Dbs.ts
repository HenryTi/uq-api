import { Db$Res, Db$Unitx, Db$Uq, DbUq, DbNoName } from "./Db";

export interface Dbs {
    readonly db$Uq: Db$Uq;
    readonly db$Res: Db$Res;
    readonly db$UnitxTest: Db$Unitx;
    readonly db$UnitxProd: Db$Unitx;
    readonly dbNoName: DbNoName;
    readonly dbUqs: { [name: string]: DbUq };

    start(): Promise<void>;
    getDbUq(dbName: string): DbUq;      // dbName = uqName [+ $test]
}
