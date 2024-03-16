"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataType = exports.createDataProtoType = exports.Bin = exports.Text = exports.Char = exports.JsonDataType = exports.DateTime = exports.TimeStamp = exports.Time = exports.DDate = exports.Double = exports.Float = exports.BigInt = exports.Int = exports.SmallInt = exports.TinyInt = exports.Dec = exports.Of = exports.EnumDataType = exports.TextId = exports.DataTypeDef = exports.IdDataType = exports.StringType = exports.NumType = exports.UnkownType = exports.DataType = exports.defaultStampOnUpdate = exports.defaultStampCurrent = void 0;
const parser = require("../parser");
const IElement_1 = require("./IElement");
const intMax = 4503599627370495;
exports.defaultStampCurrent = 'CURRENT_TIMESTAMP';
exports.defaultStampOnUpdate = 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP';
function compareDateString(cur, pre) {
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
class DataType extends IElement_1.IElement {
    get isNum() { return false; }
    get isString() { return false; }
    get isId() { return false; }
    get canHaveDefault() { return true; }
    compare(dt) { return true; }
    setSField(field) { }
    max() { }
    min() { }
    canCollate() { return false; }
    isDefaultEqu(cur, pre) {
        if (this.canHaveDefault === false)
            return true;
        if (cur === undefined) {
            if (pre === undefined)
                return true;
            return false;
        }
        else {
            if (pre === undefined)
                return false;
        }
        if (this.isNum === true) {
            let c = Number(cur);
            let p = Number(pre);
            return c === p;
        }
        return this.compareDefaultString(String(cur), String(pre));
    }
    compareDefaultString(cur, pre) {
        return cur.toLowerCase() === pre.toLowerCase();
    }
}
exports.DataType = DataType;
class UnkownType extends DataType {
    constructor(type) {
        super();
        this._type = type;
    }
    get type() { return this._type; }
    parser(context) { return; }
    sql(dtb, paramPrefix) { return; }
    get defaultValue() { return; }
}
exports.UnkownType = UnkownType;
class NumType extends DataType {
    get isNum() { return true; }
}
exports.NumType = NumType;
class StringType extends DataType {
    get isString() { return true; }
    canCollate() { return true; }
}
exports.StringType = StringType;
class IdBase extends DataType {
    constructor() {
        super(...arguments);
        this.idSize = 'big';
    }
    get type() { return 'id'; }
    get defaultValue() { return 0; }
    get isId() { return true; }
    compare(dt) { return true; }
    setSField(field) { }
    max() { return 0x7fffffff; }
    min() { return 0; }
}
class IdDataType extends IdBase {
    parser(context) { return new parser.PId(this, context); }
    sql(dtb) { dtb.id(this); }
    compare(dt) {
        let { idType, arrName } = dt;
        return this.idType === idType && this.arrName === arrName;
    }
    setSField(field) {
        field.ID = this.idType;
        field.tuid = this.idType;
        if (this.arrName === undefined) {
        }
        else {
            field.arr = this.arrName;
        }
    }
    max() {
        switch (this.idSize) {
            case '': return 0x7fffffff;
            case 'big': return intMax;
            case 'small': return 0x7fff;
            case 'tiny': return 0x7f;
        }
    }
}
exports.IdDataType = IdDataType;
class DataTypeDef extends DataType {
    constructor(typeName) {
        super();
        this.typeName = typeName;
    }
    get type() {
        return 'datatype';
    }
    parser(context) {
        // 都是空的
        return new parser.PDataTypeDef(this, context);
    }
    sql(dtb, paramPrefix) {
        if (this.dataType === undefined)
            debugger;
        this.dataType.sql(dtb);
    }
    setSField(field) {
        this.dataType.setSField(field);
        field.type = this.dataType.type;
    }
    get defaultValue() {
        return this.dataType.defaultValue;
    }
    get isNum() { return this.dataType.isNum; }
    get isString() { return this.dataType.isString; }
    get isId() { return this.dataType.isId; }
    get canHaveDefault() { return this.dataType.canHaveDefault; }
}
exports.DataTypeDef = DataTypeDef;
class TextId extends IdBase {
    constructor() {
        super(...arguments);
        this.idSize = '';
    }
    get type() { return 'textid'; }
    parser(context) { return new parser.PTextId(this, context); }
    sql(dtb) { dtb.textId(this); }
}
exports.TextId = TextId;
class EnumDataType extends DataType {
    get type() { return 'enum'; }
    get defaultValue() { return 0; }
    get isNum() { return true; }
    parser(context) { return new parser.PEnumDataType(this, context); }
    sql(dtb) { dtb.smallInt(); }
    compare(enumDataType) {
        let { type } = enumDataType;
        if (type === 'smallint')
            return true;
        if (type !== 'enum')
            return false;
        let { enm } = enumDataType;
        if (!enm)
            return false;
        return enm.name === this.enm.name;
    }
    max() { return 0x7fff; }
    min() { return -0x7fff; }
}
exports.EnumDataType = EnumDataType;
class Of extends DataType {
    constructor() {
        super(...arguments);
        this.idSize = '';
    }
    get type() { return 'id'; }
    get defaultValue() { return 0; }
    get isId() { return true; }
    parser(context) { return new parser.POf(this, context); }
    sql(dtb, paramPrefix) { dtb.of(this, paramPrefix); }
    compare(dt) {
        let of = dt;
        return this.owner === of.owner && this.arr === of.arr;
    }
    setSField(field) {
        field.owner = this.owner;
        field.arr = this.arr;
    }
}
exports.Of = Of;
class Dec extends NumType {
    constructor(precision = 12, scale = 2) {
        super();
        this.precision = precision;
        this.scale = scale;
    }
    get type() { return 'dec'; }
    get defaultValue() { return 0; }
    parser(context) { return new parser.PDec(this, context); }
    sql(dtb) { dtb.dec(this); }
    compare(dt) {
        let dec = dt;
        return this.precision === dec.precision && this.scale === dec.scale;
    }
    setSField(sf) { sf.scale = this.scale; sf.precision = this.precision; }
    max() { return intMax; }
    min() { return -intMax; }
}
exports.Dec = Dec;
class TinyInt extends NumType {
    get type() { return 'tinyint'; }
    get defaultValue() { return 0; }
    parser(context) { return new parser.PTinyInt(this, context); }
    sql(dtb) { dtb.tinyInt(); }
    max() { return 127; }
    min() { return -127; }
}
exports.TinyInt = TinyInt;
class SmallInt extends NumType {
    get type() { return 'smallint'; }
    get defaultValue() { return 0; }
    parser(context) { return new parser.PSmallInt(this, context); }
    sql(dtb) { dtb.smallInt(); }
    compare(dt) {
        if (dt.type === 'tag')
            return true;
        return super.compare(dt);
    }
    max() { return 0x7FFF; }
    min() { return -0x7FFF; }
}
exports.SmallInt = SmallInt;
class Int extends NumType {
    get type() { return 'int'; }
    get defaultValue() { return 0; }
    parser(context) { return new parser.PInt(this, context); }
    sql(dtb) { dtb.int(); }
    max() { return 0x7FFFFFFF; }
    min() { return -0x7FFFFFFF; }
}
exports.Int = Int;
class BigInt extends NumType {
    get type() { return 'bigint'; }
    get defaultValue() { return 0; }
    parser(context) { return new parser.PBigInt(this, context); }
    sql(dtb) { dtb.bigInt(); }
    max() { return intMax; }
    min() { return -intMax; }
}
exports.BigInt = BigInt;
class Float extends NumType {
    get type() { return 'float'; }
    get defaultValue() { return 0; }
    parser(context) { return new parser.PFloat(this, context); }
    sql(dtb) { dtb.float(); }
    max() { return 1.175494351e38; }
    min() { return -1.175494351e38; }
}
exports.Float = Float;
class Double extends NumType {
    get type() { return 'double'; }
    get defaultValue() { return 0; }
    parser(context) { return new parser.PDouble(this, context); }
    sql(dtb) { dtb.double(); }
    max() { return Number.MAX_VALUE; }
    min() { return -Number.MAX_VALUE; }
}
exports.Double = Double;
class DDate extends DataType {
    get type() { return 'date'; }
    get defaultValue() { return; }
    parser(context) { return new parser.PDate(this, context); }
    sql(dtb) { dtb.date(); }
    max() { return '3000-1-1'; }
    min() { return '1900-1-1'; }
    compareDefaultString(cur, pre) {
        return compareDateString(cur, pre);
    }
}
exports.DDate = DDate;
class Time extends DataType {
    get type() { return 'time'; }
    get defaultValue() { return 0; }
    parser(context) { return new parser.PTime(this, context); }
    sql(dtb) { dtb.time(); }
    max() { return '23:59:59.9999'; }
    min() { return '0:0:0'; }
}
exports.Time = Time;
class TimeStamp extends DataType {
    get type() { return 'timestamp'; }
    get defaultValue() { return [exports.defaultStampCurrent]; }
    parser(context) { return new parser.PTime(this, context); }
    sql(dtb) { dtb.timestamp(); }
    max() { return '2038-1-18'; }
    min() { return '1970-1-1'; }
    isDefaultEqu(cur, pre) {
        if (cur === undefined) {
            if (pre === undefined)
                return true;
            return false;
        }
        else {
            if (pre === undefined)
                return false;
        }
        let defaultValue = String(cur).toUpperCase();
        let preDefaultValue = String(pre).toUpperCase();
        let defGen = ' DEFAULT_GENERATED';
        let p = preDefaultValue.indexOf(defGen);
        if (p >= 0) {
            preDefaultValue = preDefaultValue.substring(0, p) + preDefaultValue.substring(p + defGen.length);
        }
        return defaultValue === preDefaultValue;
    }
}
exports.TimeStamp = TimeStamp;
class DateTime extends DataType {
    constructor(precision = 0) {
        super();
        this.precision = 0;
        this.precision = precision;
    }
    get type() { return 'datetime'; }
    get defaultValue() { return; }
    parser(context) { return new parser.PDateTime(this, context); }
    sql(dtb) { dtb.dateTime(this); }
    compare(dt) {
        let d = dt;
        return this.precision === d.precision;
    }
    max() { return '3000-1-1'; }
    min() { return '1000-1-1'; }
    compareDefaultString(cur, pre) {
        return compareDateString(cur, pre);
    }
}
exports.DateTime = DateTime;
class JsonDataType extends DataType {
    get type() { return 'json'; }
    get defaultValue() { return ''; }
    get isNum() { return false; }
    parser(context) { return new parser.PJsonDataType(this, context); }
    sql(dtb) { dtb.json(); }
    compare(jsonDataType) {
        let { type } = jsonDataType;
        return (type === 'json');
    }
}
exports.JsonDataType = JsonDataType;
class Char extends StringType {
    constructor(size = 50) {
        super();
        this.size = 50;
        this.size = size;
    }
    get type() { return 'char'; }
    get defaultValue() { return ''; }
    parser(context) { return new parser.PChar(this, context); }
    sql(dtb) { dtb.char(this); }
    compare(dt) {
        let c = dt;
        return this.size === c.size;
    }
    setSField(sf) { sf.size = this.size; }
}
exports.Char = Char;
class Text extends StringType {
    constructor() {
        super(...arguments);
        this.size = '';
    }
    get type() { return 'text'; }
    get canHaveDefault() { return false; }
    get defaultValue() { return ''; }
    parser(context) { return new parser.PText(this, context); }
    sql(dtb) { dtb.text(this); }
    compare(dt) {
        let c = dt;
        return this.size === c.size;
    }
}
exports.Text = Text;
class Bin extends StringType {
    constructor(size = 50) {
        super();
        this.size = 50;
        this.size = size;
    }
    get type() { return 'bin'; }
    get defaultValue() { return ''; }
    parser(context) { return new parser.PBin(this, context); }
    sql(dtb) { dtb.bin(this); }
    canCollate() { return false; }
    compare(dt) {
        let c = dt;
        return this.size === c.size;
    }
    setSField(sf) { sf.size = this.size; }
}
exports.Bin = Bin;
function createDataProtoType(type) {
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
exports.createDataProtoType = createDataProtoType;
function createDataType(type) {
    let ret = createDataProtoType(type);
    if (ret !== undefined)
        return ret;
    return new DataTypeDef(type);
}
exports.createDataType = createDataType;
//# sourceMappingURL=datatype.js.map