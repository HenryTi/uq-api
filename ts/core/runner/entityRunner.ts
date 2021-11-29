import * as _ from 'lodash';
import { logger } from '../../tool';
import { Db, env } from '../db';
import {
    DbServer, ParamID, ParamIX, ParamIXSum
    , ParamActs, ParamActDetail, ParamIDDetailGet, ParamIDinIX
    , ParamIDLog, ParamIDSum, ParamKeyID, ParamKeyIX
    , ParamKeyIXSum, ParamKeyIDSum, ParamSum, TableSchema
    , ParamIDxID, ParamIDTree, ParamIDNO, ParamActIX, ParamActIXSort, ParamQueryID
} from '../dbServer';
import { packReturns } from '../packReturn';
import { ImportData } from '../importData';
import {
    ParametersBus, ActionParametersBus, SheetVerifyParametersBus
    , SheetActionParametersBus, AcceptParametersBus
} from '../inBusAction';
import { Net } from '../net';
import { centerApi } from '../centerApi';
import { BusFace, BusFaceAccept, BusFaceQuery } from './BusFace';

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
    faces: string;
    outCount: number;
    urlColl: { [url: string]: BusFace };
    faceColl: { [bus: string]: BusFace };
    hasError: boolean;
}
/*
export interface Face {
    bus: string;
    faceName: string;
    version: number;
    accept?: {
        inBuses: any[];
    };
    query?: boolean;
}
*/

export class EntityRunner {
    protected readonly db: Db;
    protected readonly dbServer: DbServer;
    private access: any;
    private schemas: { [entity: string]: { type: string; from: string; call: any; run: any; } };
    private accessSchemaArr: any[];
    private role: any;
    private roleNames: string;
    private tuids: { [name: string]: any };
    private busArr: any[];
    private entityColl: { [id: number]: EntityAccess };
    private sheetRuns: { [sheet: string]: SheetRun };
    private readonly modifyMaxes: { [unit: number]: number };
    private readonly roleVersions: { [unit: number]: { [app: number]: { version: number, tick: number } } } = {};
    private ixOfUsers: string;
    private compileTick: number = 0;

    name: string;
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
    buses: Buses; //{[url:string]:any}; // 直接查找bus
    hasPullEntities: boolean = false;
    net: Net;
    hasSheet: boolean = false;
    isCompiling: boolean = false;
    execQueueActError: boolean = false;

    constructor(name: string, db: Db, net: Net = undefined) {
        this.name = name;
        this.db = db;
        this.net = net;
        this.modifyMaxes = {};
        this.dbServer = db.dbServer;
    }

    getDb(): string { return this.db.getDbName() }

    async reset() {
        this.isCompiling = false;
        this.execQueueActError = false;
        this.db.reset();
        this.schemas = undefined;
        await this.init();
    }

    async setCompileTick(compileTick: number) {
        if (compileTick === undefined) return;
        if (this.compileTick === compileTick) return;
        this.compileTick = compileTick;
        await this.reset();
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
        await this.db.log(unit, this.net.getUqFullName(this.uq), subject, content);
    }
    async procCall(proc: string, params: any[]): Promise<any> {
        return await this.db.call(proc, params);
    }
    async call(proc: string, params: any[]): Promise<any> {
        return await this.db.call('tv_' + proc, params);
    }
    async sql(sql: string, params: any[]): Promise<any> {
        return await this.db.sql(sql, params);
    }
    async buildTuidAutoId(): Promise<void> {
        await this.db.buildTuidAutoId();
    }
    async tableFromProc(proc: string, params: any[]): Promise<any[]> {
        return await this.db.tableFromProc('tv_' + proc, params);
    }
    async tablesFromProc(proc: string, params: any[]): Promise<any[][]> {
        let ret = await this.db.tablesFromProc('tv_' + proc, params);
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
        return await this.db.call(proc, p);
    }
    async unitUserCall(proc: string, unit: number, user: number, ...params: any[]): Promise<any> {
        let p: any[] = [];
        //if (this.hasUnit === true) 
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        return await this.db.call(proc, p);
    }

    async unitUserCallEx(proc: string, unit: number, user: number, ...params: any[]): Promise<any> {
        let p: any[] = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        return await this.db.callEx(proc, p);
    }

    async unitTableFromProc(proc: string, unit: number, ...params: any[]): Promise<any[]> {
        let p: any[] = [];
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tableFromProc(proc, p);
        return ret;
    }
    async unitUserTableFromProc(proc: string, unit: number, user: number, ...params: any[]): Promise<any[]> {
        let p: any[] = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tableFromProc(proc, p);
        return ret;
    }

    async unitTablesFromProc(proc: string, unit: number, ...params: any[]): Promise<any[][]> {
        let p: any[] = [];
        p.push(unit);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tablesFromProc(proc, p);
        return ret;
    }
    async unitUserTablesFromProc(proc: string, unit: number, user: number, ...params: any[]): Promise<any[][]> {
        let p: any[] = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined) p.push(...params);
        let ret = await this.db.tablesFromProc(proc, p);
        return ret;
    }
    async buildProc(proc: string): Promise<void> {
    }

    isExistsProcInDb(proc: string): boolean {
        return this.db.isExistsProcInDb(proc);
    }

    async createProcInDb(proc: string) {
        await this.db.createProcInDb(proc);
    }

    async start(unit: number, user: number): Promise<void> {
        return await this.unitUserCall('tv_$start', unit, user);
    }
    async createResDb(resDbName: string): Promise<void> {
        await this.db.createResDb(resDbName);
    }
    async create$UqDb(): Promise<void> {
        await this.db.create$UqDb();
    }
    async loadSchemas(hasSource: number): Promise<any[][]> {
        return await this.db.tablesFromProc('tv_$entitys', [hasSource]);
    }
    async saveSchema(unit: number, user: number, id: number, name: string, type: number, schema: string, run: string, source: string, from: string, open: number, isPrivate: number): Promise<any> {
        return await this.unitUserCall('tv_$entity', unit, user, id, name, type, schema, run, source, from, open, isPrivate);
    }
    async loadConstStrs(): Promise<{ [name: string]: number }[]> {
        return await this.db.call('tv_$const_strs', []);
    }
    async saveConstStr(type: string): Promise<number> {
        return await this.db.call('tv_$const_str', [type]);
    }
    async loadSchemaVersion(name: string, version: string): Promise<string> {
        return await this.db.call('tv_$entity_version', [name, version]);
    }
    async setEntityValid(entities: string, valid: number): Promise<any[]> {
        let ret = await this.db.call('tv_$entity_validate', [entities, valid]);
        return ret;
    }
    async saveFace(bus: string, busOwner: string, busName: string, faceName: string) {
        await this.db.call('tv_$save_face', [bus, busOwner, busName, faceName]);
    }

    async tagType(names: string) {
        await this.db.call('tv_$tag_type', [names]);
    }
    async tagSaveSys(data: string) {
        await this.db.call('tv_$tag_save_sys', [data]);
    }

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
        return await this.unitUserCallEx('tv_' + tuid, unit, user, id);
    }
    async tuidArrGet(tuid: string, arr: string, unit: number, user: number, owner: number, id: number): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '_' + arr + '$id', unit, user, owner, id);
    }
    async tuidGetAll(tuid: string, unit: number, user: number): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '$all', unit, user);
    }
    async tuidVid(tuid: string, unit: number, uniqueValue: any): Promise<any> {
        let proc = `tv_${tuid}$vid`;
        return await this.unitCall(proc, unit, uniqueValue);
    }
    async tuidArrVid(tuid: string, arr: string, unit: number, uniqueValue: any): Promise<any> {
        let proc = `tv_${tuid}_${arr}$vid`;
        return await this.unitCall(proc, unit, uniqueValue);
    }
    async tuidGetArrAll(tuid: string, arr: string, unit: number, user: number, owner: number): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '_' + arr + '$all', unit, user, owner);
    }
    async tuidIds(tuid: string, arr: string, unit: number, user: number, ids: string): Promise<any> {
        let proc = 'tv_' + tuid;
        if (arr !== '$') proc += '_' + arr;
        proc += '$ids';
        let ret = await this.unitUserCall(proc, unit, user, ids);
        return ret;
    }
    async tuidMain(tuid: string, unit: number, user: number, id: number): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '$main', unit, user, id);
    }
    async tuidSave(tuid: string, unit: number, user: number, params: any[]): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '$save', unit, user, ...params);
    }
    async tuidSetStamp(tuid: string, unit: number, params: any[]): Promise<void> {
        return await this.unitCall('tv_' + tuid + '$stamp', unit, ...params);
    }
    async tuidArrSave(tuid: string, arr: string, unit: number, user: number, params: any[]): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '_' + arr + '$save', unit, user, ...params);
    }
    async tuidArrPos(tuid: string, arr: string, unit: number, user: number, params: any[]): Promise<any> {
        return await this.unitUserCall('tv_' + tuid + '_' + arr + '$pos', unit, user, ...params);
    }
    async tuidSeach(tuid: string, unit: number, user: number, arr: string, key: string, pageStart: number, pageSize: number): Promise<any> {
        let proc = 'tv_' + tuid + '$search';
        return await this.unitUserTablesFromProc(proc, unit, user, key || '', pageStart, pageSize);
    }
    async saveProp(tuid: string, unit: number, user: number, id: number, prop: string, value: any) {
        let proc = 'tv_' + tuid + '$prop';
        await this.unitUserCall(proc, unit, user, id, prop, value);
    }
    async tuidArrSeach(tuid: string, unit: number, user: number, arr: string, ownerId: number, key: string, pageStart: number, pageSize: number): Promise<any> {
        let proc = `tv_${tuid}_${arr}$search`;
        return await this.unitUserTablesFromProc(proc, unit, user, ownerId, key || '', pageStart, pageSize);
    }
    async mapSave(map: string, unit: number, user: number, params: any[]): Promise<any> {
        return await this.unitUserCall('tv_' + map + '$save', unit, user, ...params);
    }
    async importVId(unit: number, user: number, source: string, tuid: string, arr: string, no: string): Promise<number> {
        let proc = `tv_$import_vid`;
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
        let ret = await this.unitUserCall('tv_' + sheet + '$verify', unit, user, inBusActionData);

        if (length === 1) {
            if (this.isVerifyItemOk(ret) === true) return;
        }
        if (this.isVerifyArrOk(ret) === true) return;

        let failed = packReturns(returns, ret);
        return failed;
    }
    async sheetSave(sheet: string, unit: number, user: number, app: number, discription: string, data: string): Promise<{}> {
        return await this.unitUserCall('tv_$sheet_save', unit, user, sheet, app, discription, data);
    }
    async sheetTo(unit: number, user: number, sheetId: number, toArr: number[]) {
        await this.unitUserCall('tv_$sheet_to', unit, user, sheetId, toArr.join(','));
    }
    async sheetProcessing(sheetId: number): Promise<void> {
        await this.db.call('tv_$sheet_processing', [sheetId]);
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
            await this.unitUserCallEx('tv_' + inBusActionName, unit, user, id, flow, action)
            : await this.unitUserCallEx('tv_' + inBusActionName, unit, user, id, flow, action, inBusActionData);
        //await this.log(unit, 'sheetAct', 'after ' + inBusActionName);
        return ret;
    }
    async sheetStates(sheet: string, state: string, unit: number, user: number, pageStart: number, pageSize: number) {
        let sql = 'tv_$sheet_state';
        return await this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
    }
    async sheetStateCount(sheet: string, unit: number, user: number) {
        let sql = 'tv_$sheet_state_count';
        return await this.unitUserCall(sql, unit, user, sheet);
    }
    async userSheets(sheet: string, state: string, unit: number, user: number, sheetUser: number, pageStart: number, pageSize: number) {
        let sql = 'tv_$sheet_state_user';
        return await this.unitUserCall(sql, unit, user, sheet, state, sheetUser, pageStart, pageSize);
    }
    async mySheets(sheet: string, state: string, unit: number, user: number, pageStart: number, pageSize: number) {
        let sql = 'tv_$sheet_state_my';
        return await this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
    }
    async getSheet(sheet: string, unit: number, user: number, id: number) {
        let sql = 'tv_$sheet_id';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }

    async sheetScan(sheet: string, unit: number, user: number, id: number) {
        let sql = 'tv_$sheet_scan';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }

    async sheetArchives(sheet: string, unit: number, user: number, pageStart: number, pageSize: number) {
        let sql = 'tv_$archives';
        return await this.unitUserCall(sql, unit, user, sheet, pageStart, pageSize);
    }

    async sheetArchive(unit: number, user: number, sheet: string, id: number) {
        let sql = 'tv_$archive_id';
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
        let result = await this.unitUserCallEx('tv_' + actionName, unit, user, actionData);
        return result;
    }
    async actionProxy(actionName: string, unit: number, user: number, proxyUser: number, data: string): Promise<any[][]> {
        let inBusAction = this.getActionParametersBus(actionName);
        let inBusResult = await inBusAction.busQueryAll(unit, user, data);
        let actionData = data + inBusResult;
        let result = await this.unitUserCallEx('tv_' + actionName, unit, user, proxyUser, actionData);
        return result;
    }

    async actionFromObj(actionName: string, unit: number, user: number, obj: any): Promise<any[][]> {
        let inBusAction = this.getActionParametersBus(actionName);
        let actionData = await inBusAction.buildDataFromObj(unit, user, obj);
        let result = await this.unitUserCallEx('tv_' + actionName, unit, user, actionData);
        return result;
    }

    async actionDirect(actionName: string, unit: number, user: number, ...params: any[]): Promise<any[][]> {
        let result = await this.unitUserCallEx('tv_' + actionName, unit, user, ...params);
        return result;
    }

    async query(query: string, unit: number, user: number, params: any[]): Promise<any> {
        let ret = await this.unitUserCall('tv_' + query, unit, user, ...params);
        return ret;
    }
    async queryProxy(query: string, unit: number, user: number, proxyUser: number, params: any[]): Promise<any> {
        let ret = await this.unitUserCall('tv_' + query, unit, user, proxyUser, ...params);
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
        await this.unitUserCall(`tv_${bus}_${face}`, unit, to, msgId, data, version, stamp);
    }
    async busAcceptFromQuery(bus: string, face: string, unit: number, body: string): Promise<void> {
        await this.unitUserCall(`tv_${bus}_${face}`, unit, 0, 0, body, undefined);
    }
    async checkPull(unit: number, entity: string, entityType: string, modifies: string): Promise<any[]> {
        let proc: string;
        switch (entityType) {
            default: throw 'error entityType';
            case 'tuid': proc = `tv_${entity}$pull_check`; break;
            case 'map': proc = 'tv_$map_pull_check'; break;
        }
        return await this.unitTableFromProc(proc, unit as number, entity, modifies);
    }
    async importData(unit: number, user: number, source: string, entity: string, filePath: string): Promise<void> {
        await ImportData.exec(this, unit, this.db, source, entity, filePath);
    }

    equDb(db: Db) {
        return this.db === db;
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
        await this.removeAllScheduleEvents();
        let rows = await this.loadSchemas(0);
        let schemaTable: { id: number, name: string, type: number, version: number, schema: string, run: string, from: string, isPrivate: number }[] = rows[0];
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
        this.dbServer.hasUnit = this.hasUnit;
        this.dbServer.setBuilder();
        let ixUserArr = [];

        let uu = setting['uniqueunit'];
        this.uniqueUnit = uu ? uu as number : 0;

        if (env.isDevelopment) logger.debug('init schemas: ', this.uq, this.author, this.version);

        this.schemas = {};
        this.accessSchemaArr = [];
        this.tuids = {};
        this.busArr = [];
        this.entityColl = {};
        this.froms = {};
        this.sheetRuns = {};
        for (let row of schemaTable) {
            let { name, id, version, schema, run, from } = row;
            if (!schema) continue;
            let tuidFroms: { [tuid: string]: { tuid?: string, maps?: string[], tuidObj?: any, mapObjs?: { [map: string]: any } } };
            let schemaObj = JSON.parse(schema);
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
                    this.roleNames = schemaObj?.names?.join('|');
                    break;
                case 'access':
                    this.accessSchemaArr.push(schemaObj);
                    break;
                case 'bus':
                    this.busArr.push(schemaObj);
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
            if (row['private'] === 0) {
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
        if (faces.length > 0) faceText = faces.join('\n');
        this.buses = {
            faces: faceText,
            outCount: busOutCount,
            urlColl,
            faceColl,
            hasError: false,
        };
        this.buildAccesses();
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
        let result = await this.db.tablesFromProc('tv_$get_access', [unit]);
        let ret = _.union(result[0].map(v => v.entity), result[1].map(v => v.entity));
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
                dst.ops = _.union(dst.ops, v.ops);
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

    private throwErr(err: string) {
        logger.error(err);
        throw new Error(err);
    }

    private getTableSchema(name: string, types: string[], values?: any[]): TableSchema {
        if (name === undefined) return undefined;
        let isXi: boolean;
        if (name[0] === '!') {
            isXi = true;
            name = name.substr(1);
        }
        let lowerName = name.toLowerCase();
        let ts = this.schemas[lowerName]?.call;
        if (ts === undefined) {
            this.throwErr(`${name} is not a valid Entity`);
        }
        let { type } = ts;
        if (types.indexOf(type) < 0) {
            this.throwErr(`TableSchema only support ${types.map(v => v.toUpperCase()).join(', ')}`);
        }
        let db = this.db.getDbName();
        return { name: lowerName, schema: ts, values, isXi };
    }
    private getTableSchemas(names: string[], types: string[]): TableSchema[] {
        return names.map(v => this.getTableSchema(v, types));
    }

    private getTableSchemaArray(names: string | string[], types: string[]): TableSchema[] {
        if (names === undefined) return;
        return Array.isArray(names) === true ?
            this.getTableSchemas(names as string[], types)
            :
            [this.getTableSchema(names as string, types)];
    }

    private async runUqStatements() {
        await this.procCall('tv_$uq', []);
    }

    private async removeAllScheduleEvents() {
        let db = this.getDb();
        let events = await this.sql(`SELECT * FROM mysql.event WHERE db = '${db}';`, []);
        if (!events || events.length === 0) return;
        this.log(0, 'SCHEDULE', 'uq-api start removeAllScheduleEvents');
        let eventsText = '';
        for (let ev of events) {
            let { db, name } = ev;
            eventsText += ` ${db}.${name}`;
            let sql = `DROP EVENT IF EXISTS \`${db}\`.\`${name}\`;`;
            await this.sql(sql, []);
        }
        await this.sql(`TRUNCATE TABLE \`${db}\`.tv_$queue_act;`, []);
        this.log(0, 'SCHEDULE', 'uq-api done removeAllScheduleEvents' + eventsText);
    }

    Acts(unit: number, user: number, param: ParamActs): Promise<any[]> {
        for (let i in param) {
            if (i === '$') continue;
            let ts = this.getTableSchema(i, ['id', 'idx', 'ix']);
            let values = (param[i] as unknown) as any[];
            if (values) {
                ts.values = values;
                param[i] = ts;
            }
        }
        return this.dbServer.Acts(unit, user, param);
    }

    ActIX(unit: number, user: number, param: ParamActIX): Promise<any[]> {
        let { IX, ID: ID, IXs } = param;
        param.IX = this.getTableSchema(IX as unknown as string, ['ix']);
        param.ID = this.getTableSchema(ID as unknown as string, ['id']);
        if (IXs) {
            param.IXs = IXs.map(v => {
                let { IX, ix } = v;
                return { IX: this.getTableSchema(IX as unknown as string, ['ix']), ix }
            })
        }
        return this.dbServer.ActIX(unit, user, param);
    }

    ActIXSort(unit: number, user: number, param: ParamActIXSort): Promise<any[]> {
        let { IX } = param;
        param.IX = this.getTableSchema(IX as unknown as string, ['ix']);
        return this.dbServer.ActIXSort(unit, user, param);
    }

    ActDetail(unit: number, user: number, param: ParamActDetail): Promise<any[]> {
        let { main, detail, detail2, detail3 } = param;
        let types = ['id'];
        param.main = this.getTableSchema(main.name as unknown as string, types, [(main as any).value as any]);
        param.detail = this.getTableSchema(detail.name as unknown as string, types, detail.values);
        if (detail2) {
            param.detail2 = this.getTableSchema(detail2.name as unknown as string, types, detail2.values);
        }
        if (detail3) {
            param.detail3 = this.getTableSchema(detail3.name as unknown as string, types, detail3.values);
        }
        return this.dbServer.ActDetail(unit, user, param);
    }

    QueryID(unit: number, user: number, param: ParamQueryID): Promise<any[]> {
        let { ID, IDX, IX } = param;
        param.ID = this.getTableSchema(ID as unknown as string, ['id']);
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, ['id', 'idx']);
        param.IX = this.getTableSchemaArray(IX as unknown as any, ['ix']);
        return this.dbServer.QueryID(unit, user, param);
    }

    IDNO(unit: number, user: number, param: ParamIDNO): Promise<string> {
        let { ID } = param;
        let types = ['id'];
        param.ID = this.getTableSchema(ID as unknown as string, types);
        return this.dbServer.IDNO(unit, user, param);
    }

    IDDetailGet(unit: number, user: number, param: ParamIDDetailGet): Promise<any[]> {
        let { main, detail, detail2, detail3 } = param;
        let types = ['id'];
        param.main = this.getTableSchema(main as unknown as string, types);
        param.detail = this.getTableSchema(detail as unknown as string, types);
        if (detail2) {
            param.detail2 = this.getTableSchema(detail2 as unknown as string, types);
        }
        if (detail3) {
            param.detail3 = this.getTableSchema(detail3 as unknown as string, types);
        }
        return this.dbServer.IDDetailGet(unit, user, param);
    }

    ID(unit: number, user: number, param: ParamID): Promise<any[]> {
        let { IDX } = param;
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return this.dbServer.ID(unit, user, param);
    }

    IDTv(unit: number, user: number, ids: number[]): Promise<any[]> {
        return this.dbServer.IDTv(unit, user, ids);
    }

    KeyID(unit: number, user: number, param: ParamKeyID): Promise<any[]> {
        let { ID, IDX } = param;
        let types = ['id', 'idx'];
        param.ID = this.getTableSchema(ID as unknown as string, ['id']);
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return this.dbServer.KeyID(unit, user, param);
    }

    IX(unit: number, user: number, param: ParamIX): Promise<any[]> {
        let { IX, IX1, IDX } = param;
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']) as TableSchema;
        param.IX1 = this.getTableSchema((IX1 as unknown) as string, ['ix']) as TableSchema;
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return this.dbServer.IX(unit, user, param);
    }

    IXr(unit: number, user: number, param: ParamIX): Promise<any[]> {
        let { IX, IX1, IDX } = param;
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']) as TableSchema;
        param.IX1 = this.getTableSchema((IX1 as unknown) as string, ['ix']) as TableSchema;
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, types);
        return this.dbServer.IXr(unit, user, param);
    }

    KeyIX(unit: number, user: number, param: ParamKeyIX): Promise<any[]> {
        let { ID, IX, IDX } = param;
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.IDX = this.getTableSchemaArray(IDX as unknown as any, ['id', 'idx']);
        return this.dbServer.KeyIX(unit, user, param);
    }

    IDLog(unit: number, user: number, param: ParamIDLog): Promise<any[]> {
        let { IDX, field } = param;
        let ts = this.getTableSchema((IDX as unknown) as string, ['idx']);
        param.IDX = ts;
        let fLower = field.toLowerCase();
        if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
            this.throwErr(`ID ${IDX} has no Field ${field}`);
        }
        return this.dbServer.IDLog(unit, user, param);
    }

    private checkIDXSumField(param: ParamSum) {
        let { IDX, field } = param;
        let ts = this.getTableSchema((IDX as unknown) as string, ['idx']);
        param.IDX = ts;
        for (let f of field) {
            let fLower = f.toLowerCase();
            if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
                this.throwErr(`ID ${IDX} has no Field ${f}`);
            }
        }
    }

    IDSum(unit: number, user: number, param: ParamIDSum): Promise<any[]> {
        this.checkIDXSumField(param);
        return this.dbServer.IDSum(unit, user, param);
    }

    KeyIDSum(unit: number, user: number, param: ParamKeyIDSum): Promise<any[]> {
        this.checkIDXSumField(param);
        return this.dbServer.KeyIDSum(unit, user, param);
    }

    IXSum(unit: number, user: number, param: ParamIXSum): Promise<any[]> {
        this.checkIDXSumField(param);
        return this.dbServer.IXSum(unit, user, param);
    }

    KeyIXSum(unit: number, user: number, param: ParamKeyIXSum): Promise<any[]> {
        this.checkIDXSumField(param);
        return this.dbServer.KeyIXSum(unit, user, param);
    }

    IDinIX(unit: number, user: number, param: ParamIDinIX): Promise<any[]> {
        let { IX, ID } = param;
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        return this.dbServer.IDinIX(unit, user, param);
    }

    IDxID(unit: number, user: number, param: ParamIDxID): Promise<any[]> {
        let { ID, IX, ID2 } = param;
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        param.IX = this.getTableSchema((IX as unknown) as string, ['ix']);
        param.ID2 = this.getTableSchema((ID2 as unknown) as string, ['id']);
        return this.dbServer.IDxID(unit, user, param);
    }

    IDTree(unit: number, user: number, param: ParamIDTree): Promise<any[]> {
        let { ID } = param;
        param.ID = this.getTableSchema((ID as unknown) as string, ['id']);
        return this.dbServer.IDTree(unit, user, param);
    }
}
