"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDX = void 0;
const parser = require("../../parser");
const pointer_1 = require("../pointer");
const schema_1 = require("../schema");
const entity_1 = require("./entity");
class IDX extends entity_1.EntityWithTable {
    constructor() {
        super(...arguments);
        //keys: Field[] = [];
        this.fields = [];
    }
    setId(field) { this.id = field; /*this.keys.push(field);*/ /*this.keys.push(field);*/ this.fields.push(field); }
    get global() { return true; }
    get type() { return 'idx'; }
    parser(context) { return new parser.PIDX(this, context); }
    db(db) { return db.IDX(this); }
    internalCreateSchema() { new schema_1.IDXSchemaBuilder(this.uq, this).build(this.schema); }
    getKeys() { return [this.id]; /*this.keys;*/ }
    getFields() { return this.fields; }
    getField(name) {
        return this.fields.find(f => f.name === name);
    }
    fieldPointer(name) {
        let f = this.getField(name);
        if (f !== undefined)
            return new pointer_1.FieldPointer();
    }
}
exports.IDX = IDX;
//# sourceMappingURL=IDX.js.map