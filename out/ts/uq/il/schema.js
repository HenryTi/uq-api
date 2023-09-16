"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IXSchemaBuilder = exports.IDXSchemaBuilder = exports.IDSchemaBuilder = exports.TempletSchemaBuilder = exports.SheetRun = exports.SheetSchemaBuilder = exports.MapSchemaBuilder = exports.BookSchemaBuilder = exports.BookBaseSchemaBuilder = exports.PendingSchemaBuilder = exports.HistorySchemaBuilder = exports.QuerySchemaBuilder = exports.TuidSchemaBuilder = exports.ActionRun = exports.ActSchemaBuilder = exports.BusSchemaBuilder = exports.ImportSchemaBuilder = exports.RoleSchemaBuilder = exports.QueueSchemaBuilder = exports.ConstSchemaBuilder = exports.EnumSchemaBuilder = exports.SchemaBuilder = void 0;
const field_1 = require("./field");
class SchemaBuilder {
    constructor(uq, entity) {
        this.uq = uq;
        this.entity = entity;
    }
    build(schema, res) {
        let { sName, type, isSys, isPrivate, keyValuesSchema } = this.entity;
        schema.name = sName;
        schema.type = type;
        schema.private = isPrivate;
        if (isSys === true)
            schema.sys = true;
        schema.fields = [];
        schema.values = keyValuesSchema;
    }
    addField(schema, fields) {
        this.internalAddField(schema.fields, fields);
    }
    addArr(schema, arrName, fields) {
        if (schema.arrs === undefined)
            schema.arrs = [];
        let sArr = {
            name: arrName,
            fields: [],
        };
        this.internalAddField(sArr.fields, fields);
        schema.arrs.push(sArr);
        return sArr;
    }
    internalAddField(toFields, fields) {
        if (fields === undefined)
            return;
        for (let field of fields) {
            let sf = field.toSField();
            toFields.push(sf);
        }
    }
    buildReturns(returns) {
        let ret = [];
        for (let r of returns.returns) {
            let { sName, fields, convertType } = r;
            ret.push(this.buildReturn(sName, fields, convertType, r.order));
        }
        return ret;
    }
    buildReturn(sName, fields, convertType, order) {
        let a = {
            name: sName,
            fields: [],
            convert: convertType,
            order
        };
        let aFields = a.fields;
        for (let f of fields) {
            aFields.push(f.toSField());
        }
        return a;
    }
}
exports.SchemaBuilder = SchemaBuilder;
class EnumSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        schema.fields = undefined;
    }
}
exports.EnumSchemaBuilder = EnumSchemaBuilder;
class ConstSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        schema.values = this.entity.keyValuesSchema;
    }
}
exports.ConstSchemaBuilder = ConstSchemaBuilder;
class QueueSchemaBuilder extends SchemaBuilder {
}
exports.QueueSchemaBuilder = QueueSchemaBuilder;
class RoleSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        schema.fields = undefined;
        let ret = {};
        let { names } = this.entity;
        for (let i in names) {
            ret[i] = Array.from(names[i]);
        }
        schema.names = ret;
    }
}
exports.RoleSchemaBuilder = RoleSchemaBuilder;
class ImportSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { uqOwner, uqName } = this.entity;
        schema.uqOwner = uqOwner;
        schema.uqName = uqName;
    }
}
exports.ImportSchemaBuilder = ImportSchemaBuilder;
class BusSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        schema.version = this.entity.shareSchema.version;
        schema.fields = undefined;
        let { shareSchema, busOwner, busName, outFaces, accepts } = this.entity;
        schema.busOwner = busOwner;
        schema.busName = busName;
        let outCount = 0;
        for (let i in outFaces) {
            if (outFaces[i] === true)
                ++outCount;
        }
        if (outCount > 0)
            schema.outCount = outCount;
        let s = schema.schema = {};
        let faceSchemas = shareSchema.faceSchemas;
        for (let i in faceSchemas) {
            let faceSchema = faceSchemas[i];
            if (faceSchema === undefined)
                continue;
            switch (faceSchema.type) {
                case 'accept':
                    s[i] = this.toFieldsArrs(faceSchema.busFields);
                    /*
                    let acceptArr = accepts.filter(v => v.name === );
                    let { length } = acceptArr;
                    if (length === 0) break;
                    */
                    let accept = accepts[faceSchema.name];
                    if (accept === undefined)
                        break;
                    let { inBuses } = accept;
                    let dup;
                    // if (length > 1) dup = length;
                    s[i].accept = {
                        inBuses: inBuses && inBuses.map(v => v.bus.name + '/' + v.faceQuerySchema.name),
                        // dup,
                    };
                    break;
                case 'query':
                    s[i] = this.toQuerySchemaFieldsArrs(faceSchema);
                    break;
            }
        }
    }
    toQuerySchemaFieldsArrs(faceSchema) {
        let { name, param, returns } = faceSchema;
        return {
            param: param,
            returns: this.toFieldsArrs(returns),
            query: this.entity.queries.find(v => v.name === name) !== undefined,
        };
    }
    toFieldsArrs(items) {
        let ret = {
            fields: [],
            arrs: [],
        };
        for (let item of items) {
            if (item.type === 'array')
                ret.arrs.push(item);
            else
                ret.fields.push(item);
        }
        if (ret.arrs.length === 0)
            ret.arrs = undefined;
        return ret;
    }
}
exports.BusSchemaBuilder = BusSchemaBuilder;
class ActSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { proxy, auth, fields, inBuses, paramConvert, isOpen } = this.entity;
        schema.proxy = proxy === null || proxy === void 0 ? void 0 : proxy.name;
        schema.auth = auth === null || auth === void 0 ? void 0 : auth.name;
        // schema.role = role;
        if (isOpen === true)
            schema.isOpen = true;
        this.addField(schema, fields);
        if (paramConvert !== undefined) {
            this.addField(schema, [(0, field_1.textField)(paramConvert.name)]);
        }
        for (let arr of this.entity.arrs) {
            let { sName, fields, isBus } = arr;
            if (isBus === true)
                continue;
            this.addArr(schema, sName, fields);
        }
        schema.paramConvert = paramConvert;
        schema.returns = this.buildReturns(this.entity.returns);
        if (inBuses !== undefined) {
            schema.inBuses = inBuses.map(v => v.bus.name + '/' + v.faceQuerySchema.name);
        }
    }
}
exports.ActSchemaBuilder = ActSchemaBuilder;
class ActionRun {
    //templets: TempletFace[] = [];
    constructor(hasSend, buses, templets) {
        //this.hasSend = hasSend;
        this.busFaces = convertToSchemaBusFace(buses);
        //this.templets = templets;
    }
}
exports.ActionRun = ActionRun;
class TuidSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { from, main, fields, id, sync, global, isOpen, unique, search, arrs, stampCreate, stampUpdate, stampOnMain } = this.entity;
        // schema.role = role;
        if (from !== undefined) {
            let { imp, peer, all } = from;
            let { uqOwner, uqName } = imp;
            schema.from = { owner: uqOwner, uq: uqName, peer: peer, all: all };
        }
        else if (isOpen === true) {
            schema.isOpen = true;
        }
        schema.global = global;
        schema.sync = sync;
        if (stampCreate === true)
            schema.$create = true;
        if (stampUpdate === true)
            schema.$update = true;
        if (stampOnMain === true)
            schema.stampOnMain = true;
        if (id !== undefined) {
            schema.id = id.name;
            let uniq = unique;
            if (uniq !== undefined)
                schema.unique = uniq.fields.map(f => f.name);
            schema.search = search;
            this.addField(schema, main);
            this.addField(schema, fields);
            schema.main = main.map(v => v.sName);
            if (arrs !== undefined) {
                for (let ar of arrs) {
                    let { sName, id, ownerField, orderField, main, fields } = ar;
                    let sArr = this.addArr(schema, sName, ar.getFields());
                    sArr.id = id.name;
                    sArr.owner = ownerField.name;
                    sArr.order = orderField.name;
                    sArr.main = main.length > 0 ?
                        main.map(v => v.sName) : fields.map(v => v.sName);
                }
            }
        }
    }
}
exports.TuidSchemaBuilder = TuidSchemaBuilder;
class QuerySchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { proxy, auth, fields, arrs, returns } = this.entity;
        schema.proxy = proxy === null || proxy === void 0 ? void 0 : proxy.name;
        schema.auth = auth === null || auth === void 0 ? void 0 : auth.name;
        let { page } = returns;
        // schema.role = role;
        if (page) {
            let { orderSwitch } = page;
            if (orderSwitch && orderSwitch.length > 0) {
                this.addField(schema, [(0, field_1.charField)('$orderSwitch', 50)]);
                schema.orderSwitch = orderSwitch;
            }
        }
        this.addField(schema, fields);
        for (let arr of arrs) {
            let { sName, fields } = arr;
            this.addArr(schema, sName, fields);
        }
        let rets = [];
        for (let r of returns.returns) {
            let { sName, fields, convertType } = r;
            rets.push(this.buildReturn(sName, fields, convertType, r.order));
        }
        schema.returns = rets;
    }
}
exports.QuerySchemaBuilder = QuerySchemaBuilder;
class HistorySchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { fields, date, sheetType, sheet, row, user /*, unit*/ } = this.entity;
        schema.keys = [];
        //this.internalAddField(schema.keys, keys);
        this.addField(schema, fields);
        schema.date = date.name;
        if (sheet !== undefined) {
            schema.sheet = sheet.name;
            schema.sheetType = sheetType.name;
            schema.row = row.name;
        }
        schema.user = user && user.name;
        //schema.unit = unit && unit.name;
        let sFields = [];
        this.internalAddField(sFields, fields);
        let retFields = [date.toSField(), ...sFields];
        if (sheet !== undefined) {
            retFields.push(sheetType.toSField());
            retFields.push(sheet.toSField());
            retFields.push(row.toSField());
        }
        if (user !== undefined)
            retFields.push(user.toSField());
        //if (unit !== undefined) retFields.push(unit.toSField());
        schema.returns = [
            {
                name: '$page',
                fields: retFields,
            }
        ];
    }
}
exports.HistorySchemaBuilder = HistorySchemaBuilder;
class PendingSchemaBuilder extends SchemaBuilder {
}
exports.PendingSchemaBuilder = PendingSchemaBuilder;
class BookBaseSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
    }
}
exports.BookBaseSchemaBuilder = BookBaseSchemaBuilder;
class BookSchemaBuilder extends BookBaseSchemaBuilder {
    build(schema) {
        super.build(schema);
        // 这个地方为slave book 临时凑的代码, 以后有机会再调整
        let { keys, fields } = this.entity;
        let len = keys.length;
        this.addField(schema, keys);
        let lastKey = keys[len - 1];
        schema.fields.pop();
        let sFields = [];
        this.internalAddField(sFields, fields);
        let retFields = [lastKey.toSField(), ...sFields];
        schema.returns = [
            {
                name: '$page',
                fields: retFields,
            }
        ];
    }
}
exports.BookSchemaBuilder = BookSchemaBuilder;
class MapSchemaBuilder extends BookBaseSchemaBuilder {
    build(schema) {
        super.build(schema);
        let { keys, fields, from, isOpen } = this.entity;
        // schema.role = role;
        schema.keys = keys.map(f => f.toSField());
        this.addField(schema, fields);
        if (from !== undefined) {
            let { imp, peer } = from;
            let { uqOwner, uqName } = imp;
            schema.from = { owner: uqOwner, uq: uqName, peer: peer };
        }
        else if (isOpen === true) {
            schema.isOpen = true;
        }
        schema.actions = this.entity.actions;
        schema.queries = this.entity.queries;
    }
}
exports.MapSchemaBuilder = MapSchemaBuilder;
class SheetSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { fields, arrs, states, verify } = this.entity;
        // schema.role = role;
        this.addField(schema, fields);
        for (let arr of arrs) {
            let { sName, fields } = arr;
            this.addArr(schema, sName, fields);
        }
        if (verify !== undefined) {
            let { inBuses } = verify;
            schema.verify = {
                inBuses: inBuses && inBuses.map(v => v.bus.name + '/' + v.faceQuerySchema.name),
                returns: this.buildReturns(verify.returns)
            };
        }
        schema.states = [];
        schema.states.push(this.buildStartSchema(this.entity));
        for (let s in states) {
            schema.states.push(this.buildStateSchema(states[s]));
        }
    }
    buildStartSchema(sheet) {
        let ret = {
            name: '$',
            actions: []
        };
        let state = sheet.start;
        for (let a in state.actions) {
            if (a === '$onsave')
                continue;
            let action = state.actions[a];
            let actionSchema = this.buildActionSchema(action);
            ret.actions.push(actionSchema);
        }
        return ret;
    }
    buildStateSchema(state) {
        let ret = {
            name: state.name,
            actions: []
        };
        for (let a in state.actions) {
            ret.actions.push(this.buildActionSchema(state.actions[a]));
        }
        return ret;
    }
    buildActionSchema(action) {
        let { name, returns, inBuses } = action;
        return {
            name: name,
            returns: this.buildReturns(returns),
            inBuses: inBuses && inBuses.map(v => v.bus.name + '/' + v.faceQuerySchema.name),
            // role: role
        };
    }
}
exports.SheetSchemaBuilder = SheetSchemaBuilder;
class SheetRun {
    constructor(sheet) {
        this.run = {};
        this.build('$', sheet.start);
        for (let i in sheet.states) {
            this.build(i, sheet.states[i]);
        }
    }
    build(name, state) {
        let s = {};
        this.run[name] = s;
        for (let i in state.actions) {
            let action = state.actions[i];
            let { hasSend, buses, templets } = action;
            s[i] = new ActionRun(hasSend, buses, templets);
        }
    }
}
exports.SheetRun = SheetRun;
function convertToSchemaBusFace(buses) {
    if (buses === undefined)
        return;
    return buses.map(b => {
        let { bus, faces } = b;
        let { name, busOwner, busName } = bus;
        return {
            name: name,
            owner: busOwner,
            bus: busName,
            faces: faces && faces.map(f => {
                return {
                    name: f.face,
                    arr: f.arrs && f.arrs.map(v => v),
                };
            })
        };
    });
}
class TempletSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { params, subjectSections, sections } = this.entity;
        schema.params = params;
        schema.subjectSections = subjectSections;
        schema.sections = sections;
    }
}
exports.TempletSchemaBuilder = TempletSchemaBuilder;
function permitToString(permit) {
    if (permit === undefined)
        return undefined;
    let { role, write } = permit;
    let ret = '+' + write.join('+');
    if (role)
        ret = role + ret;
    return ret;
}
class IDSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        schema.keys = [];
        let { fields, keys, stars, stampCreate, stampUpdate, global, idType, isMinute, permit, joins } = this.entity;
        schema.create = stampCreate;
        schema.update = stampUpdate;
        schema.global = global;
        schema.idType = idType;
        schema.isMinute = isMinute;
        schema.permit = permitToString(permit);
        this.addField(schema, fields);
        this.internalAddField(schema.keys, keys);
        if (stars !== undefined) {
            schema.stars = stars;
        }
        if (joins !== undefined) {
            schema.joins = joins.map(v => ({ ID: v.ID.name, field: v.field.name }));
        }
    }
}
exports.IDSchemaBuilder = IDSchemaBuilder;
class IDXSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { fields, stampCreate, stampUpdate, permit } = this.entity;
        this.addField(schema, fields);
        schema.permit = permitToString(permit);
        schema.create = stampCreate;
        schema.update = stampUpdate;
    }
}
exports.IDXSchemaBuilder = IDXSchemaBuilder;
class IXSchemaBuilder extends SchemaBuilder {
    build(schema) {
        super.build(schema);
        let { fields, prev, ixx, stampCreate, stampUpdate, xType, permit } = this.entity;
        schema.ixx = ixx !== undefined;
        schema.create = stampCreate;
        schema.update = stampUpdate;
        schema.permit = permitToString(permit);
        schema.hasSort = (prev !== undefined);
        schema.xType = xType;
        this.addField(schema, fields);
    }
}
exports.IXSchemaBuilder = IXSchemaBuilder;
//# sourceMappingURL=schema.js.map