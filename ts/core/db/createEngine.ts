import { SqlType } from "../../tool";
import { Db } from "./Db";
import { MsDb } from "./ms";
import { MyDb } from "./my";

/*
export function createDb(sqlType: SqlType, dbName: string, dbConfig: any): Db {
    switch (sqlType) {
        case SqlType.mysql: return new MyDb(dbName, dbConfig);
        case SqlType.mssql: return new MsDb(dbName, dbConfig);
    }
}
*/