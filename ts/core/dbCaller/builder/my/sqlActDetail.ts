import { ParamActDetail } from "../../dbCaller";
import { Builders } from "../builders";
import { MySqlBuilder, sqlEndStatement } from "./mySqlBuilder";

export class SqlActDetail extends MySqlBuilder {
	private param: ParamActDetail;

	constructor(builder: Builders, param: ParamActDetail) {
		super(builder);
		this.param = param;
	}

	build(): string {
		let { main, detail, detail2, detail3 } = this.param;
		//let {values} = main;
		let mainOverride = {
			id: `(@main:=@id:=tv_$id(${main.schema.typeId}))`,
			no: `(@no:=tv_$no(@unit, '${main.name}', unix_timestamp()))`,
		}
		let sql = 'SET @ret=\'\'' + sqlEndStatement;
		sql += this.buildInsert(main, mainOverride);
		let detailOverride = {
			id: `(@id:=tv_$id(${detail.schema.typeId}))`,
			main: '@main',
			row: '(@row:=@row+1)',
		}
		sql += this.buildInsert(detail, detailOverride);
		if (detail2) {
			let detailOverride2 = {
				...detailOverride,
				id: `(@id:=tv_$id(${detail2.schema.typeId}))`,
			}
			sql += this.buildInsert(detail2, detailOverride2);
		}
		if (detail3) {
			let detailOverride3 = {
				...detailOverride,
				id: `(@id:=tv_$id(${detail3.schema.typeId}))`,
			}
			sql += this.buildInsert(detail3, detailOverride3);
		}
		sql += 'SELECT @ret as ret' + sqlEndStatement;
		return sql;
	}
}
