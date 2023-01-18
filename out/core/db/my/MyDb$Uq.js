"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDb$Uq = void 0;
const tool_1 = require("../../../tool");
const consts_1 = require("../../consts");
const locals_1 = require("../../locals");
const sqlsVersion_1 = require("./sqlsVersion");
const MyDb_1 = require("./MyDb");
class MyDb$Uq extends MyDb_1.MyDb {
    constructor() {
        super(consts_1.consts.$uq);
    }
    connectionConfig() { return tool_1.env.connection; }
    createDatabase() {
        const _super = Object.create(null, {
            createDatabase: { get: () => super.createDatabase }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.createDatabase.call(this);
            yield this.create$UqDb();
        });
    }
    logPerformance(tick, log, ms) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.proc('performance', [tick, log, ms]);
            }
            catch (err) {
                tool_1.logger.error(err);
                let { message, sqlMessage } = err;
                let msg = '';
                if (message)
                    msg += message;
                if (sqlMessage)
                    msg += ' ' + sqlMessage;
                yield this.proc('performance', [Date.now(), msg, 0]);
            }
        });
    }
    uqLog(unit, uq, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.proc('log', [unit, uq, subject, content]);
        });
    }
    uqLogError(unit, uq, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.proc('log_error', [unit, uq, subject, content]);
        });
    }
    /**
     * 从$uq.uq表中获取（服务器上配置的） 所有的uq（即DB）名称
     * @returns
     */
    uqDbs() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = tool_1.env.isDevelopment === true ?
                `select id, name as db, compile_tick from $uq.uq WHERE name<>'$uid';` :
                `select id, name as db, compile_tick
	            from $uq.uq 
				where name<>'$uid' AND
					not exists(SELECT \`name\` FROM $uq.setting WHERE \`name\`='debugging_jobs' AND \`value\`='yes' AND UNIX_TIMESTAMP()-unix_timestamp(update_time)<600);`;
            let rows = yield this.sql(sql, undefined);
            return rows;
        });
    }
    create$UqDb() {
        return __awaiter(this, void 0, void 0, function* () {
            // let exists = this.sqlExists('$uq');
            // let rows: any[] = await this.exec(exists, undefined);
            let sqls = yield (0, sqlsVersion_1.sqlsVersion)();
            try {
                // if (rows.length == 0) {
                //    let sql = 'CREATE DATABASE IF NOT EXISTS $uq'; // default CHARACTER SET utf8 COLLATE utf8_unicode_ci';
                //    await this.exec(sql, undefined);
                // }
                let createUqTable = 'CREATE TABLE IF NOT EXISTS $uq.uq (id int not null auto_increment, `name` varchar(50), compile_tick INT, create_time timestamp not null default current_timestamp, uid bigint not null default 0, primary key(`name`), unique key unique_id (id))';
                yield this.sql(createUqTable, undefined);
                let existsCompileTick = `SELECT NULL FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'uq' AND table_schema = '$uq' AND column_name = 'compile_tick'`;
                let compileTickColumns = yield this.sql(existsCompileTick, undefined);
                if (compileTickColumns.length === 0) {
                    yield this.sql(`ALTER TABLE $uq.uq ADD compile_tick int NOT NULL default '0';`, undefined);
                }
                let createLog = 'CREATE TABLE IF NOT EXISTS $uq.log (`time` timestamp(6) not null, uq int, unit int, subject varchar(100), content text, primary key(`time`))';
                yield this.sql(createLog, undefined);
                let createErrorLog = 'CREATE TABLE IF NOT EXISTS $uq.error (`time` timestamp(6) not null, uq int, unit int, subject varchar(100), content text, primary key(`time`))';
                yield this.sql(createErrorLog, undefined);
                let createSetting = 'CREATE TABLE IF NOT EXISTS $uq.setting (`name` varchar(100) not null, `value` varchar(100), update_time timestamp default current_timestamp on update current_timestamp, primary key(`name`))';
                yield this.sql(createSetting, undefined);
                let createPerformance = 'CREATE TABLE IF NOT EXISTS $uq.performance (`time` timestamp(6) not null, ms int, log text, primary key(`time`))';
                yield this.sql(createPerformance, undefined);
                let createLocal = 'CREATE TABLE IF NOT EXISTS $uq.local (id smallint not null auto_increment, `name` varchar(50), discription varchar(100), primary key(`id`), unique key unique_name (`name`))';
                yield this.sql(createLocal, undefined);
                yield this.initBuildLocal();
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
                let retProcLogExists = yield this.sql(sqls.procLogExists, undefined);
                if (retProcLogExists.length === 0) {
                    yield this.sql(this.buildLogSql(), undefined);
                }
                let retProcLogErrorExists = yield this.sql(sqls.procLogErrorExists, undefined);
                if (retProcLogErrorExists.length === 0) {
                    yield this.sql(this.buildLogErrorSql(), undefined);
                }
                let retPerformanceExists = yield this.sql(sqls.performanceExists, undefined);
                if (retPerformanceExists.length === 0) {
                    yield this.sql(performanceLog, undefined);
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
                let retUidExists = yield this.sql(sqls.uidExists, undefined);
                if (retUidExists.length === 0) {
                    yield this.sql(uid, undefined);
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
                let retDateToUidExists = yield this.sql(sqls.dateToUidExists, undefined);
                if (retDateToUidExists.length === 0) {
                    yield this.sql(dateToUid, undefined);
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
                let retUidToDateExists = yield this.sql(sqls.uidToDateExists, undefined);
                if (retUidToDateExists.length === 0) {
                    yield this.sql(uidToDate, undefined);
                }
                let addUqUidColumnExists = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'uq' AND table_schema = '$uq' AND column_name = 'uid';`;
                let addUqUidColumn = `ALTER TABLE $uq.uq ADD uid bigint NOT NULL default '0';`;
                let retAddUqUidColumnExists = yield this.sql(addUqUidColumnExists, undefined);
                if (retAddUqUidColumnExists.length === 0) {
                    yield this.sql(addUqUidColumn, undefined);
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    initBuildLocal() {
        return __awaiter(this, void 0, void 0, function* () {
            let selectLocal = `select * from $uq.local limit 1;`;
            let ret = yield this.sql(selectLocal, undefined);
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
            yield this.sql(sql, undefined);
        });
    }
    setDebugJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let sql = `insert into $uq.setting (\`name\`, \`value\`) VALUES ('debugging_jobs', 'yes') 
			ON DUPLICATE KEY UPDATE value='yes', update_time=current_timestamp;`;
                yield this.sql(sql, undefined);
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    buildLogSql() {
        return this.logSql('log', 'log');
    }
    buildLogErrorSql() {
        return this.logSql('log_error', 'error');
    }
    logSql(procName, tableName) {
        return `create procedure $uq.${procName}(
            _unit int, _uq varchar(50), _subject varchar(100), _content text) 
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