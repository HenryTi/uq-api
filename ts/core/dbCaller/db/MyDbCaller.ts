import { createPool, Pool/*, MysqlError, TypeCast*/ } from 'mysql2';
import * as _ from 'lodash';
import { logger } from '../../../tool';
import { DbCaller } from '../dbCaller';
import { env } from '../../../tool/env';
import { consts } from '../../consts';
import { dbLogger, SpanLog } from './dbLogger';
import { dbSqlsVersion } from './dbStart';

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
const oldTwProfix = 'tv_';  // will be changed to '';

/*
const collationConnection = `
    SET character_set_client = 'utf8';
    SET collation_connection = 'utf8_unicode_ci';
`;
*/
const sysProcColl = {
    $entitys: true,
    $entity: true,
    $entity_version: true,
    $entity_validate: true,
    $entity_no: true,
    $init_setting: true,
    $set_setting: true,
    $get_setting: true,
    $const_strs: true,
    $const_str: true,
    $tag_values: true,
    $tag_type: true,
    $tag_save_sys: true,
    $tag_save: true,
};

export class MyDbCaller extends DbCaller {
    private dbConfig: any;
    private pool: Pool;
    constructor(dbName: string, dbConfig: any) {
        super(dbName);
        this.dbConfig = dbConfig;
        this.resetProcColl();
    }

    // protected createBuilder() { return new MyBuilder(this.dbName, this.hasUnit, this.twProfix); }

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
        // conf.timezone = 'UTC';
        // conf.typeCast = castField;
        conf.connectionLimit = 10;
        conf.waitForConnections = true;
        // conf.acquireTimeout = 10000;
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

    async loadTwProfix(): Promise<void> {
        this.twProfix = await this.checkIsTwProfix() === true ? oldTwProfix : '';
    }

    private async checkIsTwProfix(): Promise<boolean> {
        return true;
    }

    private async exec(sql: string, values: any[], log?: SpanLog): Promise<any> {
        if (this.pool === undefined) {
            this.pool = await this.getPool();
        }
        if (!sql) debugger;
        return await new Promise<any>((resolve, reject) => {
            let retryCount = 0;
            let isDevelopment = env.isDevelopment;
            let handleResponse = (err: any, result: any) => {
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
    async sqlDropProc(procName: string, isFunc: boolean): Promise<any> {
        let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
        let sql = `DROP ${type} IF EXISTS  \`${this.dbName}\`.\`${procName}\``;
        await this.exec(sql, []);
    }

    private procColl: { [procName: string]: boolean };
    private buidlCallProcSql(proc: string, params: any[]): string {
        let c = 'call `' + this.dbName + '`.`' + this.twProfix + proc + '`(';
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
    private async callProcBase(proc: string, params: any[]): Promise<any> {
        let sql = this.buidlCallProcSql(proc, params);
        let ret = await this.exec(sql, params);
        return ret;
    }
    async sqlProc(procName: string, procSql: string): Promise<any> {
        let ret = await this.callProcBase('$proc_save', [this.dbName, procName, procSql]);
        let t0 = ret[0];
        let changed = t0[0]['changed'];
        let isOk = changed === 0;
        this.procColl[procName.toLowerCase()] = isOk;
    }

    async buildProc(procName: string, procSql: string, isFunc: boolean = false): Promise<any> {
        let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
        let drop = `DROP ${type} IF EXISTS \`${this.dbName}\`.\`${procName}\`;`;
        await this.sql(drop, undefined);
        await this.sql(procSql, undefined);
        // clear changed flag
        await this.callProcBase('$proc_save', [this.dbName, procName, undefined]);
    }

    private async procGet(proc: string): Promise<{ proc: string; changed: number; }> {
        let results = await this.callProcBase('$proc_get', [this.dbName, proc]);
        let ret = results[0];
        if (ret.length === 0) {
            results = await this.callProcBase('$proc_get', [this.dbName, oldTwProfix + proc]);
            if (results[0].length === 0) {
                debugger;
                throw new Error(`proc not defined: ${this.dbName}.${proc}`);
            }
        }
        let r0 = ret[0];
        return r0;
        // let procSql = r0['proc'];
        // return procSql;
    }

    async buildRealProcFrom$ProcTable(proc: string): Promise<void> {
        /*
        let results = await this.callProcBase(this.dbName, '$proc_get', [this.dbName, proc]);
        let ret = results[0];
        if (ret.length === 0) {
            results = await this.callProcBase(this.dbName, '$proc_get', [this.dbName, oldTwProfix + proc]);
            if (results[0].length === 0) {
                debugger;
                throw new Error(`proc not defined: ${this.dbName}.${proc}`);
            }
        }
        let r0 = ret[0];
        let procSql = r0['proc'];
        */
        const { proc: procSql } = await this.procGet(proc);
        const drop = `DROP PROCEDURE IF EXISTS \`${this.dbName}\`.\`${proc}\`;`;
        await this.sql(drop, undefined);
        await this.sql(procSql, undefined);
        await this.callProcBase('$proc_save', [this.dbName, proc, undefined]);
    }

    private async execProc(proc: string, params: any[]): Promise<any> {
        let needBuildProc: boolean;
        let dbFirstChar = this.dbName[0];
        if (dbFirstChar === '$') {
            if (this.dbName.startsWith(consts.$unitx) === true) {
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
                    const { proc: procSql, changed } = await this.procGet(proc);
                    /*
                    let results = await this.callProcBase(this.dbName, '$proc_get', [this.dbName, proc]);
                    let ret = results[0];
                    if (ret.length === 0) {
                        //debugger;
                        console.error(`proc not defined: ${this.dbName}.${proc}`);
                        this.procColl[procLower] = false;
                        throw new Error(`proc not defined: ${this.dbName}.${proc}`);
                    }
                    else {
                    */
                    // let r0 = ret[0];
                    // let changed = r0['changed'];
                    if (changed === 1) {
                        // await this.sqlDropProc(db, proc);
                        // let sql = r0['proc'];
                        await this.buildProc(proc, procSql);
                    }
                    this.procColl[procLower] = true;
                    // }
                }
            }
            catch {
            }
        }
        return await this.execProcBase(proc, params);
    }
    private async execProcBase(proc: string, params: any[]): Promise<any> {
        let c = 'call `' + this.dbName + '`.`' + this.twProfix + proc + '`(';
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
        if (this.dbName !== '$uq') {
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
    async buildTuidAutoId(): Promise<void> {
        let sql = `UPDATE \`${this.dbName}\`.${this.twProfix}$entity a 
			SET a.tuidVid=(
				select b.AUTO_INCREMENT 
					from information_schema.tables b
					where b.table_name=concat('${this.twProfix}', a.name)
						AND b.TABLE_SCHEMA='${this.dbName}'
				)
			WHERE a.tuidVid IS NULL;
        `;
        await this.exec(sql, []);
    }
    async tableFromProc(proc: string, params: any[]): Promise<any[]> {
        let res = await this.execProc(proc, params);
        if (Array.isArray(res) === false) return [];
        switch (res.length) {
            case 0: return [];
            default: return res[0];
        }
    }
    async tablesFromProc(proc: string, params: any[]): Promise<any[][]> {
        return await this.execProc(proc, params);
    }
    async call(proc: string, params: any[]): Promise<any> {
        let result: any[][] = await this.execProc(proc, params);
        if (Array.isArray(result) === false) return [];
        result.pop();
        if (result.length === 1) return result[0];
        return result;
    }
    async callEx(proc: string, params: any[]): Promise<any> {
        //return await this.execProc(db, proc, params);
        let result: any[][] = await this.execProc(proc, params);
        if (Array.isArray(result) === false) return [];
        result.pop();
        return result;
    }
    // return exists
    async buildDatabase(): Promise<boolean> {
        this.resetProcColl();
        let exists = this.sqlExists(this.dbName);
        let retExists = await this.exec(exists, []);
        let ret = retExists.length > 0;
        if (ret === false) {
            try {
                let sql = `CREATE DATABASE IF NOT EXISTS \`${this.dbName}\``; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci`;
                await this.exec(sql, undefined);
            }
            catch (err) {
                console.error(err);
            }
        }
        let retTry = await this.exec('select 1', undefined);
        await this.insertInto$Uq(this.dbName);
        return ret;
    }
    async createProcObjs(db: string): Promise<void> {
        const createProcTable = `
CREATE TABLE IF NOT EXISTS \`${db}\`.\`${this.twProfix}$proc\` (
	\`name\` VARCHAR(200) NOT NULL,
	\`proc\` TEXT NULL, 
	\`changed\` TINYINT(4) NULL DEFAULT NULL,
	update_time timestamp default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (\`name\`));
`;
        // CHARACTER SET utf8 COLLATE utf8_unicode_ci

        await this.exec(createProcTable, undefined);
        const getProc = `
DROP PROCEDURE IF EXISTS \`${db}\`.${this.twProfix}$proc_get;
CREATE PROCEDURE \`${db}\`.${this.twProfix}$proc_get(
	IN _schema VARCHAR(200),
	IN _name VARCHAR(200)
) BEGIN	
	SELECT proc, CASE WHEN (changed=1 OR NOT (exists(SELECT ROUTINE_BODY
	FROM information_schema.routines
	WHERE 1=1 AND ROUTINE_SCHEMA=_schema AND ROUTINE_NAME=_name))) THEN 1 ELSE 0 END AS changed
	FROM ${this.twProfix}$proc
	WHERE 1=1 AND name=_name FOR UPDATE;
END
`;
        //WHERE 1=1 AND ROUTINE_SCHEMA COLLATE utf8_general_ci=_schema COLLATE utf8_general_ci AND ROUTINE_NAME COLLATE utf8_general_ci=_name COLLATE utf8_general_ci))) THEN 1 ELSE 0 END AS changed
        await this.exec(getProc, undefined);

        const saveProc = `
DROP PROCEDURE IF EXISTS \`${db}\`.${this.twProfix}$proc_save;
CREATE PROCEDURE \`${db}\`.${this.twProfix}$proc_save(
	_schema VARCHAR(200),
	_name VARCHAR(200),
	_proc TEXT
) 
__proc_exit: BEGIN
	DECLARE _procOld TEXT;DECLARE _changed TINYINT;
	IF _proc IS NULL THEN
	UPDATE ${this.twProfix}$proc SET changed=0 WHERE name=_name;
	LEAVE __proc_exit;
	END IF;
	SELECT proc INTO _procOld
	FROM ${this.twProfix}$proc
	WHERE 1=1 AND name=_name FOR UPDATE;
	SET _changed=1;
	IF _procOld IS NULL THEN
	INSERT INTO ${this.twProfix}$proc (name, proc, changed) 
		VALUES (_name, _proc, 1);
	ELSEIF binary _proc=_procOld THEN
		SET _changed=0;
	ELSE
	UPDATE ${this.twProfix}$proc SET proc=_proc, changed=1 
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

    private async insertInto$Uq(db: string): Promise<void> {
        let insertUqDb = `insert into $uq.uq (\`name\`) values ('${db}') on duplicate key update create_time=current_timestamp();`;
        await this.exec(insertUqDb, undefined);
    }
    async createDatabase(): Promise<void> {
        let sql = 'CREATE DATABASE IF NOT EXISTS `' + this.dbName + '` default CHARACTER SET utf8 '; //COLLATE utf8_unicode_ci';
        await this.exec(sql, undefined);
    }
    async existsDatabase(): Promise<boolean> {
        let sql = this.sqlExists(this.dbName);
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
    async saveTextId(text: string): Promise<number> {
        let sql = `select \`${this.dbName}\`.${this.twProfix}$textid(?) as a`;
        let ret = await this.exec(sql, [text]);
        return ret[0]['a'];
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

    isExistsProc(proc: string): boolean {
        return this.procColl[proc.toLowerCase()] === true
    }
    async createProc(proc: string): Promise<void> {
        let procLower = proc.toLowerCase();
        let p = this.procColl[procLower];
        if (p !== true) {
            const { proc: procSql, changed } = await this.procGet(proc);
            /*
            let results = await this.callProcBase('$proc_get', [this.dbName, proc]);
            let ret = results[0];
            if (ret.length === 0) {
                //debugger;
                console.error(`proc not defined: ${this.dbName}.${proc}`);
                this.procColl[procLower] = false;
                throw new Error(`proc not defined: ${this.dbName}.${proc}`);
            }
            else {
                let r0 = ret[0];
                let changed = r0['changed'];
            */
            if (changed === 1) {
                // await this.sqlDropProc(db, proc);
                // let sql = r0['proc'];
                await this.buildProc(proc, procSql);
            }
            this.procColl[procLower] = true;
            // }
        }
    }

    private execQueueActError: boolean = false;
    private events: Set<string> = new Set<string>();
    async execQueueAct(): Promise<number> {
        if (this.execQueueActError === true) return -1;
        let sql: string;
        // try {
        let db = this.dbName;
        let ret: any[] = await this.call('$exec_queue_act', []);
        if (ret) {
            // let db = runner.getDb();
            for (let row of ret) {
                let { entity, entityName, exec_time, unit, param, repeat, interval } = row;
                if (this.events.has(entityName) === false) {
                    this.events.add(entityName);
                }
                sql = `
    USE \`${db}\`;
    DROP EVENT IF EXISTS \`${this.twProfix}${entityName}\`;
    CREATE EVENT IF NOT EXISTS \`${this.twProfix}${entityName}\`
        ON SCHEDULE AT CURRENT_TIMESTAMP ON COMPLETION PRESERVE DO CALL \`${this.twProfix}${entityName}\`(${unit}, 0);
    `;
                await this.exec(sql, []);
                if (repeat === 1) {
                    sql = `use \`${db}\`; DELETE a FROM ${this.twProfix}$queue_act AS a WHERE a.unit=${unit} AND a.entity=${entity};`;
                }
                else {
                    sql = `use \`${db}\`; UPDATE ${this.twProfix}$queue_act AS a 
                            SET a.exec_time=date_add(GREATEST(a.exec_time, CURRENT_TIMESTAMP()), interval a.interval minute)
                                , a.repeat=a.repeat-1
                            WHERE a.unit=${unit} AND a.entity=${entity};
                        `;
                }
                await this.exec(sql, []);
            }
        }
        return 0;
        /*
    }
    catch (err) {
        let $uqDb = Db.db(consts.$uq);
        await $uqDb.uqLog(0, runner.getDb(), 'Error execQueueAct'
            , (err.message ?? '') + ': ' + sql);
        logger.error(`execQueueAct: `, err);
        // runner.execQueueActError = true; 暂时先不处理这个 2022-1-6
        return -1;
    }
    */
    }

    async removeAllScheduleEvents(): Promise<string> {
        let db = this.dbName; // .getDb();
        let events: { db: string; name: string }[];
        try {
            const sqls = dbSqlsVersion();
            events = await this.exec(sqls.eventExists, [db]);
            if ((!events) || events.length === 0) return;
        }
        catch (err) {
            debugger;
            return;
        }
        let eventsText = '';
        for (let ev of events) {
            let { db, name } = ev;
            //if (name.startsWith('t v_') === true) continue;
            if (this.events.has(name) === false) continue;
            eventsText += ` ${db}.${name}`;
            let sql = `DROP EVENT IF EXISTS \`${db}\`.\`${name}\`;`;
            await this.sql(sql, []);
        }
        await this.sql(`TRUNCATE TABLE \`${db}\`.${this.twProfix}$queue_act;`, []);
        return eventsText;
    }
}
/*
const castField: TypeCast = (field: any, next) => {
    switch (field.type) {
        default: return next();
        case 'DATE': return castDate(field);
        case 'DATETIME': return castDateTime(field);
    }
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
}
*/
