"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyDbUq = void 0;
const tool_1 = require("../../../tool");
const Db_1 = require("../Db");
const MyDb_1 = require("./MyDb");
const consts_1 = require("../../consts");
const sqlsVersion_1 = require("./sqlsVersion");
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
        this.isTesting = dbName.endsWith(consts_1.consts.$test);
        this.resetProcColl();
    }
    connectionConfig() { return tool_1.env.connection; }
    async initLoad() {
        if (this.twProfix !== undefined)
            return;
        const { oldTwProfix, tv$entityExists } = sqlsVersion_1.sqlsVersion;
        let ret = await this.sql(tv$entityExists, [this.name]);
        this.twProfix = ret.length > 0 ? oldTwProfix : '';
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
    async createProcObjs() {
        const createProcTable = `
    CREATE TABLE IF NOT EXISTS \`${this.name}\`.\`${this.twProfix}$proc\` (
        \`name\` VARCHAR(200) NOT NULL,
        \`proc\` TEXT NULL, 
        \`changed\` TINYINT(4) NULL DEFAULT NULL,
        update_time timestamp default CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`name\`));
    `;
        // CHARACTER SET utf8 COLLATE utf8_unicode_ci
        await this.sql(createProcTable, undefined);
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
        await this.sql(getProc, undefined);
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
        await this.sql(saveProc, undefined);
        return;
    }
    async uqProc(procName, procSql, procType) {
        let ret = await this.proc('$proc_save', [this.name, procName, procSql]);
        let t0 = ret[0];
        let changed = t0[0]['changed'];
        let isOk = changed === 0;
        this.procColl[procName.toLowerCase()] = isOk;
        if (procType === Db_1.ProcType.proc)
            return;
        let isFunc = (procType === Db_1.ProcType.func);
        await this.buildUqProc(procName, procSql, isFunc);
    }
    /*
    async uqCoreProc(procName: string, procSql: string, isFunc: boolean): Promise<any> {
        await this.uqProc(procName, procSql);
        await this.buildUqProc(procName, procSql, isFunc);
    }
    */
    async buildUqProc(procName, procSql, isFunc = false) {
        let type = isFunc === true ? 'FUNCTION' : 'PROCEDURE';
        let drop = `DROP ${type} IF EXISTS \`${this.name}\`.\`${procName}\`;`;
        await this.sql(drop, undefined);
        await this.sql(procSql, undefined);
        // clear changed flag
        await this.proc('$proc_save', [this.name, procName, undefined]);
    }
    async uqProcGet(proc) {
        proc = this.twProfix + proc;
        let results = await super.proc('$proc_get', [this.name, proc]);
        let ret = results[0];
        if (ret.length === 0) {
            debugger;
            throw new Error(`proc not defined: ${this.name}.${proc}`);
        }
        /*
        if (ret.length === 0) {
            results = await super.proc('$proc_get', [this.name, oldTwProfix + proc]);
            if (results[0].length === 0) {
                debugger;
                throw new Error(`proc not defined: ${this.name}.${proc}`);
            }
            ret = results[0];
        }
        */
        return ret[0];
        // let r0 = ret[0];
        // return r0;
        // let procSql = r0['proc'];
        // return procSql;
    }
    async buildUqStoreProcedureIfNotExists(...procNames) {
        if (procNames === undefined)
            return;
        for (let procName of procNames) {
            if (procName === undefined)
                continue;
            if (this.isExistsProc(procName) === false) {
                await this.createProc(procName);
            }
        }
    }
    async buildUqStoreProcedure(procName) {
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
        const { proc: procSql } = await this.uqProcGet(procName);
        const drop = `DROP PROCEDURE IF EXISTS \`${this.name}\`.\`${procName}\`;`;
        await this.sql(drop, undefined);
        await this.sql(procSql, undefined);
        await this.proc('$proc_save', [this.name, procName, undefined]);
    }
    async existsDatabase() {
        return await super.existsDatabase();
    }
    async buildDatabase() {
        this.resetProcColl();
        return await super.buildDatabase();
    }
    async execUqProc(proc, params) {
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
                    const { proc: procSql, changed } = await this.uqProcGet(proc);
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
                        await this.buildUqProc(proc, procSql);
                    }
                    this.procColl[procLower] = true;
                    // }
                }
            }
            catch (_a) {
            }
        }
        return await this.procWithLog(proc, params);
    }
    isExistsProc(proc) {
        return this.procColl[proc.toLowerCase()] === true;
    }
    async createProc(proc) {
        let procLower = proc.toLowerCase();
        let p = this.procColl[procLower];
        if (p !== true) {
            const { proc: procSql, changed } = await this.uqProcGet(proc);
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
                await this.buildUqProc(proc, procSql);
            }
            this.procColl[procLower] = true;
            // }
        }
    }
    async execQueueAct() {
        if (this.execQueueActError === true)
            return -1;
        let sql;
        // try {
        let db = this.name;
        let ret = await this.call('$exec_queue_act', []);
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
                await this.sql(sql);
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
                await this.sql(sql);
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
    async removeAllScheduleEvents() {
        let db = this.name; // .getDb();
        let events;
        try {
            const sqls = sqlsVersion_1.sqlsVersion;
            events = await this.sql(sqls.eventExists, [db]);
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
            await this.sql(sql, []);
        }
        await this.sql(`TRUNCATE TABLE \`${db}\`.${this.twProfix}$queue_act;`, []);
        return eventsText;
    }
    async buildTuidAutoId() {
        let sql = `UPDATE \`${this.name}\`.${this.twProfix}$entity a 
			SET a.tuidVid=(
				select b.AUTO_INCREMENT 
					from information_schema.tables b
					where b.table_name=concat('${this.twProfix}', a.name)
						AND b.TABLE_SCHEMA='${this.name}'
				)
			WHERE a.tuidVid IS NULL;
        `;
        await this.sql(sql);
    }
    async tableFromProc(proc, params) {
        let res = await this.execUqProc(proc, params);
        if (Array.isArray(res) === false)
            return [];
        switch (res.length) {
            case 0: return [];
            default: return res[0];
        }
    }
    async tablesFromProc(proc, params) {
        return await this.execUqProc(proc, params);
    }
    async call(proc, params) {
        let result = await this.execUqProc(proc, params);
        if (Array.isArray(result) === false)
            return [];
        result.pop();
        if (result.length === 1)
            return result[0];
        return result;
    }
    async callEx(proc, params) {
        //return await this.execProc(db, proc, params);
        let result = await this.execUqProc(proc, params);
        if (Array.isArray(result) === false)
            return [];
        result.pop();
        return result;
    }
    async saveTextId(text) {
        let sql = `select \`${this.name}\`.${this.twProfix}$textid(?) as a`;
        let ret = await this.sql(sql, [text]);
        return ret[0]['a'];
    }
}
exports.MyDbUq = MyDbUq;
//# sourceMappingURL=MyDbUq.js.map