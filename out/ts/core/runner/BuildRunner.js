"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildRunner = void 0;
const core_1 = require("../../core");
const tool_1 = require("../../tool");
const centerApi_1 = require("../centerApi");
const Runner_1 = require("./Runner");
class BuildRunner extends Runner_1.Runner {
    constructor() {
        super(...arguments);
        this.setting = {};
    }
    async initSetting() {
        await this.dbUq.call('$init_setting', []);
        let updateCompileTick = `update $uq.uq set compile_tick=unix_timestamp() where name='${this.dbUq.name}'`;
        await this.dbUq.sql(updateCompileTick, undefined);
    }
    async setSetting(unit, name, value) {
        name = name.toLowerCase();
        await this.unitCall('$set_setting', unit, name, value);
        if (unit === 0) {
            let n = Number(value);
            this.setting[name] = n === Number.NaN ? value : n;
        }
    }
    async getSetting(unit, name) {
        name = name.toLowerCase();
        let ret = await this.unitTableFromProc('$get_setting', unit, name);
        if (ret.length === 0)
            return undefined;
        let v = ret[0].value;
        /*
        if (unit === 0) {
            let n = Number(v);
            v = this.setting[name] = isNaN(n)===true? v : n;
        }
        */
        return v;
    }
    async setSettingInt(unit, name, int, big) {
        await this.unitCall('$set_setting_int', unit, name, int, big);
    }
    async getSettingInt(unit, name) {
        let ret = await this.unitTableFromProc('$get_setting_int', unit, name);
        return ret[0];
    }
    async setUqOwner(userId) {
        let ret = await this.dbUq.call('$setUqOwner', [userId]);
        return ret.length > 0;
    }
    async setUnitAdmin(unitAdmin) {
        try {
            for (let ua of unitAdmin) {
                let { unit, admin } = ua;
                await this.dbUq.call('$set_unit_admin', [unit, admin]);
            }
        }
        catch (err) {
            tool_1.logger.error('set unit admin', err);
        }
    }
    // type: 1=prod, 2=test
    async refreshIDSection(service) {
        let tbl = await this.dbUq.tableFromProc('$id_section_get', []);
        let { section, sectionCount } = tbl[0];
        if (sectionCount <= 0 || sectionCount > 8) {
            return;
        }
        let type = this.dbUq.isTesting === true ? 2 : 1;
        let ret = await centerApi_1.centerApi.IDSectionApply(service, type, section, sectionCount);
        if (ret) {
            let { start, end, section_max, service_max } = ret;
            if (start) {
                await this.dbUq.call('$id_section_set', [start, end - start]);
            }
            else {
                let err = `ID Section unmatch: here_max:${section_max} center_max here: ${service_max}`;
                tool_1.logger.error(err);
                throw err;
            }
        }
    }
    async sql(sql, params) {
        try {
            return await this.dbUq.sql(sql, params || []);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async procSql(procName, procSql) {
        try {
            return await this.dbUq.uqProc(procName, procSql, core_1.ProcType.proc);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async procCoreSql(procName, procSql, isFunc) {
        try {
            let procType = isFunc === true ? core_1.ProcType.func : core_1.ProcType.core;
            await this.dbUq.uqProc(procName, procSql, procType);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async buildProc(proc) {
        await this.dbUq.buildUqStoreProcedure(proc);
    }
    async call(proc, params) {
        return await this.dbUq.call(proc, params);
    }
    async buildDatabase() {
        let ret = await this.dbUq.buildDatabase();
        await this.dbUq.createProcObjs();
        return ret;
    }
    async createDatabase() {
        let ret = await this.dbUq.createDatabase();
        await this.dbUq.createProcObjs();
        return ret;
    }
    async existsDatabase() {
        return await this.dbUq.existsDatabase();
    }
    async buildTuidAutoId() {
        await this.dbUq.buildTuidAutoId();
    }
    async tableFromProc(proc, params) {
        return await this.dbUq.tableFromProc(proc, params);
    }
    async tablesFromProc(proc, params) {
        let ret = await this.dbUq.tablesFromProc(proc, params);
        let len = ret.length;
        if (len === 0)
            return ret;
        let pl = ret[len - 1];
        if (Array.isArray(pl) === false)
            ret.pop();
        return ret;
    }
    async unitCall(proc, unit, ...params) {
        let p = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined)
            p.push(...params);
        return await this.dbUq.call(proc, p);
    }
    async unitUserCall(proc, unit, user, ...params) {
        let p = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined)
            p.push(...params);
        return await this.dbUq.call(proc, p);
    }
    async unitTableFromProc(proc, unit, ...params) {
        let p = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined)
            p.push(...params);
        let ret = await this.dbUq.tableFromProc(proc, p);
        return ret;
    }
    async unitUserTableFromProc(proc, unit, user, ...params) {
        let p = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined)
            p.push(...params);
        let ret = await this.dbUq.tableFromProc(proc, p);
        return ret;
    }
    async unitTablesFromProc(proc, unit, ...params) {
        let p = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined)
            p.push(...params);
        let ret = await this.dbUq.tablesFromProc(proc, p);
        return ret;
    }
    async unitUserTablesFromProc(proc, unit, user, ...params) {
        let p = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined)
            p.push(...params);
        let ret = await this.dbUq.tablesFromProc(proc, p);
        return ret;
    }
}
exports.BuildRunner = BuildRunner;
//# sourceMappingURL=BuildRunner.js.map