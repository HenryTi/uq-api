import { Db$Res, Db$Unitx, Db$Uq, DbNoName, DbUq } from "../Db";
import { Dbs } from "../Dbs";
import { MyDb$Res } from "./MyDb$Res";
import { MyDb$Unitx } from "./MyDb$Unitx";
import { MyDb$Uq } from "./MyDb$Uq";
import { MyDbNoName } from "./MyDbNoName";
import { MyDbUq } from "./MyDbUq";
import { checkSqlVersion } from "./sqlsVersion";

export class MyDbs implements Dbs {
    readonly db$Uq: Db$Uq;
    readonly db$Res: Db$Res;
    readonly db$UnitxTest: Db$Unitx;
    readonly db$UnitxProd: Db$Unitx;
    readonly dbNoName: DbNoName;
    readonly dbUqs: { [name: string]: DbUq; };

    constructor() {
        this.db$Uq = new MyDb$Uq();
        this.db$Res = new MyDb$Res();
        this.db$UnitxTest = new MyDb$Unitx(true);
        this.db$UnitxProd = new MyDb$Unitx(false);
        this.dbNoName = new MyDbNoName(undefined);
        this.dbUqs = {};
    }

    async getDbUq(dbName: string): Promise<DbUq> {
        let dbUq = this.dbUqs[dbName];
        if (dbUq === undefined) {
            dbUq = new MyDbUq(dbName);
            this.dbUqs[dbName] = dbUq;
            await dbUq.initLoad();
        }
        return dbUq;
    }

    async start() {
        // create$ResDb(),
        // create$UqDb()
        await checkSqlVersion();
        await Promise.all([
            this.db$Uq.createDatabase(),
            this.db$Res.createDatabase(),
        ]);
    }
}
