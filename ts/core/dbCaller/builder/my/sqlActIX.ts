import { ParamActIX, TableSchema } from "../../dbCaller";
import { Builders } from "../builders";
import { MySqlBuilder, retTab, sqlEndStatement } from "./mySqlBuilder";

export class SqlActIX extends MySqlBuilder {
	private param: ParamActIX;

	constructor(builder: Builders, param: ParamActIX) {
		super(builder);
		this.param = param;
	}

	build(): string {
		let { IX, ID, IXs, values } = this.param;
		let sql = 'set @ret=\'\'' + sqlEndStatement;
		for (let value of values) {
			let { ix, xi } = value;
			if (!xi) continue;
			let ixValue = { ix: undefined, xi: undefined };
			switch (typeof ix) {
				case 'undefined':
					ixValue.ix = { value: '@user' };
					break;
				case 'object':
					sql += this.buildSaveIDWithoutRet(ID, ix);
					sql += retTab;
					ixValue.ix = { value: '@id' };
					break;
				default:
					ixValue.ix = ix;
					break;
			}
			switch (typeof xi) {
				case 'object':
					sql += this.buildSaveIDWithoutRet(ID, xi);
					sql += retTab;
					ixValue.xi = { value: '@id' };
					break;
				default:
					ixValue.xi = xi;
					break;
			}
			sql += this.buildSaveIX(IX, ixValue);
			sql += this.buildIXs(IXs, ixValue);
		}
		return sql + 'select @ret as ret' + sqlEndStatement;
	}

	private buildIXs(IXs: { IX: TableSchema; ix: number }[], ixValue: { ix: any, xi: any }): string {
		if (!IXs) return '';
		let sql = '';
		for (let IXi of IXs) {
			let { IX, ix } = IXi;
			ixValue.ix = ix ?? { value: '@user' };
			sql += this.buildSaveIX(IX, ixValue);
		}
		return sql;
	}
}
