import { TableSchema } from "./IDDefines";
import { SqlFactory } from "./SqlFactory";

export abstract class SqlBuilder<P = any> {
    protected readonly sqlFactory: SqlFactory;
    protected readonly dbName: string;
    protected readonly hasUnit: boolean;
    protected readonly twProfix: string;
    protected param: P;

    sql: string;        // direct sql
    proc: string;       // procedure name 
    procParameters: any[];      // procedure parameters

    constructor(sqlFactory: SqlFactory, param: P) {
        this.sqlFactory = sqlFactory;
        let { dbName, twProfix } = sqlFactory;
        this.dbName = dbName;
        this.hasUnit = false; // hasUnit; ID, IDX, IX表，都没有$unit字段，所以当hasUnit=false处理
        this.twProfix = twProfix;
        this.param = this.convertParam(param);
    }

    protected abstract convertParam(p: P): P;
    abstract build(): void;
    abstract dbObjectName(obj: string): string;

    protected getTableSchema(name: string, types: string[], values?: any[]): TableSchema {
        if (name === undefined) return undefined;
        let isXi: boolean;
        if (name[0] === '!') {
            isXi = true;
            name = name.substring(1);
        }
        let lowerName = name.toLowerCase();
        //let ts = this.entityRunner.schemas[lowerName]?.call;
        let ts = this.sqlFactory.getTableSchema(lowerName);
        if (ts === undefined) {
            this.throwErr(`${name} is not a valid Entity`);
        }
        let { type } = ts;
        if (types.indexOf(type) < 0) {
            this.throwErr(`TableSchema only support ${types.map(v => v.toUpperCase()).join(', ')}`);
        }
        return { name: lowerName, schema: ts, values, isXi };
    }
    protected getTableSchemas(names: string[], types: string[]): TableSchema[] {
        return names.map(v => this.getTableSchema(v, types));
    }

    protected getTableSchemaArray(names: string | string[], types: string[]): TableSchema[] {
        if (names === undefined) return;
        return Array.isArray(names) === true ?
            this.getTableSchemas(names as string[], types)
            :
            [this.getTableSchema(names as string, types)];
    }

    protected throwErr(err: string) {
        // logger.error(err);
        throw new Error(err);
    }

    protected buildValueTableSchema(values: any): any {
        let ret = {};
        for (let i in values) {
            if (i === 'ID') {
                ret[i] = this.getTableSchema(values[i], ['id']);
            }
            else {
                let val = values[i];
                if (typeof val === 'object') {
                    val = this.buildValueTableSchema(val);
                }
                ret[i] = val;
            }
        }
        return ret;
    }
}
