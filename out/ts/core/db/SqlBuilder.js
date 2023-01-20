"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlBuilder = void 0;
class SqlBuilder {
    constructor(sqlFactory, param) {
        this.sqlFactory = sqlFactory;
        let { dbName, twProfix } = sqlFactory;
        this.dbName = dbName;
        this.hasUnit = false; // hasUnit; ID, IDX, IX表，都没有$unit字段，所以当hasUnit=false处理
        this.twProfix = twProfix;
        this.param = this.convertParam(param);
    }
    getTableSchema(name, types, values) {
        if (name === undefined)
            return undefined;
        let isXi;
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
    getTableSchemas(names, types) {
        return names.map(v => this.getTableSchema(v, types));
    }
    getTableSchemaArray(names, types) {
        if (names === undefined)
            return;
        return Array.isArray(names) === true ?
            this.getTableSchemas(names, types)
            :
                [this.getTableSchema(names, types)];
    }
    throwErr(err) {
        // logger.error(err);
        throw new Error(err);
    }
    buildValueTableSchema(values) {
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
exports.SqlBuilder = SqlBuilder;
//# sourceMappingURL=SqlBuilder.js.map