import { logger } from "../../../tool";
import { locals } from "../../locals";
import { consts } from "../../consts";
import { Db } from "./db";
import { env } from "../../../tool/env";
import { dbSqlsVersion } from "./dbStart";

export class $UqDb extends Db {
    constructor() {
        super(consts.$uq);
    }
    protected getDbConfig() {
        let ret = env.connection;
        ret.flags = '-FOUND_ROWS';
        return ret;
    }

    async init(): Promise<void> { }

    async logPerformance(tick: number, log: string, ms: number): Promise<void> {
        try {
            await this.dbCaller.call('performance', [tick, log, ms]);
        }
        catch (err) {
            logger.error(err);
            let { message, sqlMessage } = err;
            let msg = '';
            if (message) msg += message;
            if (sqlMessage) msg += ' ' + sqlMessage;
            await this.dbCaller.call('performance', [Date.now(), msg, 0]);
        }
    }

    async uqLog(unit: number, uq: string, subject: string, content: string): Promise<void> {
        return await this.dbCaller.call('log', [unit, uq, subject, content]);
    }
    async uqLogError(unit: number, uq: string, subject: string, content: string): Promise<void> {
        return await this.dbCaller.call('log_error', [unit, uq, subject, content]);
    }

    /**
     * 从$uq.uq表中获取（服务器上配置的） 所有的uq（即DB）名称
     * @returns 
     */
    async uqDbs(): Promise<any[]> {
        return await this.dbCaller.uqDbs();
    }

    async createDatabase(): Promise<void> {
        await super.createDatabase();
        await this.create$UqDb();
    }

    private async create$UqDb(): Promise<void> {
        // let exists = this.sqlExists('$uq');
        // let rows: any[] = await this.exec(exists, undefined);
        let sqls = dbSqlsVersion();
        try {
            // if (rows.length == 0) {
            //    let sql = 'CREATE DATABASE IF NOT EXISTS $uq'; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci';
            //    await this.exec(sql, undefined);
            // }
            let createUqTable = 'CREATE TABLE IF NOT EXISTS $uq.uq (id int not null auto_increment, `name` varchar(50), compile_tick INT, create_time timestamp not null default current_timestamp, uid bigint not null default 0, primary key(`name`), unique key unique_id (id))';
            await this.sql(createUqTable, undefined);
            let existsCompileTick = `SELECT NULL FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'uq' AND table_schema = '$uq' AND column_name = 'compile_tick'`;
            let compileTickColumns = await this.sql(existsCompileTick, undefined);
            if (compileTickColumns.length === 0) {
                await this.sql(`ALTER TABLE $uq.uq ADD compile_tick int NOT NULL default '0';`, undefined);
            }
            let createLog = 'CREATE TABLE IF NOT EXISTS $uq.log (`time` timestamp(6) not null, uq int, unit int, subject varchar(100), content text, primary key(`time`))';
            await this.sql(createLog, undefined);
            let createErrorLog = 'CREATE TABLE IF NOT EXISTS $uq.error (`time` timestamp(6) not null, uq int, unit int, subject varchar(100), content text, primary key(`time`))';
            await this.sql(createErrorLog, undefined);
            let createSetting = 'CREATE TABLE IF NOT EXISTS $uq.setting (`name` varchar(100) not null, `value` varchar(100), update_time timestamp default current_timestamp on update current_timestamp, primary key(`name`))';
            await this.sql(createSetting, undefined);
            let createPerformance = 'CREATE TABLE IF NOT EXISTS $uq.performance (`time` timestamp(6) not null, ms int, log text, primary key(`time`))';
            await this.sql(createPerformance, undefined);
            let createLocal = 'CREATE TABLE IF NOT EXISTS $uq.local (id smallint not null auto_increment, `name` varchar(50), discription varchar(100), primary key(`id`), unique key unique_name (`name`))';
            await this.sql(createLocal, undefined);
            await this.initBuildLocal();

            let performanceLog = `
	create procedure $uq.performance(_tick bigint, _log text, _ms int) begin
        declare _time, _tmax timestamp(6);
        set _time=current_timestamp(6);
        select max(\`time\`) into _tmax from \`performance\` where \`time\`>_time for update;
        if _tmax is null then
            set _tmax = _time;
        else
            set _tmax = ADDDATE(_tmax,interval 1 microsecond);
        end if;
		insert ignore into performance (\`time\`, log, ms) values (_tmax, _log, _ms);
	end;
	`;
            let retProcLogExists = await this.sql(sqls.procLogExists, undefined);
            if (retProcLogExists.length === 0) {
                await this.sql(new WriteLog().sql(), undefined);
            }
            let retProcLogErrorExists = await this.sql(sqls.procLogErrorExists, undefined);
            if (retProcLogErrorExists.length === 0) {
                await this.sql(new WriteLogError().sql(), undefined);
            }

            let retPerformanceExists = await this.sql(sqls.performanceExists, undefined);
            if (retPerformanceExists.length === 0) {
                await this.sql(performanceLog, undefined);
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
            let retUidExists = await this.sql(sqls.uidExists, undefined);
            if (retUidExists.length === 0) {
                await this.sql(uid, undefined);
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
            let retDateToUidExists = await this.sql(sqls.dateToUidExists, undefined);
            if (retDateToUidExists.length === 0) {
                await this.sql(dateToUid, undefined);
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
            let retUidToDateExists = await this.sql(sqls.uidToDateExists, undefined);
            if (retUidToDateExists.length === 0) {
                await this.sql(uidToDate, undefined);
            }

            let addUqUidColumnExists = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'uq' AND table_schema = '$uq' AND column_name = 'uid';`;
            let addUqUidColumn = `ALTER TABLE $uq.uq ADD uid bigint NOT NULL default '0';`;
            let retAddUqUidColumnExists = await this.sql(addUqUidColumnExists, undefined);
            if (retAddUqUidColumnExists.length === 0) {
                await this.sql(addUqUidColumn, undefined);
            }
        }
        catch (err) {
            console.error(err);
        }
    }

    private async initBuildLocal() {
        let selectLocal = `select * from $uq.local limit 1;`;
        let ret = await this.sql(selectLocal, undefined);
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
        await this.sql(sql, undefined);
    }
}

export const $uqDb = new $UqDb();

export async function create$UqDb() {
    //let db = Db.db(consts.$uq);
    //let runner = new EntityRunner(db);
    //await runner.create$UqDb();
    await $uqDb.createDatabase();
}

abstract class WriteLogBase {
    protected abstract get procName(): string;
    protected abstract get tableName(): string;
    sql(): string {
        return `create procedure $uq.${this.procName}(
	_unit int, _uq varchar(50), _subject varchar(100), _content text) 
begin
	declare _time, _tmax timestamp(6);
	set _time=current_timestamp(6);
    select max(\`time\`) into _tmax from \`${this.tableName}\` where \`time\`>_time for update;
    if _tmax is null then
        set _tmax = _time;
    else
        set _tmax = ADDDATE(_tmax,interval 1 microsecond);
    end if;
    insert ignore into \`${this.tableName}\` (\`time\`, unit, uq, subject, content) 
        values (_tmax, _unit, 
            (select id from uq where name=_uq for update),
            _subject, 
            _content);
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
