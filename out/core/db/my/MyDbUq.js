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
exports.MyDbUq = void 0;
const tool_1 = require("../../../tool");
const MyDb_1 = require("./MyDb");
const consts_1 = require("../../consts");
const sqlsVersion_1 = require("./sqlsVersion");
const oldTwProfix = 'tv_'; // will be changed to '';
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
class MyDbUq extends MyDb_1.MyDb {
    constructor(dbName) {
        super(dbName);
        this.execQueueActError = false;
        this.events = new Set();
        this.resetProcColl();
    }
    connectionConfig() { return tool_1.env.connection; }
    initLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            this.twProfix = (yield this.checkIsTwProfix()) === true ? oldTwProfix : '';
        });
    }
    checkIsTwProfix() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    resetProcColl() {
        this.procColl = Object.assign({}, sysProcColl);
    }
    reset() {
        this.resetProcColl();
    }
    ;
    buildCallProc(proc) {
        let c = 'call `' + this.name + '`.`' + this.twProfix + proc + '`';
        return c;
    }
    createProcObjs() {
        return __awaiter(this, void 0, void 0, function* () {
            const createProcTable = `
    CREATE TABLE IF NOT EXISTS \`${this.name}\`.\`${this.twProfix}$proc\` (
        \`name\` VARCHAR(200) NOT NULL,
        \`proc\` TEXT NULL, 
        \`changed\` TINYINT(4) NULL DEFAULT NULL,
        update_time timestamp default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`name\`));
    `;
            // CHARACTER SET utf8 COLLATE utf8_unicode_ci
            yield this.sql(createProcTable, undefined);
            const getProc = `
    DROP PROCEDURE IF EXISTS \`${this.name}\`.${this.twProfix}$proc_get;
    CREATE PROCEDURE \`${this.name}\`.${this.twProfix}$proc_get(
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
            yield this.sql(getProc, undefined);
            const saveProc = `
    DROP PROCEDURE IF EXISTS \`${this.name}\`.${this.twProfix}$proc_save;
    CREATE PROCEDURE \`${this.name}\`.${this.twProfix}$proc_save(
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
            yield this.sql(saveProc, undefined);
            return;
        });
    }
    uqProc(procName, procSql) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.proc('$proc_save', [this.name, procName, procSql]);
            let t0 = ret[0];
            let changed = t0[0]['changed'];
            let isOk = changed === 0;
            this.procColl[procName.toLowerCase()] = isOk;
        });
    }
    buildUqProc(procName, procSql, isFunc = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
            let drop = `DROP ${type} IF EXISTS \`${this.name}\`.\`${procName}\`;`;
            yield this.sql(drop, undefined);
            yield this.sql(procSql, undefined);
            // clear changed flag
            yield this.proc('$proc_save', [this.name, procName, undefined]);
        });
    }
    uqProcGet(proc) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = yield this.proc('$proc_get', [this.name, proc]);
            let ret = results[0];
            if (ret.length === 0) {
                results = yield this.proc('$proc_get', [this.name, oldTwProfix + proc]);
                if (results[0].length === 0) {
                    debugger;
                    throw new Error(`proc not defined: ${this.name}.${proc}`);
                }
            }
            let r0 = ret[0];
            return r0;
            // let procSql = r0['proc'];
            // return procSql;
        });
    }
    buildUqRealProcFrom$ProcTable(proc) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const { proc: procSql } = yield this.uqProcGet(proc);
            const drop = `DROP PROCEDURE IF EXISTS \`${this.name}\`.\`${proc}\`;`;
            yield this.sql(drop, undefined);
            yield this.sql(procSql, undefined);
            yield this.proc('$proc_save', [this.name, proc, undefined]);
        });
    }
    buildDatabase() {
        const _super = Object.create(null, {
            buildDatabase: { get: () => super.buildDatabase }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.resetProcColl();
            return yield _super.buildDatabase.call(this);
        });
    }
    execUqProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let needBuildProc;
            let dbFirstChar = this.name[0];
            if (dbFirstChar === '$') {
                if (this.name.startsWith(consts_1.consts.$unitx) === true) {
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
                        const { proc: procSql, changed } = yield this.uqProcGet(proc);
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
                            yield this.buildUqProc(proc, procSql);
                        }
                        this.procColl[procLower] = true;
                        // }
                    }
                }
                catch (_a) {
                }
            }
            return yield this.procWithLog(proc, params);
        });
    }
    isExistsProc(proc) {
        return this.procColl[proc.toLowerCase()] === true;
    }
    createProc(proc) {
        return __awaiter(this, void 0, void 0, function* () {
            let procLower = proc.toLowerCase();
            let p = this.procColl[procLower];
            if (p !== true) {
                const { proc: procSql, changed } = yield this.uqProcGet(proc);
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
                    yield this.buildUqProc(proc, procSql);
                }
                this.procColl[procLower] = true;
                // }
            }
        });
    }
    execQueueAct() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.execQueueActError === true)
                return -1;
            let sql;
            // try {
            let db = this.name;
            let ret = yield this.call('$exec_queue_act', []);
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
                    yield this.exec(sql, []);
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
                    yield this.exec(sql, []);
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
        });
    }
    removeAllScheduleEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            let db = this.name; // .getDb();
            let events;
            try {
                const sqls = yield (0, sqlsVersion_1.sqlsVersion)();
                events = yield this.exec(sqls.eventExists, [db]);
                if ((!events) || events.length === 0)
                    return;
            }
            catch (err) {
                debugger;
                return;
            }
            let eventsText = '';
            for (let ev of events) {
                let { db, name } = ev;
                //if (name.startsWith('t v_') === true) continue;
                if (this.events.has(name) === false)
                    continue;
                eventsText += ` ${db}.${name}`;
                let sql = `DROP EVENT IF EXISTS \`${db}\`.\`${name}\`;`;
                yield this.sql(sql, []);
            }
            yield this.sql(`TRUNCATE TABLE \`${db}\`.${this.twProfix}$queue_act;`, []);
            return eventsText;
        });
    }
    buildTuidAutoId() {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `UPDATE \`${this.name}\`.${this.twProfix}$entity a 
			SET a.tuidVid=(
				select b.AUTO_INCREMENT 
					from information_schema.tables b
					where b.table_name=concat('${this.twProfix}', a.name)
						AND b.TABLE_SCHEMA='${this.name}'
				)
			WHERE a.tuidVid IS NULL;
        `;
            yield this.exec(sql, []);
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield this.execUqProc(proc, params);
            if (Array.isArray(res) === false)
                return [];
            switch (res.length) {
                case 0: return [];
                default: return res[0];
            }
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.execUqProc(proc, params);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.execUqProc(proc, params);
            if (Array.isArray(result) === false)
                return [];
            result.pop();
            if (result.length === 1)
                return result[0];
            return result;
        });
    }
    callEx(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            //return await this.execProc(db, proc, params);
            let result = yield this.execUqProc(proc, params);
            if (Array.isArray(result) === false)
                return [];
            result.pop();
            return result;
        });
    }
    saveTextId(text) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = `select \`${this.name}\`.${this.twProfix}$textid(?) as a`;
            let ret = yield this.exec(sql, [text]);
            return ret[0]['a'];
        });
    }
}
exports.MyDbUq = MyDbUq;
//# sourceMappingURL=MyDbUq.js.map