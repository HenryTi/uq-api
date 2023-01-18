import { consts } from "../../consts";
import { Db$Res, Db$Unitx, Db$Uq, DbNoName, DbUq } from "../Db";
import { Dbs } from "../Dbs";
import { MyDb$Res } from "./MyDb$Res";
import { MyDb$UnitxProd, MyDb$UnitxTest } from "./MyDb$Unitx";
import { MyDb$Uq } from "./MyDb$Uq";
import { MyDbNoName } from "./MyDbNoName";
import { MyDbUq } from "./MyDbUq";

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
        this.db$UnitxTest = new MyDb$UnitxTest();
        this.db$UnitxProd = new MyDb$UnitxProd();
        this.dbNoName = new MyDbNoName();
        this.dbUqs = {};
    }

    getDbUq(uqName: string): DbUq {
        let dbUq = this.dbUqs[uqName];
        if (dbUq === undefined) {
            dbUq = new MyDbUq(uqName);
            this.dbUqs[uqName] = dbUq;
        }
        return dbUq;
    }

    async start() {
        // create$ResDb(),
        // create$UqDb()
        await Promise.all([
            this.db$Uq.createDatabase(),
            this.db$Res.createDatabase(),
        ]);
    }
}
