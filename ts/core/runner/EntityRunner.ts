import * as jsonpack from 'jsonpack';
import { env, logger } from '../../tool';
import { createSqlFactory, SqlBuilder, SqlFactory } from '../db';
import { Db, Db$Uq, getDbs, DbUq } from '../db';
import { packReturns } from '../packReturn';
import { ImportData } from '../importData';
import {
    ParametersBus, ActionParametersBus, SheetVerifyParametersBus
    , SheetActionParametersBus, AcceptParametersBus
} from '../inBusAction';
import { Net } from '../net';
import { centerApi } from '../centerApi';
import { BusFace, BusFaceAccept, BusFaceQuery } from './BusFace';
import { Runner } from './Runner';

interface EntityAccess {
    name: string;
    access: any;
}

interface SheetRun {
    onsave: boolean;
    verify: {
        returns: any[];      // returns;
        inBuses: any[];
    }
}

export interface Buses {
    /**
     * 一个uq的bus中定义的所有face的完整名称（ownername/busname/facename），用\n分隔
     */
    faces: string;
    /**
     * 一个uq中定义的bus的个数 
     */
    outCount: number;
    urlColl: { [url: string]: BusFace };
    faceColl: { [bus: string]: BusFace };
    error: any;
}

export class EntityRunner extends Runner {
    private access: any;
    private accessSchemaArr: any[];
    private role: any;
    private roleNames: { [role: string]: string[] };
    private ids: { [name: string]: any };
    private tuids: { [name: string]: any };

    /**
     * entity表中bus的定义集合
     */
    private busArr: any[];
    private entityColl: { [id: number]: EntityAccess };
    private sheetRuns: { [sheet: string]: SheetRun };
    private readonly modifyMaxes: { [unit: number]: number };
    private readonly roleVersions: { [unit: number]: { [app: number]: { version: number, tick: number } } } = {};
    private readonly db$Uq: Db$Uq;
    private ixOfUsers: string;
    private compileTick: number = 0;

    // readonly IDRunner: IDRunner;
    readonly net: Net;
    readonly sqlFactory: SqlFactory
    readonly dbName: string;
    schemas: { [entity: string]: { type: string; from: string; call: any; run: any; } };
    uqOwner: string;
    uq: string;
    author: string;
    version: string;
    importTuids: any[];
    // tuid的值，第一个是tuidname，随后用tab分隔的map
    froms: { [from: string]: { [tuid: string]: { tuid?: string, maps?: string[], tuidObj?: any, mapObjs?: { [map: string]: any } } } };
    hasUnit: boolean;
    hasStatements: boolean;
    uqId: number;
    uqVersion: number;  // uq compile changes
    uniqueUnit: number;
    service: number;

    /**
     * 一个uq定义的bus的信息
     */
    buses: Buses; //{[url:string]:any}; // 直接查找bus
    hasPullEntities: boolean = false;
    hasSheet: boolean = false;
    isCompiling: boolean = false;
    devBuildSys: boolean = false;

    /**
     * EntityRunner: 提供调用某个db中存储过程 / 缓存某db中配置数据 的类？
     * @param name uq(即数据库)的名称
     * @param dbContainer 
     * @param net 
     */
    constructor(dbUq: DbUq, net: Net) {
        super(dbUq);
        this.net = net;
        this.modifyMaxes = {};
        this.dbName = dbUq.name;
        this.sqlFactory = createSqlFactory({
            dbUq,
            getTableSchema: this.getTableSchema,
            // dbName: this.dbName,
            hasUnit: false,
            // twProfix: this.dbUq.twProfix,
        });
        this.db$Uq = getDbs().db$Uq;
    }

    private getTableSchema = (lowerName: string): any => {
        return this.schemas[lowerName]?.call;
    }

    async reset() {
        this.isCompiling = false;
        this.dbUq.reset();
        this.schemas = undefined;
        await this.init();
    }

    /**
     * 设置runner的compileTick，但是这个compileTick好像没看到有什么用
     * @param compileTick 
     * @returns 
     */
    async setCompileTick(compileTick: number) {
        if (compileTick === undefined) return;
        if (this.compileTick === compileTick) return;
        this.compileTick = compileTick;
        await this.reset();
    }

    async IDSql(unit: number, user: number, sqlBuilder: SqlBuilder<any>) {
        sqlBuilder.build();
        let { sql, proc, procParameters } = sqlBuilder;
        let ret: any;
        if (proc !== undefined) {
            ret = await this.call(proc, procParameters);
        }
        else if (sql !== undefined) {
            ret = await this.call('$exec_sql_trans', [unit, user, sql]);
        }
        else {
            throw new Error('error on build sql');
        }
        return ret;
    }

    async ActIDProp(unit: number, user: number, ID: string, id: number, propName: string, value: string) {
        return await this.call(`${ID}$prop`, [unit, user, id, propName, value]);
    }

    getEntityNameList() {
        return Object.keys(this.schemas).join(', ');
        //return JSON.stringify(this.schemas);
    }

    async getRoles(unit: number, app: any, user: number, inRoles: string): Promise<{ roles: number, version: number }> {
        let [rolesBin, rolesVersion] = inRoles.split('.');
        let unitRVs = this.roleVersions[unit];
        if (unitRVs === undefined) {
            this.roleVersions[unit] = unitRVs = {}
        }
        let rv = unitRVs[app];
        if (rv !== undefined) {
            let { version: rvVersion, tick } = rv;
            let now = Date.now();
            if (Number(rolesVersion) === rvVersion && now - tick < 60 * 1000) return;
        }
        // 去中心服务器取user对应的roles，version
        let ret = await centerApi.appRoles(unit, app, user);
        if (ret === undefined) return;
        let { roles, version } = ret;
        unitRVs[app] = { version, tick: Date.now() };
        if (version === Number(rolesVersion) && roles === Number(rolesBin)) return;
        return ret;
    }
    async getAdmins(unit: number, user: number): Promise<any[]> {
        let tbl = await this.tableFromProc('$get_admins', [unit, user]);
        if (tbl.length === 0) return;
        return tbl;
    }
    async setMeAdmin(unit: number, user: number): Promise<void> {
        await this.call('$set_me_admin', [unit, user]);
    }
    async setAdmin(unit: number, $user: number, user: number, role: number, assigned: string): Promise<void> {
        await this.call('$set_admin', [unit, $user, user, role, assigned]);
    }
    async isAdmin(unit: number, user: number): Promise<boolean> {
        let ret = await this.tableFromProc('$is_admin', [unit, user]);
        return ret.length > 0;
    }

    async getMyRoles(unit: number, user: number): Promise<string> {
        if (!this.roleNames) return;
        let tbl = await this.tableFromProc('$get_my_roles', [unit, user]);
        if (tbl.length === 0) return;
        let { roles, admin } = tbl[0];

        if (admin > 0) {
            return '$|' + this.roleNames;
        }
        return roles;
        /*
        switch (admin) {
            default: return roles;
            case 1: return '$|' + this.roleNames;
            case 2: return '$' + roles;
        }
        */
    }
    async getAllRoleUsers(unit: number, user: number): Promise<any[]> {
        // row 0 返回 ixOfUsers
        let tbl = await this.tableFromProc('$get_all_role_users', [unit, user]);
        tbl.unshift({ user: 0, roles: this.ixOfUsers });
        return tbl;
    }
    async setUserRoles(unit: number, user: number, theUser: number, roles: string): Promise<any> {
        await this.call('$set_user_roles', [unit, user, theUser, roles]);
    }
    async deleteUserRoles(unit: number, user: number, theUser: number): Promise<any> {
        await this.call('$delete_user_roles', [unit, user, theUser]);
    }

    async roleGetAdmins(unit: number, user: number): Promise<any[]> {
        let tbl = await this.tableFromProc('$get_admins', [unit, user]);
        if (tbl.length === 0) return;
        return tbl;
    }
    async roleSetMeAdmin(unit: number, user: number): Promise<void> {
        await this.call('$set_me_admin', [unit, user]);
    }
    async roleSetAdmin(unit: number, $user: number, user: number, role: number, assigned: string): Promise<void> {
        await this.call('$set_admin', [unit, $user, user, role, assigned]);
    }
    async roleIsAdmin(unit: number, user: number): Promise<boolean> {
        let ret = await this.tableFromProc('$is_admin', [unit, user]);
        return ret.length > 0;
    }

    async roleGetMy(unit: number, user: number): Promise<any[][]> {
        let ret = await this.tablesFromProc('$role_my_roles', [unit, user]);
        return ret;
    }
    async roleGetAllUsers(unit: number, user: number): Promise<any[]> {
        // row 0 返回 ixOfUsers
        let tbl = await this.tableFromProc('$get_all_role_users', [unit, user]);
        tbl.unshift({ user: 0, roles: this.ixOfUsers });
        return tbl;
    }
    async roleSetUser(unit: number, user: number, theUser: number, roles: string): Promise<any> {
        await this.call('$set_user_roles', [unit, user, theUser, roles]);
    }
    async roleDeleteUser(unit: number, user: number, theUser: number): Promise<any> {
        await this.call('$delete_user_roles', [unit, user, theUser]);
    }

    checkUqVersion(uqVersion: number) {
        //if (this.uqVersion === undefined) return;
        //if (uqVersion !== this.uqVersion) 
        throw 'unmatched uq version';
    }

    setModifyMax(unit: number, modifyMax: number) {
        this.modifyMaxes[unit] = modifyMax;
    }

    async getModifyMax(unit: number): Promise<number> {
        let ret = this.modifyMaxes[unit];
        if (ret !== undefined) {
            if (ret === null) return;
            return ret;
        }
        try {
            let maxes: any[] = await this.tableFromProc('$modify_queue_max', [unit]);
            if (maxes.length === 0) {
                ret = null;
            }
            else {
                ret = maxes[0].max;
            }
            this.modifyMaxes[unit] = ret;
            return ret;
        }
        catch (err) {
            logger.error(err);
            this.modifyMaxes[unit] = null;
        }
    }
    async log(unit: number, subject: string, content: string): Promise<void> {
        // await this.$uqDb.uqLog(unit, this.net.getUqFullName(this.uq), subject, content);
        await this.db$Uq.proc('log', [unit, this.dbName, subject, content]);
    }
    async logError(unit: number, subject: string, content: string): Promise<void> {
        //await this.$uqDb.uqLogError(unit, this.net.getUqFullName(this.uq), subject, content);
        await this.db$Uq.proc('log_error', [unit, this.dbName, subject, content]);
    }
    async call(proc: string, params: any[]): Promise<any> {
        return await this.dbUq.call(proc, params);
    }
    async sql(sql: string, params: any[]): Promise<any> {
        return await this.dbUq.sql(sql, params);
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

    async unitUserCallEx(proc: string, unit: number, user: number, ...params: any[]): Promise<any> {
        let p: any[] = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        return await this.dbUq.callEx(proc, p);
    }

    async unitTableFromProc(proc: string, unit: number, ...params: any[]): Promise<any[]> {
        let p: any[] = [];
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.dbUq.tableFromProc(proc, p);
        return ret;
    }
    async unitUserTableFromProc(proc: string, unit: number, user: number, ...params: any[]): Promise<any[]> {
        let p: any[] = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.dbUq.tableFromProc(proc, p);
        return ret;
    }

    async unitTablesFromProc(proc: string, unit: number, ...params: any[]): Promise<any[][]> {
        let p: any[] = [];
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.dbUq.tablesFromProc(proc, p);
        return ret;
    }
    async unitUserTablesFromProc(proc: string, unit: number, user: number, ...params: any[]): Promise<any[][]> {
        let p: any[] = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.dbUq.tablesFromProc(proc, p);
        return ret;
    }
    async buildProc(proc: string): Promise<void> {
    }

    async buildUqStoreProcedureIfNotExists(...procs: string[]): Promise<void> {
        await this.dbUq.buildUqStoreProcedureIfNotExists(...procs);
    }
    /*
    async createProc(proc: string) {
        await this.dbUq.createProc(proc);
    }
    */

    /**
     * 读取runner对应的uq的entity表和setting表
     * @param hasSource 表示是否读取entity的源代码 
     * @returns array[0]对应的是entity表的记录；array[1]对应的是setting表的记录 
     */
    async loadSchemas(hasSource: number): Promise<any[][]> {
        return await this.dbUq.tablesFromProc('$entitys', [hasSource]);
    }

    async saveSchema(unit: number, user: number, id: number, name: string, type: number, schema: string, run: string, source: string, from: string, open: number, isPrivate: number): Promise<any> {
        return await this.unitUserCall('$entity', unit, user, id, name, type, schema, run, source, from, open, isPrivate);
    }
    async loadConstStrs(): Promise<{ [name: string]: number }[]> {
        return await this.dbUq.call('$const_strs', []);
    }
    async saveConstStr(type: string): Promise<number> {
        return await this.dbUq.call('$const_str', [type]);
    }
    async saveTextId(text: string): Promise<number> {
        return await this.dbUq.saveTextId(text);
    }
    async loadSchemaVersion(name: string, version: string): Promise<string> {
        return await this.dbUq.call('$entity_version', [name, version]);
    }
    async setEntityValid(entities: string, valid: number): Promise<any[]> {
        let ret = await this.dbUq.call('$entity_validate', [entities, valid]);
        return ret;
    }
    async saveFace(bus: string, busOwner: string, busName: string, faceName: string) {
        await this.dbUq.call('$save_face', [bus, busOwner, busName, faceName]);
    }

    async execQueueAct(): Promise<number> {
        return await this.dbUq.execQueueAct();
    }
    /*
    async tagType(names: string) {
        await this.db.call('$tag_type', [names]);
    }
    async tagSaveSys(data: string) {
        await this.db.call('$tag_save_sys', [data]);
    }
    */
    isTuidOpen(tuid: string) {
        tuid = tuid.toLowerCase();
        let t = this.tuids[tuid];
        if (t === undefined) return false;
        if (t.isOpen === true) return true;
        return false;
    }
    isActionOpen(action: string) {
        action = action.toLowerCase();
        let t = this.schemas[action];
        if (t === undefined) return false;
        let { call } = t;
        if (call === undefined) return false;
        if (call.isOpen === true) return true;
        return false;
    }
    getTuid(tuid: string) {
        tuid = tuid.toLowerCase();
        let ret = this.tuids[tuid];
        return ret;
    }
    getMap(map: string): any {
        map = map.toLowerCase();
        let m = this.schemas[map];
        if (m === undefined) return;
        if (m.type === 'map') return m;
    }

    async entityNo(entity: string, unit: number, year: number, month: number, date: number): Promise<any[]> {
        return await this.call('$entity_no', [unit, entity, `${year}-${month}-${date}`]);
    }
    async tuidGet(tuid: string, unit: number, user: number, id: number): Promise<any> {
        return await this.unitUserCallEx(tuid, unit, user, id);
    }
    async tuidArrGet(tuid: string, arr: string, unit: number, user: number, owner: number, id: number): Promise<any> {
        return await this.unitUserCall(tuid + '_' + arr + '$id', unit, user, owner, id);
    }
    async tuidGetAll(tuid: string, unit: number, user: number): Promise<any> {
        return await this.unitUserCall(tuid + '$all', unit, user);
    }
    async tuidVid(tuid: string, unit: number, uniqueValue: any): Promise<any> {
        let proc = `${tuid}$vid`;
        return await this.unitCall(proc, unit, uniqueValue);
    }
    async tuidArrVid(tuid: string, arr: string, unit: number, uniqueValue: any): Promise<any> {
        let proc = `${tuid}_${arr}$vid`;
        return await this.unitCall(proc, unit, uniqueValue);
    }
    async tuidGetArrAll(tuid: string, arr: string, unit: number, user: number, owner: number): Promise<any> {
        return await this.unitUserCall(tuid + '_' + arr + '$all', unit, user, owner);
    }
    async tuidIds(tuid: string, arr: string, unit: number, user: number, ids: string): Promise<any> {
        let proc = tuid;
        if (arr !== '$') proc += '_' + arr;
        proc += '$ids';
        let ret = await this.unitUserCall(proc, unit, user, ids);
        return ret;
    }
    async tuidMain(tuid: string, unit: number, user: number, id: number): Promise<any> {
        return await this.unitUserCall(tuid + '$main', unit, user, id);
    }
    async tuidSave(tuid: string, unit: number, user: number, params: any[]): Promise<any> {
        return await this.unitUserCall(tuid + '$save', unit, user, ...params);
    }
    async tuidSetStamp(tuid: string, unit: number, params: any[]): Promise<void> {
        return await this.unitCall(tuid + '$stamp', unit, ...params);
    }
    async tuidArrSave(tuid: string, arr: string, unit: number, user: number, params: any[]): Promise<any> {
        return await this.unitUserCall(tuid + '_' + arr + '$save', unit, user, ...params);
    }
    async tuidArrPos(tuid: string, arr: string, unit: number, user: number, params: any[]): Promise<any> {
        return await this.unitUserCall(tuid + '_' + arr + '$pos', unit, user, ...params);
    }
    async tuidSeach(tuid: string, unit: number, user: number, arr: string, key: string, pageStart: number, pageSize: number): Promise<any> {
        let proc = tuid + '$search';
        return await this.unitUserTablesFromProc(proc, unit, user, key || '', pageStart, pageSize);
    }
    async saveProp(tuid: string, unit: number, user: number, id: number, prop: string, value: any) {
        let proc = tuid + '$prop';
        await this.unitUserCall(proc, unit, user, id, prop, value);
    }
    async tuidArrSeach(tuid: string, unit: number, user: number, arr: string, ownerId: number, key: string, pageStart: number, pageSize: number): Promise<any> {
        let proc = `${tuid}_${arr}$search`;
        return await this.unitUserTablesFromProc(proc, unit, user, ownerId, key || '', pageStart, pageSize);
    }
    async mapSave(map: string, unit: number, user: number, params: any[]): Promise<any> {
        return await this.unitUserCall(map + '$save', unit, user, ...params);
    }
    async importVId(unit: number, user: number, source: string, tuid: string, arr: string, no: string): Promise<number> {
        let proc = `$import_vid`;
        let ret = await this.unitUserTableFromProc(proc, unit, user, source, tuid, arr, no);
        return ret[0].vid;
    }
    private getSheetVerifyParametersBus(sheetName: string): ParametersBus {
        let name = sheetName + '$verify';
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction === undefined) {
            let svpb = new SheetVerifyParametersBus(this, sheetName);
            if (svpb.init() === true) {
                inBusAction = this.parametersBusCache[name] = svpb;
            }
        }
        return inBusAction;
    }
    private isVerifyItemOk(arr: any[]): boolean { return arr.length === 0 }
    private isVerifyArrOk(arr: any[]): boolean {
        for (let item of arr) {
            if (this.isVerifyItemOk(item) === false) return false;
        }
        return true;
    }
    async sheetVerify(sheet: string, unit: number, user: number, data: string): Promise<string> {
        let sheetRun = this.sheetRuns[sheet];
        if (sheetRun === undefined) return;
        let { verify } = sheetRun;
        if (verify === undefined) return;
        let { returns } = verify;
        if (returns === undefined) return;
        let { length } = returns;
        if (length === 0) return;

        //let actionName = sheet + '$verify';
        let inBusAction = this.getSheetVerifyParametersBus(sheet);
        let inBusResult = await inBusAction.busQueryAll(unit, user, data);
        let inBusActionData = data + inBusResult;
        let ret = await this.unitUserCall(sheet + '$verify', unit, user, inBusActionData);

        if (length === 1) {
            if (this.isVerifyItemOk(ret) === true) return;
        }
        if (this.isVerifyArrOk(ret) === true) return;

        let failed = packReturns(returns, ret);
        return failed;
    }
    async sheetSave(sheet: string, unit: number, user: number, app: number, discription: string, data: string): Promise<{}> {
        return await this.unitUserCall('$sheet_save', unit, user, sheet, app, discription, data);
    }
    async sheetTo(unit: number, user: number, sheetId: number, toArr: number[]) {
        await this.unitUserCall('$sheet_to', unit, user, sheetId, toArr.join(','));
    }
    async sheetProcessing(sheetId: number): Promise<void> {
        await this.dbUq.call('$sheet_processing', [sheetId]);
    }
    private getSheetActionParametersBus(sheetName: string, stateName: string, actionName: string): ParametersBus {
        let name = `${sheetName}_${stateName}_${actionName}`;
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction === undefined) {
            let sapb = new SheetActionParametersBus(this, sheetName, stateName, actionName);
            if (sapb.init() === true) {
                inBusAction = this.parametersBusCache[name] = sapb;
            }
        }
        return inBusAction;
    }
    async sheetAct(sheet: string, state: string, action: string, unit: number, user: number, id: number, flow: number): Promise<any[]> {
        let inBusActionName = sheet + '_' + (state === '$' ? action : state + '_' + action);
        let inBusAction = this.getSheetActionParametersBus(sheet, state, action);
        if (inBusAction === undefined) return [`state ${state} is not sheet ${sheet} state`];
        let inBusActionData = await inBusAction.busQueryAll(unit, user, id);
        //await this.log(unit, 'sheetAct', 'before ' + inBusActionName);
        let ret = inBusActionData === '' ?
            await this.unitUserCallEx(inBusActionName, unit, user, id, flow, action)
            : await this.unitUserCallEx(inBusActionName, unit, user, id, flow, action, inBusActionData);
        //await this.log(unit, 'sheetAct', 'after ' + inBusActionName);
        return ret;
    }
    async sheetStates(sheet: string, state: string, unit: number, user: number, pageStart: number, pageSize: number) {
        let sql = '$sheet_state';
        return await this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
    }
    async sheetStateCount(sheet: string, unit: number, user: number) {
        let sql = '$sheet_state_count';
        return await this.unitUserCall(sql, unit, user, sheet);
    }
    async userSheets(sheet: string, state: string, unit: number, user: number, sheetUser: number, pageStart: number, pageSize: number) {
        let sql = '$sheet_state_user';
        return await this.unitUserCall(sql, unit, user, sheet, state, sheetUser, pageStart, pageSize);
    }
    async mySheets(sheet: string, state: string, unit: number, user: number, pageStart: number, pageSize: number) {
        let sql = '$sheet_state_my';
        return await this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
    }
    async getSheet(sheet: string, unit: number, user: number, id: number) {
        let sql = '$sheet_id';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }

    async sheetScan(sheet: string, unit: number, user: number, id: number) {
        let sql = '$sheet_scan';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }

    async sheetArchives(sheet: string, unit: number, user: number, pageStart: number, pageSize: number) {
        let sql = '$archives';
        return await this.unitUserCall(sql, unit, user, sheet, pageStart, pageSize);
    }

    async sheetArchive(unit: number, user: number, sheet: string, id: number) {
        let sql = '$archive_id';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }

    private parametersBusCache: { [name: string]: ParametersBus } = {}
    private getActionParametersBus(actionName: string): ParametersBus {
        let inBusAction = this.parametersBusCache[actionName];
        if (inBusAction === undefined) {
            let apb = new ActionParametersBus(this, actionName);
            if (apb.init() === true) {
                inBusAction = this.parametersBusCache[actionName] = apb;
            }
        }
        return inBusAction;
    }
    async action(actionName: string, unit: number, user: number, data: string): Promise<any[][]> {
        let inBusAction = this.getActionParametersBus(actionName);
        let inBusResult = await inBusAction.busQueryAll(unit, user, data);
        let actionData = data + inBusResult;
        let result = await this.unitUserCallEx(actionName, unit, user, actionData);
        return result;
    }
    async actionProxy(actionName: string, unit: number, user: number, proxyUser: number, data: string): Promise<any[][]> {
        let inBusAction = this.getActionParametersBus(actionName);
        let inBusResult = await inBusAction.busQueryAll(unit, user, data);
        let actionData = data + inBusResult;
        let result = await this.unitUserCallEx(actionName, unit, user, proxyUser, actionData);
        return result;
    }

    async actionFromObj(actionName: string, unit: number, user: number, obj: any): Promise<any[][]> {
        let inBusAction = this.getActionParametersBus(actionName);
        let actionData = await inBusAction.buildDataFromObj(unit, user, obj);
        let result = await this.unitUserCallEx(actionName, unit, user, actionData);
        return result;
    }

    async actionDirect(actionName: string, unit: number, user: number, ...params: any[]): Promise<any[][]> {
        let result = await this.unitUserCallEx(actionName, unit, user, ...params);
        return result;
    }

    async query(query: string, unit: number, user: number, params: any[]): Promise<any> {
        let ret = await this.unitUserCall(query, unit, user, ...params);
        return ret;
    }
    async queryProxy(query: string, unit: number, user: number, proxyUser: number, params: any[]): Promise<any> {
        let ret = await this.unitUserCall(query, unit, user, proxyUser, ...params);
        return ret;
    }

    // msgId: bus message id
    // body: bus message body
    private getAcceptParametersBus(bus: string, face: string): ParametersBus {
        let name = bus + '_' + face;
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction == undefined) {
            let apb = new AcceptParametersBus(this, bus, face);
            if (apb.init() === true) {
                inBusAction = this.parametersBusCache[name] = apb;
            }
        }
        return inBusAction;
    }
    async bus(bus: string, face: string, unit: number, to: number, msgId: number, body: string, version: number, stamp: number): Promise<void> {
        let inBusAction = this.getAcceptParametersBus(bus, face);
        let inBusResult = await inBusAction.busQueryAll(unit, to, body);
        let data = body + inBusResult;
        const proc = `${bus}_${face}`;
        await this.unitUserCall(proc, unit, to, msgId, data, version, stamp);
    }
    async busAcceptFromQuery(bus: string, face: string, unit: number, body: string): Promise<void> {
        await this.unitUserCall(`${bus}_${face}`, unit, 0, 0, body, undefined);
    }
    async checkPull(unit: number, entity: string, entityType: string, modifies: string): Promise<any[]> {
        let proc: string;
        switch (entityType) {
            default: throw 'error entityType';
            case 'tuid': proc = `${entity}$pull_check`; break;
            case 'map': proc = '$map_pull_check'; break;
        }
        return await this.unitTableFromProc(proc, unit as number, entity, modifies);
    }
    async importData(unit: number, user: number, source: string, entity: string, filePath: string): Promise<void> {
        await ImportData.exec(this, unit, this.dbUq, source, entity, filePath);
    }

    equDb(dbContainer: Db) {
        return this.dbUq === dbContainer;
    }
    /*
        async reset() {
            await this.net.resetRunnerAfterCompile(this);
        }
    */
    async init() {
        if (this.schemas !== undefined) return;
        try {
            await this.initInternal();
            if (this.hasStatements === true) {
                await this.runUqStatements();
            }
        }
        catch (err) {
            this.schemas = undefined;
            logger.error(err.message);
            debugger;
        }
    }

    private async initInternal() {
        this.log(0, 'SCHEDULE', 'uq-api start removeAllScheduleEvents');
        let eventsText = await this.dbUq.removeAllScheduleEvents();
        this.log(0, 'SCHEDULE', 'uq-api done removeAllScheduleEvents' + eventsText);

        let rows = await this.loadSchemas(0);
        let schemaTable: {
            id: number, name: string, type: number, version: number,
            schema: string, run: string, from: string, isPrivate: number
        }[] = rows[0];
        let settingTable: { name: string, value: string }[] = rows[1];
        let setting: { [name: string]: string | number } = {};
        for (let row of settingTable) {
            let { name, value } = row;
            name = name.toLowerCase();
            if (value === null) {
                setting[name] = null;
            }
            else {
                let n = Number(value);
                setting[name] = isNaN(n) === true ? value : n;
            }
        }
        this.uqOwner = setting['uqowner'] as string;
        this.uq = setting['uq'] as string;
        this.author = setting['author'] as string;
        this.uqId = setting['uqid'] as number;
        this.version = setting['version'] as string;        // source verion in uq code
        this.uqVersion = setting['uqversion'] as number;    // compile changed
        if (this.uqVersion === undefined) this.uqVersion = 1;
        this.hasUnit = !(setting['hasunit'] as number === 0);
        this.hasStatements = setting['hasstatements'] as number === 1;
        this.service = setting['service'] as number;
        this.devBuildSys = setting['dev-build-sys'] as string !== null;
        // this.db.hasUnit = this.hasUnit;
        // this.dbCaller.setBuilder();
        let ixUserArr = [];

        let uu = setting['uniqueunit'] as number;
        this.uniqueUnit = uu ?? env.uniqueUnitInConfig;

        if (env.isDevelopment) logger.debug('init schemas: ', this.uq, this.author, this.version);

        this.schemas = {};
        this.accessSchemaArr = [];
        this.ids = {};
        this.tuids = {};
        this.busArr = [];
        this.entityColl = {};
        this.froms = {};
        this.sheetRuns = {};
        for (let row of schemaTable) {
            let { name, id, version, schema, run, from } = row;
            if (!schema) continue;
            let tuidFroms: { [tuid: string]: { tuid?: string, maps?: string[], tuidObj?: any, mapObjs?: { [map: string]: any } } };
            let schemaObj: any;
            if (schema[0] === '{') {
                schemaObj = JSON.parse(schema);
            }
            else {
                schemaObj = jsonpack.unpack(schema);
            }
            let sName = schemaObj.name;
            let runObj = JSON.parse(run);
            schemaObj.typeId = id;
            schemaObj.busVersion = schemaObj.version;
            schemaObj.version = version;
            let { type, sync } = schemaObj;
            this.schemas[name] = {
                type: type,
                from: from,
                call: schemaObj,
                run: runObj,
            }
            switch (type) {
                case '$role':
                    this.role = schemaObj;
                    this.roleNames = schemaObj?.names;
                    break;
                case 'access':
                    this.accessSchemaArr.push(schemaObj);
                    break;
                case 'bus':
                    this.busArr.push(schemaObj);
                    break;
                case 'id':
                    if (schemaObj.private !== true) {
                        this.ids[name] = schemaObj;
                    }
                    break;
                case 'tuid':
                    this.tuids[name] = schemaObj;
                    if (from) {
                        if (!(sync === false)) this.hasPullEntities = true;
                        tuidFroms = this.froms[from];
                        if (tuidFroms === undefined) tuidFroms = this.froms[from] = {};
                        let tuidFrom = tuidFroms[name];
                        if (tuidFrom === undefined) tuidFrom = tuidFroms[name] = {};
                        tuidFrom.tuidObj = schemaObj;
                    }
                    this.buildTuidMainFields(schemaObj);
                    break;
                case 'map':
                    if (from) {
                        this.hasPullEntities = true;
                        tuidFroms = this.froms[from];
                        if (tuidFroms === undefined) tuidFroms = this.froms[from] = {};
                        let { keys } = schemaObj;
                        let key0 = keys[0];
                        let tuidName = key0.tuid;
                        if (tuidName === undefined) break;
                        let tuidFrom = tuidFroms[tuidName];
                        if (tuidFrom === undefined) tuidFrom = tuidFroms[tuidName] = {};
                        let mapObjs = tuidFrom.mapObjs;
                        if (mapObjs === undefined) mapObjs = tuidFrom.mapObjs = {};
                        mapObjs[name] = schemaObj;
                    }
                    break;
                case 'sheet':
                    this.hasSheet = true;
                    this.sheetRuns[name] = {
                        onsave: runObj?.run['$']?.['$onsave'] !== undefined,
                        verify: schemaObj.verify,
                    };
                    break;
                case 'ix':
                    // 下面这句，以后可以去掉。schema.idIsUser会改成ixIsUser
                    if (schemaObj.idIsUser === true) {
                        ixUserArr.push(schemaObj);
                    };
                    if (schemaObj.ixIsUser === true) {
                        ixUserArr.push(schemaObj);
                    }
                    break;
            }
            if (row['private'] === 0 || type === 'id') {
                this.entityColl[id] = {
                    name: sName,
                    access: type !== 'sheet' ?
                        type + '|' + id :
                        {
                            $: type,
                            id: id,
                            ops: schemaObj.states && schemaObj.states.map(v => v.name)
                        }
                };
            }
        }
        this.ixOfUsers = ixUserArr.map(v => v.name).join('|');
        for (let i in this.froms) {
            let from = this.froms[i];
            for (let t in from) {
                let syncTuid = from[t];
                let { tuidObj, mapObjs } = syncTuid;
                if (tuidObj !== undefined) {
                    syncTuid.tuid = (tuidObj.name as string).toLowerCase();
                }
                if (mapObjs !== undefined) {
                    let s: string[] = [];
                    for (let m in mapObjs) s.push(m.toLowerCase());
                    syncTuid.maps = s;
                }
            }
        }
        for (let i in this.schemas) {
            let schema = this.schemas[i].call;
            let { type, name } = schema;
            switch (type) {
                case 'map':
                    this.mapBorn(schema)
                    break;
            }
        }

        for (let i in this.schemas) {
            let schema = this.schemas[i];
            let { call } = schema;
            if (call === undefined) continue;
            let circular = false;
            let tuidsArr: any[] = [call];

            let text = JSON.stringify(call, (key: string, value: any) => {
                if (key === 'tuids') {
                    let ret: any[] = [];
                    for (let v of value) {
                        if (tuidsArr.findIndex(a => a === v) >= 0) {
                            circular = true;
                        }
                        else {
                            tuidsArr.push(v);
                            ret.push(v);
                        }
                    }
                    return ret.length > 0 ? ret : undefined;
                }
                else if (key !== '' && value === call) {
                    circular = true;
                    return undefined;
                }
                else return value;
            });
            if (circular) {
                let newCall = JSON.parse(text);
                schema.call = newCall;
            }
        }

        let faces: string[] = [];
        let busOutCount = 0;
        let urlColl: { [url: string]: BusFace } = {};
        let faceColl: { [bus: string]: BusFace } = {};
        for (let busSchema of this.busArr) {
            let { name: bus, busOwner, busName, schema, outCount, busVersion } = busSchema;
            for (let i in schema) {
                let { accept, query } = schema[i];
                let faceName = i.toLowerCase();
                let url = `${busOwner.toLowerCase()}/${busName.toLowerCase()}/${faceName}`;
                if (urlColl[url]) continue;
                let faceUrl = `${bus.toLowerCase()}/${faceName}`;
                if (accept !== undefined) {
                    faces.push(url);
                    faceColl[faceUrl] = urlColl[url] = new BusFaceAccept(
                        this, url, bus, faceName, busVersion, accept
                    );
                }
                else if (query === true) {
                    faceColl[faceUrl] = urlColl[url] = new BusFaceQuery(
                        this,
                        url,
                        bus,
                        faceName,
                        busVersion,
                    );
                }
            }
            busOutCount += (outCount ?? 0);
        }
        let faceText: string;
        if (faces.length > 0) faceText = '\n' + faces.join('\n') + '\n';
        this.buses = {
            faces: faceText,
            outCount: busOutCount,
            urlColl,
            faceColl,
            error: undefined,
        };
        this.buildTuid$User();
        this.buildAccesses();
    }

    private buildTuid$User() {
        let $user = this.tuids['$user'];
        if ($user !== undefined) return;
        this.buildTuidMainFields(this.$userSchema);
        this.tuids['$user'] = this.$userSchema;
    }

    private buildTuidMainFields(tuidSchema: any) {
        let { id, base, fields, main, arrs } = tuidSchema;
        let mainFields = tuidSchema.mainFields = [
            { name: id, type: 'id' }
        ];
        if (base) for (let b of base) mainFields.push(fields.find(v => v.name === b));
        if (main) for (let m of main) mainFields.push(fields.find(v => v.name === m));
        if (arrs === undefined) return;
        for (let arr of arrs) {
            let { id, owner, main, fields } = arr;
            mainFields = arr.mainFields = [
                { name: id, type: 'id' },
                { name: owner, type: 'id' }
            ];
            if (main) for (let m of main) mainFields.push(fields.find(v => v.name === m));
        }
    }

    private mapBorn(schema: any) {
        function getCall(s: string) {
            let c = this.schemas[s];
            if (c === undefined) return;
            return c.call;
        }
        let call = getCall.bind(this);
        let { name, actions, queries } = schema;
        let sn = name.toLowerCase();
        for (let i in actions) {
            let n = sn + actions[i];
            schema.actions[i] = call(n);
        }
        for (let i in queries) {
            let n = sn + queries[i];
            schema.queries[i] = call(n);
        }
    }
    private buildAccesses() {
        this.access = {
            uq: this.uqId
        };
        for (let access of this.accessSchemaArr) {
            let acc = this.access[access.name] = {};
            for (let item of access.list) {
                let it = item as string;
                let pos = it.indexOf(':');
                let name: string, ops: string;
                if (pos > 0) {
                    name = it.substring(0, pos);
                    ops = it.substring(pos + 1);
                }
                else {
                    name = it;
                }
                let schema = this.schemas[name];
                if (schema === undefined) continue;
                let entity = schema.call;
                if (entity === undefined) continue;
                let { type, typeId } = entity;
                acc[name] = ops === undefined ?
                    type + '|' + typeId :
                    {
                        $: type,
                        id: typeId,
                        ops: ops.split('+')
                    };

            }
        }
        if (env.isDevelopment) logger.debug('access: ', this.access);
    }
    private async getUserAccess(unit: number, user: number): Promise<number[]> {
        let result = await this.dbUq.tablesFromProc('$get_access', [unit]);
        let ret = [...result[0].map(v => v.entity), ...result[1].map(v => v.entity)];
        return ret;
    }
    async getAccesses(unit: number, user: number, acc: string[]): Promise<any> {
        await this.init();
        let access = {} as any;
        function merge(src: any) {
            for (let i in src) {
                let v = src[i];
                if (typeof v === 'string') {
                    access[i] = v;
                    continue;
                }
                let dst = access[i];
                if (dst === undefined) {
                    access[i] = v;
                    continue;
                }
                dst.ops = [...dst.ops, ...v.ops];
            }
        }
        if (acc === undefined) {
            for (let a in this.access) {
                merge(this.access[a]);
            }
        }
        else {
            for (let a of acc) merge(this.access[a]);
        }
        let accessEntities = await this.getUserAccess(unit, user);
        let entityAccess: { [name: string]: any } = {};
        for (let entityId of accessEntities) {
            let entity = this.entityColl[entityId];
            if (entity === undefined) continue;
            let { name, access } = entity;
            entityAccess[name] = access;
        }
        return {
            version: this.uqVersion,
            access: entityAccess,
            ids: this.ids,
            tuids: this.tuids,
            role: this.role,
        };
    }

    async getEntities(unit: number): Promise<any> {
        await this.init();
        let entityAccess: { [name: string]: any } = {};
        for (let entityId in this.entityColl) {
            let entity = this.entityColl[entityId];
            let { name, access } = entity;
            entityAccess[name] = access;
        }
        return {
            version: this.uqVersion,
            access: entityAccess,
            ids: this.ids,
            tuids: this.tuids,
            role: this.role,
        };
    }

    async getAllSchemas(): Promise<any> {
        return this.schemas;
    }

    getSchema(name: string): any {
        return this.schemas[name.toLowerCase()];
    }

    private actionConvertSchemas: { [name: string]: any } = {};
    getActionConvertSchema(name: string): any {
        return this.actionConvertSchemas[name];
    }
    setActionConvertSchema(name: string, value: any): any {
        this.actionConvertSchemas[name] = value;
    }

    private async runUqStatements() {
        await this.procCall('$uq', []);
    }

    readonly $userSchema = {
        "name": "$user",
        "type": "tuid",
        "private": false,
        "fields": [
            { "name": "name", "type": "char", "size": 100 },
            { "name": "nick", "type": "char", "size": 100 },
            { "name": "icon", "type": "char", "size": 200 },
            { "name": "assigned", "type": "char", "size": 100 },
            { "name": "poke", "type": "tinyint" },
            { "name": "timezone", "type": "tinyint" }
        ],
        "global": false,
        "sync": false,
        "id": "id",
        "main": [
            "name", "nick", "icon", "assigned", "poke", "timezone"
        ]
    };
}
