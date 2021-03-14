import { EntitySchema, ParamSum, TableSchema } from "../../dbServer";
import { Builders, ISqlBuilder } from "../builders";

export const retLn = `set @ret=CONCAT(@ret, '\\n');\n`;
export const retTab = `set @ret=CONCAT(@ret, @id, '\\t');\n`;

export abstract class MySqlBuilder implements ISqlBuilder {
	//private readonly sqlContext: SqlContext;
	protected readonly dbName:string;
	protected readonly hasUnit:boolean;


	constructor(builder: Builders) {
		//this.sqlContext = sqlContext;
		let {dbName, hasUnit} = builder;
		this.dbName = dbName;
		this.hasUnit = hasUnit;
	}

	abstract build():string;

	protected buildSumSelect(param:ParamSum):string {
		let {IDX, far, near, field} = param;
		let {name, schema} = IDX;
		if (!far) far = 0;
		if (!near) near = Number.MAX_SAFE_INTEGER;
		let sql = 'select t.id';
		for (let f of field) {
			let {exFields} = schema;
			let exField = exFields?.find(v => v.field === f);
			if (exField === undefined) {
				return `select '${f} is not logged' as error`;
			}
			f = f.toLowerCase();
			sql += `,\`tv_${name}$${f}$sum\`(t.id,${far},${near}) as ${f}`;
		}
		sql += ` from \`tv_${name}\` as t`;
		return sql;
	}

	protected buildIDX(IDX: TableSchema[], isIXr:boolean = false): {cols: string; tables: string} {
		let {name, schema} = IDX[0];
		let {type} = schema;
		let idJoin = type === 'ix' && isIXr === false? 'id2' : 'id';
		let tables = `\`${this.dbName}\`.\`tv_${name}\` as t0`;
		let ti = `t0`;
		let cols = ti + '.id';
		function buildCols(schema:EntitySchema) {
			let {fields, type:schemaType} = schema;
			for (let f of fields) {
				let {name:fn, type:ft} = f;
				if (fn === 'id') continue;
				if (isIXr === true && schemaType === 'ix' && fn === 'id2') continue;
				let fv = `${ti}.\`${fn}\``;
				cols += ',';
				cols += ft === 'textid'? `tv_$idtext(${fv})` : fv;
				cols += ' as `' + fn + '`';
			}
		}
		buildCols(schema);
		let len = IDX.length;
		let $timeField:string;
		for (let i=1; i<len; i++) {
			let {name, schema} = IDX[i];
			tables += ` left join \`${this.dbName}\`.\`tv_${name}\` as t${i} on t0.${idJoin}=t${i}.id`;
			let {type} = schema;
			ti = `t${i}`;
			buildCols(schema);
			if (type === 'idx' && $timeField === undefined) {
				$timeField = `,${ti}.\`$time\` as \`$time\``;
				$timeField += `,tv_$idtext(${ti}.\`$field\`) as \`$field\``;
				$timeField += `,${ti}.\`$value\` as \`$value\``;
			}
		}
		if ($timeField !== undefined) cols += $timeField;
		return {cols, tables};
	}

	protected buildInsert(ts:TableSchema, override: any, valueItem?: any): string {
		if (!ts) return '';
		let {name, schema, values} = ts;
		let {fields, owner} = schema;
		if (!override) override = {};
		let sql = 'set @row=0;\n';
		let cols:string, vals:string;
		let first:boolean;
		if (this.hasUnit === true) {
			cols = '`$unit`';
			vals = '@unit';
			first = false;
		}
		else {
			cols = '';
			vals = '';
			first = true;
		}
		for (let f of fields) {
			let {name} = f;
			if (first === true) {
				first = false;
			}
			else {
				cols += ',';
			};
			cols += `\`${name}\``;
		}
		/*
		if (owner === true) {
			cols += ',`$owner`';
		}
		*/
		if (valueItem !== undefined) {
			values = [valueItem];
		}
		for (let value of values) {
			sql += `insert into \`tv_${name}\`\n\t(${cols})\n\tvalues\n\t`;
			first = true;
			vals = '';
			for (let f of fields) {
				let {name, type} = f;
				if (first === true) {
					first = false;
				}
				else {
					vals += ',';
				};
				if (name === '$owner' && owner === true) {
					vals += '@user';
					continue;
				}
				let v = value[name];
				let ov = override[name];
				if (v !== undefined) {
					vals += (type==='textid'? `tv_$textid('${v}')`: `'${v}'`);
				}
				else if (ov !== undefined) {
					vals += ov;
				}
				else {
					vals += 'null';
				}
			}
			/*
			if (owner === true) {
				vals += ',@user';
			}
			*/
			sql += `(${vals});\n`;
			sql += retTab;
		}
		sql += retLn;
		return sql;
	}

	protected buildDetailSelect(ts:TableSchema, whereId:string):string {
		if (ts === undefined) return '';
		let sql = 'SELECT ';
		let first = true;
		for (let f of ts.schema.fields) {
			if (first === true) {
				first = false;
			}
			else {
				sql += ',';
			}
			let {name, type} = f;
			sql += (type === 'textid')?
				`tv_$idtext(\`${name}\`)`
				:
				`\`${name}\``;
		}
		sql += ' FROM `tv_' + ts.name + '` WHERE 1=1';
		if (this.hasUnit === true) {
			sql += ' AND `$unit`=@unit'
		}
		sql += ' AND ' + whereId;
		return sql + ';\n';
	}


	protected buildSaveID(ts:TableSchema, idValue?:any): string {
		let sql = '';
		let {values, name, schema} = ts;
		if (idValue !== undefined) {
			values = [idValue];
		}
		let {keys, fields} = schema;
		for (let value of values) {
			let {id} = value;
			if (id) {
				if (id<0) {
					sql += this.buildDelete(ts, -id);
				}
				else {
					sql += this.buildUpdate(ts, value);
				}
			}
			else {
				sql += `set @id=\`tv_${name}$id\`(@unit,@user,1`;
				let updateOverride = {id: '@id'};
				for (let k of keys) {
					let {name:kn, type} = k;
					let v = value[kn];
					sql += ',';
					if (type === 'textid') {
						sql += `tv_$textid('${v}')`;
					}
					else if (kn === 'no') {
						sql += v? `'${v}'` : `tv_$no(@unit, '${name}')`;
					}
					else {
						sql += `'${v}'`;
					}
					(updateOverride as any)[kn] = null;
				}
				sql += ');\n'
				if (fields.length > keys.length + 1) {
					sql += this.buildUpdate(ts, value, updateOverride);
				}
				sql += retTab;
			}
		}
		sql += retLn;
		return sql;
	}

	protected buildSaveIDX(ts:TableSchema): string {
		let sql = '';
		let {values} = ts;
		for (let value of values) {
			let {id} = value;
			if (id < 0) {
				sql += this.buildDelete(ts, -id);
			}
			else {
				sql += this.buildUpsert(ts, value);
			}

		}
		sql += retLn;
		return sql;
	}

	protected buildSaveIX(ts:TableSchema, ixValue?:any): string {
		let sql = '';
		let {values} = ts;
		if (ixValue !== undefined) {
			values = [ixValue];
		}
		for (let value of values) {
			let {id, id2} = value;
			if (id < 0) {
				sql += this.buildDelete(ts, -id, id2);
			}
			else {
				sql += this.buildUpsert(ts, value);
			}
		}
		sql += retLn;
		return sql;
	}

	protected buildUpsert(ts:TableSchema, value:any): string {
		let {name:tableName, schema} = ts;
		let {fields, exFields} = schema;
		let cols = '', vals = '', dup = '';
		let sqlWriteEx:string[] = [];
		let first = true;
		for (let f of fields) {
			let {name, type} = f;
			let v = value[name];
			let val:string;
			if (v === undefined || v === null) {
				val = 'null';
			}
			else {
				let time:number;
				if (type === 'textid') {
					if (typeof v === 'object') {
						time = v.$time;
						v = v.value;
					}
					val = `tv_$textid('${v}')`;
				}
				else {
					if (typeof v === 'object') {
						time = v.$time;
						v = v.value;
						val = time === undefined? `${v}` : `'${v}'`;
					}
					else {
						val = `'${v}'`;
					}
				}
				switch (name) {
					default:
						if (dup.length > 0) dup += ',';
						dup += '`' + name + '`=values(`' + name + '`)';
						break;
					case 'id':
					case 'id2':
						break;
				}
				if (exFields) {
					let exField = exFields.find(v => v.field === name);
					if (exField !== undefined) {
						let {field, track, memo, sum, time:timeCanSet} = exField;
						let valueId = value['id'];
						let sqlEx = `set @dxValue=\`tv_${tableName}$${field}\`(@unit,@user,${valueId},0,'${v}'`;
						if (timeCanSet === true) {
							sqlEx += ',';
							sqlEx += time !== undefined? time : 'null';
						}
						if (track === true) {
							let vTrack = value['$track'];
							sqlEx += ',';
							sqlEx += (vTrack? vTrack : 'null');
						}
						if (memo === true) {
							let vMemo = value['$memo'];
							sqlEx += ',';
							sqlEx += (vMemo? `'${vMemo}'` : 'null');
						}
						sqlEx += `);\n`;
						sqlWriteEx.push(sqlEx);
					}
				}
			}
			if (first === true) {
				first = false;
			}
			else {
				cols += ',';
				vals += ',';
			}
			cols += '\`' + name + '\`';
			vals += val;
		}
		let ignore = '', onDup = '';
		if (dup.length > 0) {
			onDup = `\non duplicate key update ${dup}`;
		}
		else {
			ignore = ' ignore';
		}
		let sql = `insert${ignore} into \`tv_${tableName}\` (${cols})\nvalues (${vals})${onDup};\n`;
		return sql + sqlWriteEx.join('');
	}

	protected buildUpdate(ts:TableSchema, value:any, override:any = {}): string {
		let {name, schema} = ts;
		let {fields} = schema;
		let sql = 'update `tv_' + name + '` set ';
		let where = ' where 1=1';
		if (this.hasUnit === true) {
			where += ' and `$unit`=@unit';
		} 
		let first = true;
		for (let f of fields) {
			let {name, type} = f;
			let ov = override[name];
			if (ov === null) continue;
			let v = value[name];
			switch (name) {
				default: 
					if (first === true) {
						first = false;
					}
					else {
						sql += ',';
					}
					sql += '\`' + name + '\`=';
					if (ov !== undefined)
						v = ov;
					else if (v === undefined) {
						v = 'null';
					}
					else {
						v = (type==='textid'? `tv_$textid('${v}')`: `'${v}'`);
					}
					sql += v;
					break;
				case 'id':
					where += ' and id=' + (ov ?? v);
					break;
				case 'id2':
					where += ' and id2=' + (ov ?? v);
					break;
			}
		}
		return sql + where + ';\n';
	}

	protected buildDelete(ts:TableSchema, id:number, id2?:number):string {
		let {name, schema} = ts;
		let {type, exFields} = schema;
		let sql = '';
		if (type === 'idx' && exFields) {
			for (let exField of exFields) {
				let {field, track, memo} = exField;
				let sqlEx = `set @dxValue=\`tv_${name}$${field}\`(@unit,@user,${id},-1,null`;
				if (track === true) {
					sqlEx += ',null';
				}
				if (memo === true) {
					sqlEx += ',null';
				}
				sqlEx += `);\n`;
				sql += sqlEx;
			}
		}
		sql += 'delete from `tv_' + name + '` where id=' + id;
		if (id2) {
			sql += ' AND id2=';
			if (id2 < 0) id2 = -id2;
			sql += id2;
		}
		sql += ';\n';
		return sql;
	}
}