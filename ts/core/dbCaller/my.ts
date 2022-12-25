import { createPool, Pool, MysqlError, TypeCast } from 'mysql';
import * as _ from 'lodash';
import { logger } from '../../tool';
import { DbCaller } from './dbCaller';
import { dbLogger, SpanLog, env } from './db';
import { consts } from '../consts';
import { MyBuilder } from './builder';
import { locals } from '../locals';

const retries = 5;
const minMillis = 1;
const maxMillis = 100;

const ER_LOCK_WAIT_TIMEOUT = 1205;
const ER_LOCK_TIMEOUT = 1213;
const ER_LOCK_DEADLOCK = 1213;

interface DbConfigPool {
    config: any;
    pool: Pool;
}

const pools: DbConfigPool[] = [];

const sqls = {
    procLogExists: undefined as string,
    procLogErrorExists: undefined as string,
    performanceExists: undefined as string,
    uidExists: undefined as string,
    dateToUidExists: undefined as string,
    uidToDateExists: undefined as string,
    eventExists: undefined as string,
};

const sqls_8 = {
    procLogExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log';`,
    procLogErrorExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='log_error';`,
    performanceExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='performance';`,
    uidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uid';`,
    dateToUidExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
    eventExists: `SELECT EVENT_SCHEMA as db, EVENT_NAME as name FROM information_schema.events WHERE event_schema = ?;`,
};

const sqls_5 = {
    procLogExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log';`,
    procLogErrorExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='log_error';`,
    performanceExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='performance';`,
    uidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='uid';`,
    dateToUidExists: `SELECT name FROM mysql.proc WHERE db='$uq' AND name='datetouid';`,
    uidToDateExists: `SELECT routine_name FROM information_schema.routines WHERE routine_schema='$uq' AND routine_name='uidtodate';`,
    eventExists: `SELECT db, name FROM mysql.event WHERE db = ?;`,
};

/*
const collationConnection = `
    SET character_set_client = 'utf8';
    SET collation_connection = 'utf8_unicode_ci';
`;
*/
const sysProcColl = {
    tv_$entitys: true,
    tv_$entity: true,
    tv_$entity_version: true,
    tv_$entity_validate: true,
    tv_$entity_no: true,
    tv_$init_setting: true,
    tv_$set_setting: true,
    tv_$get_setting: true,
    tv_$const_strs: true,
    tv_$const_str: true,
    tv_$tag_values: true,
    tv_$tag_type: true,
    tv_$tag_save_sys: true,
    tv_$tag_save: true,
};

export class MyDbCaller extends DbCaller {
    private dbConfig: any;
    private pool: Pool;
    constructor(dbName: string, dbConfig: any) {
        super(dbName);
        this.dbConfig = dbConfig;
        this.resetProcColl();
    }

    protected createBuilder() { return new MyBuilder(this.dbName, this.hasUnit); }

    private resetProcColl() {
        this.procColl = _.merge({}, sysProcColl);
    }

    reset(): void { this.resetProcColl(); };

    private async getPool(): Promise<Pool> {
        for (let p of pools) {
            let { config, pool } = p;
            if (_.isEqual(this.dbConfig, config) === true) {
                return pool;
            }
        }
        let conf = _.clone(this.dbConfig);
        conf.timezone = 'UTC';
        conf.typeCast = castField;
        conf.connectionLimit = 10;
        conf.waitForConnections = true;
        conf.acquireTimeout = 10000;
        conf.multipleStatements = true;
        //conf.charset = 'utf8mb4';
        //let newPool = await this.createPool(conf);
        let newPool = createPool(conf);
        pools.push({ config: this.dbConfig, pool: newPool });
        return newPool;
    }

    /**
     * 判断db在服务器上是否存在
     * @param db db名称 
     * @returns 
     */
    private sqlExists(db: string): string {
        return `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${db}';`;
    }

    private async exec(sql: string, values: any[], log?: SpanLog): Promise<any> {
        if (this.pool === undefined) {
            this.pool = await this.getPool();
        }
        if (!sql) debugger;
        return await new Promise<any>((resolve, reject) => {
            let retryCount = 0;
            let isDevelopment = env.isDevelopment;
            let handleResponse = (err: MysqlError, result: any) => {
                if (err === null) {
                    if (log !== undefined) {
                        log.tries = retryCount;
                        log.close();
                    }
                    resolve(result);
                    return;
                }
                switch (+err.errno) {
                    case +ER_LOCK_WAIT_TIMEOUT:
                    case +ER_LOCK_TIMEOUT:
                    case +ER_LOCK_DEADLOCK:
                        if (isDevelopment === true) logger.error(`ERROR - ${err.errno} ${err.message}`);
                        ++retryCount;
                        if (retryCount > retries) {
                            if (isDevelopment === true) logger.error(`Out of retries so just returning the error.`);
                            if (log !== undefined) {
                                log.tries = retryCount;
                                log.error = err.sqlMessage;
                                log.close();
                            }
                            reject(err);
                            return;
                        }
                        let sleepMillis = Math.floor((Math.random() * maxMillis) + minMillis)
                        if (isDevelopment === true) {
                            logger.error(sql + ': ---- Retrying request with', retries - retryCount, 'retries left. Timeout', sleepMillis);
                        }
                        return setTimeout(() => {
                            // debugger;
                            this.pool.query(sql, values, handleResponse);
                        }, sleepMillis);
                    default:
                        if (isDevelopment === true) {
                            debugger;
                            logger.error(err);
                            logger.error(sql);
                        }
                        if (log !== undefined) {
                            log.tries = retryCount;
                            log.error = err.sqlMessage;
                            log.close();
                        }
                        reject(err);
                        return;
                }
            }
            this.pool.query(sql, values, handleResponse);
        });
    }
    async sql(sql: string, params: any[]): Promise<any> {
        let result = await this.exec(sql, params);
        return result;
    }
    async sqlDropProc(db: string, procName: string, isFunc: boolean): Promise<any> {
        let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
        let sql = `DROP ${type} IF EXISTS  \`${db}\`.\`${procName}\``;
        await this.exec(sql, []);
    }

    private procColl: { [procName: string]: boolean };
    private buidlCallProcSql(db: string, proc: string, params: any[]): string {
        let c = 'call `' + db + '`.`' + proc + '`(';
        let sql = c;
        if (params !== undefined) {
            let len = params.length;
            if (len > 0) {
                sql += '?';
                for (let i = 1; i < len; i++) sql += ',?';
            }
        }
        sql += ')';
        return sql;
    }
    private async callProcBase(db: string, proc: string, params: any[]): Promise<any> {
        let sql = this.buidlCallProcSql(db, proc, params);
        let ret = await this.exec(sql, params);
        return ret;
    }
    async sqlProc(db: string, procName: string, procSql: string): Promise<any> {
        let ret = await this.callProcBase(db, 'tv_$proc_save', [db, procName, procSql]);
        let t0 = ret[0];
        let changed = t0[0]['changed'];
        let isOk = changed === 0;
        this.procColl[procName.toLowerCase()] = isOk;
    }

    async buildProc(db: string, procName: string, procSql: string, isFunc: boolean = false): Promise<any> {
        let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
        let drop = `DROP ${type} IF EXISTS \`${db}\`.\`${procName}\`;`;
        await this.sql(drop, undefined);
        await this.sql(procSql, undefined);
        // clear changed flag
        await this.callProcBase(db, 'tv_$proc_save', [db, procName, undefined]);
    }

    async buildRealProcFrom$ProcTable(db: string, proc: string): Promise<void> {
        let results = await this.callProcBase(db, 'tv_$proc_get', [db, proc]);
        let ret = results[0];
        if (ret.length === 0) {
            debugger;
            throw new Error(`proc not defined: ${db}.${proc}`);
        }
        let r0 = ret[0];
        let procSql = r0['proc'];
        let drop = `DROP PROCEDURE IF EXISTS \`${db}\`.\`${proc}\`;`;
        await this.sql(drop, undefined);
        await this.sql(procSql, undefined);
        await this.callProcBase(db, 'tv_$proc_save', [db, proc, undefined]);
    }

    private async execProc(db: string, proc: string, params: any[]): Promise<any> {
        let needBuildProc: boolean;
        let dbFirstChar = db[0];
        if (dbFirstChar === '$') {
            if (db.startsWith(consts.$unitx) === true) {
                needBuildProc = true;
            }
            else {
                needBuildProc = false;
            }
        }
        else {
            needBuildProc = true;
        }
        if (needBuildProc === true) {
            try {
                let procLower = proc.toLowerCase();
                let p = this.procColl[procLower];
                if (p !== true) {
                    let results = await this.callProcBase(db, 'tv_$proc_get', [db, proc]);
                    let ret = results[0];
                    if (ret.length === 0) {
                        //debugger;
                        console.error(`proc not defined: ${db}.${proc}`);
                        this.procColl[procLower] = false;
                        throw new Error(`proc not defined: ${db}.${proc}`);
                    }
                    else {
                        let r0 = ret[0];
                        let changed = r0['changed'];
                        if (changed === 1) {
                            // await this.sqlDropProc(db, proc);
                            let sql = r0['proc'];
                            await this.buildProc(db, proc, sql);
                        }
                        this.procColl[procLower] = true;
                    }
                }
            }
            catch {
            }
        }
        return await this.execProcBase(db, proc, params);
    }
    private async execProcBase(db: string, proc: string, params: any[]): Promise<any> {
        let c = 'call `' + db + '`.`' + proc + '`(';
        let sql = c;
        if (params !== undefined) {
            let len = params.length;
            if (len > 0) {
                sql += '?';
                for (let i = 1; i < len; i++) sql += ',?';
            }
        }
        sql += ')';
        let spanLog: SpanLog;
        if (db !== '$uq') {
            let log = c;
            if (params !== undefined) {
                let len = params.length;
                for (let i = 0; i < len; i++) {
                    if (i > 0) log += ',';
                    let v = params[i];
                    if (v === undefined) log += 'null';
                    else if (v === null) log += 'null';
                    else {
                        log += '\'' + v + '\'';
                    }
                }
            }
            log += ')';
            spanLog = await dbLogger.open(log);
        }
        return await this.exec(sql, params, spanLog);
    }
    async buildTuidAutoId(db: string): Promise<void> {
        let sql1 = `UPDATE \`${db}\`.tv_$entity a 
			SET a.tuidVid=(
				select b.AUTO_INCREMENT 
					from information_schema.tables b
					where b.table_name=concat('tv_', a.name)
						AND b.TABLE_SCHEMA='${db}'
				)
			WHERE a.tuidVid IS NULL;
        `;
        await this.exec(sql1, []);
    }
    async tableFromProc(db: string, proc: string, params: any[]): Promise<any[]> {
        let res = await this.execProc(db, proc, params);
        if (Array.isArray(res) === false) return [];
        switch (res.length) {
            case 0: return [];
            default: return res[0];
        }
    }
    async tablesFromProc(db: string, proc: string, params: any[]): Promise<any[][]> {
        return await this.execProc(db, proc, params);
    }
    async call(db: string, proc: string, params: any[]): Promise<any> {
        let result: any[][] = await this.execProc(db, proc, params);
        if (Array.isArray(result) === false) return [];
        result.pop();
        if (result.length === 1) return result[0];
        return result;
    }
    async callEx(db: string, proc: string, params: any[]): Promise<any> {
        //return await this.execProc(db, proc, params);
        let result: any[][] = await this.execProc(db, proc, params);
        if (Array.isArray(result) === false) return [];
        result.pop();
        return result;
    }
    // return exists
    async buildDatabase(db: string): Promise<boolean> {
        this.resetProcColl();
        let exists = this.sqlExists(db);
        let retExists = await this.exec(exists, []);
        let ret = retExists.length > 0;
        if (ret === false) {
            try {
                let sql = `CREATE DATABASE IF NOT EXISTS \`${db}\``; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci`;
                await this.exec(sql, undefined);
            }
            catch (err) {
                console.error(err);
            }
        }
        let retTry = await this.exec('select 1', undefined);
        await this.insertInto$Uq(db);
        return ret;
    }
    async getEvents(db: string): Promise<{ db: string; name: string; }[]> {
        let ret = await this.exec(sqls.eventExists, [db]);
        return ret;
    }
    async createProcObjs(db: string): Promise<void> {
        const createProcTable = `
CREATE TABLE IF NOT EXISTS \`${db}\`.\`tv_$proc\` (
	\`name\` VARCHAR(200) NOT NULL,
	\`proc\` TEXT NULL, 
	\`changed\` TINYINT(4) NULL DEFAULT NULL,
	update_time timestamp default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (\`name\`));
`;
        // CHARACTER SET utf8 COLLATE utf8_unicode_ci

        await this.exec(createProcTable, undefined);
        const getProc = `
DROP PROCEDURE IF EXISTS \`${db}\`.tv_$proc_get;
CREATE PROCEDURE \`${db}\`.tv_$proc_get(
	IN _schema VARCHAR(200),
	IN _name VARCHAR(200)
) BEGIN	
	SELECT proc, CASE WHEN (changed=1 OR NOT (exists(SELECT ROUTINE_BODY
	FROM information_schema.routines
	WHERE 1=1 AND ROUTINE_SCHEMA=_schema AND ROUTINE_NAME=_name))) THEN 1 ELSE 0 END AS changed
	FROM tv_$proc
	WHERE 1=1 AND name=_name FOR UPDATE;
END
`;
        //WHERE 1=1 AND ROUTINE_SCHEMA COLLATE utf8_general_ci=_schema COLLATE utf8_general_ci AND ROUTINE_NAME COLLATE utf8_general_ci=_name COLLATE utf8_general_ci))) THEN 1 ELSE 0 END AS changed
        await this.exec(getProc, undefined);

        const saveProc = `
DROP PROCEDURE IF EXISTS \`${db}\`.tv_$proc_save;
CREATE PROCEDURE \`${db}\`.tv_$proc_save(
	_schema VARCHAR(200),
	_name VARCHAR(200),
	_proc TEXT
) 
__proc_exit: BEGIN
	DECLARE _procOld TEXT;DECLARE _changed TINYINT;
	IF _proc IS NULL THEN
	UPDATE tv_$proc SET changed=0 WHERE name=_name;
	LEAVE __proc_exit;
	END IF;
	SELECT proc INTO _procOld
	FROM tv_$proc
	WHERE 1=1 AND name=_name FOR UPDATE;
	SET _changed=1;
	IF _procOld IS NULL THEN
	INSERT INTO tv_$proc (name, proc, changed) 
		VALUES (_name, _proc, 1);
	ELSEIF binary _proc=_procOld THEN
		SET _changed=0;
	ELSE
	UPDATE tv_$proc SET proc=_proc, changed=1 
		WHERE name=_name;
	END IF;
	SELECT CASE WHEN (_changed=1 OR NOT (exists(SELECT ROUTINE_BODY
	FROM information_schema.routines 
	WHERE 1=1 AND ROUTINE_SCHEMA=_schema AND ROUTINE_NAME=_name))) THEN 1 ELSE 0 END AS changed;
END
`;
        //WHERE 1=1 AND ROUTINE_SCHEMA COLLATE utf8_general_ci=_schema COLLATE utf8_general_ci AND ROUTINE_NAME COLLATE utf8_general_ci=_name COLLATE utf8_general_ci))) THEN 1 ELSE 0 END AS changed;
        await this.exec(saveProc, undefined);

        return;
    }
    async create$UqDb(): Promise<void> {
        let versionResults = await this.sql('use information_schema; select version() as v', []);
        let versionRows = versionResults[1];
        let version = versionRows[0]['v'];
        if (version >= '8.0') {
            _.merge(sqls, sqls_8);
        }
        else {
            _.merge(sqls, sqls_5);
        }

        let exists = this.sqlExists('$uq');
        let rows: any[] = await this.exec(exists, undefined);
        try {
            if (rows.length == 0) {
                let sql = 'CREATE DATABASE IF NOT EXISTS $uq'; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci';
                await this.exec(sql, undefined);
            }
            let createUqTable = 'CREATE TABLE IF NOT EXISTS $uq.uq (id int not null auto_increment, `name` varchar(50), compile_tick INT, create_time timestamp not null default current_timestamp, uid bigint not null default 0, primary key(`name`), unique key unique_id (id))';
            await this.exec(createUqTable, undefined);
            let existsCompileTick = `SELECT NULL FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'uq' AND table_schema = '$uq' AND column_name = 'compile_tick'`;
            let compileTickColumns = await this.exec(existsCompileTick, undefined);
            if (compileTickColumns.length === 0) {
                await this.exec(`ALTER TABLE $uq.uq ADD compile_tick int NOT NULL default '0';`, undefined);
            }
            let createLog = 'CREATE TABLE IF NOT EXISTS $uq.log (`time` timestamp(6) not null, uq int, unit int, subject varchar(100), content text, primary key(`time`))';
            await this.exec(createLog, undefined);
            let createErrorLog = 'CREATE TABLE IF NOT EXISTS $uq.error (`time` timestamp(6) not null, uq int, unit int, subject varchar(100), content text, primary key(`time`))';
            await this.exec(createErrorLog, undefined);
            let createSetting = 'CREATE TABLE IF NOT EXISTS $uq.setting (`name` varchar(100) not null, `value` varchar(100), update_time timestamp default current_timestamp on update current_timestamp, primary key(`name`))';
            await this.exec(createSetting, undefined);
            let createPerformance = 'CREATE TABLE IF NOT EXISTS $uq.performance (`time` timestamp(6) not null, ms int, log text, primary key(`time`))';
            await this.exec(createPerformance, undefined);
            let createLocal = 'CREATE TABLE IF NOT EXISTS $uq.local (id smallint not null auto_increment, `name` varchar(50), discription varchar(100), primary key(`id`), unique key unique_name (`name`))';
            await this.exec(createLocal, undefined);
            await this.initBuildLocal();

            let performanceLog = `
	create procedure $uq.performance(_tick bigint, _log text, _ms int) begin
		declare _t timestamp(6);
		set _t = from_unixtime(_tick/1000);
		_loop: while 1=1 do
			insert ignore into performance (\`time\`, log, ms) values (_t, _log, _ms);
			if row_count()>0 then
				leave _loop; 
			end if;
			set _t=date_add(_t, interval 1 microsecond);
		end while;
	end;
	`;
            let retProcLogExists = await this.exec(sqls.procLogExists, undefined);
            if (retProcLogExists.length === 0) {
                await this.exec(new WriteLog().sql(), undefined);
            }
            let retProcLogErrorExists = await this.exec(sqls.procLogErrorExists, undefined);
            if (retProcLogErrorExists.length === 0) {
                await this.exec(new WriteLogError().sql(), undefined);
            }

            let retPerformanceExists = await this.exec(sqls.performanceExists, undefined);
            if (retPerformanceExists.length === 0) {
                await this.exec(performanceLog, undefined);
            }

            let uid = `
	CREATE FUNCTION $uq.uid(uqName VARCHAR(200))
	RETURNS bigint(20)
	LANGUAGE SQL
	DETERMINISTIC
	MODIFIES SQL DATA
	SQL SECURITY DEFINER
	COMMENT ''
	BEGIN
		DECLARE id, saved BIGINT;
		SET id = (UNIX_TIMESTAMP()<<18);
		IF uqName IS NULL THEN
			SET uqName='$uid';
		END IF;
		SELECT cast(uid as SIGNED) into saved FROM $uq.uq where \`name\`=uqName FOR update;
		IF saved IS NULL THEN
			INSERT IGNORE INTO $uq.uq (name, uid) VALUES ('$uid', id);
			SET saved=id;
		END IF;
		IF id<=saved THEN
			SET id=saved+1;
		END IF;
		UPDATE $uq.uq SET uid=id WHERE \`name\`=uqName;
		RETURN id;
	END
	`;
            let retUidExists = await this.exec(sqls.uidExists, undefined);
            if (retUidExists.length === 0) {
                await this.exec(uid, undefined);
            }

            let dateToUid = `
	CREATE FUNCTION $uq.DateToUid(
		_date DATETIME
	)
	RETURNS bigint(20)
	LANGUAGE SQL
	DETERMINISTIC
	NO SQL
	SQL SECURITY DEFINER
	COMMENT ''
	BEGIN
		DECLARE ret BIGINT;
		SET ret=unix_timestamp(_date)<<18;
		RETURN ret;
	END    
	`;
            let retDateToUidExists = await this.exec(sqls.dateToUidExists, undefined);
            if (retDateToUidExists.length === 0) {
                await this.exec(dateToUid, undefined);
            }

            let uidToDate = `
	CREATE FUNCTION $uq.UidToDate(
		_uid BIGINT
	)
	RETURNS DATETIME
	LANGUAGE SQL
	DETERMINISTIC
	NO SQL
	SQL SECURITY DEFINER
	COMMENT ''
	BEGIN
		DECLARE ret DATETIME;
		SET ret=from_unixtime(_uid>>18);
		RETURN ret;
	END    
	`;
            let retUidToDateExists = await this.exec(sqls.uidToDateExists, undefined);
            if (retUidToDateExists.length === 0) {
                await this.exec(uidToDate, undefined);
            }

            let addUqUidColumnExists = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'uq' AND table_schema = '$uq' AND column_name = 'uid';`;
            let addUqUidColumn = `ALTER TABLE $uq.uq ADD uid bigint NOT NULL default '0';`;
            let retAddUqUidColumnExists = await this.exec(addUqUidColumnExists, undefined);
            if (retAddUqUidColumnExists.length === 0) {
                await this.exec(addUqUidColumn, undefined);
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    private async initBuildLocal() {
        let selectLocal = `select * from $uq.local limit 1;`;
        let ret = await this.exec(selectLocal, undefined);
        if (ret.length > 0) return;
        let sql = 'insert into $uq.local (id, name, discription) values ';
        let first = true;
        for (let item of locals) {
            if (first === true) {
                first = false;
            }
            else {
                sql += ',';
            }
            let [id, name, discription] = item;
            sql += `(${id}, '${name}', '${discription}')`;
        }
        await this.exec(sql, undefined);
    }

    private async insertInto$Uq(db: string): Promise<void> {
        let insertUqDb = `insert into $uq.uq (\`name\`) values ('${db}') on duplicate key update create_time=current_timestamp();`;
        await this.exec(insertUqDb, undefined);
    }
    async createDatabase(db: string): Promise<void> {
        let sql = 'CREATE DATABASE IF NOT EXISTS `' + db + '` default CHARACTER SET utf8 '; //COLLATE utf8_unicode_ci';
        await this.exec(sql, undefined);
    }
    async existsDatabase(db: string): Promise<boolean> {
        let sql = this.sqlExists(db);
        let rows: any[] = await this.exec(sql, undefined);
        return rows.length > 0;
    }
    async setDebugJobs(): Promise<void> {
        try {
            let sql = `insert into $uq.setting (\`name\`, \`value\`) VALUES ('debugging_jobs', 'yes') 
			ON DUPLICATE KEY UPDATE value='yes', update_time=current_timestamp;`;
            await this.exec(sql, undefined);
        }
        catch (err) {
            console.error(err);
        }
    }
    async uqDbs(): Promise<any[]> {
        let sql = env.isDevelopment === true ?
            `select id, name as db, compile_tick from $uq.uq WHERE name<>'$uid';` :
            `select id, name as db, compile_tick
	            from $uq.uq 
				where name<>'$uid' AND
					not exists(SELECT \`name\` FROM $uq.setting WHERE \`name\`='debugging_jobs' AND \`value\`='yes' AND UNIX_TIMESTAMP()-unix_timestamp(update_time)<600);`;
        let rows: any[] = await this.exec(sql, undefined);
        return rows;
    }
    async createResDb(resDbName: string): Promise<void> {
        try {
            await this.createDatabase(resDbName);
            let sql = `
				CREATE TABLE if not exists ${resDbName}.item(
					id int not null auto_increment primary key,
					fileName varchar(120),
					mimetype varchar(50),
					uploadDate datetime default now(),
					useDate datetime
				);
			`;
            await this.exec(sql, undefined);
            let proc = `
				DROP PROCEDURE IF EXISTS ${resDbName}.createItem;
				CREATE PROCEDURE ${resDbName}.createItem (\`_fileName\` varchar(120), _mimetype varchar(50))
				BEGIN
					insert into item (fileName, mimetype) values (\`_fileName\`, _mimetype);
					select last_insert_id() as id;
				END;
			`;
            await this.exec(proc, undefined);

            proc = `
				DROP PROCEDURE IF EXISTS ${resDbName}.useItem;
				CREATE PROCEDURE ${resDbName}.useItem(_id int)
				BEGIN
					update item set useDate=now() where id=_id;
				END;
			`;
            await this.exec(proc, undefined);
        }
        catch (err) {
            console.error(err);
        }
    }

    isExistsProcInDb(proc: string): boolean {
        return this.procColl[proc.toLowerCase()] === true
    }
    async createProcInDb(db: string, proc: string): Promise<void> {
        let procLower = proc.toLowerCase();
        let p = this.procColl[procLower];
        if (p !== true) {
            let results = await this.callProcBase(db, 'tv_$proc_get', [db, proc]);
            let ret = results[0];
            if (ret.length === 0) {
                //debugger;
                console.error(`proc not defined: ${db}.${proc}`);
                this.procColl[procLower] = false;
                throw new Error(`proc not defined: ${db}.${proc}`);
            }
            else {
                let r0 = ret[0];
                let changed = r0['changed'];
                if (changed === 1) {
                    // await this.sqlDropProc(db, proc);
                    let sql = r0['proc'];
                    await this.buildProc(db, proc, sql);
                }
                this.procColl[procLower] = true;
            }
        }
    }
}

const castField: TypeCast = (field: any, next) => {
    switch (field.type) {
        default: return next();
        case 'DATE': return castDate(field);
        case 'DATETIME': return castDateTime(field);
    }
    /*
    if (( field.type === "BIT" ) && ( field.length === 1 ) ) {
        var bytes = field.buffer();
        // A Buffer in Node represents a collection of 8-bit unsigned integers.
        // Therefore, our single "bit field" comes back as the bits '0000 0001',
        // which is equivalent to the number 1.
        return( bytes[ 0 ] === 1 );
    }
    return next();
    */
}

// 确保服务器里面保存的时间是UTC时间
const timezoneOffset = new Date().getTimezoneOffset() * 60000;
function castDate(field: any) {
    // 这个地方也许有某种方法加速吧
    let text = field.string();
    return text;
}
function castDateTime(field: any) {
    // 这个地方也许有某种方法加速吧
    let text = field.string();;
    return text;
    /*
    let text = field.string();
    if (text === null) return null;
    if (text === undefined) return undefined;
    let d = new Date(new Date(text).getTime() - timezoneOffset);
    return d;
    */
}

abstract class WriteLogBase {
    protected abstract get procName(): string;
    protected abstract get tableName(): string;
    sql(): string {
        return `create procedure $uq.${this.procName}(
	_unit int, _uq varchar(50), _subject varchar(100), _content text) 
begin
	declare _time timestamp(6);
	set _time=current_timestamp(6);
	_exit: loop
		if not exists(select \`unit\` from \`${this.tableName}\` where \`time\`=_time for update) then
			insert ignore into \`${this.tableName}\` (\`time\`, unit, uq, subject, content) 
				values (_time, _unit, 
					(select id from uq where name=_uq for update),
					_subject, 
					_content);
			leave _exit;
		else
			set _time = ADDDATE(_time,interval 1 microsecond );
		end if;
	end loop;
end;
`;
    }
}

class WriteLog extends WriteLogBase {
    protected get procName(): string { return 'log' }
    protected get tableName(): string { return 'log' }
}

class WriteLogError extends WriteLogBase {
    protected get procName(): string { return 'log_error' }
    protected get tableName(): string { return 'error' }
}
