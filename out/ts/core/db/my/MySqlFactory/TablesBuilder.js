"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IXrIXTablesBuilder = exports.IXrTablesBuilder = exports.IXIXTablesBuilder = exports.IXTablesBuilder = exports.TablesBuilder = void 0;
class TablesBuilder {
    constructor(mySqlBuilder, IDX) {
        this.$fieldBuilt = false;
        this.doneTimeField = false;
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
    dbObjectName(obj) {
        return this.mySqlBuilder.dbObjectName(obj);
    }
    buildCols(schema) {
        let { fields, type, biz, create, update, name } = schema;
        let $fieldBuilt = false;
        for (let f of fields) {
            let { name: fn, type: ft } = f;
            if (fn === 'id')
                continue;
            let fv = `t${this.i}.\`${fn}\``;
            if (this.cols.length > 0)
                this.cols += ',';
            this.cols += ft === 'textid' ? `${this.dbObjectName('$idtext')}(${fv})` : fv;
            this.cols += ' as `' + fn + '`';
        }
        if (name === 'Atom') {
            let bud = this.dbObjectName('bud');
            let $phrase = this.dbObjectName('$phrase');
            this.cols += `, (select p1.name from ${bud} as p0 join ${$phrase} as p1 on p1.id=p0.phrase where p0.id=t${this.i}.base) as $phrase`;
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
    buildIDX() {
        if (!this.IDX)
            return;
        if (this.IDX.length === 0)
            return;
        function buildDbName(tableSchema) {
            let { name, schema } = tableSchema;
            let { biz } = schema;
            if (biz === undefined)
                return name;
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
    buildIdCol() {
        this.cols += `, t${this.i - 1}.id`;
    }
}
exports.TablesBuilder = TablesBuilder;
class IXTablesBuilder extends TablesBuilder {
    constructor(mySqlBuilder, IX, IDX) {
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
    buildIX() {
        let { name, schema } = this.IX;
        this.tables += `${this.dbObjectName(name)} as t${this.i}`;
        this.buildCols(schema);
        ++this.i;
    }
    buildIdCol() {
        if (!this.IDX)
            return;
        if (this.IDX.length === 0)
            return;
        this.cols += `, t${this.i}.id`;
    }
}
exports.IXTablesBuilder = IXTablesBuilder;
class IXIXTablesBuilder extends IXTablesBuilder {
    constructor(mySqlBuilder, IX, IX1, IDX) {
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
    buildIX() {
        let { name } = this.IX;
        this.tables += `${this.dbObjectName(name)} as t${this.i}`;
        ++this.i;
    }
    buildIX1() {
        let { name, schema } = this.IX1;
        this.tables += ` join ${this.dbObjectName(name)} as t${this.i} on t${this.i - 1}.xi=t${this.i}.ix`;
        this.buildCols(schema);
        ++this.i;
    }
}
exports.IXIXTablesBuilder = IXIXTablesBuilder;
class IXrTablesBuilder extends TablesBuilder {
    constructor(mySqlBuilder, IX, IDX) {
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
    buildIXr() {
        let { name, schema } = this.IX;
        this.tables += `${this.dbObjectName(name)} as t${this.i}`;
        this.buildCols(schema);
        ++this.i;
    }
}
exports.IXrTablesBuilder = IXrTablesBuilder;
class IXrIXTablesBuilder extends IXrTablesBuilder {
    constructor(mySqlBuilder, IX, IX1, IDX) {
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
    buildIXr() {
        let { name } = this.IX;
        this.tables += `${this.dbObjectName(name)} as t${this.i}`;
        //this.buildCols(schema);
        ++this.i;
    }
    buildIX1() {
        let { name, schema } = this.IX1;
        this.tables += ` join ${this.dbObjectName(name)} as t${this.i} on t${this.i - 1}.ix=t${this.i}.ix`;
        this.buildCols(schema);
        ++this.i;
    }
}
exports.IXrIXTablesBuilder = IXrIXTablesBuilder;
//# sourceMappingURL=TablesBuilder.js.map