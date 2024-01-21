import { Db$Res, Db$Site, Db$Unitx, Db$Uq, Db$X, DbNoName, DbUq } from "../Db";
import { Dbs } from "../Dbs";
import { MyDb$Res } from "./MyDb$Res";
import { MyDb$Site } from "./MyDb$Site";
import { MyDb$Unitx } from "./MyDb$Unitx";
import { MyDb$Uq } from "./MyDb$Uq";
import { DbSqlsVersion, MyDbNoName } from "./MyDbNoName";
import { MyDbUq } from "./MyDbUq";

export class MyDbs implements Dbs {
    readonly db$Uq: Db$Uq;
    readonly db$Res: Db$Res;
    readonly db$Site: Db$Site;
    readonly db$UnitxTest: Db$Unitx;
    readonly db$UnitxProd: Db$Unitx;
    readonly dbNoName: MyDbNoName;
    readonly dbUqs: { [name: string]: DbUq; };
    readonly uq_api_version: string;
    sqlsVersion: DbSqlsVersion;

    constructor(uq_api_version: string) {
        this.uq_api_version = uq_api_version;
        this.db$Uq = new MyDb$Uq(this);
        this.db$Res = new MyDb$Res(this);
        this.db$Site = new MyDb$Site(this);
        this.db$UnitxTest = new MyDb$Unitx(this, true);
        this.db$UnitxProd = new MyDb$Unitx(this, false);
        this.dbNoName = new MyDbNoName(this);
        this.dbUqs = {};
    }

    async getDbUq(dbName: string): Promise<DbUq> {
        let dbUq = this.dbUqs[dbName];
        if (dbUq === undefined) {
            dbUq = new MyDbUq(this, dbName);
            this.dbUqs[dbName] = dbUq;
            await dbUq.initLoad();
        }
        return dbUq;
    }

    async start() {
        const [sqlsVersion, savedUqApiVersion] = await this.dbNoName.versions();
        this.sqlsVersion = sqlsVersion;

        if (savedUqApiVersion !== this.uq_api_version) {
            await Promise.all([
                this.db$Uq.createDatabase(),
                this.db$Res.createDatabase(),
                this.db$Site.createDatabase(),
            ]);
            await this.dbNoName.saveUqVersion();
        }
    }
}
