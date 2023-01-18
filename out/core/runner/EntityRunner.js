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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityRunner = void 0;
const _ = require("lodash");
const config = require("config");
const tool_1 = require("../../tool");
const dbCaller_1 = require("../dbCaller");
const packReturn_1 = require("../packReturn");
const importData_1 = require("../importData");
const inBusAction_1 = require("../inBusAction");
const centerApi_1 = require("../centerApi");
const BusFace_1 = require("./BusFace");
const IDRunner_1 = require("./IDRunner");
const Runner_1 = require("./Runner");
// 整个服务器，可以单独设置一个unit id。跟老版本兼容。
// 新版本会去掉uq里面的唯一unit的概念。
const uniqueUnitInConfig = (_a = config.get('unique-unit')) !== null && _a !== void 0 ? _a : 0;
class EntityRunner extends Runner_1.Runner {
    /**
     * EntityRunner: 提供调用某个db中存储过程 / 缓存某db中配置数据 的类？
     * @param name uq(即数据库)的名称
     * @param db
     * @param net
     */
    constructor(db, net = undefined) {
        super(db);
        this.roleVersions = {};
        this.compileTick = 0;
        this.hasPullEntities = false;
        this.hasSheet = false;
        this.isCompiling = false;
        this.devBuildSys = false;
        this.parametersBusCache = {};
        this.actionConvertSchemas = {};
        this.$userSchema = {
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
        this.net = net;
        this.modifyMaxes = {};
        this.dbCaller = db.dbCaller;
        this.name = db.getDbName();
        this.IDRunner = new IDRunner_1.IDRunner(this, new dbCaller_1.Builder(), this.dbCaller);
        this.$uqDb = dbCaller_1.$uqDb;
    }
    // getDb(): string { return this.db.getDbName() }
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            this.isCompiling = false;
            this.db.reset();
            this.schemas = undefined;
            yield this.init();
        });
    }
    /**
     * 设置runner的compileTick，但是这个compileTick好像没看到有什么用
     * @param compileTick
     * @returns
     */
    setCompileTick(compileTick) {
        return __awaiter(this, void 0, void 0, function* () {
            if (compileTick === undefined)
                return;
            if (this.compileTick === compileTick)
                return;
            this.compileTick = compileTick;
            yield this.reset();
        });
    }
    getEntityNameList() {
        return Object.keys(this.schemas).join(', ');
        //return JSON.stringify(this.schemas);
    }
    getRoles(unit, app, user, inRoles) {
        return __awaiter(this, void 0, void 0, function* () {
            let [rolesBin, rolesVersion] = inRoles.split('.');
            let unitRVs = this.roleVersions[unit];
            if (unitRVs === undefined) {
                this.roleVersions[unit] = unitRVs = {};
            }
            let rv = unitRVs[app];
            if (rv !== undefined) {
                let { version: rvVersion, tick } = rv;
                let now = Date.now();
                if (Number(rolesVersion) === rvVersion && now - tick < 60 * 1000)
                    return;
            }
            // 去中心服务器取user对应的roles，version
            let ret = yield centerApi_1.centerApi.appRoles(unit, app, user);
            if (ret === undefined)
                return;
            let { roles, version } = ret;
            unitRVs[app] = { version, tick: Date.now() };
            if (version === Number(rolesVersion) && roles === Number(rolesBin))
                return;
            return ret;
        });
    }
    getAdmins(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let tbl = yield this.tableFromProc('$get_admins', [unit, user]);
            if (tbl.length === 0)
                return;
            return tbl;
        });
    }
    setMeAdmin(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call('$set_me_admin', [unit, user]);
        });
    }
    setAdmin(unit, $user, user, role, assigned) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call('$set_admin', [unit, $user, user, role, assigned]);
        });
    }
    isAdmin(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.tableFromProc('$is_admin', [unit, user]);
            return ret.length > 0;
        });
    }
    getMyRoles(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.roleNames)
                return;
            let tbl = yield this.tableFromProc('$get_my_roles', [unit, user]);
            if (tbl.length === 0)
                return;
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
        });
    }
    getAllRoleUsers(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            // row 0 返回 ixOfUsers
            let tbl = yield this.tableFromProc('$get_all_role_users', [unit, user]);
            tbl.unshift({ user: 0, roles: this.ixOfUsers });
            return tbl;
        });
    }
    setUserRoles(unit, user, theUser, roles) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call('$set_user_roles', [unit, user, theUser, roles]);
        });
    }
    deleteUserRoles(unit, user, theUser) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call('$delete_user_roles', [unit, user, theUser]);
        });
    }
    roleGetAdmins(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let tbl = yield this.tableFromProc('$get_admins', [unit, user]);
            if (tbl.length === 0)
                return;
            return tbl;
        });
    }
    roleSetMeAdmin(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call('$set_me_admin', [unit, user]);
        });
    }
    roleSetAdmin(unit, $user, user, role, assigned) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call('$set_admin', [unit, $user, user, role, assigned]);
        });
    }
    roleIsAdmin(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.tableFromProc('$is_admin', [unit, user]);
            return ret.length > 0;
        });
    }
    roleGetMy(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.tablesFromProc('$role_my_roles', [unit, user]);
            return ret;
        });
    }
    roleGetAllUsers(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            // row 0 返回 ixOfUsers
            let tbl = yield this.tableFromProc('$get_all_role_users', [unit, user]);
            tbl.unshift({ user: 0, roles: this.ixOfUsers });
            return tbl;
        });
    }
    roleSetUser(unit, user, theUser, roles) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call('$set_user_roles', [unit, user, theUser, roles]);
        });
    }
    roleDeleteUser(unit, user, theUser) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.call('$delete_user_roles', [unit, user, theUser]);
        });
    }
    checkUqVersion(uqVersion) {
        //if (this.uqVersion === undefined) return;
        //if (uqVersion !== this.uqVersion) 
        throw 'unmatched uq version';
    }
    setModifyMax(unit, modifyMax) {
        this.modifyMaxes[unit] = modifyMax;
    }
    getModifyMax(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = this.modifyMaxes[unit];
            if (ret !== undefined) {
                if (ret === null)
                    return;
                return ret;
            }
            try {
                let maxes = yield this.tableFromProc('$modify_queue_max', [unit]);
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
                tool_1.logger.error(err);
                this.modifyMaxes[unit] = null;
            }
        });
    }
    log(unit, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            // await this.$uqDb.uqLog(unit, this.net.getUqFullName(this.uq), subject, content);
            const uq = this.net.getUqFullName(this.uq);
            yield this.$uqDb.call('log', [unit, uq, subject, content]);
        });
    }
    logError(unit, subject, content) {
        return __awaiter(this, void 0, void 0, function* () {
            //await this.$uqDb.uqLogError(unit, this.net.getUqFullName(this.uq), subject, content);
            const uq = this.net.getUqFullName(this.uq);
            yield this.$uqDb.call('log_error', [unit, uq, subject, content]);
        });
    }
    /*
        async uqLog(unit: number, uq: string, subject: string, content: string): Promise<void> {
            return await this.dbCaller.call('$uq', 'log', [unit, uq, subject, content]);
        }
        async uqLogError(unit: number, uq: string, subject: string, content: string): Promise<void> {
            return await this.dbCaller.call('$uq', 'log_error', [unit, uq, subject, content]);
        }
        async logPerformance(tick: number, log: string, ms: number): Promise<void> {
            try {
                await this.dbCaller.call('$uq', 'performance', [tick, log, ms]);
            }
            catch (err) {
                logger.error(err);
                let { message, sqlMessage } = err;
                let msg = '';
                if (message) msg += message;
                if (sqlMessage) msg += ' ' + sqlMessage;
                await this.dbCaller.call('$uq', 'performance', [Date.now(), msg, 0]);
            }
        }
    */
    procCall(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call(proc, params);
        });
    }
    call(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call(proc, params);
        });
    }
    sql(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.sql(sql, params);
        });
    }
    buildTuidAutoId() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.buildTuidAutoId();
        });
    }
    tableFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.tableFromProc(proc, params);
        });
    }
    tablesFromProc(proc, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.tablesFromProc(proc, params);
            let len = ret.length;
            if (len === 0)
                return ret;
            let pl = ret[len - 1];
            if (Array.isArray(pl) === false)
                ret.pop();
            return ret;
        });
    }
    unitCall(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.call(proc, p);
        });
    }
    unitUserCall(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            //if (this.hasUnit === true) 
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.call(proc, p);
        });
    }
    unitUserCallEx(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            return yield this.db.callEx(proc, p);
        });
    }
    unitTableFromProc(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tableFromProc(proc, p);
            return ret;
        });
    }
    unitUserTableFromProc(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tableFromProc(proc, p);
            return ret;
        });
    }
    unitTablesFromProc(proc, unit, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            p.push(unit);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tablesFromProc(proc, p);
            return ret;
        });
    }
    unitUserTablesFromProc(proc, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let p = [];
            p.push(unit);
            p.push(user);
            if (params !== undefined)
                p.push(...params);
            let ret = yield this.db.tablesFromProc(proc, p);
            return ret;
        });
    }
    buildProc(proc) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    isExistsProc(proc) {
        return this.db.isExistsProc(proc);
    }
    createProc(proc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.createProc(proc);
        });
    }
    /**
     * 读取runner对应的uq的entity表和setting表
     * @param hasSource 表示是否读取entity的源代码
     * @returns array[0]对应的是entity表的记录；array[1]对应的是setting表的记录
     */
    loadSchemas(hasSource) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.tablesFromProc('$entitys', [hasSource]);
        });
    }
    saveSchema(unit, user, id, name, type, schema, run, source, from, open, isPrivate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('$entity', unit, user, id, name, type, schema, run, source, from, open, isPrivate);
        });
    }
    loadConstStrs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('$const_strs', []);
        });
    }
    saveConstStr(type) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('$const_str', [type]);
        });
    }
    saveTextId(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.saveTextId(text);
        });
    }
    loadSchemaVersion(name, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.call('$entity_version', [name, version]);
        });
    }
    setEntityValid(entities, valid) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.db.call('$entity_validate', [entities, valid]);
            return ret;
        });
    }
    saveFace(bus, busOwner, busName, faceName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('$save_face', [bus, busOwner, busName, faceName]);
        });
    }
    execQueueAct() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.db.execQueueAct();
        });
    }
    /*
    async tagType(names: string) {
        await this.db.call('$tag_type', [names]);
    }
    async tagSaveSys(data: string) {
        await this.db.call('$tag_save_sys', [data]);
    }
    */
    isTuidOpen(tuid) {
        tuid = tuid.toLowerCase();
        let t = this.tuids[tuid];
        if (t === undefined)
            return false;
        if (t.isOpen === true)
            return true;
        return false;
    }
    isActionOpen(action) {
        action = action.toLowerCase();
        let t = this.schemas[action];
        if (t === undefined)
            return false;
        let { call } = t;
        if (call === undefined)
            return false;
        if (call.isOpen === true)
            return true;
        return false;
    }
    getTuid(tuid) {
        tuid = tuid.toLowerCase();
        let ret = this.tuids[tuid];
        return ret;
    }
    getMap(map) {
        map = map.toLowerCase();
        let m = this.schemas[map];
        if (m === undefined)
            return;
        if (m.type === 'map')
            return m;
    }
    entityNo(entity, unit, year, month, date) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.call('$entity_no', [unit, entity, `${year}-${month}-${date}`]);
        });
    }
    tuidGet(tuid, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCallEx(tuid, unit, user, id);
        });
    }
    tuidArrGet(tuid, arr, unit, user, owner, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall(tuid + '_' + arr + '$id', unit, user, owner, id);
        });
    }
    tuidGetAll(tuid, unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall(tuid + '$all', unit, user);
        });
    }
    tuidVid(tuid, unit, uniqueValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `${tuid}$vid`;
            return yield this.unitCall(proc, unit, uniqueValue);
        });
    }
    tuidArrVid(tuid, arr, unit, uniqueValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `${tuid}_${arr}$vid`;
            return yield this.unitCall(proc, unit, uniqueValue);
        });
    }
    tuidGetArrAll(tuid, arr, unit, user, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall(tuid + '_' + arr + '$all', unit, user, owner);
        });
    }
    tuidIds(tuid, arr, unit, user, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = tuid;
            if (arr !== '$')
                proc += '_' + arr;
            proc += '$ids';
            let ret = yield this.unitUserCall(proc, unit, user, ids);
            return ret;
        });
    }
    tuidMain(tuid, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall(tuid + '$main', unit, user, id);
        });
    }
    tuidSave(tuid, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall(tuid + '$save', unit, user, ...params);
        });
    }
    tuidSetStamp(tuid, unit, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitCall(tuid + '$stamp', unit, ...params);
        });
    }
    tuidArrSave(tuid, arr, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall(tuid + '_' + arr + '$save', unit, user, ...params);
        });
    }
    tuidArrPos(tuid, arr, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall(tuid + '_' + arr + '$pos', unit, user, ...params);
        });
    }
    tuidSeach(tuid, unit, user, arr, key, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = tuid + '$search';
            return yield this.unitUserTablesFromProc(proc, unit, user, key || '', pageStart, pageSize);
        });
    }
    saveProp(tuid, unit, user, id, prop, value) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = tuid + '$prop';
            yield this.unitUserCall(proc, unit, user, id, prop, value);
        });
    }
    tuidArrSeach(tuid, unit, user, arr, ownerId, key, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `${tuid}_${arr}$search`;
            return yield this.unitUserTablesFromProc(proc, unit, user, ownerId, key || '', pageStart, pageSize);
        });
    }
    mapSave(map, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall(map + '$save', unit, user, ...params);
        });
    }
    importVId(unit, user, source, tuid, arr, no) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = `$import_vid`;
            let ret = yield this.unitUserTableFromProc(proc, unit, user, source, tuid, arr, no);
            return ret[0].vid;
        });
    }
    getSheetVerifyParametersBus(sheetName) {
        let name = sheetName + '$verify';
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction === undefined) {
            let svpb = new inBusAction_1.SheetVerifyParametersBus(this, sheetName);
            if (svpb.init() === true) {
                inBusAction = this.parametersBusCache[name] = svpb;
            }
        }
        return inBusAction;
    }
    isVerifyItemOk(arr) { return arr.length === 0; }
    isVerifyArrOk(arr) {
        for (let item of arr) {
            if (this.isVerifyItemOk(item) === false)
                return false;
        }
        return true;
    }
    sheetVerify(sheet, unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let sheetRun = this.sheetRuns[sheet];
            if (sheetRun === undefined)
                return;
            let { verify } = sheetRun;
            if (verify === undefined)
                return;
            let { returns } = verify;
            if (returns === undefined)
                return;
            let { length } = returns;
            if (length === 0)
                return;
            //let actionName = sheet + '$verify';
            let inBusAction = this.getSheetVerifyParametersBus(sheet);
            let inBusResult = yield inBusAction.busQueryAll(unit, user, data);
            let inBusActionData = data + inBusResult;
            let ret = yield this.unitUserCall(sheet + '$verify', unit, user, inBusActionData);
            if (length === 1) {
                if (this.isVerifyItemOk(ret) === true)
                    return;
            }
            if (this.isVerifyArrOk(ret) === true)
                return;
            let failed = (0, packReturn_1.packReturns)(returns, ret);
            return failed;
        });
    }
    sheetSave(sheet, unit, user, app, discription, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.unitUserCall('$sheet_save', unit, user, sheet, app, discription, data);
        });
    }
    sheetTo(unit, user, sheetId, toArr) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.unitUserCall('$sheet_to', unit, user, sheetId, toArr.join(','));
        });
    }
    sheetProcessing(sheetId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.call('$sheet_processing', [sheetId]);
        });
    }
    getSheetActionParametersBus(sheetName, stateName, actionName) {
        let name = `${sheetName}_${stateName}_${actionName}`;
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction === undefined) {
            let sapb = new inBusAction_1.SheetActionParametersBus(this, sheetName, stateName, actionName);
            if (sapb.init() === true) {
                inBusAction = this.parametersBusCache[name] = sapb;
            }
        }
        return inBusAction;
    }
    sheetAct(sheet, state, action, unit, user, id, flow) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusActionName = sheet + '_' + (state === '$' ? action : state + '_' + action);
            let inBusAction = this.getSheetActionParametersBus(sheet, state, action);
            if (inBusAction === undefined)
                return [`state ${state} is not sheet ${sheet} state`];
            let inBusActionData = yield inBusAction.busQueryAll(unit, user, id);
            //await this.log(unit, 'sheetAct', 'before ' + inBusActionName);
            let ret = inBusActionData === '' ?
                yield this.unitUserCallEx(inBusActionName, unit, user, id, flow, action)
                : yield this.unitUserCallEx(inBusActionName, unit, user, id, flow, action, inBusActionData);
            //await this.log(unit, 'sheetAct', 'after ' + inBusActionName);
            return ret;
        });
    }
    sheetStates(sheet, state, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = '$sheet_state';
            return yield this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
        });
    }
    sheetStateCount(sheet, unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = '$sheet_state_count';
            return yield this.unitUserCall(sql, unit, user, sheet);
        });
    }
    userSheets(sheet, state, unit, user, sheetUser, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = '$sheet_state_user';
            return yield this.unitUserCall(sql, unit, user, sheet, state, sheetUser, pageStart, pageSize);
        });
    }
    mySheets(sheet, state, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = '$sheet_state_my';
            return yield this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
        });
    }
    getSheet(sheet, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = '$sheet_id';
            return yield this.unitUserCall(sql, unit, user, sheet, id);
        });
    }
    sheetScan(sheet, unit, user, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = '$sheet_scan';
            return yield this.unitUserCall(sql, unit, user, sheet, id);
        });
    }
    sheetArchives(sheet, unit, user, pageStart, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = '$archives';
            return yield this.unitUserCall(sql, unit, user, sheet, pageStart, pageSize);
        });
    }
    sheetArchive(unit, user, sheet, id) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = '$archive_id';
            return yield this.unitUserCall(sql, unit, user, sheet, id);
        });
    }
    getActionParametersBus(actionName) {
        let inBusAction = this.parametersBusCache[actionName];
        if (inBusAction === undefined) {
            let apb = new inBusAction_1.ActionParametersBus(this, actionName);
            if (apb.init() === true) {
                inBusAction = this.parametersBusCache[actionName] = apb;
            }
        }
        return inBusAction;
    }
    action(actionName, unit, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusAction = this.getActionParametersBus(actionName);
            let inBusResult = yield inBusAction.busQueryAll(unit, user, data);
            let actionData = data + inBusResult;
            let result = yield this.unitUserCallEx(actionName, unit, user, actionData);
            return result;
        });
    }
    actionProxy(actionName, unit, user, proxyUser, data) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusAction = this.getActionParametersBus(actionName);
            let inBusResult = yield inBusAction.busQueryAll(unit, user, data);
            let actionData = data + inBusResult;
            let result = yield this.unitUserCallEx(actionName, unit, user, proxyUser, actionData);
            return result;
        });
    }
    actionFromObj(actionName, unit, user, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusAction = this.getActionParametersBus(actionName);
            let actionData = yield inBusAction.buildDataFromObj(unit, user, obj);
            let result = yield this.unitUserCallEx(actionName, unit, user, actionData);
            return result;
        });
    }
    actionDirect(actionName, unit, user, ...params) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.unitUserCallEx(actionName, unit, user, ...params);
            return result;
        });
    }
    query(query, unit, user, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.unitUserCall(query, unit, user, ...params);
            return ret;
        });
    }
    queryProxy(query, unit, user, proxyUser, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret = yield this.unitUserCall(query, unit, user, proxyUser, ...params);
            return ret;
        });
    }
    // msgId: bus message id
    // body: bus message body
    getAcceptParametersBus(bus, face) {
        let name = bus + '_' + face;
        let inBusAction = this.parametersBusCache[name];
        if (inBusAction == undefined) {
            let apb = new inBusAction_1.AcceptParametersBus(this, bus, face);
            if (apb.init() === true) {
                inBusAction = this.parametersBusCache[name] = apb;
            }
        }
        return inBusAction;
    }
    bus(bus, face, unit, to, msgId, body, version, stamp) {
        return __awaiter(this, void 0, void 0, function* () {
            let inBusAction = this.getAcceptParametersBus(bus, face);
            let inBusResult = yield inBusAction.busQueryAll(unit, to, body);
            let data = body + inBusResult;
            const proc = `${bus}_${face}`;
            yield this.unitUserCall(proc, unit, to, msgId, data, version, stamp);
        });
    }
    busAcceptFromQuery(bus, face, unit, body) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.unitUserCall(`${bus}_${face}`, unit, 0, 0, body, undefined);
        });
    }
    checkPull(unit, entity, entityType, modifies) {
        return __awaiter(this, void 0, void 0, function* () {
            let proc;
            switch (entityType) {
                default: throw 'error entityType';
                case 'tuid':
                    proc = `${entity}$pull_check`;
                    break;
                case 'map':
                    proc = '$map_pull_check';
                    break;
            }
            return yield this.unitTableFromProc(proc, unit, entity, modifies);
        });
    }
    importData(unit, user, source, entity, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield importData_1.ImportData.exec(this, unit, this.db, source, entity, filePath);
        });
    }
    equDb(db) {
        return this.db === db;
    }
    /*
        async reset() {
            await this.net.resetRunnerAfterCompile(this);
        }
    */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schemas !== undefined)
                return;
            try {
                yield this.initInternal();
                if (this.hasStatements === true) {
                    yield this.runUqStatements();
                }
            }
            catch (err) {
                this.schemas = undefined;
                tool_1.logger.error(err.message);
                debugger;
            }
        });
    }
    initInternal() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.log(0, 'SCHEDULE', 'uq-api start removeAllScheduleEvents');
            let eventsText = yield this.dbCaller.removeAllScheduleEvents();
            this.log(0, 'SCHEDULE', 'uq-api done removeAllScheduleEvents' + eventsText);
            let rows = yield this.loadSchemas(0);
            let schemaTable = rows[0];
            let settingTable = rows[1];
            let setting = {};
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
            this.uqOwner = setting['uqowner'];
            this.uq = setting['uq'];
            this.author = setting['author'];
            this.uqId = setting['uqid'];
            this.version = setting['version']; // source verion in uq code
            this.uqVersion = setting['uqversion']; // compile changed
            if (this.uqVersion === undefined)
                this.uqVersion = 1;
            this.hasUnit = !(setting['hasunit'] === 0);
            this.hasStatements = setting['hasstatements'] === 1;
            this.service = setting['service'];
            this.devBuildSys = setting['dev-build-sys'] !== null;
            this.dbCaller.hasUnit = this.hasUnit;
            // this.dbCaller.setBuilder();
            let ixUserArr = [];
            let uu = setting['uniqueunit'];
            this.uniqueUnit = uu !== null && uu !== void 0 ? uu : uniqueUnitInConfig;
            if (dbCaller_1.env.isDevelopment)
                tool_1.logger.debug('init schemas: ', this.uq, this.author, this.version);
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
                if (!schema)
                    continue;
                let tuidFroms;
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
                };
                switch (type) {
                    case '$role':
                        this.role = schemaObj;
                        this.roleNames = schemaObj === null || schemaObj === void 0 ? void 0 : schemaObj.names;
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
                            if (!(sync === false))
                                this.hasPullEntities = true;
                            tuidFroms = this.froms[from];
                            if (tuidFroms === undefined)
                                tuidFroms = this.froms[from] = {};
                            let tuidFrom = tuidFroms[name];
                            if (tuidFrom === undefined)
                                tuidFrom = tuidFroms[name] = {};
                            tuidFrom.tuidObj = schemaObj;
                        }
                        this.buildTuidMainFields(schemaObj);
                        break;
                    case 'map':
                        if (from) {
                            this.hasPullEntities = true;
                            tuidFroms = this.froms[from];
                            if (tuidFroms === undefined)
                                tuidFroms = this.froms[from] = {};
                            let { keys } = schemaObj;
                            let key0 = keys[0];
                            let tuidName = key0.tuid;
                            if (tuidName === undefined)
                                break;
                            let tuidFrom = tuidFroms[tuidName];
                            if (tuidFrom === undefined)
                                tuidFrom = tuidFroms[tuidName] = {};
                            let mapObjs = tuidFrom.mapObjs;
                            if (mapObjs === undefined)
                                mapObjs = tuidFrom.mapObjs = {};
                            mapObjs[name] = schemaObj;
                        }
                        break;
                    case 'sheet':
                        this.hasSheet = true;
                        this.sheetRuns[name] = {
                            onsave: ((_a = runObj === null || runObj === void 0 ? void 0 : runObj.run['$']) === null || _a === void 0 ? void 0 : _a['$onsave']) !== undefined,
                            verify: schemaObj.verify,
                        };
                        break;
                    case 'ix':
                        // 下面这句，以后可以去掉。schema.idIsUser会改成ixIsUser
                        if (schemaObj.idIsUser === true) {
                            ixUserArr.push(schemaObj);
                        }
                        ;
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
                        syncTuid.tuid = tuidObj.name.toLowerCase();
                    }
                    if (mapObjs !== undefined) {
                        let s = [];
                        for (let m in mapObjs)
                            s.push(m.toLowerCase());
                        syncTuid.maps = s;
                    }
                }
            }
            for (let i in this.schemas) {
                let schema = this.schemas[i].call;
                let { type, name } = schema;
                switch (type) {
                    case 'map':
                        this.mapBorn(schema);
                        break;
                }
            }
            for (let i in this.schemas) {
                let schema = this.schemas[i];
                let { call } = schema;
                if (call === undefined)
                    continue;
                let circular = false;
                let tuidsArr = [call];
                let text = JSON.stringify(call, (key, value) => {
                    if (key === 'tuids') {
                        let ret = [];
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
                    else
                        return value;
                });
                if (circular) {
                    let newCall = JSON.parse(text);
                    schema.call = newCall;
                }
            }
            let faces = [];
            let busOutCount = 0;
            let urlColl = {};
            let faceColl = {};
            for (let busSchema of this.busArr) {
                let { name: bus, busOwner, busName, schema, outCount, busVersion } = busSchema;
                for (let i in schema) {
                    let { accept, query } = schema[i];
                    let faceName = i.toLowerCase();
                    let url = `${busOwner.toLowerCase()}/${busName.toLowerCase()}/${faceName}`;
                    if (urlColl[url])
                        continue;
                    let faceUrl = `${bus.toLowerCase()}/${faceName}`;
                    if (accept !== undefined) {
                        faces.push(url);
                        faceColl[faceUrl] = urlColl[url] = new BusFace_1.BusFaceAccept(this, url, bus, faceName, busVersion, accept);
                    }
                    else if (query === true) {
                        faceColl[faceUrl] = urlColl[url] = new BusFace_1.BusFaceQuery(this, url, bus, faceName, busVersion);
                    }
                }
                busOutCount += (outCount !== null && outCount !== void 0 ? outCount : 0);
            }
            let faceText;
            if (faces.length > 0)
                faceText = '\n' + faces.join('\n') + '\n';
            this.buses = {
                faces: faceText,
                outCount: busOutCount,
                urlColl,
                faceColl,
                error: undefined,
            };
            this.buildTuid$User();
            this.buildAccesses();
        });
    }
    buildTuid$User() {
        let $user = this.tuids['$user'];
        if ($user !== undefined)
            return;
        this.buildTuidMainFields(this.$userSchema);
        this.tuids['$user'] = this.$userSchema;
    }
    buildTuidMainFields(tuidSchema) {
        let { id, base, fields, main, arrs } = tuidSchema;
        let mainFields = tuidSchema.mainFields = [
            { name: id, type: 'id' }
        ];
        if (base)
            for (let b of base)
                mainFields.push(fields.find(v => v.name === b));
        if (main)
            for (let m of main)
                mainFields.push(fields.find(v => v.name === m));
        if (arrs === undefined)
            return;
        for (let arr of arrs) {
            let { id, owner, main, fields } = arr;
            mainFields = arr.mainFields = [
                { name: id, type: 'id' },
                { name: owner, type: 'id' }
            ];
            if (main)
                for (let m of main)
                    mainFields.push(fields.find(v => v.name === m));
        }
    }
    mapBorn(schema) {
        function getCall(s) {
            let c = this.schemas[s];
            if (c === undefined)
                return;
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
    buildAccesses() {
        this.access = {
            uq: this.uqId
        };
        for (let access of this.accessSchemaArr) {
            let acc = this.access[access.name] = {};
            for (let item of access.list) {
                let it = item;
                let pos = it.indexOf(':');
                let name, ops;
                if (pos > 0) {
                    name = it.substring(0, pos);
                    ops = it.substring(pos + 1);
                }
                else {
                    name = it;
                }
                let schema = this.schemas[name];
                if (schema === undefined)
                    continue;
                let entity = schema.call;
                if (entity === undefined)
                    continue;
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
        if (dbCaller_1.env.isDevelopment)
            tool_1.logger.debug('access: ', this.access);
    }
    getUserAccess(unit, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.db.tablesFromProc('$get_access', [unit]);
            let ret = _.union(result[0].map(v => v.entity), result[1].map(v => v.entity));
            return ret;
        });
    }
    getAccesses(unit, user, acc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            let access = {};
            function merge(src) {
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
                for (let a of acc)
                    merge(this.access[a]);
            }
            let accessEntities = yield this.getUserAccess(unit, user);
            let entityAccess = {};
            for (let entityId of accessEntities) {
                let entity = this.entityColl[entityId];
                if (entity === undefined)
                    continue;
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
        });
    }
    getEntities(unit) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            let entityAccess = {};
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
        });
    }
    getAllSchemas() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.schemas;
        });
    }
    getSchema(name) {
        return this.schemas[name.toLowerCase()];
    }
    getActionConvertSchema(name) {
        return this.actionConvertSchemas[name];
    }
    setActionConvertSchema(name, value) {
        this.actionConvertSchemas[name] = value;
    }
    runUqStatements() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.procCall('$uq', []);
        });
    }
}
exports.EntityRunner = EntityRunner;
//# sourceMappingURL=EntityRunner.js.map