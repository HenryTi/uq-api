"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IX = void 0;
const parser = require("../../parser");
const pointer_1 = require("../pointer");
const schema_1 = require("../schema");
const entity_1 = require("./entity");
// 一对多关系 i-x
class IX extends entity_1.EntityWithTable {
    constructor() {
        super(...arguments);
        this.keys = [];
        this.fields = [];
    }
    setXField(x, field) {
        switch (x) {
            case 'ixx':
                this.ixx = field;
                break;
            case 'ix':
            case 'i':
                this.i = field;
                break;
            case 'xi':
            case 'x':
                this.x = field;
                break;
            default: throw Error('undefined x');
        }
        this.keys.unshift(field);
        this.fields.unshift(field);
    }
    get global() { return true; }
    get type() { return 'ix'; }
    parser(context) { return new parser.PIX(this, context); }
    db(db) { return db.IX(this); }
    internalCreateSchema() { new schema_1.IXSchemaBuilder(this.uq, this).build(this.schema); }
    getKeys() { return this.keys; }
    getFields() { return this.fields; }
    getField(name) {
        return this.fields.find(f => f.name === name);
    }
    fieldPointer(name) {
        let f = this.getField(name);
        if (f !== undefined)
            return new pointer_1.FieldPointer();
        let xField;
        switch (name) {
            default: return;
            case 'ix':
            case 'i':
                xField = this.i;
                break;
            case 'xi':
            case 'x':
                xField = this.x;
                break;
        }
        if (name === xField.name)
            return new pointer_1.FieldPointer();
    }
}
exports.IX = IX;
//# sourceMappingURL=IX.js.map