import { ParamActIXSort } from "../../dbCaller";
import { Builder } from "../Builder";
import { MySqlBuilder, sqlLineEnd } from "./mySqlBuilder";

export class SqlActIXSort extends MySqlBuilder {
    private param: ParamActIXSort;

    constructor(builder: Builder, param: ParamActIXSort) {
        super(builder);
        this.param = param;
    }

    build(): string {
        let { IX, ix, xi: id, after } = this.param;
        let { name, schema } = IX;
        let { hasSort } = schema as any;
        if (hasSort === true) {
            let sql = `set @ret=\`${this.dbName}\`.${this.twProfix}${name}$sort(${ix},${id},${after})` + sqlLineEnd;
            return sql + 'select @ret as ret' + sqlLineEnd;
        }
        else {
            return 'select 0 as ret' + sqlLineEnd;
        }
    }
}
