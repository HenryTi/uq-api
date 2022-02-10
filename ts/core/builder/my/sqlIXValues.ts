import { ParamIXValues } from "../../dbServer";
import { Builders } from "../builders";
import { MySqlBuilder } from "./mySqlBuilder";

export class SqlIXValues extends MySqlBuilder {
	private param: ParamIXValues;

	constructor(builder: Builders, param: ParamIXValues) {
		super(builder);
		this.param = param;
	}

	build() {
		let { IX, ix, page, order } = this.param;
		let xiType: number = (IX.schema as any).xiType
		let tStart: number, tSize: number;
		if (page) {
			let { start, size } = page;
			tStart = start ?? null;
			tSize = size ?? null;
		}
		if (!order) order = 'asc';
		let sql = `call ${this.dbName}.tv_$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;
		return sql;
	}

	buildCall(): { proc: string; params: any[]; } {
		let proc = 'tv_$ix_values';
		let { IX, ix, page, order } = this.param;
		let xiType: number = (IX.schema as any).xiType
		let tStart: number, tSize: number;
		if (page) {
			let { start, size } = page;
			tStart = start;
			tSize = size;
		}
		if (!order) order = 'asc';
		let callParams: any[] = [
			IX.name, xiType, ix, tStart, tSize, order
		];
		//let sql = `call ${this.dbName}.tv_$ix_values(@unit, @user, '${IX.name}', '${xiType}', ${ix}, ${tStart}, ${tSize}, '${order}' )`;
		return { proc, params: callParams };
	}
}
