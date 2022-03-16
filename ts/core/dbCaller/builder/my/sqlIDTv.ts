import { Builders } from "../builders";
import { MySqlBuilder, sqlEndStatement } from "./mySqlBuilder";

export class SqlIDTv extends MySqlBuilder {
	private ids: number[];

	constructor(builder: Builders, ids: number[]) {
		super(builder);
		this.ids = ids;
	}

	build(): string {
		let idTbl: string = '$id';
		if (this.ids[0] < 0) {
			idTbl += '_local';
			for (let i = 0; i < this.ids.length; i++) this.ids[i] = -this.ids[i];
		}
		let sql = `
SELECT a.id, b.name as $type, a.name as $tv 
	FROM tv_${idTbl} as a 
		JOIN tv_$entity as b ON a.entity=b.id 
	WHERE a.id in (${this.ids.join(',')})` + sqlEndStatement;
		return sql;
	}
}
