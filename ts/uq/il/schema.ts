import { charField, Field, intField, textField } from './field';
import { Uq } from './uq';
import {
    Entity, Returns, Act, Tuid, Sheet, Query, History, Book,
    SheetState, SheetAction, Bus, BusFace, Map, BookBase, Import, ID,
    Templet, TempletFace, Role, ActionParamConvert, Enum, IX, IDX, Const, Queue, Pending, Permit
} from './entity';
import { FaceAcceptSchema, FaceQuerySchema } from './busSchema';

export interface SField {
    name: string;
    type: string;
    null: boolean;
}

export interface SArr {
    name: string;
    fields: SField[];
}

export interface Schema {
    name: string;
    type: string;
    sys?: boolean;
    fields: SField[];
    arrs: SArr[];
    private: boolean;
    values?: { [key: string]: number | string };
}
export class SchemaBuilder<E extends Entity> {
    protected readonly uq: Uq;
    protected readonly entity: E;
    constructor(uq: Uq, entity: E) {
        this.uq = uq;
        this.entity = entity;
    }

    build(schema: Schema, res?: { [phrase: string]: string }) {
        let { sName, type, isSys, isPrivate, keyValuesSchema } = this.entity;
        schema.name = sName;
        schema.type = type;
        schema.private = isPrivate;
        if (isSys === true) schema.sys = true;
        schema.fields = [];
        schema.values = keyValuesSchema;
    }

    protected addField(schema: Schema, fields: Field[]) {
        this.internalAddField(schema.fields, fields);
    }

    protected addArr(schema: Schema, arrName: string, fields: Field[]): SArr {
        if (schema.arrs === undefined) schema.arrs = [];
        let sArr = {
            name: arrName,
            fields: [],
        }
        this.internalAddField(sArr.fields, fields);
        schema.arrs.push(sArr);
        return sArr;
    }

    protected internalAddField(toFields: SField[], fields: Field[]) {
        if (fields === undefined) return;
        for (let field of fields) {
            let sf = field.toSField();
            toFields.push(sf);
        }
    }

    protected buildReturns(returns: Returns): any[] {
        let ret = [];
        for (let r of returns.returns) {
            let { sName, fields, convertType } = r;
            ret.push(this.buildReturn(sName, fields, convertType, (r as any).order));
        }
        return ret;
    }

    protected buildReturn(sName: string, fields: Field[], convertType: string, order: any): any {
        let a = {
            name: sName,
            fields: [] as SField[],
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

interface EnumSchema extends Schema {
}
export class EnumSchemaBuilder extends SchemaBuilder<Enum> {
    build(schema: EnumSchema) {
        super.build(schema);
        schema.fields = undefined;
    }
}

interface ConstSchema extends Schema {
    // values: { [name: string]: number | string };
}
export class ConstSchemaBuilder extends SchemaBuilder<Const> {
    build(schema: ConstSchema) {
        super.build(schema);
        schema.values = this.entity.keyValuesSchema;
    }
}

export class QueueSchemaBuilder extends SchemaBuilder<Queue> {
}

interface RoleSchema extends Schema {
    names: { [name: string]: string[] };
}
export class RoleSchemaBuilder extends SchemaBuilder<Role> {
    build(schema: RoleSchema) {
        super.build(schema);
        schema.fields = undefined;
        let ret: { [name: string]: string[] } = {};
        let { names } = this.entity;
        for (let i in names) {
            ret[i] = Array.from(names[i]);
        }
        schema.names = ret;
    }
}

interface ImportSchema extends Schema {
    uqOwner: string;
    uqName: string;
}
export class ImportSchemaBuilder extends SchemaBuilder<Import> {
    build(schema: ImportSchema) {
        super.build(schema);
        let { uqOwner, uqName } = this.entity;
        schema.uqOwner = uqOwner;
        schema.uqName = uqName;
    }
}

interface BusSchema extends Schema {
    url: string;
    busOwner: string;
    busName: string;
    schema: any;
    version: number;
    outCount: number; // 使用过的往外写的face数
}
export class BusSchemaBuilder extends SchemaBuilder<Bus> {
    build(schema: BusSchema) {
        super.build(schema);
        schema.version = this.entity.shareSchema.version;
        schema.fields = undefined;
        let { shareSchema, busOwner, busName, outFaces, accepts } = this.entity;
        schema.busOwner = busOwner;
        schema.busName = busName;
        let outCount = 0;
        for (let i in outFaces) {
            if (outFaces[i] === true) ++outCount;
        }
        if (outCount > 0) schema.outCount = outCount;
        let s = schema.schema = {}
        let faceSchemas = shareSchema.faceSchemas;
        for (let i in faceSchemas) {
            let faceSchema = faceSchemas[i];
            if (faceSchema === undefined) continue;
            switch (faceSchema.type) {
                case 'accept':
                    s[i] = this.toFieldsArrs((faceSchema as FaceAcceptSchema).busFields);
                    /*
                    let acceptArr = accepts.filter(v => v.name === );
                    let { length } = acceptArr;
                    if (length === 0) break;
                    */
                    let accept = accepts[faceSchema.name];
                    if (accept === undefined) break;
                    let { inBuses } = accept;
                    let dup: number;
                    // if (length > 1) dup = length;
                    s[i].accept = {
                        inBuses: inBuses && inBuses.map(v => v.bus.name + '/' + v.faceQuerySchema.name),
                        // dup,
                    };
                    break;
                case 'query':
                    s[i] = this.toQuerySchemaFieldsArrs(faceSchema as FaceQuerySchema);
                    break;
            }
        }
    }

    private toQuerySchemaFieldsArrs(faceSchema: FaceQuerySchema): any {
        let { name, param, returns } = faceSchema;
        return {
            param: param,
            returns: this.toFieldsArrs(returns),
            query: this.entity.queries.find(v => v.name === name) !== undefined,
        }
    }

    private toFieldsArrs(items: any[]): any {
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
        if (ret.arrs.length === 0) ret.arrs = undefined;
        return ret;
    }
}

export interface SchemaBusFace {
    name: string;
    owner: string;
    bus: string;
    faces: {
        name: string;
        arr: string[];
    }[];
}


interface ActSchema extends Schema {
    isOpen: boolean;
    returns: any[];
    inBuses: any[];
    // role: { [crudl: string]: string[] };
    paramConvert: ActionParamConvert;
    proxy: string;
    auth: string;
}
export class ActSchemaBuilder extends SchemaBuilder<Act> {
    build(schema: ActSchema) {
        super.build(schema);
        let { proxy, auth, fields, inBuses, paramConvert, isOpen } = this.entity;
        schema.proxy = proxy?.name;
        schema.auth = auth?.name;
        // schema.role = role;
        if (isOpen === true) schema.isOpen = true;
        this.addField(schema, fields);
        if (paramConvert !== undefined) {
            this.addField(schema, [textField(paramConvert.name)]);
        }
        for (let arr of this.entity.arrs) {
            let { sName, fields, isBus } = arr;
            if (isBus === true) continue;
            this.addArr(schema, sName, fields);
        }
        schema.paramConvert = paramConvert
        schema.returns = this.buildReturns(this.entity.returns);

        if (inBuses !== undefined) {
            schema.inBuses = inBuses.map(v => v.bus.name + '/' + v.faceQuerySchema.name);
        }
    }
}

export interface STuidArr extends SArr {
    id: string;
    order: string;
}
export class ActionRun {
    //hasSend: boolean;
    busFaces: SchemaBusFace[];
    //templets: TempletFace[] = [];
    constructor(hasSend: boolean, buses: BusFace[], templets: TempletFace[]) {
        //this.hasSend = hasSend;
        this.busFaces = convertToSchemaBusFace(buses);
        //this.templets = templets;
    }
}

interface TuidSchema extends Schema {
    global: boolean;
    id: string;
    from: { owner: string; uq: string; peer: string, all: boolean }
    sync: boolean;			// changed to isPull
    isOpen: boolean;
    main: string[];
    unique: string[];
    search: string[];
    // role: { [crudl: string]: string[] };
    $create: boolean;
    $update: boolean;
    stampOnMain: boolean;		// ids 查询时，是不是自动带stamp
}
export class TuidSchemaBuilder extends SchemaBuilder<Tuid> {
    build(schema: TuidSchema) {
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
        if (stampCreate === true) schema.$create = true;
        if (stampUpdate === true) schema.$update = true;
        if (stampOnMain === true) schema.stampOnMain = true;
        if (id !== undefined) {
            schema.id = id.name;
            let uniq = unique;
            if (uniq !== undefined) schema.unique = uniq.fields.map(f => f.name);
            schema.search = search;
            this.addField(schema, main);
            this.addField(schema, fields);
            schema.main = main.map(v => v.sName);
            if (arrs !== undefined) {
                for (let ar of arrs) {
                    let { sName, id, ownerField, orderField, main, fields } = ar;
                    let sArr: STuidArr = this.addArr(schema, sName, ar.getFields()) as STuidArr;
                    sArr.id = id.name;
                    (sArr as any).owner = ownerField.name;
                    sArr.order = orderField.name;
                    (sArr as any).main = main.length > 0 ?
                        main.map(v => v.sName) : fields.map(v => v.sName);
                }
            }
        }
    }
}

interface QuerySchema extends Schema {
    returns: any[];
    // role: { [crudl: string]: string[] };
    orderSwitch: string[];
    proxy: string;
    auth: string;
}
export class QuerySchemaBuilder extends SchemaBuilder<Query> {
    build(schema: QuerySchema) {
        super.build(schema);
        let { proxy, auth, fields, arrs, returns } = this.entity;
        schema.proxy = proxy?.name;
        schema.auth = auth?.name;
        let { page } = returns;
        // schema.role = role;
        if (page) {
            let { orderSwitch } = page;
            if (orderSwitch && orderSwitch.length > 0) {
                this.addField(schema, [charField('$orderSwitch', 50)]);
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
            rets.push(this.buildReturn(sName, fields, convertType, (r as any).order));
        }
        schema.returns = rets;
    }
}

interface HistorySchema extends Schema {
    keys: SField[];
    date: string;
    sheetType: string;            // 单据类型id, int
    sheet: string;           // 单据id字段名称,bigint
    row: string;             // 单据行号名称,smallint, 每个单据不能超过3万行
    user: string;            // 操作人
    unit: string;            // 单位
    returns: any[];
}
export class HistorySchemaBuilder extends SchemaBuilder<History> {
    build(schema: HistorySchema) {
        super.build(schema);
        let { fields, date, sheetType, sheet, row, user/*, unit*/ } = this.entity;
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
        let sFields: SField[] = [];
        this.internalAddField(sFields, fields);
        let retFields: SField[] = [date.toSField(), ...sFields];
        if (sheet !== undefined) {
            retFields.push(sheetType.toSField());
            retFields.push(sheet.toSField());
            retFields.push(row.toSField());
        }
        if (user !== undefined) retFields.push(user.toSField());
        //if (unit !== undefined) retFields.push(unit.toSField());

        schema.returns = [
            {
                name: '$page',
                fields: retFields,
            }
        ]
    }
}

export class PendingSchemaBuilder extends SchemaBuilder<Pending> {
}

interface BookBaseSchema extends Schema {
}
export abstract class BookBaseSchemaBuilder<E extends BookBase> extends SchemaBuilder<E> {
    build(schema: BookBaseSchema) {
        super.build(schema);
    }
}
interface BookSchema extends BookBaseSchema {
    returns: any[];
}
export class BookSchemaBuilder extends BookBaseSchemaBuilder<Book> {
    build(schema: BookSchema) {
        super.build(schema);
        // 这个地方为slave book 临时凑的代码, 以后有机会再调整
        let { keys, fields } = this.entity;
        let len = keys.length;
        this.addField(schema, keys);
        let lastKey = keys[len - 1];
        schema.fields.pop();
        let sFields: SField[] = [];
        this.internalAddField(sFields, fields);
        let retFields: SField[] = [lastKey.toSField(), ...sFields];
        schema.returns = [
            {
                name: '$page',
                fields: retFields,
            }
        ]
    }
}

interface MapSchema extends BookBaseSchema {
    keys: SField[];
    from: { owner: string; uq: string; peer: string }
    isOpen: boolean;
    actions: any;
    queries: any;
    // role: { [crudl: string]: string[] };
}
export class MapSchemaBuilder extends BookBaseSchemaBuilder<Map> {
    build(schema: MapSchema) {
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

interface SheetStateSchema {
    name: string;
    actions: SheetActionSchema[];
}

interface SheetActionSchema {
    name: string;
    returns: any[];
    inBuses: any[];
    // role: { [crudl: string]: string[] };
}

interface SheetSchema extends Schema {
    verify: {
        inBuses: any[];
        returns: any[];
    }
    states: SheetStateSchema[];
}
export class SheetSchemaBuilder extends SchemaBuilder<Sheet> {
    build(schema: SheetSchema) {
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
            }
        }
        schema.states = [];
        schema.states.push(this.buildStartSchema(this.entity));
        for (let s in states) {
            schema.states.push(this.buildStateSchema(states[s]));
        }
    }

    private buildStartSchema(sheet: Sheet): SheetStateSchema {
        let ret: SheetStateSchema = {
            name: '$',
            actions: []
        };
        let state = sheet.start;
        for (let a in state.actions) {
            if (a === '$onsave') continue;
            let action = state.actions[a];
            let actionSchema = this.buildActionSchema(action);
            ret.actions.push(actionSchema);
        }
        return ret;
    }

    private buildStateSchema(state: SheetState): SheetStateSchema {
        let ret = {
            name: state.name,
            actions: []
        };
        for (let a in state.actions) {
            ret.actions.push(this.buildActionSchema(state.actions[a]));
        }
        return ret;
    }

    private buildActionSchema(action: SheetAction): SheetActionSchema {
        let { name, returns, inBuses } = action;
        return {
            name: name,
            returns: this.buildReturns(returns),
            inBuses: inBuses && inBuses.map(v => v.bus.name + '/' + v.faceQuerySchema.name),
            // role: role
        };
    }
}

export class SheetRun {
    run: { [state: string]: { [action: string]: ActionRun } };
    constructor(sheet: Sheet) {
        this.run = {};
        this.build('$', sheet.start);
        for (let i in sheet.states) {
            this.build(i, sheet.states[i]);
        }
    }
    private build(name: string, state: SheetState) {
        let s: { [action: string]: ActionRun } = {};
        this.run[name] = s;
        for (let i in state.actions) {
            let action = state.actions[i];
            let { hasSend, buses, templets } = action;
            s[i] = new ActionRun(hasSend, buses, templets);
        }
    }
}

function convertToSchemaBusFace(buses: BusFace[]): SchemaBusFace[] {
    if (buses === undefined) return;
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
                }
            })
        };
    });
}

interface TempletSchema extends Schema {
    params: string[];
    subjectSections: string[];
    sections: string[];
}
export class TempletSchemaBuilder extends SchemaBuilder<Templet> {
    build(schema: TempletSchema) {
        super.build(schema);
        let { params, subjectSections, sections } = this.entity;
        schema.params = params;
        schema.subjectSections = subjectSections;
        schema.sections = sections;
    }
}

interface IDSchema extends Schema {
    keys: SField[];
    stars: string[];
    owner: boolean;
    nameNoVice: string[];
    create: boolean;
    update: boolean;
    global: boolean;
    isMinute: boolean;
    idType: number;
    permit: string;
    joins: { ID: string; field: string; }[];
}
function permitToString(permit: Permit) {
    if (permit === undefined) return undefined;
    let { role, write } = permit;
    let ret = '+' + write.join('+');
    if (role) ret = role + ret;
    return ret;
}
export class IDSchemaBuilder extends SchemaBuilder<ID> {
    build(schema: IDSchema) {
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

interface IDXSchema extends Schema {
    create: boolean;
    update: boolean;
    permit: string;
}
export class IDXSchemaBuilder extends SchemaBuilder<IDX> {
    build(schema: IDXSchema) {
        super.build(schema);
        let { fields, stampCreate, stampUpdate, permit } = this.entity;
        this.addField(schema, fields);
        schema.permit = permitToString(permit);
        schema.create = stampCreate;
        schema.update = stampUpdate;
    }
}

interface IXSchema extends Schema {
    ixxx: boolean;
    ixx: boolean;
    idIsUser: boolean;  // 以后去掉。仅仅为了兼容以前ix定义为id
    ixIsUser: boolean;
    hasSort: boolean;
    create: boolean;
    update: boolean;
    xType: number;
    seq: boolean;
    permit: string;
}
export class IXSchemaBuilder extends SchemaBuilder<IX> {
    build(schema: IXSchema) {
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
