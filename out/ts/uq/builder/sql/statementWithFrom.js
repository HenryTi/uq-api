"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VarTableWithDb = exports.VarTableWithSchema = exports.VarTable = exports.IDEntityTable = exports.EntityTable = exports.GlobalTable = exports.FromJsonTable = exports.Table = exports.Search = exports.Where = exports.Join = exports.From = exports.Column = exports.WithFrom = exports.WithFromBuilder = void 0;
const statement_1 = require("./statement");
class WithFromBuilder {
    where(exp) {
        this._where = this.createWhere();
        this._where.exp = exp;
    }
    from(tbl) {
        this._from = this.createFrom();
        this._from.tbl = tbl;
        return this;
    }
    get hasFrom() { return this._from !== undefined; }
    join(join, tbl) {
        if (this._from !== undefined) {
            let joins = this._from.joins;
            if (joins === undefined)
                joins = this._from.joins = [];
            let j = this.createJoin();
            j.join = join;
            j.tbl = tbl;
            joins.push(j);
        }
        return this;
    }
    on(exp) {
        if (this._from !== undefined) {
            let joins = this._from.joins;
            if (joins !== undefined) {
                let join = joins[joins.length - 1];
                join.on = exp;
            }
        }
        return this;
    }
    search(columns, key, tbl) {
        if (columns === undefined)
            return;
        if (this._searches === undefined)
            this._searches = [];
        this._searches.push(new Search(columns, key, tbl));
    }
}
exports.WithFromBuilder = WithFromBuilder;
class WithFrom extends statement_1.StatementBase {
    constructor() {
        super();
        this.withFromBuilder = this.createWithFromBuilder();
    }
    where(exp) { this.withFromBuilder.where(exp); return this; }
    from(tbl) { this.withFromBuilder.from(tbl); return this; }
    join(join, tbl) { this.withFromBuilder.join(join, tbl); return this; }
    on(exp) { this.withFromBuilder.on(exp); return this; }
    search(columns, key, tbl) {
        this.withFromBuilder.search(columns, key, tbl);
        return this;
    }
}
exports.WithFrom = WithFrom;
class Column {
    constructor(exp, alias, pointer) {
        this.exp = exp;
        this.alias = alias;
        this.pointer = pointer;
    }
}
exports.Column = Column;
class From {
}
exports.From = From;
class Join {
}
exports.Join = Join;
class Where {
}
exports.Where = Where;
class Search {
    constructor(columns, key, tbl) {
        this.columns = columns;
        this.key = key;
        this.tbl = tbl;
    }
}
exports.Search = Search;
class Table extends statement_1.SqlTable {
    constructor(alias) {
        super();
        this._alias = alias;
        this.hasUnit = false;
    }
    addJoinOn(sb) { }
    ;
    addWhereUnit(sb) { }
    to(sb) {
        if (this._alias !== undefined)
            sb.append(' AS ').alias(this._alias);
    }
    get alias() { return this._alias; }
}
exports.Table = Table;
class FromJsonTable extends Table {
    constructor(alias, value, path, columns) {
        super(alias);
        this.value = value;
        this.path = path;
        this.columns = columns;
    }
    to(sb) {
        sb.append('JSON_TABLE(')
            .exp(this.value)
            .comma()
            .string(this.path)
            .space()
            .append('COLUMNS(');
        let first = true;
        for (let col of this.columns) {
            if (first === true) {
                first = false;
            }
            else {
                sb.comma();
            }
            const { field, path } = col;
            sb.fld(field.name);
            sb.space();
            field.dataType.sql(sb);
            sb.space().append('PATH ').string(path);
        }
        sb.r().r().append(' AS ').append(this._alias);
    }
}
exports.FromJsonTable = FromJsonTable;
class GlobalTable extends Table {
    constructor(schema, tableName, alias) {
        super(alias);
        this.schema = schema;
        this.name = tableName;
    }
    to(sb) {
        sb.name(this.schema).dot().name(this.name);
        super.to(sb);
    }
}
exports.GlobalTable = GlobalTable;
class EntityTable extends Table {
    constructor(name, hasUnit, alias) {
        super(alias);
        this.name = name;
        this.hasUnit = hasUnit;
    }
    addJoinOn(sb) {
    }
    ;
    addWhereUnit(sb) {
        if (this.hasUnit === false)
            return;
        sb.append(' AND ').aliasDot(this._alias).fld('$unit').append('=').var('$unit');
    }
    to(sb) {
        sb.dbName().dot();
        sb.entityTable(this.name);
        super.to(sb);
    }
}
exports.EntityTable = EntityTable;
class IDEntityTable extends EntityTable {
    addJoinOn(sb) {
        if (!this._alias)
            return;
    }
    ;
    addWhereUnit(sb) {
        // ID 没有 $unit
        //if (this.hasUnit === false) return;
        //sb.append(' AND ').aliasDot(this._alias).fld('$unit').append('=').var('$unit');
    }
}
exports.IDEntityTable = IDEntityTable;
class VarTable extends Table {
    constructor(name, alias) {
        super(alias);
        this.name = name;
    }
    to(sb) {
        sb.dbName().dot().var(this.name);
        super.to(sb);
    }
}
exports.VarTable = VarTable;
class VarTableWithSchema extends Table {
    constructor(name, alias) {
        super(alias);
        this.name = name;
    }
    to(sb) {
        sb.dbName()
            .dot()
            .var(this.name);
        super.to(sb);
    }
}
exports.VarTableWithSchema = VarTableWithSchema;
class VarTableWithDb extends Table {
    constructor(dbName, name, alias) {
        super(alias);
        this.dbName = dbName;
        this.name = name;
    }
    to(sb) {
        sb.name(this.dbName).dot().var(this.name);
        super.to(sb);
    }
}
exports.VarTableWithDb = VarTableWithDb;
//# sourceMappingURL=statementWithFrom.js.map