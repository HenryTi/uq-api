import { EntitySchema, TableSchema } from "../../IDDefines";
import { MySqlBuilder } from "./MySqlBuilder";

export class TablesBuilder {
    private $fieldBuilt = false;
    // protected readonly dbName: string;
    protected readonly mySqlBuilder: MySqlBuilder<any>;
    protected readonly IDX: TableSchema[];
    protected i: number;
    protected iId: number;			// 连结ix id的那个table
    protected doneTimeField = false;
    protected idJoin: string;
    // protected twProfix: string;
    cols: string;
    tables: string;

    constructor(mySqlBuilder: MySqlBuilder<any>, IDX: TableSchema[]) {
        this.mySqlBuilder = mySqlBuilder;
        //this.dbName = dbName;
        this.IDX = IDX;
        this.cols = '';
        this.tables = '';
        this.iId = 0;
        //this.twProfix = twProfix;
    }

    build() {
        this.i = 0;
        this.iId = 0;
        this.idJoin = 'id';
        this.buildIDX();
        this.buildIdCol();
    }

    protected dbObjectName(obj: string) {
        return this.mySqlBuilder.dbObjectName(obj);
    }

    protected buildCols(schema: EntitySchema): void {
        let { fields, type, biz, create, update, name } = schema;
        let $fieldBuilt = false;
        for (let f of fields) {
            let { name: fn, type: ft } = f;
            if (fn === 'id') continue;
            let fv = `t${this.i}.\`${fn}\``;
            if (this.cols.length > 0) this.cols += ',';
            this.cols += ft === 'textid' ? `${this.dbObjectName('$idtext')}(${fv})` : fv;
            this.cols += ' as `' + fn + '`';
        }
        if (name === 'Atom') {
            let bud = this.dbObjectName('bud');
            let $phrase = this.dbObjectName('$phrase');
            this.cols += `, (select p1.name from ${bud} as p0 join ${$phrase} as p1 on p1.id=p0.ext where p0.id=t${this.i}.base) as $phrase`;
        }
        if (this.$fieldBuilt !== true) {
            if (create === true) {
                this.cols += `, unix_timestamp(t${this.i}.$create) as $create`;
                $fieldBuilt = true;
            }

            if (update === true) {
                this.cols += `, unix_timestamp(t${this.i}.$update) as $update`;
                $fieldBuilt = true;
            }
        }

        this.$fieldBuilt = $fieldBuilt;
    }

    protected buildIDX(): void {
        if (!this.IDX) return;
        if (this.IDX.length === 0) return;
        function buildDbName(tableSchema: TableSchema) {
            let { name, schema } = tableSchema;
            let { biz } = schema;
            if (biz === undefined) return name;
            return `${biz}$${name}`;
        }
        let IDX = this.IDX[0];
        // let { name, schema } = this.IDX[0];
        let tbl = `${this.dbObjectName(buildDbName(IDX))} as t${this.i}`;
        if (this.i === 0) {
            this.tables += tbl;
        }
        else {
            this.tables += ` left join ${tbl} on t${this.iId}.${this.idJoin}=t${this.i}.id`;
        }

        this.buildCols(IDX.schema);
        ++this.i;
        let len = this.IDX.length;
        for (let i = 1; i < len; i++) {
            // let { name, schema } = this.IDX[i];
            let IDXi = this.IDX[i];
            let dbName = buildDbName(IDXi);
            this.tables += ` left join ${this.dbObjectName(dbName)} as t${this.i} on t${this.iId}.${this.idJoin}=t${this.i}.id`;
            this.buildCols(IDXi.schema);
            ++this.i;
        }
    }

    protected buildIdCol(): void {
        this.cols += `, t${this.i - 1}.id`;
    }
}

export class IXTablesBuilder extends TablesBuilder {
    protected readonly IX: TableSchema;

    constructor(mySqlBuilder: MySqlBuilder<any>, IX: TableSchema, IDX: TableSchema[]) {
        super(mySqlBuilder, IDX);
        this.IX = IX;
    }

    build() {
        this.i = 0;
        this.idJoin = 'xi';
        this.buildIX();
        this.buildIdCol();
        this.buildIDX();
    }

    protected buildIX() {
        let { name, schema } = this.IX;
        this.tables += `${this.dbObjectName(name)} as t${this.i}`;
        this.buildCols(schema);
        ++this.i;
    }

    protected buildIdCol(): void {
        if (!this.IDX) return;
        if (this.IDX.length === 0) return;
        this.cols += `, t${this.i}.id`;
    }
}

export class IXIXTablesBuilder extends IXTablesBuilder {
    private readonly IX1: TableSchema;

    constructor(mySqlBuilder: MySqlBuilder<any>, IX: TableSchema, IX1: TableSchema, IDX: TableSchema[]) {
        super(mySqlBuilder, IX, IDX);
        this.IX1 = IX1;
    }

    build() {
        this.i = 0;
        this.iId = 1;
        this.idJoin = 'xi';
        this.buildIX();
        this.buildIX1();
        this.buildIdCol();
        this.buildIDX();
    }

    protected buildIX() {
        let { name } = this.IX;
        this.tables += `${this.dbObjectName(name)} as t${this.i}`;
        ++this.i;
    }
    protected buildIX1() {
        let { name, schema } = this.IX1;
        this.tables += ` join ${this.dbObjectName(name)} as t${this.i} on t${this.i - 1}.xi=t${this.i}.ix`;
        this.buildCols(schema);
        ++this.i;
    }
}

export class IXrTablesBuilder extends TablesBuilder {
    protected readonly IX: TableSchema;

    constructor(mySqlBuilder: MySqlBuilder<any>, IX: TableSchema, IDX: TableSchema[]) {
        super(mySqlBuilder, IDX);
        this.IX = IX;
    }

    build() {
        this.i = 0;
        this.idJoin = 'ix';
        this.buildIXr();
        this.buildIDX();
        this.buildIdCol();
    }

    protected buildIXr() {
        let { name, schema } = this.IX;
        this.tables += `${this.dbObjectName(name)} as t${this.i}`;
        this.buildCols(schema);
        ++this.i;
    }
}

export class IXrIXTablesBuilder extends IXrTablesBuilder {
    private readonly IX1: TableSchema;

    constructor(mySqlBuilder: MySqlBuilder<any>, IX: TableSchema, IX1: TableSchema, IDX: TableSchema[]) {
        super(mySqlBuilder, IX, IDX);
        this.IX1 = IX1;
    }

    build() {
        this.i = 0;
        this.idJoin = 'xi';
        this.buildIXr();
        this.buildIX1();
        this.buildIDX();
        this.buildIdCol();
    }

    protected buildIXr() {
        let { name } = this.IX;
        this.tables += `${this.dbObjectName(name)} as t${this.i}`;
        //this.buildCols(schema);
        ++this.i;
    }

    protected buildIX1() {
        let { name, schema } = this.IX1;
        this.tables += ` join ${this.dbObjectName(name)} as t${this.i} on t${this.i - 1}.ix=t${this.i}.ix`;
        this.buildCols(schema);
        ++this.i;
    }
}

