"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Templet = exports.EntityVarTable = exports.SheetAction = exports.SheetState = exports.StateTo = exports.SheetVerify = exports.Sheet = exports.Query = exports.useBusFace = exports.InBusAction = exports.Bus = exports.BusQuery = exports.BusAccept = exports.ActionHasInBus = exports.QueryBase = exports.Returns = exports.ActionBase = exports.Pending = exports.History = exports.HistoryBase = exports.Book = exports.BookBase = exports.Import = exports.Role = exports.Arr = exports.IArr = exports.Index = exports.EntityWithTable = exports.Queue = exports.DataTypeDefine = exports.Const = exports.Enum = exports.Entity = exports.EntityAccessibility = void 0;
const _ = require("lodash");
const parser = require("../../parser");
const element_1 = require("../element");
const pointer_1 = require("../pointer");
const statement_1 = require("../statement");
const schema_1 = require("../schema");
var EntityAccessibility;
(function (EntityAccessibility) {
    EntityAccessibility[EntityAccessibility["invisible"] = 0] = "invisible";
    EntityAccessibility[EntityAccessibility["visible"] = 1] = "visible";
})(EntityAccessibility || (exports.EntityAccessibility = EntityAccessibility = {}));
class Entity extends element_1.IElement {
    constructor(uq) {
        super();
        this.isVarTable = false;
        this.isSourceChanged = false;
        this.uq = uq;
        this.isPrivate = false;
    }
    get isBiz() { return false; }
    get sName() { return this.jName || this.name; } // 保持大小写的name
    buildSchema(res) {
        if (this.schema !== undefined)
            return;
        this.schema = {};
        this.internalCreateSchema(res);
    }
    createRun() { return; }
    getArr(arrName) { return; }
    get defaultAccessibility() { return EntityAccessibility.invisible; }
    pushSharpFields(sharpField) {
        if (this.sharpFields === undefined)
            this.sharpFields = [];
        this.sharpFields.push(sharpField);
    }
    getReturns() { return undefined; }
    calcKeyValue(key) {
        if (this.keyValues === undefined)
            return undefined;
        const kv = this.keyValues[key];
        if (kv === undefined) {
            return undefined;
        }
        const { val } = kv;
        switch (typeof val) {
            case 'number':
            case 'string':
                return val;
        }
        const [v0, v1] = val;
        return kv.val = this.uq.calcKeyValue(v0, v1);
    }
}
exports.Entity = Entity;
class Enum extends Entity {
    // enum的值，应该只支持数字
    // values: { [key: string]: number } = {};
    // key是区分大小写的
    get global() { return false; }
    get type() { return 'enum'; }
    get defaultAccessibility() { return EntityAccessibility.visible; }
    parser(context) { return new parser.PEnum(this, context); }
    db(db) { return db.enm(this); }
    internalCreateSchema() { new schema_1.EnumSchemaBuilder(this.uq, this).build(this.schema); }
}
exports.Enum = Enum;
class Const extends Entity {
    constructor() {
        super(...arguments);
        this.values = {};
    }
    // namedValues: { [name: string]: string | number } = {};
    get global() { return false; }
    get type() { return 'const'; }
    get defaultAccessibility() { return EntityAccessibility.visible; }
    parser(context) { return new parser.PConst(this, context); }
    db(db) { return db._const(this); }
    internalCreateSchema() { new schema_1.ConstSchemaBuilder(this.uq, this).build(this.schema); }
}
exports.Const = Const;
class DataTypeDefine extends Entity {
    constructor() {
        super(...arguments);
        this.datatypes = {};
    }
    get global() { return false; }
    get type() { return 'datatype'; }
    get defaultAccessibility() { return EntityAccessibility.invisible; }
    parser(context) { return new parser.PDataTypeDefine(this, context); }
    db(db) { return db.dataTypeDefine(this); }
    internalCreateSchema() { }
}
exports.DataTypeDefine = DataTypeDefine;
class Queue extends Entity {
    constructor() {
        super(...arguments);
        this.onceOnly = false;
    }
    get global() { return false; }
    get type() { return 'queue'; }
    parser(context) { return new parser.PQueue(this, context); }
    db(db) { return db.queue(this); }
    internalCreateSchema() { new schema_1.QueueSchemaBuilder(this.uq, this).build(this.schema); }
}
exports.Queue = Queue;
class EntityWithTable extends Entity {
    constructor() {
        super(...arguments);
        this.isConst = false;
    }
    getTableAlias() { return; }
    getTableName() { return this.name; }
    getArrTable(arr) { return; }
}
exports.EntityWithTable = EntityWithTable;
class Index {
    constructor(name, unique = false) {
        this.unique = false;
        this.fields = [];
        this.name = name;
        this.unique = unique;
    }
}
exports.Index = Index;
class IArr {
}
exports.IArr = IArr;
class Arr extends EntityWithTable {
    constructor() {
        super(...arguments);
        this.fields = [];
        this.isBus = false;
        this.isVarTable = true;
    }
    get type() { return 'arr'; }
    get global() { return true; }
    parser(context) { return new parser.PArr(this, context); }
    db(db) { return db.arr(this); }
    fieldPointer(name) {
        return this.fields.find(f => f.name === name) !== undefined ?
            new pointer_1.FieldPointer() : undefined;
    }
    getKeys() { return; }
    getFields() { return _.clone(this.fields); }
    getField(name) { return this.fields.find(v => v.name === name); }
    ;
    internalCreateSchema() { }
    ;
}
exports.Arr = Arr;
class Role extends Entity {
    constructor() {
        super(...arguments);
        this.names = { $: new Set() };
    }
    get type() { return '$role'; }
    get global() { return true; }
    get defaultAccessibility() { return EntityAccessibility.visible; }
    parser(context) { return new parser.PRole(this, context); }
    db(db) { return db.role(this); }
    internalCreateSchema() { new schema_1.RoleSchemaBuilder(this.uq, this).build(this.schema); }
    isValid(role, sub) {
        let subs;
        if (sub === undefined || sub === null) {
            subs = this.names['$'];
            if (subs === undefined)
                return false;
            if (sub === null)
                return true;
            return subs.has(role);
        }
        subs = this.names[role];
        if (subs === undefined)
            return false;
        return subs.has(sub);
    }
}
exports.Role = Role;
class Import extends Entity {
    get type() { return 'import'; }
    get global() { return true; }
    parser(context) { return new parser.PImport(this, context); }
    db(db) { return db.import(this); }
    internalCreateSchema() {
        let sb = new schema_1.ImportSchemaBuilder(this.uq, this);
        sb.build(this.schema);
    }
}
exports.Import = Import;
class BookBase extends EntityWithTable {
    constructor() {
        super(...arguments);
        this.keys = [];
        this.fields = [];
    }
    get global() { return false; }
    getTableAlias() { return; }
    getTableName() { return this.name; }
    fieldPointer(name) {
        if (this.keys.find(f => f.name === name) !== undefined)
            return new pointer_1.FieldPointer();
        return this.fields.find(f => f.name === name) !== undefined ?
            new pointer_1.FieldPointer() : undefined;
        ;
    }
    getKeys() { return this.keys; }
    getFields() { return _.concat([], this.keys, this.fields); }
    getArrTable(arr) { return; }
    getField(name) {
        let f = this.keys.find(f => f.name === name);
        if (f !== undefined)
            return f;
        return this.fields.find(f => f.name === name);
    }
}
exports.BookBase = BookBase;
class Book extends BookBase {
    get type() { return 'book'; }
    parser(context) { return new parser.PBook(this, context); }
    db(db) { return db.book(this); }
    internalCreateSchema() { new schema_1.BookSchemaBuilder(this.uq, this).build(this.schema); }
}
exports.Book = Book;
class HistoryBase extends EntityWithTable {
    constructor() {
        super(...arguments);
        this.fields = [];
    }
    get global() { return false; }
    //unit: Field;            // 单位
    getTableAlias() { return; }
    getTableName() { return this.name; }
    fieldPointer(name) {
        var _a, _b;
        if (this.date.name === name ||
            this.fields.find(f => f.name === name) !== undefined ||
            this.sheet !== undefined && (this.sheet.name == name || this.sheetType.name == name) ||
            ((_a = this.user) === null || _a === void 0 ? void 0 : _a.name) === name ||
            ((_b = this.row) === null || _b === void 0 ? void 0 : _b.name) == name)
            return new pointer_1.FieldPointer();
        return;
    }
    getArrTable(arr) { return; }
    getField(fieldName) {
        let f = this.fields.find(f => f.name === fieldName);
        if (f !== undefined)
            return f;
        if (fieldName === 'date')
            return this.date;
    }
}
exports.HistoryBase = HistoryBase;
class History extends HistoryBase {
    get type() { return 'history'; }
    parser(context) { return new parser.PHistory(this, context); }
    db(db) { return db.history(this); }
    getKeys() {
        return [this.date];
    }
    getFields() {
        let ret = [this.date, ...this.fields,
            this.sheetType, this.sheet, this.row, this.user /*, this.unit*/];
        return ret;
    }
    internalCreateSchema() { new schema_1.HistorySchemaBuilder(this.uq, this).build(this.schema); }
}
exports.History = History;
class Pending extends EntityWithTable {
    constructor() {
        super(...arguments);
        this.fields = [];
        this.keyFields = [];
    }
    get global() { return false; }
    get type() { return 'pending'; }
    parser(context) { return new parser.PPending(this, context); }
    db(db) { return db.pending(this); }
    internalCreateSchema() { new schema_1.PendingSchemaBuilder(this.uq, this).build(this.schema); }
    getKeys() { return this.keyFields; }
    getFields() { return this.fields; }
    getField(name) { return this.fields.find(f => f.name === name); }
    fieldPointer(name) {
        if (this.fields.find(f => f.name === name) !== undefined) {
            return new pointer_1.FieldPointer();
        }
        return;
    }
}
exports.Pending = Pending;
class ActionBase extends Entity {
    constructor() {
        super(...arguments);
        this.fields = [];
        this.arrs = [];
        this.tableVars = {};
        this.transactionOff = false;
    }
    get global() { return false; }
    addArr(arr) {
        this.arrs.push(arr);
    }
    addTableVar(tableVar) {
        let name = tableVar.name;
        let t = this.tableVars[name];
        if (t !== undefined)
            return false;
        this.tableVars[name] = tableVar;
        return true;
    }
    getTableVar(name) { return this.tableVars[name]; }
    nameUnique() {
        let ret = [];
        let keys = {};
        this.fields.forEach(f => {
            let fn = f.name;
            if (keys[fn] === undefined)
                keys[fn] = f;
            else
                ret.push(fn);
        });
        this.arrs.forEach(a => {
            let an = a.name;
            if (keys[an] === undefined)
                keys[an] = a;
            else
                ret.push(an);
            a.fields.forEach(f => {
                let fn = f.name;
                if (keys[fn] === undefined)
                    keys[fn] = f;
                else
                    ret.push(fn);
            });
        });
        if (ret.length === 0)
            return;
        return ret;
    }
}
exports.ActionBase = ActionBase;
class Returns extends element_1.IElement {
    constructor() {
        super(...arguments);
        this.returns = [];
    }
    get type() { return 'returns;'; }
    parser(context, owner) { return new parser.PReturns(owner, this, context); }
    addPage(page) {
        this.page = page;
        this.returns.push(page);
    }
    addRet(ret) {
        this.returns.push(ret);
    }
}
exports.Returns = Returns;
class QueryBase extends ActionBase {
    get type() { return 'query'; }
    parser(context) { return new parser.PQuery(this, context); }
    db(db) { return db.query(this); }
    internalCreateSchema() { new schema_1.QuerySchemaBuilder(this.uq, this).build(this.schema); }
    getReturns() { return this.returns; }
}
exports.QueryBase = QueryBase;
class ActionHasInBus extends ActionBase {
}
exports.ActionHasInBus = ActionHasInBus;
class BusAccept extends ActionHasInBus {
    constructor() {
        super(...arguments);
        this.statements = []; // for multiple accept of one bus
        this.buses = [];
        this.hasParams = false;
        this.hasLocal = false;
        this.isQuery = false;
    }
    get type() { return 'accept'; }
    parser(context) { return; }
    db(db) { return; }
    useBusFace(bus, face, arr, local) {
        useBusFace(this.buses, bus, face, arr, local);
    }
    internalCreateSchema() { }
    ;
    merge(accept) {
        this.statements.push(accept.statement);
    }
}
exports.BusAccept = BusAccept;
class BusQuery extends QueryBase {
    constructor() {
        super(...arguments);
        this.buses = [];
        this.hasParams = false;
    }
    useBusFace(bus, face, arr, local) {
        useBusFace(this.buses, bus, face, arr, false);
    }
}
exports.BusQuery = BusQuery;
class Bus extends Entity {
    constructor() {
        super(...arguments);
        this.outFaces = {};
        this.accepts = {};
        this.queries = [];
    }
    get type() { return 'bus'; }
    get global() { return false; }
    parser(context) { return new parser.PBus(this, context); }
    db(db) { return db.bus(this); }
    internalCreateSchema() { new schema_1.BusSchemaBuilder(this.uq, this).build(this.schema); }
    newBusAccept(face, jFace) {
        let ba = new BusAccept(this.uq);
        ba.name = face;
        if (jFace !== face)
            ba.jName = jFace;
        ba.statement = new statement_1.BusAcceptStatement(undefined, ba);
        this.accepts[face] = ba;
        return ba;
    }
    newBusQuery(face, jFace) {
        let bq = new BusQuery(this.uq);
        bq.name = face;
        if (jFace !== face)
            bq.jName = jFace;
        bq.statement = new statement_1.BusQueryStatement(undefined, bq);
        this.queries.push(bq);
        return bq;
    }
    merge(bus) {
        let { outFaces, source, queries, accepts } = bus;
        Object.assign(this.outFaces, outFaces);
        for (let i in accepts) {
            let accept = accepts[i];
            let acc = this.accepts[i];
            if (acc === undefined) {
                acc = this.accepts[i] = accept;
            }
            acc.merge(accept);
        }
        /*
        for (let i in this.accepts) {
            const accept = this.accepts[i];
            let { statement } = accept;
            accept.statement = new BusAcceptStatement(undefined, accept);
            accept.statement.statements.push(statement);
        }
        */
        this.source += source;
        if (queries.length > 0) {
            for (let q of queries) {
                let { name } = q;
                let qr = this.queries.find(v => v.name === name);
                if (qr !== undefined) {
                    return `duplicate query ${name} in BUS ${this.name}`;
                }
            }
        }
    }
}
exports.Bus = Bus;
class InBusAction extends ActionBase {
    constructor(ownerAction) {
        super(ownerAction.uq);
        this.ownerAction = ownerAction;
    }
    get type() { return 'inbus'; }
    parser(context) { return new parser.PInBusAction(this, context); }
    db(db) { return; }
    getReturns() { return this.returns; }
    internalCreateSchema() { }
    ;
}
exports.InBusAction = InBusAction;
function useBusFace(buses, bus, face, arr, local) {
    let bf = buses.find(bf => bf.bus === bus);
    if (bf === undefined) {
        buses.push({ bus, faces: [{ face, arrs: [], local }] });
    }
    else {
        let f = bf.faces.find(f => f.face === face);
        if (f === undefined) {
            let arrs = arr ? [arr] : [];
            bf.faces.push({ face, arrs, local });
        }
        else {
            if (local === true) {
                f.local = local;
            }
            if (arr) {
                if (f.arrs.findIndex(v => v === arr) < 0) {
                    f.arrs.push(arr);
                }
            }
        }
    }
}
exports.useBusFace = useBusFace;
class Query extends QueryBase {
    get type() { return 'query'; }
    get defaultAccessibility() { return EntityAccessibility.visible; }
}
exports.Query = Query;
class Sheet extends ActionBase {
    constructor() {
        super(...arguments);
        this.start = new SheetState(this.uq);
        this.states = {};
    }
    get type() { return 'sheet'; }
    get defaultAccessibility() { return EntityAccessibility.visible; }
    parser(context) { return new parser.PSheet(this, context); }
    db(db) { return db.sheet(this); }
    internalCreateSchema() { new schema_1.SheetSchemaBuilder(this.uq, this).build(this.schema); }
    createRun() { return new schema_1.SheetRun(this); }
    eachChild(callback) {
        for (let i in this.states)
            callback(this.states[i], i);
    }
}
exports.Sheet = Sheet;
class SheetVerify extends ActionHasInBus {
    get type() { return 'verify'; }
    get global() { return false; }
    parser(context) { return new parser.PSheetVerify(this, context); }
    db(db) { return; }
    getReturns() { return this.returns; }
    internalCreateSchema() { }
    ;
}
exports.SheetVerify = SheetVerify;
var StateTo;
(function (StateTo) {
    StateTo[StateTo["to"] = 0] = "to";
    StateTo[StateTo["reply"] = 1] = "reply";
    StateTo[StateTo["origin"] = 2] = "origin";
})(StateTo || (exports.StateTo = StateTo = {}));
;
class SheetState extends Entity {
    constructor() {
        super(...arguments);
        this.to = StateTo.to;
    }
    get type() { return 'sheetstate'; }
    get global() { return false; }
    //builder(context: builder.Context) { return context.sheetState(this); }
    parser(context) { return new parser.PSheetState(this, context); }
    db(db) { return db.sheetState(this); }
    addAction(sheetAction) {
        if (this.actions === undefined)
            this.actions = {};
        let sn = sheetAction.name;
        if (this.actions[sn] !== undefined)
            return false;
        this.actions[sn] = sheetAction;
        return true;
    }
    eachChild(callback) {
        if (this.actions === undefined)
            return;
        for (let i in this.actions)
            callback(this.actions[i], i);
    }
    internalCreateSchema() { }
    ;
}
exports.SheetState = SheetState;
class SheetAction extends ActionHasInBus {
    //inBuses: InBusAction[];
    //arrs: Arr[];
    get type() { return 'sheetaction'; }
    get global() { return false; }
    constructor(uq, actionName) {
        super(uq);
        this.buses = [];
        this.hasSend = false;
        this.templets = [];
        this.name = actionName;
    }
    parser(context) { return new parser.PSheetAction(this, context); }
    db(db) { return db.sheetAction(this); }
    useBusFace(bus, face, arr, local) {
        useBusFace(this.buses, bus, face, arr, local);
    }
    useSend() { this.hasSend = true; }
    getReturns() { return this.returns; }
    internalCreateSchema() { }
    ;
}
exports.SheetAction = SheetAction;
class EntityVarTable extends Entity {
    constructor(tableVar) {
        super(undefined);
        this.isVarTable = true;
        this.tableVar = tableVar;
        let { keys } = tableVar;
        this.keys = keys;
    }
    db(db) {
        throw new Error("Method not implemented.");
    }
    parser(context) {
        throw new Error("Method not implemented.");
    }
    getTableAlias() {
        return 'a';
    }
    getTableName() {
        return this.tableVar.name;
    }
    fieldPointer(name) {
        return this.tableVar.fields.find(f => f.name === name) !== undefined ?
            new pointer_1.FieldPointer() : undefined;
    }
    getKeys() {
        return this.keys;
    }
    getFields() {
        return this.tableVar.fields;
    }
    getArrTable(arr) {
        throw new Error("Method not implemented.");
    }
    internalCreateSchema() { }
    ;
}
exports.EntityVarTable = EntityVarTable;
class Templet extends Entity {
    get type() { return 'templet'; }
    get global() { return false; }
    parser(context) {
        return new parser.PTemplet(this, context);
    }
    db(db) { return; }
    internalCreateSchema() { new schema_1.TempletSchemaBuilder(this.uq, this).build(this.schema); }
}
exports.Templet = Templet;
//# sourceMappingURL=entity.js.map