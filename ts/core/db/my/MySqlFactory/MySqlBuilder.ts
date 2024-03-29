import { EnumIdType, Field, ParamSum, TableSchema } from "../../IDDefines";
// import { Builder, ISqlBuilder } from "../Builder";
import { IXIXTablesBuilder, IXrIXTablesBuilder, IXrTablesBuilder, IXTablesBuilder, TablesBuilder } from "./TablesBuilder";
import { SqlBuilder } from "../../SqlBuilder";

// 不理解，为什么当时选择\x0c作为行结尾
// 解决：MySqlBuilder生成的sql，都要经过 $exec_sql_trans来转换执行。\x0c转换为; 加上@user和@unit
export const sqlLineEnd = '\x0c\n';
export const retLn = "set @ret=CONCAT(@ret, '\\n')" + sqlLineEnd;
export const retTab = "set @ret=CONCAT(@ret, @id, '\\t')" + sqlLineEnd;

export abstract class MySqlBuilder<P> extends SqlBuilder<P> {
    /*
        protected readonly dbName: string;
        protected readonly hasUnit: boolean;
        protected readonly twProfix: string;
    */
    /*
        constructor(builder: Builder) {
            let { dbName, hasUnit, twProfix } = builder;
            this.dbName = dbName;
            this.hasUnit = false; // hasUnit; ID, IDX, IX表，都没有$unit字段，所以当hasUnit=false处理
            this.twProfix = twProfix;
        }
    */
    dbObjectName(obj: string): string {
        return `\`${this.dbName}\`.\`${this.twProfix}${obj}\``;
    }
    protected buildSumSelect(param: ParamSum): string {
        let { IDX, far, near, field } = param;
        let { name } = IDX;
        if (!far) far = 0;
        if (!near) near = Number.MAX_SAFE_INTEGER;
        let sql = 'select t.id';
        for (let f of field) {
            sql += `,${this.dbObjectName(`${name}$${f}$sum`)}(t.id,${far},${near}) as ${f}`;
        }
        sql += ` from ${this.dbObjectName(name)} as t`;
        return sql;
    }

    protected buildIXrIDX(IX: TableSchema, IDX: TableSchema[]): { cols: string; tables: string; } {
        let b = new IXrTablesBuilder(this, IX, IDX);
        b.build();
        return b;
    }

    protected buildIXrIXIDX(IX: TableSchema, IX1: TableSchema, IDX: TableSchema[]): { cols: string; tables: string; } {
        let b = new IXrIXTablesBuilder(this, IX, IX1, IDX);
        b.build();
        return b;
    }

    protected buildIXIDX(IX: TableSchema, IDX: TableSchema[]): { cols: string; tables: string; } {
        let b = new IXTablesBuilder(this, IX, IDX);
        b.build();
        return b;
    }

    protected buildIXIXIDX(IX: TableSchema, IX1: TableSchema, IDX: TableSchema[]): { cols: string; tables: string; } {
        let b = new IXIXTablesBuilder(this, IX, IX1, IDX);
        b.build();
        return b;
    }

    protected buildIDX(IDX: TableSchema[]): { cols: string; tables: string; } {
        let b = new TablesBuilder(this, IDX);
        b.build();
        return b;
    }

    protected buildInsert(ts: TableSchema, override: any, valueItem?: any): string {
        if (!ts) return '';
        let { name, schema, values } = ts;
        let { fields, owner } = schema;
        if (!override) override = {};
        let sql = 'set @row=0' + sqlLineEnd;
        let cols: string, valsInit: string, valsFirst: boolean;
        let first: boolean;
        if (this.hasUnit === true) {
            cols = '`$unit`';
            valsInit = '@unit';
            valsFirst = first = false;
        }
        else {
            cols = '';
            valsInit = '';
            valsFirst = first = true;
        }
        for (let f of fields) {
            let { name } = f;
            if (first === true) {
                first = false;
            }
            else {
                cols += ',';
            };
            cols += `\`${name}\``;
        }
        /*
        if (owner === true) {
            cols += ',`$owner`';
        }
        */
        if (valueItem !== undefined) {
            values = [valueItem];
        }
        for (let value of values) {
            sql += `insert into ${this.dbObjectName(name)}\n\t(${cols})\n\tvalues\n\t`;
            let fieldFirst = valsFirst;
            let vals = valsInit;
            for (let f of fields) {
                let { name, type } = f;
                if (fieldFirst === true) {
                    fieldFirst = false;
                }
                else {
                    vals += ',';
                };
                if (name === '$owner' && owner === true) {
                    vals += '@user';
                    continue;
                }
                let v = value[name];
                let ov = override[name];
                if (v !== undefined) {
                    vals += (type === 'textid' ? `${this.dbObjectName('$textid')}('${v}')` : `'${v}'`);
                }
                else if (ov !== undefined) {
                    vals += ov;
                }
                else {
                    vals += 'null';
                }
            }
            /*
            if (owner === true) {
                vals += ',@user';
            }
            */
            sql += `(${vals})` + sqlLineEnd;
            sql += retTab;
        }
        sql += retLn;
        return sql;
    }

    protected buildDetailSelect(ts: TableSchema, whereId: string): string {
        if (ts === undefined) return '';
        let sql = 'SELECT ';
        let first = true;
        for (let f of ts.schema.fields) {
            if (first === true) {
                first = false;
            }
            else {
                sql += ',';
            }
            let { name, type } = f;
            sql += (type === 'textid') ?
                `${this.dbObjectName('$idtext')}(\`${name}\`)`
                :
                `\`${name}\``;
        }
        sql += ` FROM ${this.dbObjectName(ts.name)} WHERE 1=1`;
        if (this.hasUnit === true) {
            sql += ' AND `$unit`=@unit'
        }
        sql += ' AND ' + whereId;
        return sql + sqlLineEnd;
    }

    /**
     * 构建 新增 ID 的sql 
     * @param ts 
     * @param withRet 
     * @param idValue 
     * @returns 
     */
    private buildSaveID(ts: TableSchema, withRet: boolean, idValue?: any): string {
        let sql = '';
        let { values, name, schema } = ts;
        if (idValue !== undefined) {
            values = [idValue];
        }
        let { keys, fields, nameNoVice, idType, isMinute: isMinuteId } = schema;
        let isMinute = (idType === EnumIdType.UMinute)
            || (idType === EnumIdType.Minute)
            || (idType === EnumIdType.MinuteId)
            || (isMinuteId === true);
        for (let value of values) {
            let { id } = value;
            if (id) {
                sql += `set @id=${id}` + sqlLineEnd;
                if (id < 0) {
                    sql += this.buildIDDelete(ts, -id);
                }
                else {
                    sql += this.buildUpdate(ts, value);
                    // 写$id(_local)表
                    if (nameNoVice !== undefined) {
                        sql += `set @$id_name=${this.dbObjectName(name + '$')}(${id})` + sqlLineEnd;
                    }
                }
            }
            else {
                sql += `set @id=${this.dbObjectName(name + '$id')}(@unit,@user,1`;  // 2022-1-27 , null 之前好像要加上这个。现在不要加。？？
                if (idType === EnumIdType.UUID) {
                    sql += ', null';
                }
                if (isMinute === true) {
                    sql += ', null';
                }
                let updateOverride = { id: '@id' };
                if (keys.length > 0) {
                    let sqlFromKey = (keyName: string, type: string, v: any) => {
                        sql += ',';
                        if (type === 'textid') {
                            sql += `${this.dbObjectName('$textid')}('${v}')`;
                        }
                        else if (keyName === 'no') {
                            sql += v ? `'${v}'` : `${this.dbObjectName('$no')}(@unit, '${name}', unix_timestamp())`;
                        }
                        else if (v === undefined) {
                            switch (type) {
                                default: sql += `@user`; break;
                                case 'timestamp': sql += `CURRENT_TIMESTAMP()`; break;
                            }
                        }
                        else if (typeof (v) === 'object') {
                            sql += this.buildValue(v);
                        }
                        else {
                            sql += `'${v}'`;
                        }
                        (updateOverride as any)[keyName] = null;
                    }
                    switch (typeof value) {
                        case 'number':
                        case 'string':
                            let { name: kn, type } = keys[0];
                            sqlFromKey(kn, type, value);
                            break;
                        case 'object':
                            for (let k of keys) {
                                let { name: kn, type } = k;
                                let v = value[kn];
                                sqlFromKey(kn, type, v);
                            }
                            break;
                    }
                }
                sql += ')' + sqlLineEnd;
                if (fields.length > keys.length + 1) {
                    sql += this.buildUpdate(ts, value, updateOverride);
                }
                // 写$id(_local)表
                if (nameNoVice !== undefined) {
                    sql += `set @$id_name=${this.dbObjectName(name + '$')}(@id)` + sqlLineEnd;
                }
                if (withRet === true) {
                    sql += retTab;
                }
            }
        }
        if (withRet === true) sql += retLn;
        return sql;
    }

    /**
     * 构建 新增？ ID的sql 
     * @param ts 
     * @param idValue 
     * @returns 
     */
    protected buildSaveIDWithRet(ts: TableSchema, idValue?: any): string {
        let sql = this.buildSaveID(ts, true, idValue);
        return sql;
    }

    protected buildSaveIDWithoutRet(ts: TableSchema, idValue?: any): string {
        let sql = this.buildSaveID(ts, false, idValue);
        return sql;
    }

    /**
     * 构建 增删改 IDX的sql 
     * @param ts 
     * @returns 
     */
    protected buildSaveIDX(ts: TableSchema): string {
        let sql = '';
        let { values } = ts;
        for (let value of values) {
            let { id } = value;
            if (id < 0) {
                sql += this.buildIDDelete(ts, -id);
            }
            else {
                sql += this.buildUpsert(ts, value);
            }

        }
        sql += retLn;
        return sql;
    }

    /**
     * 
     * @param ts 
     * @param ixValue 
     * @returns 
     */
    protected buildSaveIX(ts: TableSchema, ixValue?: any): string {
        let sql = '';
        let { values } = ts;
        if (ixValue !== undefined) {
            values = [ixValue];
        }
        for (let value of values) {
            let { $, ix, xi } = value;
            if ($ === '-') {
                sql += this.buildIXDelete(ts, ix, xi);
            }
            else if (typeof xi === 'number' && xi < 0) {
                sql += this.buildIXDelete(ts, ix, -xi);
            }
            else {
                if (ix === null) {
                    ix = '@id';
                    value.ix = ix;
                }
                else if (!ix) {
                    ix = '@user';
                    value.ix = ix;
                }
                if (xi === null) {
                    value.xi = '@id';
                }
                else if (typeof xi === 'object') {
                    value.xi = xi.value;
                }
                else {
                    value.xi = `'${xi}'`;
                }
                sql += this.buildUpsert(ts, value);
            }
        }
        sql += retLn;
        return sql;
    }

    /**
     * 构建 新增或修改 IDX的sql 
     * @param ts 
     * @param value 
     * @returns 
     */
    protected buildUpsert(ts: TableSchema, value: any): string {
        let { name: tableName, schema } = ts;
        let { keys, fields, type, hasSort } = schema;
        let cols: string, vals: string, dup = '';
        let sqlBefore: string = '';
        let sqlWriteEx: string[] = [];
        let first: boolean;
        if (this.hasUnit === true) {
            first = false;
            cols = '`$unit`';
            vals = '@unit';
        }
        else {
            first = true;
            cols = '';
            vals = '';
        }
        for (let f of fields) {
            let { name, type } = f;
            let v = value[name];
            if (v === undefined) continue;
            let act = 0;
            let val: string;
            act = value.$act;
            if (act === undefined || act === null) act = 0;
            if (v === null) {
                val = 'null';
            }
            else {
                //let time: number;
                let setAdd: string;
                if (typeof v === 'object') {
                    setAdd = v.setAdd;
                    //time = v.$time;
                    if (v.value !== undefined) {
                        v = v.value;
                    }
                    else {
                        v = this.buildValue(v);
                    }
                }

                let sum: boolean;
                let dupAdd = '';
                if (type === 'textid') {
                    val = `${this.dbObjectName('$textid')}('${v}')`;
                }
                else {
                    switch (setAdd) {
                        default:
                            if (sum === true) dupAdd = '+ifnull(`' + name + '`, 0)';
                            break;
                        case '+': dupAdd = '+ifnull(`' + name + '`, 0)'; break;
                        case '=': dupAdd = ''; break;
                    }
                    switch (type) {
                        default:
                            val = `${v}`;
                            break;
                        case 'char':
                            val = `'${sqlStringEscape(v)}'`
                            break;
                        case 'date':
                        case 'datetime':
                        case 'time':
                            val = `'${v}'`;
                            break;
                    }
                }
                switch (name) {
                    default:
                        if (dup.length > 0) dup += ',';
                        dup += '`' + name + '`=values(`' + name + '`)' + dupAdd;
                        break;
                    case 'ix':
                    case 'id':
                        break;
                }
            }
            if (first === true) {
                first = false;
            }
            else {
                cols += ',';
                vals += ',';
            }
            cols += '\`' + name + '\`';
            vals += val;
        }
        let sqlSeq: string;
        if (hasSort === true) {
            let ixValue = value['ix'];
            if (typeof ixValue === 'object') {
                ixValue = ixValue.value;
            }
            sqlSeq = `\nset @seq=ifnull((select max(seq) from ${this.dbObjectName(tableName)} where ix=${ixValue} and xi=${value['xi']}), 0)+1` + sqlLineEnd;
            cols += ',\`seq\`';
            vals += `,@seq`;
        }
        else {
            sqlSeq = '';
        }
        let ignore = '', onDup = '';
        if (dup.length > 0) {
            onDup = `\non duplicate key update ${dup}`;
        }
        else {
            ignore = ' ignore';
        }
        let sql = sqlBefore + sqlSeq +
            `insert${ignore} into ${this.dbObjectName(tableName)} (${cols})\nvalues (${vals})${onDup}` + sqlLineEnd;
        return sql + sqlWriteEx.join('');
    }

    protected buildUpdate(ts: TableSchema, value: any, override: any = {}): string {
        let { name, schema } = ts;
        let { fields } = schema;
        let sql = `update ${this.dbObjectName(name)} set `;
        let where = ' where 1=1';
        if (this.hasUnit === true) {
            where += ' and `$unit`=@unit';
        }
        let first = true;
        for (let f of fields) {
            let { name, type } = f;
            let ov = override[name];
            if (ov === null) continue;
            let v = value[name];
            switch (name) {
                default:
                    if (first === true) {
                        first = false;
                    }
                    else {
                        sql += ',';
                    }
                    sql += '\`' + name + '\`=';
                    if (ov !== undefined)
                        v = ov;
                    else if (v === undefined) {
                        v = 'null';
                    }
                    else {
                        if (type === 'textid') {
                            v = `${this.dbObjectName('$textid')}('${v}')`;
                        }
                        else if (typeof v === 'string') {
                            v = this.buildValue(v);
                        }
                    }
                    sql += v;
                    break;
                case 'ix':
                    where += ' and ix=' + (ov ?? v);
                    break;
                case 'id':
                    where += ' and id=' + (ov ?? v);
                    break;
            }
        }
        return sql + where + sqlLineEnd;
    }

    protected buildIXDelete(ts: TableSchema, ix: number, xi: number): string {
        let { name, schema } = ts;
        let sql = '';
        sql += `delete from ${this.dbObjectName(name)} where ix=`;
        if (typeof ix === 'object') {
            sql += (ix as any).value;
        }
        else if (!ix) {
            sql += '@user';
        }
        else {
            sql += ix;
        }
        if (xi) {
            sql += ' AND xi=';
            sql += xi;
        }
        if (this.hasUnit === true) sql += ' AND `$unit`=@unit';
        sql += sqlLineEnd;
        return sql;
    }

    protected buildIDDelete(ts: TableSchema, id: number): string {
        let { name, schema } = ts;
        let sql = '';
        if (id) {
            if (id < 0) id = -id;
            sql += `delete from ${this.dbObjectName(name)} where id=${id}`;
            if (id) {
                sql += ' AND id=';
                sql += id;
            }
        }
        sql += sqlLineEnd;
        return sql;
    }

    protected buildOrder(order: string): 'asc' | 'desc' {
        if (!order) order = 'asc';
        else order = order.toLowerCase() as any;
        switch (order) {
            default: order = 'asc'; break;
            case 'asc': break;
            case 'desc': break;
        }
        return order as any;
    }

    protected buildValue(val: any) {
        if (typeof val !== 'object') return `'${sqlStringEscape(val)}'`;
        let ret = '';
        let { ID } = val;
        if (ID === undefined) throw Error('ID needed in ACTS ID field');
        let { name, schema } = ID;
        let { keys } = schema;
        ret += ` ${this.dbObjectName(name + '$id')}(@unit,@user, 1`;
        for (let key of keys) {
            let v = val[key.name];
            if (typeof v === 'number')
                ret += ',' + v;
            else
                ret += `,'${sqlStringEscape(v)}'`;
        }
        ret += ') ';
        return ret;
    }
}

const esc = /\\|\'/;
const chars = '\\\'';
const cSplash = chars.charCodeAt(0);
const cQuote = chars.charCodeAt(1);
function sqlStringEscape(s: string): string {
    if (s.search(esc) < 0) return s;
    let ret = '';
    let len = s.length;
    let p = 0;
    for (let i = 0; i < len; i++) {
        let c = s.charCodeAt(i);
        if (c === cSplash) {
            ret += s.substring(p, i) + '\\\\';
            p = i + 1;
        }
        else if (c === cQuote) {
            ret += s.substring(p, i) + '\\\'';
            p = i + 1;
        }
    }
    return ret + s.substring(p);
}
