import * as parser from '../parser';
import { IElement } from './element';
import { Tuid, Enum } from './entity';

const intMax = 4503599627370495;
export const defaultStampCurrent = 'CURRENT_TIMESTAMP';
export const defaultStampOnUpdate = 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP';

export type IdSize = 'big' | '' | 'small' | 'tiny';

export interface DataTypeBuilder {
    id(id: IdDataType): void;
    textId(id: TextId): void;
    //tagDataType(tagDataType: TagDataType):void;
    of(of: Of, paramPrefix?: string): void;
    dec(dec: Dec): void;
    tinyInt(): void;
    smallInt(): void;
    int(): void;
    bigInt(): void;
    float(): void;
    double(): void;
    date(): void;
    time(): void;
    dateTime(dt: DateTime): void;
    char(c: Char): void;
    text(dt: Text): void;
    timestamp(): void;
    bin(b: Bin): void;
    json(): void;
}

function compareDateString(cur: string, pre: string) {
    if (cur[0] === '\'') {
        cur = cur.substring(1, cur.length - 1);
    }
    if (pre[0] === '\'') {
        pre = pre.substring(1, pre.length - 1);
    }
    let c = Date.parse(cur + ' GMT');
    let p = Date.parse(pre + ' GMT');
    let ret = c === p;
    return ret;
}

export abstract class DataType extends IElement {
    abstract get type(): string;
    get isNum(): boolean { return false; }
    get isString(): boolean { return false; }
    get isId(): boolean { return false; }
    get canHaveDefault(): boolean { return true }
    abstract parser(context: parser.PContext): parser.PDataType;
    abstract sql(dtb: DataTypeBuilder, paramPrefix?: string): void;
    abstract get defaultValue(): any;
    compare(dt: DataType): boolean { return true; }
    setSField(field: any) { }
    max(): any { }
    min(): any { }
    isDefaultEqu(cur: any, pre: any): boolean {
        if (this.canHaveDefault === false) return true;
        if (cur === undefined) {
            if (pre === undefined) return true;
            return false;
        }
        else {
            if (pre === undefined) return false;
        }
        if (this.isNum === true) {
            let c = Number(cur);
            let p = Number(pre);
            return c === p;
        }
        return this.compareDefaultString(String(cur), String(pre));
    }
    protected compareDefaultString(cur: string, pre: string) {
        return cur.toLowerCase() === pre.toLowerCase();
    }
}

export class UnkownType extends DataType {
    private _type: string;
    constructor(type: string) {
        super();
        this._type = type;
    }
    get type(): string { return this._type }
    parser(context: parser.PContext): parser.PDataType { return; }
    sql(dtb: DataTypeBuilder, paramPrefix?: string): void { return; }
    get defaultValue(): any { return; }
}

export abstract class NumType extends DataType {
    get isNum(): boolean { return true; }
}

export abstract class StringType extends DataType {
    binary: boolean;
    get isString(): boolean { return true; }
}

abstract class IdBase extends DataType {
    get type(): string { return 'id'; }
    get defaultValue(): any { return 0; }
    get isId(): boolean { return true; }
    idSize: IdSize = 'big';
    compare(dt: DataType): boolean { return true; }
    setSField(field: any) { }
    max(): number { return 0x7fffffff }
    min(): number { return 0 }
}

export class IdDataType extends IdBase {
    tuid: Tuid;
    idType: string;
    arrName: string;
    parser(context: parser.PContext) { return new parser.PId(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.id(this); }
    compare(dt: DataType): boolean {
        let { idType, arrName } = dt as IdDataType;
        return this.idType === idType && this.arrName === arrName;
    }
    setSField(field: any) {
        field.ID = this.idType;
        field.tuid = this.idType;
        if (this.arrName === undefined) {
        }
        else {
            field.arr = this.arrName;
        }
    }
    max(): number {
        switch (this.idSize) {
            case '': return 0x7fffffff;
            case 'big': return intMax;
            case 'small': return 0x7fff;
            case 'tiny': return 0x7f;
        }
    }
}

export class DataTypeDef extends DataType {
    readonly typeName: string;
    constructor(typeName: string) {
        super();
        this.typeName = typeName;
    }
    dataType: DataType;
    get type(): string {
        return 'datatype';
    }
    parser(context: parser.PContext): parser.PDataType {
        // 都是空的
        return new parser.PDataTypeDef(this, context);
    }
    sql(dtb: DataTypeBuilder, paramPrefix?: string): void {
        if (this.dataType === undefined) debugger;
        this.dataType.sql(dtb);
    }
    setSField(field: any): void {
        this.dataType.setSField(field);
        field.type = this.dataType.type;
    }
    get defaultValue(): any {
        return this.dataType.defaultValue;
    }
    get isNum(): boolean { return this.dataType.isNum; }
    get isString(): boolean { return this.dataType.isString; }
    get isId(): boolean { return this.dataType.isId; }
    get canHaveDefault(): boolean { return this.dataType.canHaveDefault; }
}

export class TextId extends IdBase {
    get type(): string { return 'textid'; }
    idSize: IdSize = '';
    parser(context: parser.PContext) { return new parser.PTextId(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.textId(this); }
}

export class EnumDataType extends DataType {
    get type(): string { return 'enum'; }
    get defaultValue(): any { return 0; }
    get isNum() { return true; }
    enm: Enum;
    parser(context: parser.PContext) { return new parser.PEnumDataType(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.smallInt(); }
    compare(enumDataType: DataType): boolean {
        let { type } = enumDataType;
        if (type === 'smallint') return true;
        if (type !== 'enum') return false;
        let { enm } = enumDataType as EnumDataType;
        if (!enm) return false;
        return enm.name === this.enm.name;
    }
    max(): number { return 0x7fff; }
    min(): number { return -0x7fff; }
}

export class Of extends DataType {
    get type(): string { return 'id'; }
    get defaultValue(): any { return 0; }
    get isId(): boolean { return true; }
    owner: string;
    arr: string;
    idSize: IdSize = '';
    parser(context: parser.PContext) { return new parser.POf(this, context); }
    sql(dtb: DataTypeBuilder, paramPrefix?: string) { dtb.of(this, paramPrefix); }
    compare(dt: DataType): boolean {
        let of = dt as Of;
        return this.owner === of.owner && this.arr === of.arr;
    }
    setSField(field: any) {
        field.owner = this.owner;
        field.arr = this.arr;
    }
}

export class Dec extends NumType {
    constructor(precision: number = 12, scale: number = 2) {
        super(); this.precision = precision; this.scale = scale;
    }
    get type(): string { return 'dec'; }
    get defaultValue(): any { return 0; }
    precision: number;
    scale: number;
    parser(context: parser.PContext) { return new parser.PDec(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.dec(this); }
    compare(dt: DataType): boolean {
        let dec = dt as Dec;
        return this.precision === dec.precision && this.scale === dec.scale;
    }
    setSField(sf: any) { sf.scale = this.scale; sf.precision = this.precision; }
    max() { return intMax }
    min() { return -intMax }
}
export class TinyInt extends NumType {
    get type(): string { return 'tinyint'; }
    get defaultValue(): any { return 0; }
    parser(context: parser.PContext) { return new parser.PTinyInt(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.tinyInt(); }
    max() { return 127 }
    min() { return -127 }
}
export class SmallInt extends NumType {
    get type(): string { return 'smallint'; }
    get defaultValue(): any { return 0; }
    parser(context: parser.PContext) { return new parser.PSmallInt(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.smallInt(); }
    compare(dt: DataType): boolean {
        if (dt.type === 'tag') return true;
        return super.compare(dt);
    }
    max() { return 0x7FFF }
    min() { return -0x7FFF }
}
export class Int extends NumType {
    get type(): string { return 'int'; }
    get defaultValue(): any { return 0; }
    parser(context: parser.PContext) { return new parser.PInt(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.int(); }
    max() { return 0x7FFFFFFF }
    min() { return -0x7FFFFFFF }
}
export class BigInt extends NumType {
    get type(): string { return 'bigint'; }
    get defaultValue(): any { return 0; }
    parser(context: parser.PContext) { return new parser.PBigInt(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.bigInt(); }
    max() { return intMax }
    min() { return -intMax }
}
export class Float extends NumType {
    get type(): string { return 'float'; }
    get defaultValue(): any { return 0; }
    parser(context: parser.PContext) { return new parser.PFloat(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.float(); }
    max() { return 1.175494351e38 }
    min() { return -1.175494351e38 }
}
export class Double extends NumType {
    get type(): string { return 'double'; }
    get defaultValue(): any { return 0; }
    parser(context: parser.PContext) { return new parser.PDouble(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.double(); }
    max() { return Number.MAX_VALUE }
    min() { return -Number.MAX_VALUE }
}
export class DDate extends DataType {
    get type(): string { return 'date'; }
    get defaultValue(): any { return; }
    parser(context: parser.PContext) { return new parser.PDate(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.date(); }
    max() { return '3000-1-1' }
    min() { return '1900-1-1' }
    protected compareDefaultString(cur: string, pre: string) {
        return compareDateString(cur, pre);
    }
}
export class Time extends DataType {
    get type(): string { return 'time'; }
    get defaultValue(): any { return 0; }
    parser(context: parser.PContext) { return new parser.PTime(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.time(); }
    max() { return '23:59:59.9999' }
    min() { return '0:0:0' }
}
export class TimeStamp extends DataType {
    get type(): string { return 'timestamp'; }
    get defaultValue(): any { return [defaultStampCurrent]; }
    parser(context: parser.PContext) { return new parser.PTime(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.timestamp(); }
    max(): any { return '2038-1-18' }
    min(): any { return '1970-1-1' }
    isDefaultEqu(cur: any, pre: any): boolean {
        if (cur === undefined) {
            if (pre === undefined) return true;
            return false;
        }
        else {
            if (pre === undefined) return false;
        }
        let defaultValue: string = String(cur).toUpperCase();
        let preDefaultValue: string = String(pre).toUpperCase();
        let defGen = ' DEFAULT_GENERATED';
        let p = preDefaultValue.indexOf(defGen);
        if (p >= 0) {
            preDefaultValue = preDefaultValue.substring(0, p) + preDefaultValue.substring(p + defGen.length);
        }
        return defaultValue === preDefaultValue;
    }
}
export class DateTime extends DataType {
    constructor(precision: number = 0) { super(); this.precision = precision; }
    get type(): string { return 'datetime'; }
    precision: number = 0;
    get defaultValue(): any { return; }
    parser(context: parser.PContext) { return new parser.PDateTime(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.dateTime(this); }
    compare(dt: DataType): boolean {
        let d = dt as DateTime;
        return this.precision === d.precision;
    }
    max(): any { return '3000-1-1' }
    min(): any { return '1000-1-1' }
    protected compareDefaultString(cur: string, pre: string) {
        return compareDateString(cur, pre);
    }
}
export class JsonDataType extends DataType {
    get type(): string { return 'json'; }
    get defaultValue(): any { return ''; }
    get isNum() { return false; }
    parser(context: parser.PContext) { return new parser.PJsonDataType(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.json(); }
    compare(jsonDataType: DataType): boolean {
        let { type } = jsonDataType;
        return (type === 'json');
    }
}
export class Char extends StringType {
    constructor(size: number = 50) { super(); this.size = size; }
    get type(): string { return 'char'; }
    size: number = 50;
    get defaultValue(): any { return ''; }
    parser(context: parser.PContext) { return new parser.PChar(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.char(this); }
    compare(dt: DataType): boolean {
        let c = dt as Char;
        return this.size === c.size;
    }
    setSField(sf: any) { sf.size = this.size; }
}
export class Text extends StringType {
    get type(): string { return 'text'; }
    get canHaveDefault(): boolean { return false }
    size: 'tiny' | '' | 'medium' | 'big' | 'long' = '';
    get defaultValue(): any { return ''; }
    parser(context: parser.PContext) { return new parser.PText(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.text(this); }
    compare(dt: DataType): boolean {
        let c = dt as Text;
        return this.size === c.size;
    }
}
export class Bin extends StringType {
    constructor(size: number = 50) { super(); this.size = size; }
    get type(): string { return 'bin'; }
    size: number = 50;
    get defaultValue(): any { return ''; }
    parser(context: parser.PContext) { return new parser.PBin(this, context); }
    sql(dtb: DataTypeBuilder) { dtb.bin(this); }
    compare(dt: DataType): boolean {
        let c = dt as Bin;
        return this.size === c.size;
    }
    setSField(sf: any) { sf.size = this.size; }
}

export function createDataProtoType(type: string): DataType {
    switch (type) {
        default: return;
        case 'id': return new IdDataType();
        case 'textid': return new TextId();
        case 'enum': return new EnumDataType();
        case 'of': return new Of();
        case 'tinyint': return new TinyInt();
        case 'smallint': return new SmallInt();
        case 'int': return new Int();
        case 'bigint': return new BigInt();
        case 'dec':
        case 'decimal': return new Dec();
        case 'float': return new Float();
        case 'double': return new Double();
        case 'date': return new DDate();
        case 'time': return new Time();
        case 'datetime': return new DateTime();
        case 'timestamp': return new TimeStamp();
        case 'varchar': // born uq代码会用到varchar
        case 'char': return new Char();
        case 'text': return new Text();
        case 'bin':
        case 'binary': return new Bin();
    }
}

export function createDataType(type: string): DataType {
    let ret = createDataProtoType(type);
    if (ret !== undefined) return ret;
    return new DataTypeDef(type);
}
