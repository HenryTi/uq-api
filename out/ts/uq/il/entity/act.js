"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SysProc = exports.Proc = exports.Function = exports.Act = void 0;
const parser = require("../../parser");
const schema_1 = require("../schema");
const entity_1 = require("./entity");
class Act extends entity_1.ActionHasInBus {
    constructor() {
        super(...arguments);
        this.buses = [];
    }
    get type() { return 'action'; }
    get defaultAccessibility() { return entity_1.EntityAccessibility.visible; }
    parser(context) { return new parser.PAct(this, context); }
    db(db) { return db.action(this); }
    internalCreateSchema() { new schema_1.ActSchemaBuilder(this.uq, this).build(this.schema); }
    useBusFace(bus, face, arr, local) {
        (0, entity_1.useBusFace)(this.buses, bus, face, arr, local);
    }
    getReturns() { return this.returns; }
}
exports.Act = Act;
class Function extends entity_1.ActionBase {
    get type() { return 'function'; }
    parser(context) { return new parser.PFunction(this, context); }
    db(db) { return db.func(this); }
    internalCreateSchema() { }
    ;
}
exports.Function = Function;
// uq 中普通被调用的子程序。如果需要返回表，有调用方提供临时表
class Proc extends Act {
    constructor() {
        super(...arguments);
        this.isScheduled = false;
        this.logError = false;
    }
    get type() { return 'proc'; }
    db(db) {
        return db.proc(this);
    }
    parser(context) { return new parser.PProc(this, context); }
}
exports.Proc = Proc;
class SysProc extends Proc {
    get type() { return 'sysproc'; }
    parser(context) { return new parser.PSysProc(this, context); }
    db(db) {
        return db.sysproc(this);
    }
}
exports.SysProc = SysProc;
//# sourceMappingURL=act.js.map