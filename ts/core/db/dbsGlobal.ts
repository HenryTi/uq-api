import { env, SqlType } from "../../tool";
import { Dbs } from "./Dbs";
import { MyDbs } from "./my";

export let dbs: Dbs;

export function createDbs(): Dbs {
    switch (env.sqlType) {
        default:
        case SqlType.mssql:
            throw new Error('sqltype mssql not implemented');
        case SqlType.mysql:
            dbs = new MyDbs();
    }
    return dbs;
}
