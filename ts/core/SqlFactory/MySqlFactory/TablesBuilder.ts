import { EntitySchema, TableSchema } from "../IDDefines";

export class TablesBuilder {
    private $fieldBuilt = false;
    protected readonly dbName: string;
    protected readonly IDX: TableSchema[];
    protected i: number;
    protected iId: number;			// 连结ix id的那个table
    protected doneTimeField = false;
    protected idJoin: string;
    protected twProfix: string;
    cols: string;
    tables: string;

    constructor(dbName: string, twProfix: string, IDX: TableSchema[]) {
        this.dbName = dbName;
        this.IDX = IDX;
        this.cols = '';
        this.tables = '';
        this.iId = 0;
        this.twProfix = twProfix;
    }

    build() {
        this.i = 0;
        this.iId = 0;
        this.idJoin = 'id';
        this.buildIDX();
        this.buildIdCol();
    }

    protected buildCols(schema: EntitySchema): void {
        let { fields, type, create, update } = schema;
        let $fieldBuilt = false;
        for (let f of fields) {
            let { name: fn, type: ft } = f;
            if (fn === 'id') continue;
            let fv = `t${this.i}.\`${fn}\``;
            if (this.cols.length > 0) this.cols += ',';
            this.cols += ft === 'textid' ? `${this.twProfix}$idtext(${fv})` : fv;
            this.cols += ' as `' + fn + '`';
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
            /*
            if (owner === true) {
                this.cols += `, t${this.i}.$owner`;
                $fieldBuilt = true;
            }
            */
        }

        this.$fieldBuilt = $fieldBuilt;
    }

    protected buildIDX(): void {
        if (!this.IDX) return;
        if (this.IDX.length === 0) return;
        let { name, schema } = this.IDX[0];
        let tbl = `\`${this.dbName}\`.\`${this.twProfix}${name}\` as t${this.i}`;
        if (this.i === 0) {
            this.tables += tbl;
        }
        else {
            this.tables += ` left join ${tbl} on t${this.iId}.${this.idJoin}=t${this.i}.id`;
        }

        this.buildCols(schema);
        ++this.i;
        let len = this.IDX.length;
        for (let i = 1; i < len; i++) {
            let { name, schema } = this.IDX[i];
            this.tables += ` left join \`${this.dbName}\`.\`${this.twProfix}${name}\` as t${this.i} on t${this.iId}.${this.idJoin}=t${this.i}.id`;
            this.buildCols(schema);
            ++this.i;
        }
    }

    protected buildIdCol(): void {
        this.cols += `, t${this.i - 1}.id`;
    }
}

export class IXTablesBuilder extends TablesBuilder {
    protected readonly IX: TableSchema;

    constructor(dbName: string, twProfix: string, IX: TableSchema, IDX: TableSchema[]) {
        super(dbName, twProfix, IDX);
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
        this.tables += `\`${this.dbName}\`.\`${this.twProfix}${name}\` as t${this.i}`;
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

    constructor(dbName: string, twProfix: string, IX: TableSchema, IX1: TableSchema, IDX: TableSchema[]) {
        super(dbName, twProfix, IX, IDX);
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
        this.tables += `\`${this.dbName}\`.\`${this.twProfix}${name}\` as t${this.i}`;
        ++this.i;
    }
    protected buildIX1() {
        let { name, schema } = this.IX1;
        this.tables += ` join \`${this.dbName}\`.\`${this.twProfix}${name}\` as t${this.i} on t${this.i - 1}.xi=t${this.i}.ix`;
        this.buildCols(schema);
        ++this.i;
    }
}

export class IXrTablesBuilder extends TablesBuilder {
    protected readonly IX: TableSchema;

    constructor(dbName: string, twProfix: string, IX: TableSchema, IDX: TableSchema[]) {
        super(dbName, twProfix, IDX);
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
        this.tables += `\`${this.dbName}\`.\`${this.twProfix}${name}\` as t${this.i}`;
        this.buildCols(schema);
        ++this.i;
    }
}

export class IXrIXTablesBuilder extends IXrTablesBuilder {
    private readonly IX1: TableSchema;

    constructor(dbName: string, twProfix: string, IX: TableSchema, IX1: TableSchema, IDX: TableSchema[]) {
        super(dbName, twProfix, IX, IDX);
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
        this.tables += `\`${this.dbName}\`.\`${this.twProfix}${name}\` as t${this.i}`;
        //this.buildCols(schema);
        ++this.i;
    }

    protected buildIX1() {
        let { name, schema } = this.IX1;
        this.tables += ` join \`${this.dbName}\`.\`${this.twProfix}${name}\` as t${this.i} on t${this.i - 1}.ix=t${this.i}.ix`;
        this.buildCols(schema);
        ++this.i;
    }
}
