import { CompileOptions, DbContext, ObjSchema } from '../dbContext';
import * as il from '../../il';
import { SqlBuilder } from './sqlBuilder';
import { DataType, Index, IdDataType, StringType, FieldsValues, Field, DataTypeDef } from '../../il';
// import { UqBuildApi } from '../../../core';
// import { CompileOptions } from '../../../compile';
import { ExpVal } from './exp';
import { EntityRunner } from '../../../core';
import { getErrorString } from '../../../tool';


export interface TableFieldsValues {
    fields: Field[];
    fieldsInit: Field[];
    values: (ExpVal[])[];
}

export abstract class Table implements ObjSchema {
    protected tab = 0;
    readonly dbName: string;
    readonly name: string;
    hasUnit: boolean = true;
    isMinuteId: boolean = false;    // ID id is defined as minute
    id: il.Field;
    idKeys: il.Field[];             // ID Entity 里面定义的key
    autoIncId: il.Field;
    fields: il.Field[];

    keys: il.Field[];               // 建表时的key，可能是id，也可能是定义的keys
    indexes: il.Index[] = [];
    fieldsValuesList: TableFieldsValues[];

    constructor(dbName: string, tblName: string) {
        this.dbName = dbName;
        this.name = tblName;
    }

    buildIdIndex(): void {
        let keysLen = this.keys.length;
        if (this.autoIncId !== undefined &&
            (keysLen > 1 || keysLen === 1 && this.hasUnit === true)) {
            //sb.comma().n().tab(tab);
            let autoIdIndex = new Index('$id_ix', true);
            autoIdIndex.global = true;
            autoIdIndex.fields = [this.autoIncId];
            this.indexes.push(autoIdIndex);
        }
    }

    isKey(field: il.Field): boolean {
        return this.keys !== undefined && this.keys.find(k => k === field) !== undefined;
    }

    update(sb: SqlBuilder) {
        this.start(sb);
        let first: boolean = true;
        let tab = this.tab + 1;
        let unit = sb.unit;
        let hasUnit = this.hasUnit === true && unit !== undefined;
        if (hasUnit === true) {
            first = false;
            sb.tab(tab);
            this.field(sb, unit);
        }
        for (let f of this.fields) {
            if (f === undefined) continue;
            if (first === true) first = false;
            else sb.comma().n();
            sb.tab(tab);
            this.field(sb, f);
        }
        if (this.keys !== undefined && this.keys.length > 0) {
            if (first === true) first = false;
            else sb.comma().n();
            sb.tab(tab);
            this.primaryKey(sb, this.keys);
        }
        else {
            debugger;
            throw 'every table should define keys'
        }
        if (this.indexes !== undefined) {
            for (let index of this.indexes) {
                if (index.fields.length === 0) continue;
                if (first as any === true) first = false;
                else sb.comma().n();
                sb.tab(tab);
                this.index(sb, index);
            }
        }
        sb.n();
        this.end(sb);
    }
    async updateDb(context: DbContext, runner: EntityRunner, options: CompileOptions): Promise<string> {
        let updater = this.createUpdater(context, runner);
        return await updater.updateDb(options);
    }
    async updateRows(context: DbContext, runner: EntityRunner, options: CompileOptions): Promise<string> {
        let updater = this.createUpdater(context, runner);
        return await updater.updateRows(options);
    }
    protected abstract createUpdater(context: DbContext, runner: EntityRunner): TableUpdater;
    protected abstract start(sb: SqlBuilder): void;
    protected abstract end(sb: SqlBuilder): void;
    protected abstract field(sb: SqlBuilder, field: il.Field): void;
    protected abstract primaryKey(sb: SqlBuilder, keys: il.Field[]): void;
    protected abstract index(sb: SqlBuilder, index: il.Index): void;
}

export abstract class TableUpdater {
    protected context: DbContext;
    protected runner: EntityRunner;
    protected table: Table;
    protected field$valid: Field;
    constructor(context: DbContext, runner: EntityRunner, table: Table) {
        this.context = context;
        this.runner = runner;
        this.table = table;
        // 原来的 ID IX 只有 const 才能有初始值。现在都可以定义初值。
        // const 有 $valid 字段，为了在生成存储过程的时候区别，在这里取值
        this.field$valid = table.fields.find(v => v?.name === '$valid');
    }

    async updateDb(options: CompileOptions): Promise<string> {
        let tblName = this.table.name;
        try {
            let existTable = await this.loadExistTable();
            if (existTable === undefined) {
                await this.createTable();
                this.context.log('TABLE [' + tblName + '] created');
                //await this.buildRows();
                return undefined;
            }
            if (existTable.hasUnit !== this.table.hasUnit) {
                let rebuildSucceed = await this.rebuildIfNoData();
                if (rebuildSucceed === false) {
                    if (existTable.hasUnit === true) {
                        //let msg = `表[${tblName}]需要手动处理：原表${existTable.hasUnit === false ? '没' : ''}有$unit字段，新表${this.table.hasUnit === false ? '没' : ''}有$unit字段`;
                        let msg = `表[${tblName}]需要手动处理：原表有$unit字段，新表'没'有$unit字段`;
                        return msg;
                    }
                    else {
                        await this.addColumn(this.context.unitField);
                    }
                }
                existTable = await this.loadExistTable();
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
                        await this.alterField(fld);
                        //ok = false;
                    }
                }
            }
            let charBinaryFields: il.Field[] = [];
            for (let field of this.table.fields) {
                if (field === undefined) continue;
                let dt = field.dataType;
                if (dt.isString === true) {
                    if ((dt as StringType).binary === true) charBinaryFields.push(field);
                }
                let fn = field.name.toLowerCase();
                let fld = existTable.fields.find(f => f !== undefined && f.name.toLowerCase() === fn);
                if (fld === undefined) {
                    await this.addColumn(field);
                    this.context.log('表[' + tblName + ']已自动添加字段' + fn);
                    changed = true;
                    continue;
                }
                if (fld.autoInc !== field.autoInc) {
                    await this.alterField(field);
                    this.context.log(`表[${tblName}]已改为${field.autoInc === true ? '' : '非'}自增`);
                }
                let dtOld = fld.dataType;
                let cdt = this.compareDataType(dtOld, dt);
                if (cdt !== undefined) {
                    try {
                        this.context.log(cdt);
                        await this.alterField(field);
                        this.context.log('表[' + tblName + ']字段' + fn + '类型已改为' + dt.type);
                    }
                    catch (err) {
                        this.context.log('表[' + tblName + ']字段' + fn + '修改类型时错误');
                        this.context.log(err);
                    }
                }
                if (field.isDefaultEqu(fld.defaultValue) === false) {
                    try {
                        await this.alterField(field);
                        this.context.log('表[' + tblName + ']字段' + fn + '默认值已改为' + field.defaultValue);
                    }
                    catch (err) {
                        this.context.log('表[' + tblName + ']字段' + fn + '修改默认值时错误');
                        this.context.log(err);
                    }
                }
            }

            for (let field of charBinaryFields) {
                await this.alterToBinary(field);
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
                        let rebuildSucceed = await this.rebuildIfNoData();
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
                        await this.createIndex(ind);
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
                    await this.dropExistIndex(ind, options.autoRemoveTableIndex);
                    changed = true;
                }
                else if (ind.unique !== ind1.unique) {
                    try {
                        if (ind.unique === true || options.autoRemoveTableIndex === true) {
                            await this.dropExistIndex(ind, true);
                            await this.createIndex(ind1);
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
            getErrorString
            let msg = '表[' + tblName + ']update时出错: ' + getErrorString(err);
            // this.context.log(msg);
            debugger;
            return msg;
        }
    }

    async updateRows(options: CompileOptions): Promise<string> {
        let tblName = this.table.name;
        try {
            await this.buildRows();
        }
        catch (err) {
            let msg = '表[' + tblName + '] add rows 时出错: ' + getErrorString(err);
            // this.context.log(msg);
            debugger;
            return msg;
        }
    }

    private async dropExistIndex(ind: il.Index, autoRemoveTableIndex: boolean): Promise<void> {
        let indName = ind.name;
        let tblName = this.table.name;
        if (autoRemoveTableIndex === true) {
            await this.dropIndex(ind);
            this.context.log('原表[' + tblName + ']中的索引' + indName + '已删除');
        }
        else {
            this.context.log('原表[' + tblName + ']中的索引' + indName + '需要手动删除');
        }
    }

    protected abstract rebuildIfNoData(): Promise<boolean>;

    private compareIndex(i1: il.Field[], i2: il.Field[]) {
        let len = i1.length;
        if (len !== i2.length) return false;
        for (let i = 0; i < len; i++) {
            if (i1[i].name !== i2[i].name) return false;
        }
        return true;
    }

    private compareDataType(preDt: DataType, newDt: DataType): string {
        let preType = preDt.type;
        let newType = newDt.type;
        if (newType === 'datatype') {
            newType = (newDt as DataTypeDef).dataType.type;
        }
        switch (newType) {
            case 'enum': newType = 'smallint'; break;
            case 'textid': newType = 'int'; break;
        }
        if (preType === newType) {
            if (newDt.compare(preDt) === true) return undefined;
            return `${preType} changed`;
        }
        if (newType !== 'id') {
            return `datatype changed: pre-${preType} new-${newType}`;
        }
        let idSize = (newDt as IdDataType).idSize;
        let idType: string;
        if (this.context.hasUnit === true) {
            idType = 'bigint';
        }
        else {
            switch (idSize) {
                default:
                case '': idType = 'int'; break;
                case 'big': idType = 'bigint'; break;
                case 'small': idType = 'smallint'; break;
                case 'tiny': idType = 'tinyint'; break;
            }
        }
        if (idType !== preType) {
            return `datatype changed: pre-${preType} new-${newType} ${idSize}`;
        }
        return undefined;
    }

    private compareField(preField: il.Field, newField: il.Field): string {
        if (preField.autoInc !== newField.autoInc) {
            return `auto inc changed: pre-${preField.autoInc} new-${newField.autoInc}`;
        }
        let preDt = preField.dataType, newDt = newField.dataType;
        // 处理 DataTypeDef 的比较
        let nndt = (newDt as any).dataType;
        if (nndt !== undefined) {
            newDt = nndt;
        }
        let cdt = this.compareDataType(preDt, newDt);
        if (cdt !== undefined) return cdt;
        if (preDt.compare(newDt) === true) return;
        return `datatype param changed: pre-${JSON.stringify(preDt)} new-${JSON.stringify(newDt, (key, value) => { if (key !== 'pelement') return value; })}`;
    }

    protected abstract loadExistTable(): Promise<Table>;
    protected abstract addColumn(field: il.Field): Promise<void>;
    protected abstract alterToBinary(field: il.Field): Promise<void>;
    protected abstract createTable(): Promise<void>;
    protected abstract dropColumn(field: il.Field): Promise<void>;
    protected abstract dropIndex(ind: il.Index): Promise<void>;
    protected abstract createIdIndex(): Promise<void>;
    protected abstract createIndex(ind: il.Index): Promise<void>;
    protected abstract alterField(field: il.Field): Promise<void>;
    protected abstract buildRows(): Promise<void>;
}
