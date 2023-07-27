"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityRunner = void 0;
const jsonpack = require("jsonpack");
const tool_1 = require("../../tool");
const db_1 = require("../db");
const db_2 = require("../db");
const packReturn_1 = require("../packReturn");
const importData_1 = require("../importData");
const inBusAction_1 = require("../inBusAction");
const centerApi_1 = require("../centerApi");
const BusFace_1 = require("./BusFace");
const Runner_1 = require("./Runner");
const sqlsVersion_1 = require("../db/my/sqlsVersion");
class EntityRunner extends Runner_1.Runner {
    /**
     * EntityRunner: 提供调用某个db中存储过程 / 缓存某db中配置数据 的类？
     * @param name uq(即数据库)的名称
     * @param dbContainer
     * @param net
     */
    constructor(dbUq, net) {
        super(dbUq);
        this.roleVersions = {};
        this.compileTick = 0;
        this.hasPullEntities = false;
        this.hasSheet = false;
        this.isCompiling = false;
        this.devBuildSys = false;
        this.getTableSchema = (lowerName) => {
            var _a;
            return (_a = this.schemas[lowerName]) === null || _a === void 0 ? void 0 : _a.call;
        };
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
        this.dbName = dbUq.name;
        this.sqlFactory = (0, db_1.createSqlFactory)({
            dbUq,
            getTableSchema: this.getTableSchema,
            // dbName: this.dbName,
            hasUnit: false,
            // twProfix: this.dbUq.twProfix,
        });
        this.db$Uq = (0, db_2.getDbs)().db$Uq;
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
    async setCompileTick(compileTick) {
        if (compileTick === undefined)
            return;
        if (this.compileTick === compileTick)
            return;
        this.compileTick = compileTick;
        await this.reset();
    }
    async IDSql(unit, user, sqlBuilder) {
        sqlBuilder.build();
        let { sql, proc, procParameters } = sqlBuilder;
        let ret;
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
    async ActIDProp(unit, user, ID, id, propName, value) {
        return await this.call(`${ID}$prop`, [unit, user, id, propName, value]);
    }
    getEntityNameList() {
        return Object.keys(this.schemas).join(', ');
        //return JSON.stringify(this.schemas);
    }
    async getRoles(unit, app, user, inRoles) {
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
        let ret = await centerApi_1.centerApi.appRoles(unit, app, user);
        if (ret === undefined)
            return;
        let { roles, version } = ret;
        unitRVs[app] = { version, tick: Date.now() };
        if (version === Number(rolesVersion) && roles === Number(rolesBin))
            return;
        return ret;
    }
    async getAdmins(unit, user) {
        let tbl = await this.tableFromProc('$get_admins', [unit, user]);
        if (tbl.length === 0)
            return;
        return tbl;
    }
    async setMeAdmin(unit, user) {
        await this.call('$set_me_admin', [unit, user]);
    }
    async setAdmin(unit, $user, user, role, assigned) {
        await this.call('$set_admin', [unit, $user, user, role, assigned]);
    }
    async isAdmin(unit, user) {
        let ret = await this.tableFromProc('$is_admin', [unit, user]);
        return ret.length > 0;
    }
    async getMyRoles(unit, user) {
        if (!this.roleNames)
            return;
        let tbl = await this.tableFromProc('$get_my_roles', [unit, user]);
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
    }
    async getAllRoleUsers(unit, user) {
        // row 0 返回 ixOfUsers
        let tbl = await this.tableFromProc('$get_all_role_users', [unit, user]);
        tbl.unshift({ user: 0, roles: this.ixOfUsers });
        return tbl;
    }
    async setUserRoles(unit, user, theUser, roles) {
        await this.call('$set_user_roles', [unit, user, theUser, roles]);
    }
    async deleteUserRoles(unit, user, theUser) {
        await this.call('$delete_user_roles', [unit, user, theUser]);
    }
    async roleGetAdmins(unit, user) {
        let tbl = await this.tableFromProc('$get_admins', [unit, user]);
        if (tbl.length === 0)
            return;
        return tbl;
    }
    async roleSetMeAdmin(unit, user) {
        await this.call('$set_me_admin', [unit, user]);
    }
    async roleSetAdmin(unit, $user, user, role, assigned) {
        await this.call('$set_admin', [unit, $user, user, role, assigned]);
    }
    async roleIsAdmin(unit, user) {
        let ret = await this.tableFromProc('$is_admin', [unit, user]);
        return ret.length > 0;
    }
    async roleGetMy(unit, user) {
        let ret = await this.tablesFromProc('$role_my_roles', [unit, user]);
        return ret;
    }
    async roleGetAllUsers(unit, user) {
        // row 0 返回 ixOfUsers
        let tbl = await this.tableFromProc('$get_all_role_users', [unit, user]);
        tbl.unshift({ user: 0, roles: this.ixOfUsers });
        return tbl;
    }
    async roleSetUser(unit, user, theUser, roles) {
        await this.call('$set_user_roles', [unit, user, theUser, roles]);
    }
    async roleDeleteUser(unit, user, theUser) {
        await this.call('$delete_user_roles', [unit, user, theUser]);
    }
    checkUqVersion(uqVersion) {
        //if (this.uqVersion === undefined) return;
        //if (uqVersion !== this.uqVersion) 
        throw 'unmatched uq version';
    }
    setModifyMax(unit, modifyMax) {
        this.modifyMaxes[unit] = modifyMax;
    }
    async getModifyMax(unit) {
        let ret = this.modifyMaxes[unit];
        if (ret !== undefined) {
            if (ret === null)
                return;
            return ret;
        }
        try {
            let maxes = await this.tableFromProc('$modify_queue_max', [unit]);
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
    }
    async log(unit, subject, content) {
        // await this.$uqDb.uqLog(unit, this.net.getUqFullName(this.uq), subject, content);
        await this.db$Uq.proc('log', [unit, this.dbName, subject, content]);
    }
    async logError(unit, subject, content) {
        //await this.$uqDb.uqLogError(unit, this.net.getUqFullName(this.uq), subject, content);
        await this.db$Uq.proc('log_error', [unit, this.dbName, subject, content]);
    }
    async confirmProc(proc) {
        await this.dbUq.confirmProc(proc);
    }
    async call(proc, params) {
        return await this.dbUq.call(proc, params);
    }
    async sql(sql, params) {
        return await this.dbUq.sql(sql, params);
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
    async unitUserCallEx(proc, unit, user, ...params) {
        let p = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined)
            p.push(...params);
        return await this.dbUq.callEx(proc, p);
    }
    async unitTableFromProc(proc, unit, ...params) {
        let p = [];
        p.push(unit);
        if (params !== undefined)
            p.push(...params);
        let ret = await this.dbUq.tableFromProc(proc, p);
        return ret;
    }
    async unitUserTableFromProc(proc, unit, user, ...params) {
        let p = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined)
            p.push(...params);
        let ret = await this.dbUq.tableFromProc(proc, p);
        return ret;
    }
    async unitTablesFromProc(proc, unit, ...params) {
        let p = [];
        p.push(unit);
        if (params !== undefined)
            p.push(...params);
        let ret = await this.dbUq.tablesFromProc(proc, p);
        return ret;
    }
    async unitUserTablesFromProc(proc, unit, user, ...params) {
        let p = [];
        p.push(unit);
        p.push(user);
        if (params !== undefined)
            p.push(...params);
        let ret = await this.dbUq.tablesFromProc(proc, p);
        return ret;
    }
    async buildProc(proc) {
    }
    async buildUqStoreProcedureIfNotExists(...procs) {
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
    async loadSchemas(hasSource) {
        return await this.dbUq.tablesFromProc('$entitys', [hasSource]);
    }
    async saveSchema(unit, user, id, name, type, schema, run, source, from, open, isPrivate) {
        return await this.unitUserCall('$entity', unit, user, id, name, type, schema, run, source, from, open, isPrivate);
    }
    async loadConstStrs() {
        return await this.dbUq.call('$const_strs', []);
    }
    async saveConstStr(type) {
        let ret = await this.dbUq.call('$const_str', [type]);
        return ret.map(v => v.id + '\t' + v.name);
    }
    async savePhrases(phrases, rolesJson) {
        if (sqlsVersion_1.sqlsVersion.version < 8)
            return [];
        let ret = await this.dbUq.call('$save_phrases', [phrases]);
        let retStr = ret.map(v => v.id + '\t' + v.name);
        if (rolesJson !== undefined) {
            let ixPhrasesRole = [];
            let roles = JSON.parse(rolesJson);
            for (let { role, permits } of roles) {
                ixPhrasesRole.push(...permits.map(v => `${role}\t${v}`));
            }
            await this.dbUq.call('$save_ixphrases_role', [ixPhrasesRole.join('\n')]);
        }
        return retStr;
    }
    async saveTextId(text) {
        return await this.dbUq.saveTextId(text);
    }
    async loadSchemaVersion(name, version) {
        return await this.dbUq.call('$entity_version', [name, version]);
    }
    async setEntityValid(entities, valid) {
        let ret = await this.dbUq.call('$entity_validate', [entities, valid]);
        return ret;
    }
    async saveFace(bus, busOwner, busName, faceName) {
        await this.dbUq.call('$save_face', [bus, busOwner, busName, faceName]);
    }
    async execQueueAct() {
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
    async entityNo(entity, unit, year, month, date) {
        return await this.call('$entity_no', [unit, entity, `${year}-${month}-${date}`]);
    }
    async tuidGet(tuid, unit, user, id) {
        return await this.unitUserCallEx(tuid, unit, user, id);
    }
    async tuidArrGet(tuid, arr, unit, user, owner, id) {
        return await this.unitUserCall(tuid + '_' + arr + '$id', unit, user, owner, id);
    }
    async tuidGetAll(tuid, unit, user) {
        return await this.unitUserCall(tuid + '$all', unit, user);
    }
    async tuidVid(tuid, unit, uniqueValue) {
        let proc = `${tuid}$vid`;
        return await this.unitCall(proc, unit, uniqueValue);
    }
    async tuidArrVid(tuid, arr, unit, uniqueValue) {
        let proc = `${tuid}_${arr}$vid`;
        return await this.unitCall(proc, unit, uniqueValue);
    }
    async tuidGetArrAll(tuid, arr, unit, user, owner) {
        return await this.unitUserCall(tuid + '_' + arr + '$all', unit, user, owner);
    }
    async tuidIds(tuid, arr, unit, user, ids) {
        let proc = tuid;
        if (arr !== '$')
            proc += '_' + arr;
        proc += '$ids';
        let ret = await this.unitUserCall(proc, unit, user, ids);
        return ret;
    }
    async tuidMain(tuid, unit, user, id) {
        return await this.unitUserCall(tuid + '$main', unit, user, id);
    }
    async tuidSave(tuid, unit, user, params) {
        return await this.unitUserCall(tuid + '$save', unit, user, ...params);
    }
    async tuidSetStamp(tuid, unit, params) {
        return await this.unitCall(tuid + '$stamp', unit, ...params);
    }
    async tuidArrSave(tuid, arr, unit, user, params) {
        return await this.unitUserCall(tuid + '_' + arr + '$save', unit, user, ...params);
    }
    async tuidArrPos(tuid, arr, unit, user, params) {
        return await this.unitUserCall(tuid + '_' + arr + '$pos', unit, user, ...params);
    }
    async tuidSeach(tuid, unit, user, arr, key, pageStart, pageSize) {
        let proc = tuid + '$search';
        return await this.unitUserTablesFromProc(proc, unit, user, key || '', pageStart, pageSize);
    }
    async saveProp(tuid, unit, user, id, prop, value) {
        let proc = tuid + '$prop';
        await this.unitUserCall(proc, unit, user, id, prop, value);
    }
    async tuidArrSeach(tuid, unit, user, arr, ownerId, key, pageStart, pageSize) {
        let proc = `${tuid}_${arr}$search`;
        return await this.unitUserTablesFromProc(proc, unit, user, ownerId, key || '', pageStart, pageSize);
    }
    async mapSave(map, unit, user, params) {
        return await this.unitUserCall(map + '$save', unit, user, ...params);
    }
    async importVId(unit, user, source, tuid, arr, no) {
        let proc = `$import_vid`;
        let ret = await this.unitUserTableFromProc(proc, unit, user, source, tuid, arr, no);
        return ret[0].vid;
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
    async sheetVerify(sheet, unit, user, data) {
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
        let inBusResult = await inBusAction.busQueryAll(unit, user, data);
        let inBusActionData = data + inBusResult;
        let ret = await this.unitUserCall(sheet + '$verify', unit, user, inBusActionData);
        if (length === 1) {
            if (this.isVerifyItemOk(ret) === true)
                return;
        }
        if (this.isVerifyArrOk(ret) === true)
            return;
        let failed = (0, packReturn_1.packReturns)(returns, ret);
        return failed;
    }
    async sheetSave(sheet, unit, user, app, discription, data) {
        return await this.unitUserCall('$sheet_save', unit, user, sheet, app, discription, data);
    }
    async sheetTo(unit, user, sheetId, toArr) {
        await this.unitUserCall('$sheet_to', unit, user, sheetId, toArr.join(','));
    }
    async sheetProcessing(sheetId) {
        await this.dbUq.call('$sheet_processing', [sheetId]);
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
    async sheetAct(sheet, state, action, unit, user, id, flow) {
        let inBusActionName = sheet + '_' + (state === '$' ? action : state + '_' + action);
        let inBusAction = this.getSheetActionParametersBus(sheet, state, action);
        if (inBusAction === undefined)
            return [`state ${state} is not sheet ${sheet} state`];
        let inBusActionData = await inBusAction.busQueryAll(unit, user, id);
        //await this.log(unit, 'sheetAct', 'before ' + inBusActionName);
        let ret = inBusActionData === '' ?
            await this.unitUserCallEx(inBusActionName, unit, user, id, flow, action)
            : await this.unitUserCallEx(inBusActionName, unit, user, id, flow, action, inBusActionData);
        //await this.log(unit, 'sheetAct', 'after ' + inBusActionName);
        return ret;
    }
    async sheetStates(sheet, state, unit, user, pageStart, pageSize) {
        let sql = '$sheet_state';
        return await this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
    }
    async sheetStateCount(sheet, unit, user) {
        let sql = '$sheet_state_count';
        return await this.unitUserCall(sql, unit, user, sheet);
    }
    async userSheets(sheet, state, unit, user, sheetUser, pageStart, pageSize) {
        let sql = '$sheet_state_user';
        return await this.unitUserCall(sql, unit, user, sheet, state, sheetUser, pageStart, pageSize);
    }
    async mySheets(sheet, state, unit, user, pageStart, pageSize) {
        let sql = '$sheet_state_my';
        return await this.unitUserCall(sql, unit, user, sheet, state, pageStart, pageSize);
    }
    async getSheet(sheet, unit, user, id) {
        let sql = '$sheet_id';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }
    async sheetScan(sheet, unit, user, id) {
        let sql = '$sheet_scan';
        return await this.unitUserCall(sql, unit, user, sheet, id);
    }
    async sheetArchives(sheet, unit, user, pageStart, pageSize) {
        let sql = '$archives';
        return await this.unitUserCall(sql, unit, user, sheet, pageStart, pageSize);
    }
    async sheetArchive(unit, user, sheet, id) {
        let sql = '$archive_id';
        return await this.unitUserCall(sql, unit, user, sheet, id);
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
    async action(actionName, unit, user, data) {
        let inBusAction = this.getActionParametersBus(actionName);
        let inBusResult = await inBusAction.busQueryAll(unit, user, data);
        let actionData = data + inBusResult;
        let result = await this.unitUserCallEx(actionName, unit, user, actionData);
        return result;
    }
    async actionProxy(actionName, unit, user, proxyUser, data) {
        let inBusAction = this.getActionParametersBus(actionName);
        let inBusResult = await inBusAction.busQueryAll(unit, user, data);
        let actionData = data + inBusResult;
        let result = await this.unitUserCallEx(actionName, unit, user, proxyUser, actionData);
        return result;
    }
    async actionFromObj(actionName, unit, user, obj) {
        let inBusAction = this.getActionParametersBus(actionName);
        let actionData = await inBusAction.buildDataFromObj(unit, user, obj);
        let result = await this.unitUserCallEx(actionName, unit, user, actionData);
        return result;
    }
    async actionDirect(actionName, unit, user, ...params) {
        let result = await this.unitUserCallEx(actionName, unit, user, ...params);
        return result;
    }
    async query(query, unit, user, params) {
        let ret = await this.unitUserCall(query, unit, user, ...params);
        return ret;
    }
    async queryProxy(query, unit, user, proxyUser, params) {
        let ret = await this.unitUserCall(query, unit, user, proxyUser, ...params);
        return ret;
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
    async bus(bus, face, unit, to, msgId, body, version, stamp) {
        let inBusAction = this.getAcceptParametersBus(bus, face);
        let inBusResult = await inBusAction.busQueryAll(unit, to, body);
        let data = body + inBusResult;
        const proc = `${bus}_${face}`;
        await this.unitUserCall(proc, unit, to, msgId, data, version, stamp);
    }
    async busAcceptFromQuery(bus, face, unit, body) {
        await this.unitUserCall(`${bus}_${face}`, unit, 0, 0, body, undefined);
    }
    async checkPull(unit, entity, entityType, modifies) {
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
        return await this.unitTableFromProc(proc, unit, entity, modifies);
    }
    async importData(unit, user, source, entity, filePath) {
        await importData_1.ImportData.exec(this, unit, this.dbUq, source, entity, filePath);
    }
    equDb(dbContainer) {
        return this.dbUq === dbContainer;
    }
    /*
        async reset() {
            await this.net.resetRunnerAfterCompile(this);
        }
    */
    async init() {
        if (this.schemas !== undefined)
            return;
        try {
            await this.initInternal();
            if (this.hasStatements === true) {
                await this.runUqStatements();
            }
        }
        catch (err) {
            this.schemas = undefined;
            tool_1.logger.error(err.message);
            debugger;
        }
    }
    async initInternal() {
        var _a;
        this.log(0, 'SCHEDULE', 'uq-api start removeAllScheduleEvents');
        let eventsText = await this.dbUq.removeAllScheduleEvents();
        this.log(0, 'SCHEDULE', 'uq-api done removeAllScheduleEvents' + eventsText);
        let rows = await this.loadSchemas(0);
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
        let ixUserArr = [];
        let uu = setting['uniqueunit'];
        this.uniqueUnit = uu !== null && uu !== void 0 ? uu : tool_1.env.uniqueUnitInConfig;
        if (tool_1.env.isDevelopment)
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
            let schemaObj;
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
                case 'biz.spec':
                    if (schemaObj.private !== true) {
                        this.ids[name] = schemaObj;
                    }
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
        if (tool_1.env.isDevelopment)
            tool_1.logger.debug('access: ', this.access);
    }
    async getUserAccess(unit, user) {
        let result = await this.dbUq.tablesFromProc('$get_access', [unit]);
        let ret = [...result[0].map(v => v.entity), ...result[1].map(v => v.entity)];
        return ret;
    }
    async getUser(user) {
        let ret = await this.dbUq.tableFromProc('$getuser', [0, 0, user]);
        if (ret.length === 0)
            return undefined;
        return ret[0];
    }
    async saveUser(id, name, nick, icon) {
        let params = [id, name, nick, icon].join('\t') + '\n';
        let ret = await this.dbUq.tableFromProc('$setuser', [0, 0, params]);
        if (ret.length === 0)
            return undefined;
        return ret[0];
    }
    async getAccesses(unit, user, acc) {
        await this.init();
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
                dst.ops = [...dst.ops, ...v.ops];
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
        let accessEntities = await this.getUserAccess(unit, user);
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
    }
    async getEntities(unit) {
        await this.init();
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
    }
    async getAllSchemas() {
        return this.schemas;
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
    async runUqStatements() {
        await this.procCall('$uq', []);
    }
}
exports.EntityRunner = EntityRunner;
//# sourceMappingURL=EntityRunner.js.map