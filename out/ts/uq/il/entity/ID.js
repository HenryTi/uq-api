"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ID = exports.EnumIdType = void 0;
const entity_1 = require("./entity");
const parser = require("../../parser");
const pointer_1 = require("../pointer");
const schema_1 = require("../schema");
const IdBase_1 = require("./IdBase");
var EnumIdType;
(function (EnumIdType) {
    EnumIdType[EnumIdType["None"] = 0] = "None";
    EnumIdType[EnumIdType["UID"] = 1] = "UID"; // UUID or ULocal or UMinute
    EnumIdType[EnumIdType["UUID"] = 2] = "UUID"; // universally unique identifier (UUID)
    EnumIdType[EnumIdType["ULocal"] = 3] = "ULocal"; // unique local identifier
    EnumIdType[EnumIdType["Global"] = 11] = "Global";
    EnumIdType[EnumIdType["Local"] = 12] = "Local";
    EnumIdType[EnumIdType["Minute"] = 13] = "Minute";
    EnumIdType[EnumIdType["MinuteId"] = 21] = "MinuteId";
})(EnumIdType || (exports.EnumIdType = EnumIdType = {})); // Minute: unique in uq
// 如果 parent key 字段存在，则是Tree结构ID。另外的key字段只能有一个, key0=parent
class ID extends IdBase_1.IdBase {
    constructor() {
        super(...arguments);
        this.isMinute = false;
        this.keys = [];
        this.idIsKey = false;
        this.global = false;
    }
    get defaultAccessibility() { return entity_1.EntityAccessibility.visible; }
    setId(field) { this.id = field; this.fields.push(field); }
    fieldPointer(name) {
        if (name === '$' || this.id.name === name)
            return new pointer_1.FieldPointer();
        if (this.fields.find(f => f.name === name) !== undefined
            || this.fields.find(f => f.name === name) !== undefined
            || name === '$create' && this.stampCreate === true
            || name === '$update' && this.stampUpdate === true) {
            return new pointer_1.FieldPointer();
        }
    }
    getField(name) {
        let f = this.fields.find(v => v.name === name);
        if (f === undefined && this.id.name === name)
            f = this.id;
        return f;
    }
    getFields() {
        return this.fields;
    }
    getKeys() {
        return [this.id];
    }
    get type() { return 'id'; }
    parser(context) { return new parser.PID(this, context); }
    db(db) { return db.ID(this); }
    internalCreateSchema() { new schema_1.IDSchemaBuilder(this.uq, this).build(this.schema); }
}
exports.ID = ID;
//# sourceMappingURL=ID.js.map