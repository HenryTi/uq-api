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
exports.TableUpdater = exports.Table = void 0;
const il_1 = require("../../il");
const core_1 = require("../../../core");
const tool_1 = require("../../../tool");
class Table {
    constructor(dbName, tblName) {
        this.tab = 0;
        this.hasUnit = true;
        this.isMinuteId = false; // ID id is defined as minute
        this.indexes = [];
        this.dbName = dbName;
        this.name = tblName;
    }
    buildIdIndex() {
        let keysLen = this.keys.length;
        if (this.autoIncId !== undefined &&
            (keysLen > 1 || keysLen === 1 && this.hasUnit === true)) {
            //sb.comma().n().tab(tab);
            let autoIdIndex = new il_1.Index('$id_ix', true);
            autoIdIndex.global = true;
            autoIdIndex.fields = [this.autoIncId];
            this.indexes.push(autoIdIndex);
        }
    }
    isKey(field) {
        return this.keys !== undefined && this.keys.find(k => k === field) !== undefined;
    }
    update(sb) {
        this.start(sb);
        let first = true;
        let tab = this.tab + 1;
        let unit = sb.unit;
        let hasUnit = this.hasUnit === true && unit !== undefined;
        if (hasUnit === true) {
            first = false;
            sb.tab(tab);
            this.field(sb, unit);
        }
        for (let f of this.fields) {
            if (f === undefined)
                continue;
            if (first === true)
                first = false;
            else
                sb.comma().n();
            sb.tab(tab);
            this.field(sb, f);
        }
        if (this.keys !== undefined && this.keys.length > 0) {
            if (first === true)
                first = false;
            else
                sb.comma().n();
            sb.tab(tab);
            this.primaryKey(sb, this.keys);
        }
        else {
            debugger;
            throw 'every table should define keys';
        }
        if (this.indexes !== undefined) {
            for (let index of this.indexes) {
                if (index.fields.length === 0)
                    continue;
                if (first === true)
                    first = false;
                else
                    sb.comma().n();
                sb.tab(tab);
                this.index(sb, index);
            }
        }
        sb.n();
        this.end(sb);
    }
    updateDb(context, runner, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let updater = this.createUpdater(context, runner);
            return yield updater.updateDb(options);
        });
    }
    updateRows(context, runner, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let updater = this.createUpdater(context, runner);
            return yield updater.updateRows(options);
        });
    }
}
exports.Table = Table;
class TableUpdater {
    constructor(context, runner, table) {
        var _a;
        this.context = context;
        this.runner = runner;
        this.table = table;
        // 原来的 ID IX 只有 const 才能有初始值。现在都可以定义初值。
        // const 有 $valid 字段，为了在生成存储过程的时候区别，在这里取值
        this.field$valid = table.fields.find(v => (v === null || v === void 0 ? void 0 : v.name) === '$valid');
        this.dbName = (_a = table.dbName) !== null && _a !== void 0 ? _a : this.context.dbName;
    }
    updateDb(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let tblName = this.table.name;
            try {
                let existTable = yield this.loadExistTable();
                if (existTable === undefined) {
                    yield this.createTable();
                    this.context.log('TABLE [' + tblName + '] created');
                    yield this.copyDataFrom$Site();
                    return undefined;
                }
                if (existTable.hasUnit !== this.table.hasUnit) {
                    let rebuildSucceed = yield this.rebuildIfNoData();
                    if (rebuildSucceed === false) {
                        if (existTable.hasUnit === true) {
                            //let msg = `表[${tblName}]需要手动处理：原表${existTable.hasUnit === false ? '没' : ''}有$unit字段，新表${this.table.hasUnit === false ? '没' : ''}有$unit字段`;
                            let msg = `表[${tblName}]需要手动处理：原表有$unit字段，新表'没'有$unit字段`;
                            return msg;
                        }
                        else {
                            yield this.addColumn(this.context.unitField);
                        }
                    }
                    existTable = yield this.loadExistTable();
                }
                let ok = true;
                let changed = false;
                for (let field of existTable.fields) {
                    let fn = field.name.toLowerCase();
                    let fld = this.table.fields.find(f => f !== undefined && f.name.toLowerCase() === fn);
                    if (fld === undefined) {
                        if (options.autoRemoveTableField === true) {
                            //await this.dropColumn(field);
                            this.context.log('表[' + tblName + ']应该删除字段' + fn);
                        }
                        else {
                            this.context.log('原表[' + tblName + ']中的字段' + fn + '在新表中不存在');
                        }
                        changed = true;
                    }
                    else {
                        let err = this.compareField(field, fld);
                        if (err !== undefined) {
                            this.context.log(`表[${tblName}]中的字段${fn}发生变化，${err}. 编译器尝试自动更新`);
                            changed = true;
                            debugger;
                            yield this.alterField(fld);
                            //ok = false;
                        }
                    }
                }
                let charBinaryFields = [];
                for (let field of this.table.fields) {
                    if (field === undefined)
                        continue;
                    let dt = field.dataType;
                    if (dt.isString === true) {
                        if (dt.binary === true)
                            charBinaryFields.push(field);
                    }
                    let fn = field.name.toLowerCase();
                    let fld = existTable.fields.find(f => f !== undefined && f.name.toLowerCase() === fn);
                    if (fld === undefined) {
                        yield this.addColumn(field);
                        this.context.log('表[' + tblName + ']已自动添加字段' + fn);
                        changed = true;
                        continue;
                    }
                    if (fld.autoInc !== field.autoInc) {
                        yield this.alterField(field);
                        this.context.log(`表[${tblName}]已改为${field.autoInc === true ? '' : '非'}自增`);
                    }
                    let dtOld = fld.dataType;
                    let cdt = this.compareDataType(dtOld, dt);
                    if (cdt !== undefined) {
                        try {
                            this.context.log(cdt);
                            yield this.alterField(field);
                            this.context.log('表[' + tblName + ']字段' + fn + '类型已改为' + dt.type);
                        }
                        catch (err) {
                            this.context.log('表[' + tblName + ']字段' + fn + '修改类型时错误');
                            this.context.log(err);
                        }
                    }
                    if (field.isDefaultEqu(fld.defaultValue) === false) {
                        try {
                            yield this.alterField(field);
                            this.context.log('表[' + tblName + ']字段' + fn + '默认值已改为' + field.defaultValue);
                        }
                        catch (err) {
                            this.context.log('表[' + tblName + ']字段' + fn + '修改默认值时错误');
                            this.context.log(err);
                        }
                    }
                }
                for (let field of charBinaryFields) {
                    yield this.alterToBinary(field);
                }
                if (existTable.keys === undefined) {
                    if (this.table.keys === undefined) {
                        // nothing to do
                    }
                    else {
                        this.context.log('表[' + tblName + ']需要手动增加Primary Key');
                        changed = true;
                    }
                }
                else {
                    if (this.table.keys === undefined) {
                        this.context.log('原表[' + tblName + ']中有Primary Key，新表中没有');
                        changed = true;
                    }
                    else {
                        if (this.compareIndex(existTable.keys, this.table.keys) === false) {
                            changed = true;
                            let rebuildSucceed = yield this.rebuildIfNoData();
                            if (rebuildSucceed === true) {
                                // everything is ok, no index upgrade needed
                                ok = true;
                                return undefined;
                            }
                            else {
                                ok = false;
                                this.context.log(`错误：原表和新表[${tblName}]中的Primary Key定义不同`);
                                this.context.log('原表 Primary Key：[' + existTable.keys.map(v => v.name).join(', ') + ']');
                                this.context.log('新表 Primary Key：[' + this.table.keys.map(v => v.name).join(', ') + ']');
                            }
                        }
                    }
                }
                for (let ind of this.table.indexes) {
                    let indName = ind.name;
                    let ind1 = existTable.indexes.find(i => i.name === indName);
                    if (ind1 === undefined) {
                        try {
                            // 质疑：
                            // 2023-03-23：看不懂
                            // 如果在现存表中没有index，应该新创建。而不是下面这一句
                            // --- await this.createIdIndex();
                            //----- 以下是上面质疑的新修改
                            yield this.createIndex(ind);
                            //----- 以上是新的修改 ----
                            if (indName !== '$id_ix') {
                                this.context.log(`新表[${tblName}]中的索引${indName}已经建立`);
                                changed = true;
                            }
                        }
                        catch (err) {
                            console.error('索引创建中发生错误', err);
                        }
                    }
                }
                for (let ind of existTable.indexes) {
                    let indName = ind.name;
                    let ind1 = this.table.indexes.find(i => i.name === indName);
                    if (ind1 === undefined) {
                        yield this.dropExistIndex(ind, options.autoRemoveTableIndex);
                        changed = true;
                    }
                    else if (ind.unique !== ind1.unique) {
                        try {
                            if (ind.unique === true || options.autoRemoveTableIndex === true) {
                                yield this.dropExistIndex(ind, true);
                                yield this.createIndex(ind1);
                            }
                            else {
                                this.context.log(`表${this.table.name}索引${ind.name}需要手动修改`);
                            }
                            changed = true;
                        }
                        catch (e) {
                            this.context.log(`修改表${this.table.name}索引${ind.name}时发生错误`);
                            this.context.log(e);
                        }
                    }
                    else {
                        let { fields } = ind;
                        if (fields.length === 0) {
                            this.context.log('表[' + tblName + ']中的索引' + indName + '是自建库索引');
                        }
                        else if (this.compareIndex(fields, ind1.fields) !== true) {
                            this.context.log('表[' + tblName + ']中的索引' + indName + '发生变化，需要手动修改');
                            changed = true;
                        }
                    }
                }
                if (changed !== true) {
                    //this.context.log('表[' + tblName + ']没有变化');
                }
                //if (ok === true) await this.buildRows();
                return undefined;
            }
            catch (err) {
                let msg = '表[' + tblName + ']update时出错: ' + (0, tool_1.getErrorString)(err);
                // this.context.log(msg);
                debugger;
                return msg;
            }
        });
    }
    copyDataFrom$Site() {
        return __awaiter(this, void 0, void 0, function* () {
            const parts = this.dbName.split('.');
            if (parts[0] !== '$site')
                return;
            let dbs = (0, core_1.getDbs)();
            let exists = yield dbs.db$Site.existsDatabase();
            if (exists === false)
                return;
            const sql = `INSERT INTO \`${this.dbName}\`.\`${this.table.name}\`
    SELECT * FROM $site.\`${parts[1]}.${this.table.name}\`
`;
            try {
                yield this.runner.sql(sql, undefined);
            }
            catch (_a) {
                console.error('copy data from $site', sql);
            }
        });
    }
    updateRows(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let tblName = this.table.name;
            try {
                yield this.buildRows();
            }
            catch (err) {
                let msg = '表[' + tblName + '] add rows 时出错: ' + (0, tool_1.getErrorString)(err);
                // this.context.log(msg);
                debugger;
                return msg;
            }
        });
    }
    dropExistIndex(ind, autoRemoveTableIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            let indName = ind.name;
            let tblName = this.table.name;
            if (autoRemoveTableIndex === true) {
                yield this.dropIndex(ind);
                this.context.log('原表[' + tblName + ']中的索引' + indName + '已删除');
            }
            else {
                this.context.log('原表[' + tblName + ']中的索引' + indName + '需要手动删除');
            }
        });
    }
    compareIndex(i1, i2) {
        let len = i1.length;
        if (len !== i2.length)
            return false;
        for (let i = 0; i < len; i++) {
            if (i1[i].name !== i2[i].name)
                return false;
        }
        return true;
    }
    compareDataType(preDt, newDt) {
        let preType = preDt.type;
        let newType = newDt.type;
        if (newType === 'datatype') {
            newType = newDt.dataType.type;
        }
        switch (newType) {
            case 'enum':
                newType = 'smallint';
                break;
            case 'textid':
                newType = 'int';
                break;
        }
        if (preType === newType) {
            if (newDt.compare(preDt) === true)
                return undefined;
            return `${preType} changed`;
        }
        if (newType !== 'id') {
            return `datatype changed: pre-${preType} new-${newType}`;
        }
        let idSize = newDt.idSize;
        let idType;
        if (this.context.hasUnit === true) {
            idType = 'bigint';
        }
        else {
            switch (idSize) {
                default:
                case '':
                    idType = 'int';
                    break;
                case 'big':
                    idType = 'bigint';
                    break;
                case 'small':
                    idType = 'smallint';
                    break;
                case 'tiny':
                    idType = 'tinyint';
                    break;
            }
        }
        if (idType !== preType) {
            return `datatype changed: pre-${preType} new-${newType} ${idSize}`;
        }
        return undefined;
    }
    compareField(preField, newField) {
        if (preField.autoInc !== newField.autoInc) {
            return `auto inc changed: pre-${preField.autoInc} new-${newField.autoInc}`;
        }
        let preDt = preField.dataType, newDt = newField.dataType;
        // 处理 DataTypeDef 的比较
        let nndt = newDt.dataType;
        if (nndt !== undefined) {
            newDt = nndt;
        }
        let cdt = this.compareDataType(preDt, newDt);
        if (cdt !== undefined)
            return cdt;
        if (preDt.compare(newDt) === true)
            return;
        return `datatype param changed: pre-${JSON.stringify(preDt)} new-${JSON.stringify(newDt, (key, value) => { if (key !== 'pelement')
            return value; })}`;
    }
}
exports.TableUpdater = TableUpdater;
//# sourceMappingURL=table.js.map