"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeStampField = exports.decField = exports.dateTimeField = exports.timeField = exports.dateField = exports.textField = exports.charField = exports.binaryField = exports.bigIntField = exports.smallIntField = exports.intField = exports.tinyIntField = exports.jsonField = exports.idField = exports.Field = exports.ProcParamType = void 0;
const dt = require("./datatype");
const parser_1 = require("../parser");
var ProcParamType;
(function (ProcParamType) {
    ProcParamType[ProcParamType["in"] = 0] = "in";
    ProcParamType[ProcParamType["out"] = 1] = "out";
    ProcParamType[ProcParamType["inout"] = 2] = "inout";
})(ProcParamType || (exports.ProcParamType = ProcParamType = {}));
class Field {
    constructor() {
        this.autoInc = false;
    }
    get type() { return 'field ' + this.dataType.type; }
    get sName() { return this.jName || this.name; }
    parser(context) { return new parser_1.PField(this, context); }
    toSField() {
        let nul;
        if (this.nullable === false)
            nul = false;
        let sf = { name: this.sName, type: this.dataType.type, null: nul };
        this.dataType.setSField(sf);
        return sf;
    }
    get tuid() { return this.dataType.tuid; }
    get idType() { return this.dataType.idType; }
    isDefaultEqu(preDefault) {
        let cur = this.defaultValue;
        if (Array.isArray(cur) === true)
            cur = cur[0];
        return this.dataType.isDefaultEqu(cur, preDefault);
    }
}
exports.Field = Field;
function idField(name, size, idTypeName) {
    let f = new Field;
    f.name = name;
    let idType = new dt.IdDataType();
    idType.idSize = size;
    idType.idType = idTypeName;
    f.dataType = idType;
    return f;
}
exports.idField = idField;
function jsonField(name) {
    let f = new Field();
    f.name = name;
    let dataType = new dt.JsonDataType();
    f.dataType = dataType;
    return f;
}
exports.jsonField = jsonField;
function tinyIntField(name) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.TinyInt();
    return f;
}
exports.tinyIntField = tinyIntField;
function intField(name) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.Int();
    return f;
}
exports.intField = intField;
function smallIntField(name) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.SmallInt();
    return f;
}
exports.smallIntField = smallIntField;
function bigIntField(name) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.BigInt();
    return f;
}
exports.bigIntField = bigIntField;
function binaryField(name, size) {
    let f = new Field();
    f.name = name;
    f.dataType = new dt.Bin(size);
    return f;
}
exports.binaryField = binaryField;
function charField(name, size, binary = false) {
    let f = new Field;
    f.name = name;
    let t = f.dataType = new dt.Char();
    t.binary = binary;
    t.size = size;
    return f;
}
exports.charField = charField;
function textField(name) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.Text();
    return f;
}
exports.textField = textField;
function dateField(name) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.DDate();
    return f;
}
exports.dateField = dateField;
function timeField(name) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.Time();
    return f;
}
exports.timeField = timeField;
function dateTimeField(name, pricesion = 0) {
    let f = new Field;
    f.name = name;
    let d = f.dataType = new dt.DateTime();
    d.precision = pricesion;
    return f;
}
exports.dateTimeField = dateTimeField;
function decField(name, pricesion, scale) {
    let f = new Field;
    f.name = name;
    let d = f.dataType = new dt.Dec();
    d.precision = pricesion;
    d.scale = scale;
    return f;
}
exports.decField = decField;
function timeStampField(name) {
    let f = new Field;
    f.name = name;
    f.dataType = new dt.TimeStamp();
    f.defaultValue = [dt.defaultStampCurrent];
    return f;
}
exports.timeStampField = timeStampField;
//# sourceMappingURL=field.js.map