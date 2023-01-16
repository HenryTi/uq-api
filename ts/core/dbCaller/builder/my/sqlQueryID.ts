import { ParamQueryID, EntitySchema } from "../../dbCaller";
import { Builder } from "../Builder";
import { MySqlBuilder, sqlLineEnd } from "./mySqlBuilder";

interface Table {
    name: string;
    alias: string;
    join: 'left' | 'right' | '';
    fieldLeft: string;
    fieldRight: string;
}

export class SqlQueryID extends MySqlBuilder {
    private param: ParamQueryID;
    private cols: string = '';
    private tables: Table[] = [];
    private wheres: string[] = [];
    private order: string = '';
    private limit: string = '';
    private t: number; // table 编号

    constructor(builder: Builder, param: ParamQueryID) {
        super(builder);
        this.param = param;
    }

    build(): string {
        //let {ID, IX, IDX, id, key, ix, page, order} = this.param;
        this.t = 0;
        this.sqlID();
        this.sqlIX();
        this.sqlIDX();
        this.sqlPage();
        this.sqlOrder();

        let sql = 'SELECT ' + this.cols;
        sql += '\n\tFROM ';

        let t0 = this.tables[0];
        let tPrev = t0;
        sql += this.twProfix + t0.name + ' as ' + t0.alias;
        let tLen = this.tables.length;
        for (let i = 1; i < tLen; i++) {
            let t = this.tables[i];
            let { name, alias, join, fieldLeft } = t;
            sql += `\n\t\t${join} JOIN ${this.twProfix}${name} AS ${alias} ON `;
            if (this.hasUnit === true) {
                sql += `${tPrev.alias}.\`$unit\`=${alias}.\`$unit\` AND `;
            }
            sql += `${tPrev.alias}.${tPrev.fieldRight}=${alias}.${fieldLeft}`;
            tPrev = t;
        }

        if (this.wheres.length > 0) {
            sql += '\n\tWHERE ' + this.wheres.join(' AND ');
        }

        if (this.order.length > 0) {
            sql += this.order;
        }
        if (this.limit.length > 0) {
            sql += `\n\tLIMIT ${this.limit}`;
        }
        return sql + sqlLineEnd;
    }

    private sqlID() {
        //ID key must be with key, ID table stay after other tabble
        let { ID, key, id } = this.param;
        if (!ID) return;
        let t = this.t++;
        let { name, schema } = ID;
        let { keys } = schema;
        this.tables.push({
            name,
            alias: 't' + t,
            join: '',
            fieldLeft: 'id',
            fieldRight: 'id',
        });
        if (this.hasUnit === true) {
            this.wheres.push(`t${t}.$unit=@unit`);
        }
        if (id !== undefined) {
            let where = `t${t}.id`;
            if (Array.isArray(id) === true) {
                let ids: any[] = id as any[];
                let len = ids.length;
                if (len > 0) {
                    if (len === 1) where += '=' + ids[0];
                    else where += ` in (${(ids.join(','))})`;
                    this.wheres.push(where);
                }
            }
            else if (typeof id === 'number') {
                where += '=' + id;
                this.wheres.push(where);
            }
        }
        if (key && keys) {
            for (let k of keys) {
                let { name, type, tuid } = k as any;
                let v = key[name];
                if (v === undefined) {
                    if (type === 'id' && tuid === '$user') {
                        this.wheres.push(`t${t}.\`${k.name}\`=@user`);
                    }
                    continue;
                }
                if (v !== '') {
                    this.wheres.push(`t${t}.\`${k.name}\`='${v}'`);
                }
            }
        }
    }

    private sqlIX() {
        let { IX: IXArr, ix, key } = this.param;
        if (!IXArr) return;
        let IX = IXArr[0];
        let { isXi } = IX;
        let ixField = isXi === true ? 'xi' : 'ix';
        let t = this.t;
        if (ix !== undefined) {
            this.wheres.push(`t${t}.${ixField}='${ix}'`);
        }
        else if (key === undefined) {
            this.wheres.push(`t${t}.${ixField}=@user`);
        }
        for (let IX of IXArr) {
            let { name, isXi } = IX;
            t = this.t;
            this.tables.push(Object.assign(
                {
                    name,
                    alias: 't' + t,
                    join: '',
                    fieldLeft: undefined,
                    fieldRight: undefined,
                } as Table,
                (isXi === true ?
                    {
                        fieldLeft: 'xi',
                        fieldRight: 'ix',
                    }
                    :
                    {
                        fieldLeft: 'ix',
                        fieldRight: 'xi',
                    }
                )
            ));
            ++this.t;
        }
    }

    private sqlIDX() {
        let { IDX: IDXArr, keyx, idx } = this.param;
        if (!IDXArr) return;
        if (IDXArr.length === 0) return;
        let t = this.t;
        if (idx !== undefined) {
            let where = `t${t}.id`;
            if (Array.isArray(idx) === true) {
                let ids: any[] = idx as any[];
                let len = ids.length;
                if (len > 0) {
                    if (len === 1) where += '=' + ids[0];
                    else where += ` in (${(ids.join(','))})`;
                    this.wheres.push(where);
                }
            }
            else if (typeof idx === 'number') {
                where += '=' + idx;
                this.wheres.push(where);
            }
        }
        if (keyx) {
            let IDX = IDXArr[0];
            let { schema } = IDX;
            let { keys } = schema;
            for (let k of keys) {
                let { name, type, tuid } = k as any;
                let v = keyx[name];
                if (v === undefined) {
                    if (type === 'id' && tuid === '$user') {
                        this.wheres.push(`t${t}.\`${k.name}\`=@user`);
                    }
                    continue;
                }
                if (v !== '') {
                    this.wheres.push(`t${t}.\`${k.name}\`='${v}'`);
                }
            }
        }
        let idCol = `, t${t}.id`;
        let len = IDXArr.length;
        for (let i = 0; i < len; i++) {
            t = this.t;
            let IDX = IDXArr[i];
            let { name, schema } = IDX;
            this.tables.push({
                name,
                alias: 't' + t,
                join: 'left',
                fieldLeft: 'id',
                fieldRight: 'id',
            });
            this.buildCols(schema);
            this.t++;
        }
        this.cols += idCol;
    }

    private sqlPage() {
        let { page } = this.param;
        if (!page) return;
        let { start, size } = page;
        if (!start) start = 0;
        //let tbl = this.tables[this.tables.length-1];
        //let {alias, fieldRight} = tbl;
        let tbl = this.tables[0];
        let { alias, fieldLeft } = tbl;
        this.wheres.push(`${alias}.${fieldLeft}>${start}`);
        this.limit = `${size}`;
    }

    private sqlOrder() {
        let { order } = this.param;
        if (!order) return;
        let ord: string;
        switch (order) {
            default:
            case 'asc': ord = 'asc'; break;
            case 'desc': ord = 'desc'; break;
        }
        //let tbl = this.tables[this.tables.length-1];
        let tbl = this.tables[0];
        let { alias, fieldRight } = tbl;
        this.order = `\n\tORDER BY ${alias}.${fieldRight} ${ord}`;
    }

    private $fieldBuilt: boolean;
    protected buildCols(schema: EntitySchema): void {
        let { fields } = schema;
        let $fieldBuilt = false;
        for (let f of fields) {
            let { name: fn, type: ft } = f;
            if (fn === 'id') continue;
            if (fn === '$create') {
                if (this.$fieldBuilt === true) continue;
                this.cols += `, unix_timestamp(t${this.t}.$create) as $create`;
                $fieldBuilt = true;
                continue;
            }
            if (fn === '$update') {
                if (this.$fieldBuilt === true) continue;
                this.cols += `, unix_timestamp(t${this.t}.$update) as $update`;
                $fieldBuilt = true;
                continue;
            }
            if (fn === '$owner') {
                if (this.$fieldBuilt === true) continue;
                this.cols += `, t${this.t}.$owner`;
                $fieldBuilt = true;
                continue;
            }
            let fv = `t${this.t}.\`${fn}\``;
            if (this.cols.length > 0) this.cols += ',';
            this.cols += ft === 'textid' ? `${this.twProfix}$idtext(${fv})` : fv;
            this.cols += ' as `' + fn + '`';
        }
        this.$fieldBuilt = $fieldBuilt;
    }
}
