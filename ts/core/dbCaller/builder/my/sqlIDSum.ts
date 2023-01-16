import { ParamIDSum } from "../../dbCaller";
import { Builder } from "../Builder";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIDSum extends MySqlBuilder {
    private param: ParamIDSum;

    constructor(builder: Builder, param: ParamIDSum) {
        super(builder);
        this.param = param;
    }

    build(): string {
        let { id } = this.param;
        let sql = this.buildSumSelect(this.param);
        if (id !== undefined) {
            sql += ' where t.id';
            if (Array.isArray(id) === true) {
                sql += ' in (' + (id as number[]).join() + ')';
            }
            else {
                sql += `=${id}`;
            }
        }
        return sql;
    }
}
