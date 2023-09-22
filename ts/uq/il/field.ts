import * as dt from './datatype';
import { PField, PContext } from '../parser';
import { Pointer } from './pointer';
import { SField } from './schema';
import { Tuid } from './entity';
import { ValueExpression } from './expression';

export interface IField {
    name: string;
    dataType: dt.DataType;
}
export enum ProcParamType {
    in, out, inout
}
export class Field implements IField {
    get type(): string { return 'field ' + this.dataType.type; }
    name: string;
    jName: string;
    get sName() { return this.jName || this.name; }
    dataType: dt.DataType;
    autoInc: boolean = false;
    nullable: boolean;
    defaultValue: any;
    busSource?: string;        // accept param busFieldName as name，bus source name
    paramType: ProcParamType;
    parser(context: PContext) { return new PField(this, context); }

    toSField(): SField {
        let nul: boolean;
        if (this.nullable === false) nul = false;
        let sf = { name: this.sName, type: this.dataType.type, null: nul };
        this.dataType.setSField(sf);
        return sf;
    }
    get tuid(): Tuid { return (this.dataType as any).tuid }
    get idType(): string { return (this.dataType as any).idType }
    isDefaultEqu(preDefault: any): boolean {
        let cur = this.defaultValue;
        if (Array.isArray(cur) === true) cur = cur[0];
        return this.dataType.isDefaultEqu(cur, preDefault);
    }
}

export function idField(name: string, size: dt.IdSize, idTypeName?: string): Field {
    let f = new Field;
    f.name = name;
    let idType = new dt.IdDataType();
    idType.idSize = size;
    idType.idType = idTypeName;
    f.dataType = idType;
    return f;
}

export function jsonField(name: string): Field {
    let f = new Field();
    f.name = name;
    let dataType = new dt.JsonDataType();
    f.dataType = dataType;
    return f;
}

export function tinyIntField(name: string) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.TinyInt();
    return f;
}

export function intField(name: string) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.Int();
    return f;
}

export function smallIntField(name: string) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.SmallInt();
    return f;
}

export function bigIntField(name: string) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.BigInt();
    return f;
}

export function binaryField(name: string, size: number) {
    let f = new Field();
    f.name = name;
    f.dataType = new dt.Bin(size);
    return f;
}

export function charField(name: string, size: number, binary: boolean = false) {
    let f = new Field;
    f.name = name;
    let t = f.dataType = new dt.Char();
    t.binary = binary;
    t.size = size;
    return f;
}

export function textField(name: string) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.Text();
    return f;
}

export function dateField(name: string) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.DDate();
    return f;
}

export function timeField(name: string) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.Time();
    return f;
}

export function dateTimeField(name: string, pricesion: number = 0) {
    let f = new Field;
    f.name = name;
    let d = f.dataType = new dt.DateTime();
    d.precision = pricesion;
    return f;
}

export function decField(name: string, pricesion: number, scale: number) {
    let f = new Field;
    f.name = name;
    let d = f.dataType = new dt.Dec();
    d.precision = pricesion;
    d.scale = scale;
    return f;
}

export function timeStampField(name: string) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.TimeStamp();
    f.defaultValue = [dt.defaultStampCurrent];
    return f;
}

export interface Table {
    getTableAlias(): string;
    getTableName(): string;
    fieldPointer(name: string): Pointer;
    getKeys(): Field[];
    getFields(): Field[];
    getArrTable(arr: string): Table;
}

export interface FieldsValues {
    fields: Field[];
    fieldsInit?: Field[];                // 仅仅没有值的时候才赋值。
    values: (ValueExpression[])[];
    hasId: boolean;
}
