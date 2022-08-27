"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlBuilder = exports.retTab = exports.retLn = exports.sqlLineEnd = void 0;
const dbCaller_1 = require("../../dbCaller");
const tablesBuilder_1 = require("./tablesBuilder");
exports.sqlLineEnd = '\x0c\n';
exports.retLn = "set @ret=CONCAT(@ret, '\\n')" + exports.sqlLineEnd;
exports.retTab = "set @ret=CONCAT(@ret, @id, '\\t')" + exports.sqlLineEnd;
class MySqlBuilder {
    constructor(builder) {
        let { dbName, hasUnit } = builder;
        this.dbName = dbName;
        this.hasUnit = false; // hasUnit; ID, IDX, IX表，都没有$unit字段，所以当hasUnit=false处理
    }
    buildCall() {
        return;
    }
    buildSumSelect(param) {
        let { IDX, far, near, field } = param;
        let { name } = IDX;
        if (!far)
            far = 0;
        if (!near)
            near = Number.MAX_SAFE_INTEGER;
        let sql = 'select t.id';
        for (let f of field) {
            sql += `,\`tv_${name}$${f}$sum\`(t.id,${far},${near}) as ${f}`;
        }
        sql += ` from \`tv_${name}\` as t`;
        return sql;
    }
    buildIXrIDX(IX, IDX) {
        let b = new tablesBuilder_1.IXrTablesBuilder(this.dbName, IX, IDX);
        b.build();
        return b;
    }
    buildIXrIXIDX(IX, IX1, IDX) {
        let b = new tablesBuilder_1.IXrIXTablesBuilder(this.dbName, IX, IX1, IDX);
        b.build();
        return b;
    }
    buildIXIDX(IX, IDX) {
        let b = new tablesBuilder_1.IXTablesBuilder(this.dbName, IX, IDX);
        b.build();
        return b;
    }
    buildIXIXIDX(IX, IX1, IDX) {
        let b = new tablesBuilder_1.IXIXTablesBuilder(this.dbName, IX, IX1, IDX);
        b.build();
        return b;
    }
    buildIDX(IDX) {
        let b = new tablesBuilder_1.TablesBuilder(this.dbName, IDX);
        b.build();
        return b;
    }
    buildInsert(ts, override, valueItem) {
        if (!ts)
            return '';
        let { name, schema, values } = ts;
        let { fields, owner } = schema;
        if (!override)
            override = {};
        let sql = 'set @row=0' + exports.sqlLineEnd;
        let cols, valsInit, valsFirst;
        let first;
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
            }
            ;
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
            sql += `insert into \`tv_${name}\`\n\t(${cols})\n\tvalues\n\t`;
            let fieldFirst = valsFirst;
            let vals = valsInit;
            for (let f of fields) {
                let { name, type } = f;
                if (fieldFirst === true) {
                    fieldFirst = false;
                }
                else {
                    vals += ',';
                }
                ;
                if (name === '$owner' && owner === true) {
                    vals += '@user';
                    continue;
                }
                let v = value[name];
                let ov = override[name];
                if (v !== undefined) {
                    vals += (type === 'textid' ? `tv_$textid('${v}')` : `'${v}'`);
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
            sql += `(${vals})` + exports.sqlLineEnd;
            sql += exports.retTab;
        }
        sql += exports.retLn;
        return sql;
    }
    buildDetailSelect(ts, whereId) {
        if (ts === undefined)
            return '';
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
                `tv_$idtext(\`${name}\`)`
                :
                    `\`${name}\``;
        }
        sql += ' FROM `tv_' + ts.name + '` WHERE 1=1';
        if (this.hasUnit === true) {
            sql += ' AND `$unit`=@unit';
        }
        sql += ' AND ' + whereId;
        return sql + exports.sqlLineEnd;
    }
    buildSaveID(ts, withRet, idValue) {
        let sql = '';
        let { values, name, schema } = ts;
        if (idValue !== undefined) {
            values = [idValue];
        }
        let { keys, fields, nameNoVice, idType, isMinute: isMinuteId } = schema;
        let isMinute = (idType === dbCaller_1.EnumIdType.UMinute)
            || (idType === dbCaller_1.EnumIdType.Minute)
            || (idType === dbCaller_1.EnumIdType.MinuteId)
            || (isMinuteId === true);
        for (let value of values) {
            let { id } = value;
            if (id) {
                sql += `set @id=${id}` + exports.sqlLineEnd;
                if (id < 0) {
                    sql += this.buildIDDelete(ts, -id);
                }
                else {
                    sql += this.buildUpdate(ts, value);
                    // 写tv_$id(_local)表
                    if (nameNoVice !== undefined) {
                        sql += `set @$id_name=\`tv_${name}$\`(${id})` + exports.sqlLineEnd;
                    }
                }
            }
            else {
                sql += `set @id=\`tv_${name}$id\`(@unit,@user,1`; // 2022-1-27 , null 之前好像要加上这个。现在不要加。？？
                if (idType === dbCaller_1.EnumIdType.UUID) {
                    sql += ', null';
                }
                if (isMinute === true) {
                    sql += ', null';
                }
                let updateOverride = { id: '@id' };
                if (keys.length > 0) {
                    let sqlFromKey = (keyName, type, v) => {
                        sql += ',';
                        if (type === 'textid') {
                            sql += `tv_$textid('${v}')`;
                        }
                        else if (keyName === 'no') {
                            sql += v ? `'${v}'` : `tv_$no(@unit, '${name}', unix_timestamp())`;
                        }
                        else if (v === undefined) {
                            switch (type) {
                                default:
                                    sql += `@user`;
                                    break;
                                case 'timestamp':
                                    sql += `CURRENT_TIMESTAMP()`;
                                    break;
                            }
                        }
                        else if (typeof (v) === 'object') {
                            sql += this.buildValue(v);
                        }
                        else {
                            sql += `'${v}'`;
                        }
                        updateOverride[keyName] = null;
                    };
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
                sql += ')' + exports.sqlLineEnd;
                if (fields.length > keys.length + 1) {
                    sql += this.buildUpdate(ts, value, updateOverride);
                }
                // 写tv_$id(_local)表
                if (nameNoVice !== undefined) {
                    sql += `set @$id_name=\`tv_${name}$\`(@id)` + exports.sqlLineEnd;
                }
                if (withRet === true) {
                    sql += exports.retTab;
                }
            }
        }
        if (withRet === true)
            sql += exports.retLn;
        return sql;
    }
    buildSaveIDWithRet(ts, idValue) {
        let sql = this.buildSaveID(ts, true, idValue);
        return sql;
    }
    buildSaveIDWithoutRet(ts, idValue) {
        let sql = this.buildSaveID(ts, false, idValue);
        return sql;
    }
    buildSaveIDX(ts) {
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
        sql += exports.retLn;
        return sql;
    }
    buildSaveIX(ts, ixValue) {
        let sql = '';
        let { values } = ts;
        if (ixValue !== undefined) {
            values = [ixValue];
        }
        for (let value of values) {
            let { ix, xi } = value;
            if (typeof xi === 'number' && xi < 0) {
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
        sql += exports.retLn;
        return sql;
    }
    buildUpsert(ts, value) {
        let { name: tableName, schema } = ts;
        let { keys, fields, type, hasSort } = schema;
        let cols, vals, dup = '';
        let sqlBefore = '';
        let sqlWriteEx = [];
        let first;
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
            if (v === undefined)
                continue;
            let act = 0;
            let val;
            act = value.$act;
            if (act === undefined || act === null)
                act = 0;
            if (v === null) {
                val = 'null';
            }
            else {
                //let time: number;
                let setAdd;
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
                let sum;
                let dupAdd = '';
                if (type === 'textid') {
                    val = `tv_$textid('${v}')`;
                }
                else {
                    switch (setAdd) {
                        default:
                            if (sum === true)
                                dupAdd = '+ifnull(`' + name + '`, 0)';
                            break;
                        case '+':
                            dupAdd = '+ifnull(`' + name + '`, 0)';
                            break;
                        case '=':
                            dupAdd = '';
                            break;
                    }
                    //if (time === undefined) {
                    //	val = `${v}`;
                    //}
                    //else {
                    switch (type) {
                        default:
                            val = `${v}`;
                            break;
                        case 'date':
                        case 'datetime':
                        case 'time':
                            val = `'${v}'`;
                            break;
                    }
                    //}
                }
                switch (name) {
                    default:
                        if (dup.length > 0)
                            dup += ',';
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
        let sqlSeq;
        if (hasSort === true) {
            sqlSeq = `\nset @seq=ifnull((select max(seq) from \`tv_${tableName}\` where ix=${value['ix']} and xi=${value['xi']}), 0)+1` + exports.sqlLineEnd;
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
            `insert${ignore} into \`tv_${tableName}\` (${cols})\nvalues (${vals})${onDup}` + exports.sqlLineEnd;
        return sql + sqlWriteEx.join('');
    }
    buildUpdate(ts, value, override = {}) {
        let { name, schema } = ts;
        let { fields } = schema;
        let sql = 'update `tv_' + name + '` set ';
        let where = ' where 1=1';
        if (this.hasUnit === true) {
            where += ' and `$unit`=@unit';
        }
        let first = true;
        for (let f of fields) {
            let { name, type } = f;
            let ov = override[name];
            if (ov === null)
                continue;
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
                        v = (type === 'textid' ? `tv_$textid('${v}')` : this.buildValue(v));
                    }
                    sql += v;
                    break;
                case 'ix':
                    where += ' and ix=' + (ov !== null && ov !== void 0 ? ov : v);
                    break;
                case 'id':
                    where += ' and id=' + (ov !== null && ov !== void 0 ? ov : v);
                    break;
            }
        }
        return sql + where + exports.sqlLineEnd;
    }
    buildIXDelete(ts, ix, xi) {
        let { name, schema } = ts;
        let sql = '';
        sql += 'delete from `tv_' + name + '` where ix=';
        if (typeof ix === 'object') {
            sql += ix.value;
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
        if (this.hasUnit === true)
            sql += ' AND `$unit`=@unit';
        sql += exports.sqlLineEnd;
        return sql;
    }
    buildIDDelete(ts, id) {
        let { name, schema } = ts;
        let sql = '';
        if (id) {
            if (id < 0)
                id = -id;
            sql += 'delete from `tv_' + name + '` where id=' + id;
            if (id) {
                sql += ' AND id=';
                sql += id;
            }
        }
        sql += exports.sqlLineEnd;
        return sql;
    }
    buildOrder(order) {
        if (!order)
            order = 'asc';
        else
            order = order.toLowerCase();
        switch (order) {
            default:
                order = 'asc';
                break;
            case 'asc': break;
            case 'desc': break;
        }
        return order;
    }
    buildValue(val) {
        if (typeof val !== 'object')
            return `'${val}'`;
        let ret = '';
        let { ID } = val;
        if (ID === undefined)
            throw Error('ID needed in ACTS ID field');
        let { name, schema } = ID;
        let { keys } = schema;
        ret += ` tv_${name}$id(@unit,@user, 1`;
        for (let key of keys) {
            let v = val[key.name];
            if (typeof v === 'number')
                ret += ',' + v;
            else
                ret += `,'${v}'`;
        }
        ret += ') ';
        return ret;
    }
}
exports.MySqlBuilder = MySqlBuilder;
//# sourceMappingURL=mySqlBuilder.js.map