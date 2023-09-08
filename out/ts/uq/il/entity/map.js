"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Map = void 0;
const parser = require("../../parser");
const pointer_1 = require("../pointer");
const schema_1 = require("../schema");
const entity_1 = require("./entity");
class Map extends entity_1.BookBase {
    constructor() {
        super(...arguments);
        this.buses = [];
        this.queries = {
            all: undefined,
            page: undefined,
            query: undefined,
        };
        this.actions = {
            sync: undefined,
            add: undefined,
            del: undefined,
        };
    }
    get type() { return 'map'; }
    get defaultAccessibility() { return entity_1.EntityAccessibility.visible; }
    parser(context) { return new parser.PMap(this, context); }
    db(db) { return db.map(this); }
    internalCreateSchema() { new schema_1.MapSchemaBuilder(this.uq, this).build(this.schema); }
    fieldPointer(name) {
        if (this.orderField !== undefined && this.orderField.name === name)
            return new pointer_1.FieldPointer();
        return super.fieldPointer(name);
    }
    getFields() { return [...super.getFields(), this.orderField]; }
    useBusFace(bus, face, arr, local) {
        (0, entity_1.useBusFace)(this.buses, bus, face, arr, local);
    }
}
exports.Map = Map;
//# sourceMappingURL=map.js.map