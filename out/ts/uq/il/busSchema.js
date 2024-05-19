"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareSchema = exports.FaceQuerySchema = exports.FaceAcceptSchema = exports.FaceSchema = void 0;
const _ = require("lodash");
class FaceSchema {
    constructor(busSchema, name, jName, schema) {
        this.busSchema = busSchema;
        this.name = name;
        this.jName = jName;
        this.schema = schema;
    }
    buildArrFields(busFields, errorLogs) {
        for (let bf of busFields) {
            let { type } = bf;
            if (type === 'array') {
                //let {fields} = bf;
                bf.fields = this.buildArrField(bf.fields, errorLogs);
                /*
                let fs = this.busSchema.faceSchemas[fields as any];
                if (fs === undefined) {
                    errorLogs.push(`${fields} not defined`);
                    continue;
                }
                if (fs.type !== 'accept') {
                    errorLogs.push(`${fields} is not accept`);
                    continue;
                }
                bf.fields = (fs as FaceAcceptSchema).busFields;
                */
            }
        }
    }
    buildArrField(arraySchemaName, errorLogs) {
        let arrName = arraySchemaName.toLowerCase();
        let fs = this.busSchema.faceSchemas[arrName];
        if (fs === undefined) {
            errorLogs.push(`${arraySchemaName} not defined`);
            return;
        }
        if (fs.type !== 'accept') {
            errorLogs.push(`${arraySchemaName} is not accept`);
            return;
        }
        return fs.busFields;
    }
    buildFaceFields(fields, errorLogs) {
        let busFields = [];
        for (let bf of fields) {
            let { type, name, fields } = bf;
            name = name.toLowerCase();
            let busField = { name: name, type: type, fields: fields };
            busFields.push(busField);
        }
        return busFields;
    }
    getFaceFields(fieldsName, errorLogs) {
        if (typeof fieldsName !== 'string') {
            errorLogs.push(`in array datatype fields must be a face name of ${this.jName}`);
            return;
        }
        let fn = fieldsName.toLowerCase();
        let fs = this.busSchema.faceSchemas[fn];
        if (fs === undefined) {
            errorLogs.push(`${this.jName}/${fieldsName} not exists`);
            return;
        }
        if (fs.type !== 'accept') {
            errorLogs.push(`${this.jName}/${fieldsName} is not fields array`);
            return;
        }
        return fs.busFields;
    }
}
exports.FaceSchema = FaceSchema;
//export type FaceQueryParam = FacePrimitivType | BusField[];
class FaceAcceptSchema extends FaceSchema {
    constructor() {
        super(...arguments);
        // protected readonly schema: FieldSchema[];
        this.type = 'accept';
    }
    build(errorLogs) {
        this.busFields = this.buildFaceFields(this.schema, errorLogs);
    }
    setArrField(errorLogs) {
        this.buildArrFields(this.busFields, errorLogs);
    }
}
exports.FaceAcceptSchema = FaceAcceptSchema;
class FaceQuerySchema extends FaceSchema {
    constructor() {
        super(...arguments);
        // protected readonly schema: { param: FieldSchema[], returns: string };
        this.type = 'query';
    }
    build(errorLogs) {
        let { param, returns } = this.schema;
        let returnFields;
        if (typeof returns === 'string') {
            let lowerReturns = returns.toLowerCase();
            let returnsFaceSchema = this.busSchema.faceSchemas[lowerReturns];
            if (returnsFaceSchema === undefined) {
                errorLogs.push('returns ' + returns + ' not exists');
                return;
            }
            if (returnsFaceSchema.type !== 'accept') {
                errorLogs.push('returns ' + returns + ' is not accept');
                return;
            }
            returnFields = this.busSchema.schema[returns];
            if (returnFields === undefined) {
                returnFields = this.busSchema.schema[lowerReturns];
                if (returnFields === undefined) {
                    errorLogs.push('returns ' + returns + ' not defined');
                    return;
                }
            }
        }
        else {
            returnFields = returns;
        }
        this.returns = this.buildFaceFields(returnFields, errorLogs);
        this.param = _.clone(param);
    }
    setArrField(errorLogs) {
        if (this.param !== undefined) {
            for (let p of this.param) {
                if (['id', 'string', 'number'].indexOf(p.type) < 0) {
                    p.fields = this.buildArrField(p.fields, errorLogs);
                }
            }
        }
        this.buildArrFields(this.returns, errorLogs);
    }
}
exports.FaceQuerySchema = FaceQuerySchema;
class ShareSchema {
    constructor() {
        this.faceSchemas = {};
    }
    async loadSchema(fromOwner, fromName) {
        /*
        try {
            let errorLogs:string[] = [];
            let busSchema = await centerApi.busSchema(fromOwner, fromName);
            if (busSchema === undefined) {
                return 'not defined';
            }
            let {schema:schemaText, version} = busSchema;
            this.version = version;
            let schemas = JSON.parse(schemaText);
            this.schema = schemas;
            for (let i in schemas) {
                let name = i.toLowerCase();
                let schema = schemas[i];
                let faceSchema:FaceSchema;
                if (Array.isArray(schema) === true) {
                    faceSchema = new FaceAcceptSchema(this, name, i, schema);
                }
                else {
                    faceSchema = new FaceQuerySchema(this, name, i, schema);
                }
                this.faceSchemas[name] = faceSchema;
            }

            for (let i in this.faceSchemas) {
                this.faceSchemas[i].build(errorLogs);
            }
            if (errorLogs.length === 0) {
                for (let i in this.faceSchemas) {
                    let fs = this.faceSchemas[i];
                    fs.setArrField(errorLogs);
                }
            }
            if (errorLogs.length === 0) return;
            return errorLogs.join('\n');
        }
        catch (err) {
            console.error(err);
            debugger;
            return err;
        }
        */
        return;
    }
}
exports.ShareSchema = ShareSchema;
//# sourceMappingURL=busSchema.js.map