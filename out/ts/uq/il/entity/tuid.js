"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuidArr = exports.Tuid = void 0;
const _ = require("lodash");
const parser = require("../../parser");
const entity_1 = require("./entity");
const field_1 = require("../field");
const schema_1 = require("../schema");
const pointer_1 = require("../pointer");
const IdBase_1 = require("./IdBase");
class Tuid extends IdBase_1.IdBase {
    constructor() {
        super(...arguments);
        this.global = false; // no unit for the Tuid
        this.sync = false; // 不会自增，内容从其它uq里面拉取过来
        //id: Field;
        this.main = [];
        this.buses = [];
    }
    get type() { return 'tuid'; }
    get defaultAccessibility() { return entity_1.EntityAccessibility.visible; }
    parser(context) { return new parser.PTuid(this, context); }
    db(db) { return db.tuid(this); }
    internalCreateSchema() { new schema_1.TuidSchemaBuilder(this.uq, this).build(this.schema); }
    addMain(field) {
        this.main.push(field);
    }
    addField(field) {
        this.fields.push(field);
    }
    getArrTable(arr) {
        return this.arrs.find(v => v.name === arr);
    }
    fieldPointer(name) {
        if (this.id.name === name) {
            return new pointer_1.FieldPointer();
        }
        if (this.main.find(f => f.name === name) !== undefined
            || this.fields.find(f => f.name === name) !== undefined
            || name === '$create' && this.stampCreate === true
            || name === '$update' && this.stampUpdate === true) {
            return new pointer_1.FieldPointer();
        }
    }
    getKeys() {
        return [this.id];
    }
    getFields() {
        let ret = _.concat([], /*this.base, */ this.id, this.main, this.fields);
        return ret;
    }
    getField(name) {
        let f = this.main.find(v => v.name === name);
        if (f === undefined)
            f = this.fields.find(v => v.name === name);
        if (f === undefined && this.id.name === name)
            f = this.id;
        return f;
    }
    getArr(name) {
        if (this.arrs === undefined)
            return;
        return this.arrs.find(v => v.name === name);
    }
    getTableAlias() { return; }
    getTableName() { return this.name; }
    useBusFace(bus, face, arr, local) {
        (0, entity_1.useBusFace)(this.buses, bus, face, arr, local);
    }
}
exports.Tuid = Tuid;
class TuidArr extends Tuid {
    constructor(owner) {
        super(owner.uq);
        this.owner = owner;
        this.orderField = (0, field_1.smallIntField)('$order');
    }
    getTableName() { return this.owner.name + '_' + this.name; }
    fieldPointer(name) {
        if (name === this.id.name
            || name === this.ownerField.name
            || name === this.orderField.name
            || this.fields.find(v => v.name === name) !== undefined
            || this.main.find(f => f.name === name) !== undefined) {
            return new pointer_1.FieldPointer();
        }
    }
    getKeys() { return [this.ownerField, this.id]; }
    getFields() {
        //let ret = _.concat([this.ownerField, this.id], this.fields, this.main, [this.orderField]);
        //return ret;
        return [...this.main, ...this.fields];
    }
    getField(name) {
        let f = this.main.find(v => v.name === name);
        if (f === undefined)
            f = this.fields.find(v => v.name === name);
        return f;
    }
}
exports.TuidArr = TuidArr;
//# sourceMappingURL=tuid.js.map