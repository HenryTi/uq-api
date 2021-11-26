import { createPool, MysqlError } from "mysql";
import { logger } from '../tool';

(async function () {
	let node_env: string;
	let db: string;

	process.argv.forEach(v => {
		let parts: string[] = v.split('=');
		if (parts.length === 2) {
			let v = parts[1].trim().toLowerCase();
			switch (parts[0].trim().toLowerCase()) {
				case 'node_env':
					node_env = v;
					break;
				case 'db':
					db = v;
					break;
			}
		}
	});
	process.env.NODE_ENV = node_env;

	const config: any = require('config');

	logger.debug('NODE_ENV ' + process.env.NODE_ENV);
	if (!process.env.NODE_ENV) {
		logger.error('node out/cli/charset-collate node_env=???');
		process.exit(0);
	}
	const const_connection = 'connection';
	const config_connection = config.get(const_connection);
	logger.debug(config_connection);
	const pool = createPool(config_connection);
	async function runSql(sql: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			let handler = (err: MysqlError | null, results?: any) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(results);
			}
			pool.query(sql, handler);
		});
	}

	async function charsetCollateColumn(dbName: string, tableName: string, columnName: string, datatype: string, charset: string, collate: string) {
		logger.debug('Column: ' + columnName + ' ' + datatype);
		let sql = `ALTER TABLE \`${dbName}\`.\`${tableName}\` MODIFY \`${columnName}\` ${datatype} CHARACTER SET ${charset} COLLATE ${collate};`;
		await runSql(sql);
	}

	const stringTypes = ['varchar', 'char', 'tinytext', 'text', 'mediumtext', 'longtext'];
	async function charsetCollateTable(dbName: string, tableName: string, charset: string, collate: string) {
		logger.debug('Table: ' + tableName);
		let sql = `ALTER TABLE \`${dbName}\`.\`${tableName}\` CONVERT TO CHARACTER SET ${charset} COLLATE ${collate};`;
		await runSql(sql);
		let sqlColumns = `select COLUMN_NAME, DATA_TYPE, COLUMN_TYPE from information_schema.COLUMNS where TABLE_SCHEMA='${dbName}' and TABLE_NAME='${tableName}'`;
		let columns = await runSql(sqlColumns);
		for (let col of columns) {
			let { COLUMN_NAME, COLUMN_TYPE, DATA_TYPE } = col;
			if (stringTypes.indexOf(DATA_TYPE) >= 0) {
				await charsetCollateColumn(dbName, tableName, COLUMN_NAME, COLUMN_TYPE, charset, collate);
			}
		}
		logger.debug('-');
	}

	async function charsetCollateDb(dbName: string, charset: string, collate: string) {
		let sqlDbFileNames = `select SCHEMA_NAME from information_schema.SCHEMATA where SCHEMA_NAME=LOWER('${dbName}')`;
		let dbFileNames: any[] = await runSql(sqlDbFileNames);
		if (dbFileNames.length === 0) {
			logger.debug(`Database ${dbName} not exists`);
			return;
		}
		dbName = dbFileNames[0]['SCHEMA_NAME'];

		logger.debug('=== charsetCollateDb: ' + dbName + ' ' + charset + ' ' + collate);
		let sql = `ALTER DATABASE \`${dbName}\` CHARACTER SET ${charset} COLLATE ${collate};`;
		logger.debug('runing... ' + sql);
		await runSql(sql);
		logger.debug('done! ' + sql);

		let sqlTables = `select TABLE_NAME from information_schema.TABLES where TABLE_SCHEMA='${dbName}' AND TABLE_TYPE='BASE TABLE'`;
		let tables: any[] = await runSql(sqlTables);
		for (let tblRow of tables) {
			await charsetCollateTable(dbName, tblRow['TABLE_NAME'], charset, collate);
		}
		logger.debug('-');
		logger.debug('-');
	}

	async function charsetCollateAllUqs(charset: string, collate: string, dbIdStart: number) {
		if (!dbIdStart) dbIdStart = 0;
		let sqlDbs = `select name from \`$uq\`.uq where id>${dbIdStart} order by id asc`;
		let dbs: any[] = await runSql(sqlDbs);
		for (let dbRow of dbs) {
			let { name: dbName } = dbRow;
			await charsetCollateDb(dbName, charset, collate);
		}
	}

	const charsetProps = {
		"character_set_client": "utf8mb4",
		"character_set_connection": "utf8mb4",
		//"character_set_database": "utf8mb4",
		"character_set_results": "utf8mb4",
		"character_set_server": "utf8mb4",
	}

	const collationProps = {
		"collation_connection": "utf8mb4_0900_ai_ci",
		//"collation_database": "utf8mb4_0900_ai_ci",
		"collation_server": "utf8mb4_0900_ai_ci",
		"default_collation_for_utf8mb4": "utf8mb4_0900_ai_ci",
	}

	async function dbServerParams(): Promise<any> {
		let ret: any = {};
		let results = await runSql(`SHOW VARIABLES LIKE '%char%';SHOW VARIABLES LIKE '%collat%';select database();`);
		setParams(ret, results[0]);
		setParams(ret, results[1]);
		return ret;
	}
	function setParams(params: any, tbl: any[]): void {
		for (let row of tbl) {
			let name = row['Variable_name'];
			let value = row['Value'];
			params[name] = value;
		}
	}

	try {
		let params = await dbServerParams();
		logger.debug(params);

		logger.debug('');
		logger.debug('========================================');

		let charset = params['character_set_connection']; //'utf8mb4';
		let collate = params['collation_connection']; //'utf8mb4_general_ci';

		if (db) {
			await charsetCollateDb(db, charset, collate);
		}
		else {
			let dbIdStart = 0; // 有些数据库升级的时候，出错的。从出错地方重新开始。
			if (!dbIdStart) {
				await charsetCollateDb('$res', charset, collate);
				await charsetCollateDb('$uq', charset, collate);
			}

			await charsetCollateAllUqs(charset, collate, dbIdStart);
		}

		logger.debug('=== Job done!');
	}
	catch (err) {
		logger.error(err);
	}
	process.exit(0);
})();
