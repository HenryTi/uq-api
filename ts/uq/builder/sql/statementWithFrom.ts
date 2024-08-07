import { Entity, JoinType, JsonTableColumn, VarPointer } from "../../il";
import { SqlBuilder } from './sqlBuilder';
import { ExpCmp, ExpVal } from "./exp";
import { SqlSysTable, SqlTable, StatementBase } from './statement';
import { consts } from "../../../core";

export abstract class WithFromBuilder {
    protected _from: From;
    protected _where: Where;
    protected _searches: Search[];

    protected abstract createFrom(): From;
    protected abstract createJoin(): Join;
    protected abstract createWhere(): Where;

    abstract buildFrom(sb: SqlBuilder, tab: number): void;
    abstract buildWhereTo(sb: SqlBuilder, tab: number): void;

    where(exp: ExpCmp) {
        this._where = this.createWhere();
        this._where.exp = exp;
    }
    from(tbl: Table) {
        this._from = this.createFrom();
        this._from.tbl = tbl;
        return this;
    }
    get hasFrom() { return this._from !== undefined; }
    join(join: JoinType, tbl: Table) { //} name:string, alias?:string) {
        if (this._from !== undefined) {
            let joins = this._from.joins;
            if (joins === undefined) joins = this._from.joins = [];
            let j = this.createJoin();
            j.join = join;
            j.tbl = tbl;
            joins.push(j);
        }
        return this;
    }
    on(exp: ExpCmp) {
        if (this._from !== undefined) {
            let joins = this._from.joins;
            if (joins !== undefined) {
                let join = joins[joins.length - 1];
                join.on = exp;
            }
        }
        return this;
    }
    search(columns: string[], key: string, tbl?: string) {
        if (columns === undefined) return;
        if (this._searches === undefined) this._searches = [];
        this._searches.push(new Search(columns, key, tbl));
    }
}

export abstract class WithFrom extends StatementBase {
    owner: Entity;
    protected withFromBuilder: WithFromBuilder;
    constructor() {
        super();
        this.withFromBuilder = this.createWithFromBuilder();
    }

    protected abstract createWithFromBuilder(): WithFromBuilder;
    where(exp: ExpCmp) { this.withFromBuilder.where(exp); return this; }
    from(tbl: Table) { this.withFromBuilder.from(tbl); return this; }
    join(join: JoinType, tbl: Table) { this.withFromBuilder.join(join, tbl); return this; }
    on(exp: ExpCmp) { this.withFromBuilder.on(exp); return this; }
    search(columns: string[], key: string, tbl?: string) {
        this.withFromBuilder.search(columns, key, tbl);
        return this;
    }
}

export abstract class Column {
    exp: ExpVal;
    alias: string;
    pointer: VarPointer;
    constructor(exp: ExpVal, alias?: string, pointer?: VarPointer) {
        this.exp = exp;
        this.alias = alias;
        this.pointer = pointer;
    }
    abstract to(sb: SqlBuilder): void; //, toVar:boolean);
}
export abstract class From {
    tbl: Table;
    joins: Join[];
    abstract to(sb: SqlBuilder, tab: number): void;
    abstract addWhereUnit(sb: SqlBuilder): void;
}
export abstract class Join {
    join: JoinType;
    tbl: Table;
    on: ExpCmp;
    abstract to(sb: SqlBuilder, tab: number): void;
}
export abstract class Where {
    exp: ExpCmp;
    //abstract to(sb:SqlBuilder);
}
export class Search {
    tbl: string;
    columns: string[];
    key: string;
    constructor(columns: string[], key: string, tbl?: string) {
        this.columns = columns;
        this.key = key;
        this.tbl = tbl;
    }
}
export abstract class Table extends SqlTable {
    // protected abstract get name(): string;
    protected _alias: string;
    constructor(alias: string) {
        super();
        this._alias = alias;
        this.hasUnit = false;
    }
    addJoinOn(sb: SqlBuilder) { };
    addWhereUnit(sb: SqlBuilder) { }
    to(sb: SqlBuilder) {
        if (this._alias !== undefined) sb.append(' AS ').alias(this._alias);
    }
    get alias(): string { return this._alias }
}
export class FromJsonTable extends Table {
    private value: ExpVal;
    private path: string;
    private columns: JsonTableColumn[];
    constructor(alias: string, value: ExpVal, path: string, columns: JsonTableColumn[]) {
        super(alias);
        this.value = value;
        this.path = path;
        this.columns = columns;
    }
    to(sb: SqlBuilder) {
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
            const { dataType } = field;
            dataType.sql(sb);
            let canCollate = dataType.canCollate();
            if (canCollate === true) {
                sb.append(' COLLATE ' + consts.collation);
            }
            sb.space().append('PATH ').string(path);
        }
        sb.r().r().append(' AS ').append(this._alias);
    }
}
export class GlobalTable extends Table {
    protected readonly name: string;
    private schema: string;
    constructor(schema: string, tableName: string, alias?: string) {
        super(alias);
        this.schema = schema;
        this.name = tableName;
    }
    to(sb: SqlBuilder) {
        sb.name(this.schema).dot().name(this.name);
        super.to(sb);
    }
}
export class EntityTable extends Table {
    protected name: string;
    constructor(name: string, hasUnit: boolean, alias?: string) {
        super(alias);
        this.name = name;
        this.hasUnit = hasUnit;
    }
    addJoinOn(sb: SqlBuilder) {
    };
    addWhereUnit(sb: SqlBuilder) {
        if (this.hasUnit === false) return;
        sb.append(' AND ').aliasDot(this._alias).fld('$unit').append('=').var('$unit');
    }
    to(sb: SqlBuilder) {
        sb.dbName().dot();
        sb.entityTable(this.name);
        super.to(sb);
    }
}
export class IDEntityTable extends EntityTable {
    addJoinOn(sb: SqlBuilder) {
        if (!this._alias) return;
    };
    addWhereUnit(sb: SqlBuilder) {
        // ID 没有 $unit
        //if (this.hasUnit === false) return;
        //sb.append(' AND ').aliasDot(this._alias).fld('$unit').append('=').var('$unit');
    }
}

export class NameTable extends Table {
    protected name: string;
    constructor(name: string, alias?: string) {
        super(alias);
        this.name = name;
    }
    to(sb: SqlBuilder) {
        sb.name(this.name);
        super.to(sb);
    }
}
export class VarTable extends Table {
    protected name: string;
    constructor(name: string, alias?: string) {
        super(alias);
        this.name = name;
    }
    to(sb: SqlBuilder) {
        sb.dbName().dot().var(this.name);
        super.to(sb);
    }
}
export class VarTableWithSchema extends Table {
    protected name: string;
    constructor(name: string, alias?: string) {
        super(alias);
        this.name = name;
    }
    to(sb: SqlBuilder) {
        sb.dbName()
            .dot()
            .var(this.name);
        super.to(sb);
    }
}
export class VarTableWithDb extends Table {
    protected dbName: string;
    protected name: string;
    constructor(dbName: string, name: string, alias?: string) {
        super(alias);
        this.dbName = dbName;
        this.name = name;
    }
    to(sb: SqlBuilder) {
        sb.name(this.dbName).dot().var(this.name);
        super.to(sb);
    }
}
