import { ParamIDNO } from "../../IDDefines";
import { MySqlBuilder, sqlLineEnd } from "./MySqlBuilder";

export class SqlIDNO extends MySqlBuilder<ParamIDNO> {
    protected override convertParam(p: ParamIDNO): ParamIDNO {
        let { ID } = p;
        let param = Object.assign({}, p);
        let types = ['id'];
        param.ID = this.getTableSchema(ID as unknown as string, types);
        return param;
    }

    build(): string {
        let { ID, stamp } = this.param;
        let sql = `SELECT ${this.twProfix}$no(@unit, '${ID.name}', ${stamp ?? null}) as no` + sqlLineEnd;
        return sql;
    }
}
