import { ParamIDNO } from "../../dbCaller";
import { Builder } from "../Builder";
import { MySqlBuilder, sqlLineEnd } from "./mySqlBuilder";

export class SqlIDNO extends MySqlBuilder {
    private param: ParamIDNO;

    constructor(builder: Builder, param: ParamIDNO) {
        super(builder);
        this.param = param;
    }

    build(): string {
        let { ID, stamp } = this.param;
        let sql = `SELECT ${this.twProfix}$no(@unit, '${ID.name}', ${stamp ?? null}) as no` + sqlLineEnd;
        return sql;
    }
}
