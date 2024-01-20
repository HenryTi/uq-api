"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDb$Uq = void 0;
const tool_1 = require("../../../tool");
const consts_1 = require("../../consts");
const locals_1 = require("../../locals");
const MyDb_1 = require("./MyDb");
const dbUqVersion = '1.0';
class MyDb$Uq extends MyDb_1.MyDb {
    constructor(myDbs) {
        super(myDbs, consts_1.consts.$uq);
    }
    initConfig(dbName) { return tool_1.env.connection; }
    async createDatabase() {
        await super.createDatabase();
        let isNew = await this.isNewVesion();
        if (isNew === true) {
            await this.create$UqDb();
            await this.setNewVersion();
        }
    }
    async logPerformance(tick, log, ms) {
        try {
            await this.proc('performance', [tick, log, ms]);
        }
        catch (err) {
            tool_1.logger.error(err);
            let { message, sqlMessage } = err;
            let msg = '';
            if (message)
                msg += message;
            if (sqlMessage)
                msg += ' ' + sqlMessage;
            await this.proc('performance', [Date.now(), msg, 0]);
        }
    }
    async uqLog(unit, uq, subject, content) {
        return await this.proc('log', [unit, uq, subject, content]);
    }
    async uqLogError(unit, uq, subject, content) {
        return await this.proc('log_error', [unit, uq, subject, content]);
    }
    /**
     * 从$uq.uq表中获取（服务器上配置的） 所有的uq（即DB）名称
     * @returns
     */
    async uqDbs() {
        let sql = tool_1.env.isDevelopment === true ?
            `select id, name as db, compile_tick from $uq.uq WHERE name<>'$uid';` :
            `select id, name as db, compile_tick
	            from $uq.uq 
				where name<>'$uid' AND
					not exists(SELECT \`name\` FROM $uq.setting WHERE \`name\`='debugging_jobs' AND \`value\`='yes' AND UNIX_TIMESTAMP()-unix_timestamp(update_time)<600);`;
        let rows = await this.sql(sql, undefined);
        return rows;
    }
    async isExists(dbName) {
        let exists = this.sqlExists(dbName);
        let rows = await this.sql(exists, undefined);
        return rows.length > 0;
    }
    async isNewVesion() {
        var _a;
        try {
            let ret = await this.sql(`select value from $uq.setting where name='$uq_version'`);
            if (((_a = ret[0]) === null || _a === void 0 ? void 0 : _a.value) === dbUqVersion)
                return false;
            return true;
        }
        catch {
            return false;
        }
    }
    async setNewVersion() {
        try {
            await this.sql(`insert into $uq.setting (name, value) values ('$uq_version', '${dbUqVersion}');`);
        }
        catch {
        }
    }
    async create$UqDb() {
        let sqls = this.myDbs.sqlsVersion;
        try {
            let createUqTable = 'CREATE TABLE IF NOT EXISTS $uq.uq (id int not null auto_increment, `name` varchar(50), compile_tick INT, create_time timestamp not null default current_timestamp, uid bigint not null default 0, primary key(`name`), unique key unique_id (id))';
            await this.sql(createUqTable, undefined);
            let existsCompileTick = `SELECT NULL FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'uq' AND table_schema = '$uq' AND column_name = 'compile_tick'`;
            let compileTickColumns = await this.sql(existsCompileTick, undefined);
            if (compileTickColumns.length === 0) {
                await this.sql(`ALTER TABLE $uq.uq ADD compile_tick int NOT NULL default '0';`, undefined);
            }
            let createLog = 'CREATE TABLE IF NOT EXISTS $uq.log (`time` timestamp(6) not null, uq int, unit bigint, subject varchar(100), content text, primary key(`time`))';
            await this.sql(createLog, undefined);
            let createErrorLog = 'CREATE TABLE IF NOT EXISTS $uq.error (`time` timestamp(6) not null, uq int, unit bigint, subject varchar(100), content text, primary key(`time`))';
            await this.sql(createErrorLog, undefined);
            let createSetting = 'CREATE TABLE IF NOT EXISTS $uq.setting (`name` varchar(100) not null, `value` varchar(100), update_time timestamp default current_timestamp on update current_timestamp, primary key(`name`))';
            await this.sql(createSetting, undefined);
            let createPerformance = 'CREATE TABLE IF NOT EXISTS $uq.performance (`time` timestamp(6) not null, ms int, log text, primary key(`time`))';
            await this.sql(createPerformance, undefined);
            let createLocal = 'CREATE TABLE IF NOT EXISTS $uq.local (id smallint not null auto_increment, `name` varchar(50), discription varchar(100), primary key(`id`), unique key unique_name (`name`))';
            await this.sql(createLocal, undefined);
            let upgrade$UqUnit = 'ALTER TABLE $uq.log MODIFY COLUMN unit bigint;ALTER TABLE $uq.error MODIFY COLUMN unit bigint;';
            await this.sql(upgrade$UqUnit, undefined);
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
            await this.sql(this.buildLogSql(), undefined);
            await this.sql(this.buildLogErrorSql(), undefined);
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
    async initBuildLocal() {
        let selectLocal = `select * from $uq.local limit 1;`;
        let ret = await this.sql(selectLocal, undefined);
        if (ret.length > 0)
            return;
        let sql = 'insert into $uq.local (id, name, discription) values ';
        let first = true;
        for (let item of locals_1.locals) {
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
    async setDebugJobs() {
        try {
            let sql = `insert into $uq.setting (\`name\`, \`value\`) VALUES ('debugging_jobs', 'yes') 
			ON DUPLICATE KEY UPDATE value='yes', update_time=current_timestamp;`;
            await this.sql(sql, undefined);
        }
        catch (err) {
            console.error(err);
        }
    }
    buildLogSql() {
        return this.logSql('log', 'log');
    }
    buildLogErrorSql() {
        return this.logSql('log_error', 'error');
    }
    logSql(procName, tableName) {
        return `
        DROP PROCEDURE IF EXISTS $uq.${procName};
        create procedure $uq.${procName} (
            _unit bigint, _uq varchar(50), _subject varchar(100), _content text) 
        begin
            declare _time, _tmax timestamp(6);
            set _time=current_timestamp(6);
            select max(\`time\`) into _tmax from \`${tableName}\` where \`time\`>_time for update;
            if _tmax is null then
                set _tmax = _time;
            else
                set _tmax = ADDDATE(_tmax,interval 1 microsecond);
            end if;
            insert ignore into \`${tableName}\` (\`time\`, unit, uq, subject, content) 
                values (_tmax, _unit, 
                    (select id from uq where name=_uq for update),
                    _subject, 
                    _content);
        end;
        `;
    }
}
exports.MyDb$Uq = MyDb$Uq;
//# sourceMappingURL=MyDb$Uq.js.map