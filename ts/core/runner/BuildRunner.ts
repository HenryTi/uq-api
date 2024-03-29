import { ProcType, getNet } from '../../core';
import { logger } from '../../tool';
import { centerApi } from '../centerApi';
import { Runner } from './Runner';

export class BuildRunner extends Runner {
    private readonly setting: { [name: string]: any } = {};

    async initSetting(): Promise<void> {
        await this.dbUq.call('$init_setting', []);
        let updateCompileTick = `update $uq.uq set compile_tick=unix_timestamp() where name='${this.dbUq.name}'`;
        await this.dbUq.sql(updateCompileTick, undefined);
    }
    async setSetting(unit: number, name: string, value: string): Promise<void> {
        name = name.toLowerCase();
        await this.unitCall('$set_setting', unit, name, value);
        if (unit === 0) {
            let n = Number(value);
            this.setting[name] = n === Number.NaN ? value : n;
        }
    }
    async getSetting(unit: number, name: string): Promise<any> {
        name = name.toLowerCase();
        let ret = await this.unitTableFromProc('$get_setting', unit, name);
        if (ret.length === 0) return undefined;
        let v = ret[0].value;
        /*
        if (unit === 0) {
            let n = Number(v);
            v = this.setting[name] = isNaN(n)===true? v : n;
        }
        */
        return v;
    }
    async setSettingInt(unit: number, name: string, int: number, big: number): Promise<void> {
        await this.unitCall('$set_setting_int', unit, name, int, big);
    }
    async getSettingInt(unit: number, name: string): Promise<{ int: number; big: number }> {
        let ret = await this.unitTableFromProc('$get_setting_int', unit, name);
        return ret[0];
    }
    async setUnitAdmin(unitAdmin: { unit: number, admin: number }[]) {
        try {
            for (let ua of unitAdmin) {
                let { unit, admin } = ua;
                await this.dbUq.call('$set_unit_admin', [unit, admin]);
            }
        }
        catch (err) {
            logger.error('set unit admin', err);
        }
    }

    // type: 1=prod, 2=test
    async refreshIDSection(service: number) {
        let tbl = await this.dbUq.tableFromProc('$id_section_get', []);
        let { section, sectionCount } = tbl[0];
        if (sectionCount <= 0 || sectionCount > 8) {
            return;
        }
        let type: 1 | 2 = this.dbUq.isTesting === true ? 2 : 1;
        let ret = await centerApi.IDSectionApply(service, type, section, sectionCount);
        if (ret) {
            let { start, end, section_max, service_max } = ret;
            if (start) {
                await this.dbUq.call('$id_section_set', [start, end - start]);
            }
            else {
                let err = `ID Section unmatch: here_max:${section_max} center_max here: ${service_max}`;
                logger.error(err);
                throw err;
            }
        }
    }

    async sql(sql: string, params: any[]): Promise<any> {
        try {
            return await this.dbUq.sql(sql, params || []);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async procSql(procName: string, procSql: string): Promise<any> {
        try {
            return await this.dbUq.uqProc(procName, procSql, ProcType.proc);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async procCoreSql(procName: string, procSql: string, isFunc: boolean): Promise<any> {
        try {
            let procType: ProcType = isFunc === true ? ProcType.func : ProcType.core;
            await this.dbUq.uqProc(procName, procSql, procType);
        }
        catch (err) {
            debugger;
            throw err;
        }
    }
    async buildProc(proc: string): Promise<any> {
        await this.dbUq.buildUqStoreProcedure(proc);
    }
    async call(proc: string, params: any[]): Promise<any> {
        return await this.dbUq.call(proc, params);
    }

    async buildDatabase(): Promise<boolean> {
        let ret = await this.dbUq.buildDatabase();
        await this.dbUq.createProcObjs();
        return ret;
    }
    async createDatabase(): Promise<void> {
        let ret = await this.dbUq.createDatabase();
        await this.dbUq.createProcObjs();
        return ret;
    }
    async existsDatabase(): Promise<boolean> {
        return await this.dbUq.existsDatabase();
    }
    async buildTuidAutoId(): Promise<void> {
        await this.dbUq.buildTuidAutoId();
    }
    async tableFromProc(proc: string, params: any[]): Promise<any[]> {
        return await this.dbUq.tableFromProc(proc, params);
    }
    async tablesFromProc(proc: string, params: any[]): Promise<any[][]> {
        let ret = await this.dbUq.tablesFromProc(proc, params);
        let len = ret.length;
        if (len === 0) return ret;
        let pl = ret[len - 1];
        if (Array.isArray(pl) === false) ret.pop();
        return ret;
    }
    async unitCall(proc: string, unit: number, ...params: any[]): Promise<any> {
        let p: any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        return await this.dbUq.call(proc, p);
    }
    async unitUserCall(proc: string, unit: number, user: number, ...params: any[]): Promise<any> {
        let p: any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        return await this.dbUq.call(proc, p);
    }

    async unitTableFromProc(proc: string, unit: number, ...params: any[]): Promise<any[]> {
        let p: any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.dbUq.tableFromProc(proc, p);
        return ret;
    }
    async unitUserTableFromProc(proc: string, unit: number, user: number, ...params: any[]): Promise<any[]> {
        let p: any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.dbUq.tableFromProc(proc, p);
        return ret;
    }

    async unitTablesFromProc(proc: string, unit: number, ...params: any[]): Promise<any[][]> {
        let p: any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.dbUq.tablesFromProc(proc, p);
        return ret;
    }
    async unitUserTablesFromProc(proc: string, unit: number, user: number, ...params: any[]): Promise<any[][]> {
        let p: any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.dbUq.tablesFromProc(proc, p);
        return ret;
    }

    async finishBuildDb(user: { id: number; }, paramUqId: number, uqVersion: number) {
        let net = getNet();

        await Promise.all([
            this.setSetting(0, 'uqId', String(paramUqId)),
            this.setSetting(0, 'uqVersion', String(uqVersion)),
        ]);
        await this.initSetting();

        await net.resetRunnerAfterCompile(this.dbUq);

        if (user) {
            let id = user.id;
            if (id) {
                await this.dbUq.call('$finish_build_db', [id]);
                // await this.setUqOwner(id);
                await this.syncCenterUser(id);
            }
        }
    }
    /*
    private async setUqOwner(userId: number): Promise<boolean> {
        let ret = await this.dbUq.call('$setUqOwner', [userId]);
        return ret.length > 0;
    }
    */

    private async syncCenterUser(userId: number) {
        let user = await centerApi.userFromId(userId);
        let { id, name, nick, icon } = user;
        await this.dbUq.call('$set_user', [id, name, nick, icon]);
        return user;
    }
}
