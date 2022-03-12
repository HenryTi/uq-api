"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDRunner = void 0;
const tool_1 = require("../../tool");
class IDRunner {
    constructor(entityRunner, dbCaller) {
        this.entityRunner = entityRunner;
        this.dbCaller = dbCaller;
    }
    Acts(unit, user, param) {
        for (let i in param) {
            if (i === '$')
                continue;
            let ts = this.getTableSchema(i, ['id', 'idx', 'ix']);
            let values = param[i];
            if (values) {
                ts.values = values;
                param[i] = ts;
            }
        }
        return this.dbCaller.Acts(unit, user, param);
    }
    ActIX(unit, user, param) {
        let { IX, ID: ID, IXs } = param;
        param.IX = this.getTableSchema(IX, ['ix']);
        param.ID = this.getTableSchema(ID, ['id']);
        if (IXs) {
            param.IXs = IXs.map(v => {
                let { IX, ix } = v;
                return { IX: this.getTableSchema(IX, ['ix']), ix };
            });
        }
        return this.dbCaller.ActIX(unit, user, param);
    }
    ActIXSort(unit, user, param) {
        let { IX } = param;
        param.IX = this.getTableSchema(IX, ['ix']);
        return this.dbCaller.ActIXSort(unit, user, param);
    }
    ActIDProp(unit, user, param) {
        return this.dbCaller.ActIDProp(unit, user, param);
    }
    ActDetail(unit, user, param) {
        let { main, detail, detail2, detail3 } = param;
        let types = ['id'];
        param.main = this.getTableSchema(main.name, types, [main.value]);
        param.detail = this.getTableSchema(detail.name, types, detail.values);
        if (detail2) {
            param.detail2 = this.getTableSchema(detail2.name, types, detail2.values);
        }
        if (detail3) {
            param.detail3 = this.getTableSchema(detail3.name, types, detail3.values);
        }
        return this.dbCaller.ActDetail(unit, user, param);
    }
    QueryID(unit, user, param) {
        let { ID, IDX, IX } = param;
        param.ID = this.getTableSchema(ID, ['id']);
        param.IDX = this.getTableSchemaArray(IDX, ['id', 'idx']);
        param.IX = this.getTableSchemaArray(IX, ['ix']);
        return this.dbCaller.QueryID(unit, user, param);
    }
    IDNO(unit, user, param) {
        let { ID } = param;
        let types = ['id'];
        param.ID = this.getTableSchema(ID, types);
        return this.dbCaller.IDNO(unit, user, param);
    }
    IDDetailGet(unit, user, param) {
        let { main, detail, detail2, detail3 } = param;
        let types = ['id'];
        param.main = this.getTableSchema(main, types);
        param.detail = this.getTableSchema(detail, types);
        if (detail2) {
            param.detail2 = this.getTableSchema(detail2, types);
        }
        if (detail3) {
            param.detail3 = this.getTableSchema(detail3, types);
        }
        return this.dbCaller.IDDetailGet(unit, user, param);
    }
    ID(unit, user, param) {
        let { IDX } = param;
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX, types);
        return this.dbCaller.ID(unit, user, param);
    }
    IDTv(unit, user, ids) {
        return this.dbCaller.IDTv(unit, user, ids);
    }
    KeyID(unit, user, param) {
        let { ID, IDX } = param;
        let types = ['id', 'idx'];
        param.ID = this.getTableSchema(ID, ['id']);
        param.IDX = this.getTableSchemaArray(IDX, types);
        return this.dbCaller.KeyID(unit, user, param);
    }
    IX(unit, user, param) {
        let { IX, IX1, IDX } = param;
        param.IX = this.getTableSchema(IX, ['ix']);
        param.IX1 = this.getTableSchema(IX1, ['ix']);
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX, types);
        return this.dbCaller.IX(unit, user, param);
    }
    IXr(unit, user, param) {
        let { IX, IX1, IDX } = param;
        param.IX = this.getTableSchema(IX, ['ix']);
        param.IX1 = this.getTableSchema(IX1, ['ix']);
        let types = ['id', 'idx'];
        param.IDX = this.getTableSchemaArray(IDX, types);
        return this.dbCaller.IXr(unit, user, param);
    }
    IXValues(unit, user, param) {
        let { IX } = param;
        param.IX = this.getTableSchema(IX, ['ix']);
        return this.dbCaller.IXValues(unit, user, param);
    }
    KeyIX(unit, user, param) {
        let { ID, IX, IDX } = param;
        param.ID = this.getTableSchema(ID, ['id']);
        param.IX = this.getTableSchema(IX, ['ix']);
        param.IDX = this.getTableSchemaArray(IDX, ['id', 'idx']);
        return this.dbCaller.KeyIX(unit, user, param);
    }
    IDLog(unit, user, param) {
        let { IDX, field } = param;
        let ts = this.getTableSchema(IDX, ['idx']);
        param.IDX = ts;
        let fLower = field.toLowerCase();
        if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
            this.throwErr(`ID ${IDX} has no Field ${field}`);
        }
        return this.dbCaller.IDLog(unit, user, param);
    }
    checkIDXSumField(param) {
        let { IDX, field } = param;
        let ts = this.getTableSchema(IDX, ['idx']);
        param.IDX = ts;
        for (let f of field) {
            let fLower = f.toLowerCase();
            if (ts.schema.fields.findIndex(v => v.name.toLowerCase() === fLower) < 0) {
                this.throwErr(`ID ${IDX} has no Field ${f}`);
            }
        }
    }
    IDSum(unit, user, param) {
        this.checkIDXSumField(param);
        return this.dbCaller.IDSum(unit, user, param);
    }
    KeyIDSum(unit, user, param) {
        this.checkIDXSumField(param);
        return this.dbCaller.KeyIDSum(unit, user, param);
    }
    IXSum(unit, user, param) {
        this.checkIDXSumField(param);
        return this.dbCaller.IXSum(unit, user, param);
    }
    KeyIXSum(unit, user, param) {
        this.checkIDXSumField(param);
        return this.dbCaller.KeyIXSum(unit, user, param);
    }
    IDinIX(unit, user, param) {
        let { IX, ID } = param;
        param.IX = this.getTableSchema(IX, ['ix']);
        param.ID = this.getTableSchema(ID, ['id']);
        return this.dbCaller.IDinIX(unit, user, param);
    }
    IDxID(unit, user, param) {
        let { ID, IX, ID2 } = param;
        param.ID = this.getTableSchema(ID, ['id']);
        param.IX = this.getTableSchema(IX, ['ix']);
        param.ID2 = this.getTableSchema(ID2, ['id']);
        return this.dbCaller.IDxID(unit, user, param);
    }
    IDTree(unit, user, param) {
        let { ID } = param;
        param.ID = this.getTableSchema(ID, ['id']);
        return this.dbCaller.IDTree(unit, user, param);
    }
    getTableSchema(name, types, values) {
        var _a;
        if (name === undefined)
            return undefined;
        let isXi;
        if (name[0] === '!') {
            isXi = true;
            name = name.substr(1);
        }
        let lowerName = name.toLowerCase();
        let ts = (_a = this.entityRunner.schemas[lowerName]) === null || _a === void 0 ? void 0 : _a.call;
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
        tool_1.logger.error(err);
        throw new Error(err);
    }
}
exports.IDRunner = IDRunner;
//# sourceMappingURL=IDRunner.js.map