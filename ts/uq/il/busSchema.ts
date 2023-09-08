import * as _ from 'lodash';
import { centerApi } from '../../core';
import { BusField } from './entity';
// import { Field, bigIntField, decField, textField, dateTimeField } from './field';

type FaceSchemas = { [faceName: string]: FaceSchema };
export interface FieldSchema {
    name: string;
    type: FaceDataType;
    fields?: string;
}

export abstract class FaceSchema {
    protected readonly schema: any;
    protected readonly busSchema: ShareSchema;
    readonly name: string;
    readonly jName: string;          // original name
    readonly type: 'accept' | 'query';

    constructor(busSchema: ShareSchema, name: string, jName: string, schema: any) {
        this.busSchema = busSchema;
        this.name = name;
        this.jName = jName;
        this.schema = schema;
    }

    abstract build(errorLogs: string[]): void;
    abstract setArrField(errorLogs: string[]): void;

    protected buildArrFields(busFields: BusField[], errorLogs: string[]): void {
        for (let bf of busFields) {
            let { type } = bf;
            if (type === 'array') {
                //let {fields} = bf;
                bf.fields = this.buildArrField(bf.fields as any, errorLogs);
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

    protected buildArrField(arraySchemaName: string, errorLogs: string[]): BusField[] {
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
        return (fs as FaceAcceptSchema).busFields;
    }

    protected buildFaceFields(fields: FieldSchema[], errorLogs: string[]): BusField[] {
        let busFields = [];
        for (let bf of fields) {
            let { type, name, fields } = bf;
            name = name.toLowerCase();
            let busField: BusField = { name: name, type: type, fields: fields as any };
            /*
            switch (type) {
                case 'string':
                case 'number':
                case 'id':
                    continue;
                case 'array':
                    busField.fields = this.getFaceFields(bf.fields, errorLogs);
                    break;
                default:
                    errorLogs.push(`unknow datatype ${type} in schema ${this.jName}`);
                    continue;
            }
            */
            busFields.push(busField);
        }
        return busFields;
    }

    protected getFaceFields(fieldsName: string, errorLogs: string[]): BusField[] {
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
        return (fs as FaceAcceptSchema).busFields;
    }
}
export type FacePrimitivType = 'string' | 'id' | 'number';
export type FaceDataType = FacePrimitivType | 'array';
//export type FaceQueryParam = FacePrimitivType | BusField[];
export class FaceAcceptSchema extends FaceSchema {
    protected readonly schema: FieldSchema[];
    type: 'accept' = 'accept';
    busFields: BusField[];
    build(errorLogs: string[]): void {
        this.busFields = this.buildFaceFields(this.schema, errorLogs);
    }
    setArrField(errorLogs: string[]): void {
        this.buildArrFields(this.busFields, errorLogs);
    }
}

export class FaceQuerySchema extends FaceSchema {
    protected readonly schema: { param: FieldSchema[], returns: string };
    type: 'query' = 'query';
    param: BusField[];
    returns: BusField[];

    build(errorLogs: string[]): void {
        let { param, returns } = this.schema;
        let returnFields: FieldSchema[];
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
        this.param = _.clone(param) as any[];
    }

    setArrField(errorLogs: string[]): void {
        if (this.param !== undefined) {
            for (let p of this.param) {
                if (['id', 'string', 'number'].indexOf(p.type) < 0) {
                    p.fields = this.buildArrField(p.fields as any, errorLogs);
                }
            }
        }
        this.buildArrFields(this.returns, errorLogs);
    }
}

export class ShareSchema {
    schema: any;
    readonly faceSchemas: FaceSchemas = {};
    version: number;

    async loadSchema(fromOwner: string, fromName: string): Promise<string> {
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
