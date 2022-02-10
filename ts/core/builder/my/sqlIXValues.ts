import { ParamIXValues } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder, sqlEndStatement } from "./mySqlBuilder";

export class SqlIXValues extends MySqlBuilder {
	private param: ParamIXValues;

	constructor(builder: Builders, param: ParamIXValues) {
		super(builder);
		this.param = param;
	}

	build(): string {
		let { IX, ix, page, order } = this.param;
		let xiType: number = (IX.schema as any).xiType
		let tStart: string, tSize: string;
		if (page) {
			let { start, size } = page;
			if (!start) tStart = 'NULL';
			else tStart = String(start);
			if (!size) tSize = 'NULL';
			else tSize = String(size);
		}
		let sql = `call ${this.dbName}.tv_$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;
		return sql;
	}
}
