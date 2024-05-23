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
exports.TableUpdater = exports.MyTable = void 0;
const table_1 = require("../table");
const il = require("../../../il");
const lodash_1 = require("lodash");
class MyTable extends table_1.Table {
    createUpdater(context, runner) {
        return new TableUpdater(context, runner, this);
    }
    start(sb) {
        sb.tab(this.tab)
            .append('CREATE TABLE `').append(this.dbName).append('`.')
            .entityTable(this.name).space().l().n();
    }
    end(sb) {
        sb.tab(this.tab).r().semicolon();
    }
    field(sb, field) {
        if (field === undefined)
            return;
        let { name, defaultValue, nullable, autoInc, dataType } = field;
        let { type } = dataType;
        sb.fld(name).space();
        dataType.sql(sb);
        if (this.isKey(field) === true) {
            nullable = false;
        }
        sb.appendIf(nullable === false, ' NOT')
            .append(' NULL')
            .appendIf(autoInc === true, ' AUTO_INCREMENT');
        if (type === 'text')
            return;
        if (defaultValue !== undefined) {
            appendDefault(sb, defaultValue);
            return;
        }
        if (nullable === true) {
            sb.append(' DEFAULT NULL');
            return;
        }
    }
    primaryKey(sb, keys) {
        sb.append('PRIMARY KEY (');
        let len = keys.length;
        let unit = sb.unit;
        let hasUnit = this.hasUnit === true && unit !== undefined;
        if (hasUnit) {
            sb.fld(unit.name).comma().space();
        }
        sb.fld(keys[0].name);
        for (let i = 1; i < len; i++) {
            sb.comma().space().fld(keys[i].name);
        }
        sb.r();
    }
    index(sb, index) {
        let { name, unique, fields, global } = index;
        if (unique === true)
            sb.append('UNIQUE ');
        sb.append('INDEX ').fld(name).space().l();
        if (global !== true && this.hasUnit === true) {
            let sbUnit = sb.unit;
            if (sbUnit !== undefined)
                sb.fld(sbUnit.name).comma().space();
        }
        let len = fields.length;
        sb.fld(fields[0].name);
        for (let i = 1; i < len; i++) {
            sb.comma().space().fld(fields[i].name);
        }
        sb.r();
    }
}
exports.MyTable = MyTable;
const sqlGetColumns = `
select
    COLUMN_NAME as name,
    DATA_TYPE as type, 
    IS_NULLABLE as nullable,  
    ORDINAL_POSITION as ordinal,  
    COLUMN_DEFAULT as def, 
    CHARACTER_MAXIMUM_LENGTH as size, 
    NUMERIC_PRECISION as prec, 
    NUMERIC_SCALE as scale, 
    DATETIME_PRECISION as datePrec, 
    EXTRA as extra
    from information_schema.columns where table_schema=? and table_name=?;
`;
const sqlGetIndexes = `
select 
    INDEX_NAME as iName, 
    NON_UNIQUE as notUni, 
    SEQ_IN_INDEX as ordinal, 
    COLUMN_NAME as name 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = ? and TABLE_NAME=? ORDER BY iName, ordinal;
`;
function sqlTableHasRows(db, tbl) {
    return `SELECT count(*) as c FROM \`${db}\`.\`${tbl}\` LIMIT 1`;
}
function appendDefault(sb, def) {
    sb.append(' DEFAULT ');
    if ((0, lodash_1.isArray)(def) === true) {
        sb.append(def.join(' '));
    }
    else { //if (typeof def === 'string') {
        //sb.append('\'').append(def).append('\'');
        //}
        //else {
        sb.append(def);
    }
}
class TableUpdater extends table_1.TableUpdater {
    createTable() {
        return __awaiter(this, void 0, void 0, function* () {
            let sb = this.createSqlBuilder();
            this.table.update(sb);
            let sql = sb.sql;
            yield this.runner.sql(sql, undefined);
        });
    }
    getDbTableName() {
        return this.context.twProfix + this.table.name;
    }
    loadExistTable() {
        return __awaiter(this, void 0, void 0, function* () {
            let { dbName } = this.context;
            let unitName = '$unit';
            let tblName = this.table.name;
            let dbTableName = this.getDbTableName();
            let rows = yield this.runner.sql(sqlGetColumns, [dbName, dbTableName]);
            if (rows.length === 0)
                return;
            let dbTable = this.context.createTable(tblName);
            let tableHasUnit = false;
            dbTable.fields = [];
            for (let row of rows) {
                let f = this.fieldFromRow(row);
                if (f.name !== unitName) {
                    dbTable.fields.push(f);
                }
                else {
                    tableHasUnit = true;
                }
            }
            dbTable.hasUnit = tableHasUnit;
            rows = yield this.runner.sql(sqlGetIndexes, [dbName, dbTableName]);
            let index;
            for (let row of rows) {
                let { name, iName, notUni } = row;
                name = name.toLowerCase();
                iName = iName.toLowerCase();
                if (index === undefined) {
                    index = new il.Index(iName, notUni === 0);
                }
                else if (iName !== index.name) {
                    this.saveIndex(dbTable, index);
                    index = new il.Index(iName, notUni === 0);
                }
                if (name !== unitName) {
                    let f = dbTable.fields.find(v => v.name === name);
                    index.fields.push(f);
                }
            }
            this.saveIndex(dbTable, index);
            return dbTable;
        });
    }
    buildAddColumnSql(field) {
        return this.buildColumnSql(field, 'ADD');
    }
    buildColumnSql(field, action) {
        let { name, nullable, autoInc, dataType, defaultValue } = field;
        let { type } = dataType;
        if (this.table.isKey(field) === true) {
            nullable = false;
        }
        let sb = this.createSqlBuilder();
        sb.append('ALTER TABLE ')
            .fld(this.context.dbName).dot().entityTable(this.table.name)
            .space()
            .append(action)
            .space();
        sb.fld(name).space();
        dataType.sql(sb);
        let def;
        if (nullable === false) {
            sb.append(' NOT NULL');
            if (autoInc === true) {
                sb.append(' AUTO_INCREMENT');
            }
        }
        else {
            sb.append(' NULL');
        }
        if (type === 'text') {
            return sb.sql;
        }
        if (defaultValue !== undefined) {
            def = defaultValue;
        }
        if (def == undefined || def === '\'\'' || def === '') {
            sb.ln();
            let sql = sb.sql;
            sb = this.createSqlBuilder();
            sb.append('ALTER TABLE ')
                .fld(this.context.dbName).dot().entityTable(this.table.name)
                .append('ALTER COLUMN ')
                .fld(name);
            if (nullable === false) {
                sb.append(' DROP DEFAULT');
            }
            else {
                sb.append(' SET DEFAULT NULL');
            }
            sb.ln();
            return [sql, sb.sql];
        }
        else {
            appendDefault(sb, def);
            sb.ln();
            return sb.sql;
        }
    }
    buildAlterToBinarySql(field) {
        let sb = this.createSqlBuilder();
        sb.append('ALTER TABLE ')
            .fld(this.context.dbName).dot().entityTable(this.table.name)
            .space()
            .append('MODIFY')
            .space();
        sb.fld(field.name).space();
        field.dataType.sql(sb);
        sb.append(' BINARY;');
        return sb.sql;
    }
    addColumn(field) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.buildAddColumnSql(field);
            yield this.runner.sql(sql, []);
        });
    }
    alterToBinary(field) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.buildAlterToBinarySql(field);
            yield this.runner.sql(sql, []);
        });
    }
    saveIndex(dbTable, index) {
        if (index.name === 'primary')
            dbTable.keys = index.fields;
        else
            dbTable.indexes.push(index);
    }
    rebuildIfNoData() {
        return __awaiter(this, void 0, void 0, function* () {
            let dbTableName = this.getDbTableName();
            let sql = sqlTableHasRows(this.runner.dbName, dbTableName);
            let ret = yield this.runner.sql(sql, []);
            if (ret.length === 0)
                return false;
            if (ret[0].c > 0)
                return false;
            yield this.runner.sql(`DROP TABLE IF EXISTS \`${this.runner.dbName}\`.\`${dbTableName}\`;`, []);
            yield this.createTable();
            return true;
        });
    }
    fieldFromRow(row) {
        let field = new il.Field();
        let { name, type, nullable, extra, def, prec, scale, size, datePrec } = row;
        field.name = name.toLowerCase();
        let dt;
        switch (type) {
            default:
                dt = new il.UnkownType(type);
                debugger;
                break;
            case 'tinytext':
                dt = new il.Text();
                dt.size = 'tiny';
                break;
            case 'text':
                dt = new il.Text();
                break;
            case 'mediumtext':
                dt = new il.Text();
                dt.size = 'medium';
                break;
            case 'bigtext':
                dt = new il.Text();
                dt.size = 'big';
                break;
            case 'tinyint':
                dt = new il.TinyInt();
                break;
            case 'smallint':
                dt = new il.SmallInt();
                break;
            case 'int':
                dt = new il.Int();
                break;
            case 'bigint':
                dt = new il.BigInt();
                break;
            case 'decimal':
                dt = new il.Dec(prec, scale);
                break;
            case 'float':
                dt = new il.Float();
                break;
            case 'double':
                dt = new il.Double();
                break;
            case 'date':
                dt = new il.DDate();
                break;
            case 'time':
                dt = new il.Time();
                break;
            case 'datetime':
                dt = new il.DateTime(datePrec);
                break;
            case 'text':
                dt = new il.Text();
                break;
            case 'varchar':
                dt = new il.Char(size);
                break;
            case 'timestamp':
                dt = new il.TimeStamp();
                break;
            case 'varbinary':
                dt = new il.Bin(size);
                break;
        }
        field.dataType = dt;
        field.nullable = nullable === 'YES';
        field.autoInc = extra === 'auto_increment';
        field.defaultValue = def;
        if (type === 'timestamp') {
            if (field.defaultValue) {
                if (extra) {
                    field.defaultValue += ' ' + extra;
                }
            }
            else {
                field.defaultValue = extra;
                if (!field.defaultValue)
                    field.defaultValue = 'null';
            }
        }
        return field;
    }
    dropColumn(field) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runSql(this.buildDropColumnSql(field));
        });
    }
    dropIndex(ind) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runSql(this.buildDropIndexSql(ind));
        });
    }
    createIdIndex() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runSql(this.buildCreateIdIndex());
        });
    }
    createIndex(ind) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ind.fields.length === 0)
                return;
            yield this.runSql(this.buildCreateIndex(ind));
        });
    }
    runSql(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runner.sql(sql, []);
        });
    }
    buildDropColumnSql(field) {
        let { dbName, twProfix } = this.context;
        return `ALTER TABLE \`${dbName}\`.\`${twProfix}${this.table.name}\` DROP COLUMN \`${field.name}\``;
    }
    buildDropIndexSql(ind) {
        let { dbName, twProfix } = this.context;
        return `ALTER TABLE \`${dbName}\`.\`${twProfix}${this.table.name}\` DROP INDEX \`${ind.name}\``;
    }
    buildCreateIdIndex() {
        let { dbName, twProfix } = this.context;
        return `ALTER TABLE \`${dbName}\`.\`${twProfix}${this.table.name}\` ADD UNIQUE INDEX \`$id_ix\` (\`id\`)`;
    }
    buildCreateIndex(ind) {
        let { name, fields, unique, global } = ind;
        let sb = this.createSqlBuilder();
        sb.append('ALTER TABLE ')
            .fld(this.context.dbName).dot().entityTable(this.table.name);
        sb.append(' ADD');
        if (unique === true) {
            sb.append(' UNIQUE');
        }
        sb.append(' INDEX ').fld(name).space().l();
        if (global !== true && this.context.hasUnit === true && this.table.hasUnit === true) {
            sb.fld('$unit').comma();
        }
        sb.fld(fields[0].name);
        for (let i = 1; i < fields.length; i++) {
            sb.comma().fld(fields[i].name);
        }
        sb.r();
        return sb.sql;
    }
    alterField(field) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = this.buildColumnSql(field, 'MODIFY');
            yield this.runner.sql(sql, []);
        });
    }
    buildRows() {
        return __awaiter(this, void 0, void 0, function* () {
            let { fieldsValuesList } = this.table;
            if (fieldsValuesList === undefined)
                return;
            let { id, idKeys } = this.table;
            let sql;
            if (id && idKeys && idKeys.length > 0) {
                sql = this.buildUpdateValidColumSql();
                if (sql !== undefined) {
                    yield this.runner.sql(sql, []);
                }
                for (let fieldsValues of fieldsValuesList) {
                    let { fields, fieldsInit, values } = fieldsValues;
                    for (let row of values) {
                        sql = this.buildSelectKeySql(fields, row);
                        let selected = yield this.runner.sql(sql, []);
                        if (selected.length > 0) {
                            sql = this.buildUpdateRowKeySql(fields, fieldsInit, row);
                        }
                        else {
                            sql = this.buildInsertRowSql(fields, row);
                        }
                        yield this.runner.sql(sql, []);
                    }
                }
            }
            else if (id) {
                sql = this.buildUpdateValidColumSql();
                if (sql !== undefined) {
                    yield this.runner.sql(sql, []);
                }
                for (let fieldsValues of fieldsValuesList) {
                    let { fields, fieldsInit, values } = fieldsValues;
                    for (let row of values) {
                        sql = this.buildSelectIdSql(fields, row);
                        let selected = yield this.runner.sql(sql, []);
                        if (selected.length > 0) {
                            sql = this.buildUpdateRowIdSql(fields, fieldsInit, row);
                            yield this.runner.sql(sql, []);
                        }
                        else {
                            sql = this.buildInsertRowSql(fields, row);
                            yield this.runner.sql(sql, []);
                        }
                    }
                }
            }
            else {
                sql = this.buildRemoveAllRowsSql();
                yield this.runner.sql(sql, []);
                for (let fieldsValues of fieldsValuesList) {
                    let sql = this.buildAddRowsSql(fieldsValues);
                    yield this.runner.sql(sql, []);
                }
            }
            return;
        });
    }
    createSqlBuilder() {
        let sb = this.context.createSqlBuilder();
        sb.setIsBuildingTable();
        return sb;
    }
    buildRemoveAllRowsSql() {
        let sb = this.createSqlBuilder();
        sb.append('TRUNCATE table ')
            .fld(this.context.dbName).dot()
            .entityTable(this.table.name);
        sb.semicolon();
        sb.append('ALTER TABLE ')
            .fld(this.context.dbName).dot()
            .entityTable(this.table.name);
        sb.append(' AUTO_INCREMENT=1');
        sb.semicolon();
        return sb.sql;
    }
    buildUpdateValidColumSql() {
        if (this.field$valid === undefined)
            return;
        let sb = this.createSqlBuilder();
        sb.append('UPDATE ')
            .fld(this.context.dbName).dot()
            .entityTable(this.table.name);
        sb.append('SET $valid=-1 WHERE $valid=1');
        sb.semicolon();
        return sb.sql;
    }
    buildAddRowsSql(fieldsValues) {
        let { fields, values } = fieldsValues;
        let sb = this.createSqlBuilder();
        sb.append('insert ignore into ')
            .fld(this.context.dbName).dot()
            .entityTable(this.table.name);
        sb.l();
        sb.sepStart();
        for (let v of fields) {
            sb.sep();
            sb.fld(v.name);
        }
        sb.sepEnd();
        sb.r();
        sb.append(' values ');
        let first = true;
        for (let row of values) {
            if (first === true) {
                first = false;
            }
            else {
                sb.comma();
            }
            sb.l();
            sb.sepStart();
            for (let v of row) {
                sb.sep();
                sb.exp(v);
            }
            sb.sepEnd();
            sb.r();
        }
        sb.semicolon();
        return sb.sql;
    }
    buildSelectIdSql(fields, rowValues) {
        let sb = this.createSqlBuilder();
        sb.append('select id from ')
            .fld(this.context.dbName).dot()
            .entityTable(this.table.name);
        sb.append(' where 1=1');
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let f = fields[i];
            if (f.name === 'id') {
                sb.append(' and ').fld(f.name).append('=').exp(rowValues[i]);
                break;
            }
        }
        sb.semicolon();
        return sb.sql;
    }
    buildSelectKeySql(fields, rowValues) {
        let sb = this.createSqlBuilder();
        let { idKeys } = this.table;
        sb.append('select id from ')
            .fld(this.context.dbName).dot()
            .entityTable(this.table.name);
        sb.append(' where 1=1');
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let f = fields[i];
            if (idKeys.findIndex(k => k === f) >= 0) {
                sb.append(' and ').fld(f.name).append('=').exp(rowValues[i]);
            }
        }
        sb.semicolon();
        return sb.sql;
    }
    buildUpdateRowIdSql(fields, fieldsInit, rowValues) {
        let sb = this.createSqlBuilder();
        sb.append('update ')
            .fld(this.context.dbName).dot()
            .entityTable(this.table.name);
        let sbSet = this.createSqlBuilder();
        let first = true;
        sbSet.append(' set ');
        let sbWhere = this.createSqlBuilder();
        sbWhere.append(' where 1=1');
        if (this.field$valid !== undefined) {
            sbSet.append('$valid=1');
            sbWhere.append(' and $valid=-1');
            first = false;
        }
        let len = fields.length;
        for (let i = 0; i < len; i++) {
            let f = fields[i];
            let vExp = rowValues[i];
            let sbPart;
            if (f.name !== 'id') {
                if (fieldsInit) {
                    if (fieldsInit.find(v => v === f))
                        continue;
                }
                if (first === false)
                    sbSet.append(', ');
                else
                    first = false;
                sbPart = sbSet;
            }
            else {
                sbWhere.append(' and ');
                sbPart = sbWhere;
            }
            sbPart.fld(f.name).append('=').exp(vExp);
        }
        sb.append(sbSet.sql).append(sbWhere.sql);
        sb.semicolon();
        return sb.sql;
    }
    buildUpdateRowKeySql(fields, fieldsInit, rowValues) {
        let sb = this.createSqlBuilder();
        let { idKeys } = this.table;
        if (idKeys.length === fields.length)
            return;
        sb.append('update ')
            .fld(this.context.dbName).dot()
            .entityTable(this.table.name);
        let sbSet = this.createSqlBuilder();
        let sbWhere = this.createSqlBuilder();
        sbSet.append(' set ');
        sbWhere.append(' where 1=1');
        let first = true;
        if (this.field$valid !== undefined) {
            sbSet.append('$valid=1');
            sbWhere.append(' and $valid=-1');
            first = false;
        }
        let len = fields.length;
        let hasFieldToUpdate = false;
        for (let i = 0; i < len; i++) {
            let f = fields[i];
            let vExp = rowValues[i];
            let sbPart;
            if (idKeys.findIndex(k => k === f) < 0) {
                if (first === true) {
                    first = false;
                }
                else {
                    sbSet.append(', ');
                }
                sbPart = sbSet;
                if (fieldsInit) {
                    if (fieldsInit.find(v => v === f))
                        continue;
                }
            }
            else {
                sbWhere.append(' and ');
                sbPart = sbWhere;
            }
            sbPart.fld(f.name).append('=').exp(vExp);
            hasFieldToUpdate = true;
        }
        if (hasFieldToUpdate === false)
            return;
        sb.append(sbSet.sql).append(sbWhere.sql);
        sb.semicolon();
        return sb.sql;
    }
    // only ID need buildInsertRowSql
    buildInsertRowSql(fields, rowValues) {
        let { dbName } = this.context;
        let sb = this.createSqlBuilder();
        let { id, name, idKeys, isMinuteId } = this.table;
        let idInFields = (fields.findIndex(v => v === id) >= 0);
        if (idInFields === false) {
            sb.append('SET @insert_row_id=`')
                .append(dbName)
                .append('`.`').append(this.context.twProfix).append(name).append('$id`(0,0,1');
            if (isMinuteId === true) {
                sb.append(',null');
            }
            for (let idKey of idKeys) {
                let p = fields.findIndex(v => v === idKey);
                if (p < 0)
                    throw 'p should not be -1';
                sb.comma().exp(rowValues[p]);
            }
            sb.r().semicolon();
            let setFields = [];
            let len = fields.length;
            for (let i = 0; i < len; i++) {
                let field = fields[i];
                let p = idKeys.findIndex(v => v === field);
                if (p >= 0)
                    continue;
                setFields.push([field, rowValues[i]]);
            }
            len = setFields.length;
            if (len > 0) {
                let first = true;
                sb.append('UPDATE ').fld(dbName).dot()
                    .entityTable(this.table.name).append(' SET ');
                if (this.field$valid !== undefined) {
                    sb.append('$valid=1');
                    first = false;
                }
                for (let i = 0; i < len; i++) {
                    let [field, val] = setFields[i];
                    if (first === true) {
                        first = false;
                    }
                    else {
                        sb.comma();
                    }
                    sb.fld(field.name).append('=').exp(val);
                }
                sb.append(' WHERE id=@insert_row_id').semicolon();
            }
        }
        else {
            sb.append('insert ignore into ')
                .fld(dbName).dot()
                .entityTable(this.table.name);
            sb.l();
            sb.sepStart();
            for (let v of fields) {
                sb.sep();
                sb.fld(v.name);
            }
            if (this.field$valid !== undefined) {
                sb.sep();
                sb.fld('$valid');
            }
            sb.sepEnd();
            sb.r();
            sb.append(' values ');
            sb.l();
            sb.sepStart();
            for (let v of rowValues) {
                sb.sep();
                sb.exp(v);
            }
            if (this.field$valid !== undefined) {
                sb.sep();
                sb.append('1');
            }
            sb.sepEnd();
            sb.r();
            sb.semicolon();
        }
        return sb.sql;
    }
}
exports.TableUpdater = TableUpdater;
//# sourceMappingURL=table.js.map