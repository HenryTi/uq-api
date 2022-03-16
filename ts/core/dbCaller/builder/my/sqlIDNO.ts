import { ParamIDNO } from "../../dbCaller";
import { Builders } from "../builders";
import { MySqlBuilder, sqlEndStatement } from "./mySqlBuilder";

export class SqlIDNO extends MySqlBuilder {
	private param: ParamIDNO;

	constructor(builder: Builders, param: ParamIDNO) {
		super(builder);
		this.param = param;
	}

	build(): string {
		let { ID, stamp } = this.param;
		let sql = `SELECT tv_$no(@unit, '${ID.name}', ${stamp ?? null}) as no` + sqlEndStatement;
		return sql;
	}
}
