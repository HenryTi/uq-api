import * as _ from 'lodash';
import * as parser from '../../parser';
import { Uq } from '../uq';
import { Field, Table, IField, FieldsValues } from '../field';
import { DataType } from '../datatype';
import { IElement } from '../element';
import { Pointer, FieldPointer } from '../pointer';
import {
    BusAcceptStatement, TableVar
    , BusQueryStatement, QueryBaseStatement, InBusActionStatement, LocalTableBase
} from '../statement';
import {
    Schema, QuerySchemaBuilder, BusSchemaBuilder, HistorySchemaBuilder,
    PendingSchemaBuilder, BookSchemaBuilder,
    ImportSchemaBuilder, TempletSchemaBuilder, RoleSchemaBuilder,
    EnumSchemaBuilder,
    ConstSchemaBuilder,
    QueueSchemaBuilder
} from '../schema';
import { Builder } from '../builder';
import { ValueExpression } from '../Exp';
import { ShareSchema, FaceQuerySchema, FaceDataType } from '../busSchema';
import { SysProc } from './act';
// import { QueueSchemaBuilder } from '..';

export interface ImportFrom {
    imp: Import;
    peer: string;      // 对方的名字
    all: boolean;
}

export enum EntityAccessibility {
    invisible, visible
}
export abstract class Entity extends IElement {
    constructor(uq: Uq) {
        super();
        this.uq = uq;
        this.isPrivate = false;
    }
    get isBiz() { return false; }
    uq: Uq;
    name: string;
    jName: string;
    get sName() { return this.jName || this.name; } // 保持大小写的name
    ver: number;            // 只是为了源代码的变化，引发重新编译。暂时没有其它用处
    isSys: boolean;         // 系统生成的
    isVarTable: boolean = false;
    isSourceChanged: boolean = false;
    isOpen: boolean;
    isPrivate: boolean;
    keyValues: {
        [name: string]: {
            key: string;
            val: string | number | [string, string];
        }
    };
    keyValuesSchema: { [key: string]: string | number };
    source: string;
    schema: Schema;
    buildSchema(res?: { [phrase: string]: string }): void {
        if (this.schema !== undefined) return;
        this.schema = {} as any;
        this.internalCreateSchema(res);
    }
    protected abstract internalCreateSchema(res?: { [phrase: string]: string }): void;
    createRun() { return; }
    getArr(arrName: string): EntityWithTable { return; }
    abstract db(db: Builder): object;
    abstract get global(): boolean;
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.invisible }
    sharpFields: SharpField[];

    pushSharpFields(sharpField: SharpField) {
        if (this.sharpFields === undefined) this.sharpFields = [];
        this.sharpFields.push(sharpField);
    }
    getReturns(): Returns { return undefined; }
    calcKeyValue(key: string): string | number {
        if (this.keyValues === undefined) return undefined;
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

export class Enum extends Entity {
    // enum的值，应该只支持数字
    // values: { [key: string]: number } = {};
    // key是区分大小写的
    get global(): boolean { return false; }
    get type(): string { return 'enum'; }
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }
    uqOwner: string;
    uqName: string;

    parser(context: parser.PContext) { return new parser.PEnum(this, context); }
    db(db: Builder): object { return db.enm(this); }
    protected internalCreateSchema() { new EnumSchemaBuilder(this.uq, this).build(this.schema as any); }
}

export class Const extends Entity {
    values: { [name: string]: ValueExpression } = {};
    // namedValues: { [name: string]: string | number } = {};
    get global(): boolean { return false; }
    get type(): string { return 'const'; }
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }
    parser(context: parser.PContext) { return new parser.PConst(this, context); }
    db(db: Builder): object { return db._const(this); }
    protected internalCreateSchema() { new ConstSchemaBuilder(this.uq, this).build(this.schema as any); }
}

export class DataTypeDefine extends Entity {
    datatypes: { [name: string]: DataType } = {};
    get global(): boolean { return false; }
    get type(): string { return 'datatype'; }
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.invisible }
    parser(context: parser.PContext) { return new parser.PDataTypeDefine(this, context); }
    db(db: Builder): object { return db.dataTypeDefine(this); }
    protected internalCreateSchema() { }
}

export class Queue extends Entity {
    onceOnly: boolean = false;
    orderBy: 'asc' | 'desc';
    get global(): boolean { return false; }
    get type(): string { return 'queue'; }
    parser(context: parser.PContext) { return new parser.PQueue(this, context); }
    db(db: Builder): object { return db.queue(this); }
    protected internalCreateSchema() { new QueueSchemaBuilder(this.uq, this).build(this.schema as any); }
}

export abstract class EntityWithTable extends Entity implements Table {
    indexes: Index[];
    fieldsValuesList: FieldsValues[];
    isConst: boolean = false;
    stampCreate: boolean;
    stampUpdate: boolean;

    getTableAlias(): string { return; }
    getTableName(): string { return this.name; }
    abstract fieldPointer(name: string): Pointer;
    abstract getKeys(): Field[];
    abstract getFields(): Field[];
    abstract getField(name: string): Field;
    getArrTable(arr: string): Table { return }

    // $phrase 表，系统编译需要，uq sql查询也需要。
    // 在sysCore里面更新，在Uq sql entity更新的时候，不需要操作。所以设这个标志
    onlyForSyntax: boolean;
}

export class Index {
    name: string;
    unique: boolean = false;
    //unit: boolean = true;
    global: boolean;
    fields: Field[] = [];
    constructor(name: string, unique: boolean = false) {
        this.name = name;
        this.unique = unique;
    }
}

export class IArr {
    name: string;
    jName: string;
    sName: string;
    fields: IField[];
    busSource?: string;        // accept param busFieldName as name，bus source name
}

export class Arr extends EntityWithTable implements IArr {
    get type(): string { return 'arr'; }
    get global(): boolean { return true; }
    fields: Field[] = [];
    isBus: boolean = false;
    isVarTable = true;
    busSource?: string;        // accept param busFieldName as name，bus source name

    parser(context: parser.PContext) { return new parser.PArr(this, context); }
    db(db: Builder): object { return db.arr(this); }

    fieldPointer(name: string): Pointer {
        return this.fields.find(f => f.name === name) !== undefined ?
            new FieldPointer() : undefined;
    }
    getKeys(): Field[] { return; }
    getFields(): Field[] { return _.clone(this.fields); }
    getField(name: string): Field { return this.fields.find(v => v.name === name) };
    protected internalCreateSchema() { };
}

export interface AccessItem {
    entity: Entity;
    ops: string[];
}

export class Role extends Entity {
    names: { [name: string]: Set<string> } = { $: new Set<string>() };
    get type(): string { return '$role'; }
    get global(): boolean { return true; }
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }
    parser(context: parser.PContext) { return new parser.PRole(this, context); }
    db(db: Builder): object { return db.role(this); }
    protected internalCreateSchema() { new RoleSchemaBuilder(this.uq, this).build(this.schema as any); }
    isValid(role: string, sub: string): boolean {
        let subs: Set<string>;
        if (sub === undefined || sub === null) {
            subs = this.names['$'];
            if (subs === undefined) return false;
            if (sub === null) return true;
            return subs.has(role);
        }
        subs = this.names[role];
        if (subs === undefined) return false;
        return subs.has(sub);
    }
}

export class Import extends Entity {
    get type(): string { return 'import'; }
    get global(): boolean { return true; }
    uqOwner: string;
    uqName: string;

    parser(context: parser.PContext) { return new parser.PImport(this, context); }
    db(db: Builder): object { return db.import(this); }
    protected internalCreateSchema() {
        let sb = new ImportSchemaBuilder(this.uq, this);
        sb.build(this.schema as any);
    }
}

export abstract class BookBase extends EntityWithTable {
    get global(): boolean { return false; }
    keys: Field[] = [];
    fields: Field[] = [];

    getTableAlias(): string { return; }
    getTableName(): string { return this.name; }
    fieldPointer(name: string): Pointer {
        if (this.keys.find(f => f.name === name) !== undefined)
            return new FieldPointer();
        return this.fields.find(f => f.name === name) !== undefined ?
            new FieldPointer() : undefined;
        ;
    }
    getKeys(): Field[] { return this.keys; }
    getFields(): Field[] { return _.concat([], this.keys, this.fields); }
    getArrTable(arr: string): Table { return }
    getField(name: string): Field {
        let f = this.keys.find(f => f.name === name);
        if (f !== undefined) return f;
        return this.fields.find(f => f.name === name);
    }
}

export class Book extends BookBase {
    get type(): string { return 'book'; }
    parser(context: parser.PContext) { return new parser.PBook(this, context); }
    db(db: Builder): object { return db.book(this); }
    protected internalCreateSchema() { new BookSchemaBuilder(this.uq, this).build(this.schema as any) }
}

export abstract class HistoryBase extends EntityWithTable {
    get global(): boolean { return false; }
    date: Field;
    fields: Field[] = [];
    sheetType: Field;
    sheet: Field;           // 单据id字段名称,bigint
    row: Field;             // 单据行号名称,smallint, 每个单据不能超过3万行
    user: Field;            // 操作人
    //unit: Field;            // 单位

    getTableAlias(): string { return; }
    getTableName(): string { return this.name; }
    fieldPointer(name: string): Pointer {
        if (this.date.name === name ||
            this.fields.find(f => f.name === name) !== undefined ||
            this.sheet !== undefined && (this.sheet.name == name || this.sheetType.name == name) ||
            this.user?.name === name ||
            this.row?.name == name) return new FieldPointer();
        return;
    }
    abstract getKeys(): Field[];
    abstract getFields(): Field[];
    getArrTable(arr: string): Table { return }

    getField(fieldName: string): Field {
        let f = this.fields.find(f => f.name === fieldName);
        if (f !== undefined) return f;
        if (fieldName === 'date') return this.date;
    }
}

export class History extends HistoryBase {
    get type(): string { return 'history'; }

    parser(context: parser.PContext) { return new parser.PHistory(this, context); }
    db(db: Builder): object { return db.history(this); }
    getKeys(): Field[] {
        return [this.date];
    }
    getFields(): Field[] {
        let ret = [this.date, ...this.fields,
        this.sheetType, this.sheet, this.row, this.user/*, this.unit*/];
        return ret;
    }
    protected internalCreateSchema() { new HistorySchemaBuilder(this.uq, this).build(this.schema as any); }
}

export class Pending extends EntityWithTable {
    get global(): boolean { return false; }
    get type(): string { return 'pending'; }
    id: Field;
    done: Field;
    fields: Field[] = [];
    keyFields: Field[] = [];
    parser(context: parser.PContext) { return new parser.PPending(this, context); }
    db(db: Builder): object { return db.pending(this); }
    protected internalCreateSchema() { new PendingSchemaBuilder(this.uq, this).build(this.schema as any); }
    getKeys(): Field[] { return this.keyFields; }
    getFields(): Field[] { return this.fields; }
    getField(name: string): Field { return this.fields.find(f => f.name === name) }
    fieldPointer(name: string): Pointer {
        if (this.fields.find(f => f.name === name) !== undefined) {
            return new FieldPointer();
        }
        return;
    }
}

export interface Busable {
    useBusFace(bus: Bus, face: string, arr: string, local: boolean): void;
}

export abstract class ActionBase extends Entity {
    get global(): boolean { return false; }
    fields: Field[] = [];
    arrs: Arr[] = [];
    tableVars: { [name: string]: TableVar } = {};
    transactionOff: boolean = false;
    proxy: SysProc;
    auth: SysProc;

    addArr(arr: Arr) {
        this.arrs.push(arr);
    }

    addTableVar(tableVar: TableVar): boolean {
        let name = tableVar.name;
        let t = this.tableVars[name];
        if (t !== undefined) return false;
        this.tableVars[name] = tableVar;
        return true;
    }

    getTableVar(name: string): TableVar { return this.tableVars[name] }

    nameUnique(): string[] {
        let ret: string[] = []
        let keys: any = {};
        this.fields.forEach(f => {
            let fn = f.name;
            if (keys[fn] === undefined) keys[fn] = f;
            else ret.push(fn);
        });
        this.arrs.forEach(a => {
            let an = a.name;
            if (keys[an] === undefined) keys[an] = a;
            else ret.push(an);
            a.fields.forEach(f => {
                let fn = f.name;
                if (keys[fn] === undefined) keys[fn] = f;
                else ret.push(fn);
            });
        });
        if (ret.length === 0) return;
        return ret;
    }
}

export interface SharpField {
    IDName: string,         // ID | IDX
    index: number;
    fields: Field[];
}

export interface Return extends LocalTableBase {
    name: string;
    fields: Field[];
    sharpFields?: SharpField[];
    needTable: boolean;
    convertType?: string;
}

export interface PageReturn extends Return {
    start: ValueExpression;
    order: 'asc' | 'desc';
    orderSwitch: string[];
}

export class Returns extends IElement {
    get type() { return 'returns;' }
    page: PageReturn;
    returns: Return[] = [];

    parser(context: parser.PContext, owner?: Entity) { return new parser.PReturns(owner, this, context); }
    addPage(page: PageReturn) {
        this.page = page;
        this.returns.push(page);
    }
    addRet(ret: Return) {
        this.returns.push(ret);
    }
}

export class QueryBase extends ActionBase {
    get type(): string { return 'query'; }
    returns: Returns;
    statement: QueryBaseStatement;

    parser(context: parser.PContext) { return new parser.PQuery(this, context); }
    db(db: Builder): object { return db.query(this); }
    protected internalCreateSchema() { new QuerySchemaBuilder(this.uq, this).build(this.schema as any); }
    getReturns(): Returns { return this.returns; }
}

export abstract class ActionHasInBus extends ActionBase { // implements HasInBus {
    inBuses: InBusAction[];
}

export interface Face {
    face: string;
    arrs: string[];
    local: boolean;
}
export interface BusFace {
    bus: Bus;
    faces: Face[];
}
export interface BusField {
    name: string;
    type: FaceDataType;
    fields?: BusField[];
}
export class BusAccept extends ActionHasInBus implements Busable {
    statement: BusAcceptStatement;      // self
    statements: BusAcceptStatement[] = []; // for multiple accept of one bus
    buses: BusFace[] = [];
    hasParams: boolean = false;
    hasLocal: boolean = false;
    isQuery: boolean = false;
    get type(): string { return 'accept'; }
    parser(context: parser.PContext): parser.PAct { return; }
    db(db: Builder): object { return; }
    useBusFace(bus: Bus, face: string, arr: string, local: boolean) {
        useBusFace(this.buses, bus, face, arr, local);
    }
    protected internalCreateSchema() { };
    merge(accept: BusAccept) {
        this.statements.push(accept.statement);
    }
}
export class BusQuery extends QueryBase implements Busable {
    buses: BusFace[] = [];
    hasParams: boolean = false;
    statement: BusQueryStatement;
    useBusFace(bus: Bus, face: string, arr: string, local: boolean) {
        useBusFace(this.buses, bus, face, arr, false);
    }
}
export class Bus extends Entity {
    get type(): string { return 'bus'; }
    get global(): boolean { return false; }
    shareSchema: ShareSchema;
    busOwner: string;
    busName: string;
    outFaces: { [face: string]: boolean } = {};
    accepts: { [name: string]: BusAccept } = {};
    queries: BusQuery[] = [];
    parser(context: parser.PContext) { return new parser.PBus(this, context); }
    db(db: Builder): object { return db.bus(this); }
    protected internalCreateSchema() { new BusSchemaBuilder(this.uq, this).build(this.schema as any); }
    newBusAccept(face: string, jFace: string): BusAccept {
        let ba = new BusAccept(this.uq);
        ba.name = face;
        if (jFace !== face) ba.jName = jFace
        ba.statement = new BusAcceptStatement(undefined, ba);
        this.accepts[face] = ba;
        return ba;
    }
    newBusQuery(face: string, jFace: string): BusQuery {
        let bq = new BusQuery(this.uq);
        bq.name = face;
        if (jFace !== face) bq.jName = jFace;
        bq.statement = new BusQueryStatement(undefined, bq);
        this.queries.push(bq);
        return bq;
    }

    merge(bus: Bus): string {
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

export class InBusAction extends ActionBase {
    readonly ownerAction: ActionHasInBus;
    bus: Bus;
    faceName: string;
    faceAlias: string;
    faceQuerySchema: FaceQuerySchema;
    busVar: string;
    tableName: string;
    returns: Returns;
    statement: InBusActionStatement;

    constructor(ownerAction: ActionHasInBus) {
        super(ownerAction.uq);
        this.ownerAction = ownerAction;
    }

    get type(): string { return 'inbus'; }
    parser(context: parser.PContext) { return new parser.PInBusAction(this, context); }
    db(db: Builder): object { return; }
    getReturns(): Returns { return this.returns; }
    protected internalCreateSchema() { };
}

export function useBusFace(buses: BusFace[], bus: Bus, face: string, arr: string, local: boolean) {
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

export class Query extends QueryBase {
    get type(): string { return 'query'; }
    get defaultAccessibility(): EntityAccessibility { return EntityAccessibility.visible }
}

export class EntityVarTable extends Entity implements Table {
    private tableVar: LocalTableBase;
    private keys: Field[];
    constructor(tableVar: LocalTableBase) {
        super(undefined);
        this.tableVar = tableVar;
        let { keys } = tableVar;
        this.keys = keys;
    }
    db(db: Builder): object {
        throw new Error("Method not implemented.");
    }
    global: boolean;
    type: string;
    isVarTable: boolean = true;
    parser(context: parser.PContext): parser.PElement {
        throw new Error("Method not implemented.");
    }
    getTableAlias(): string {
        return 'a';
    }
    getTableName(): string {
        return this.tableVar.name;
    }
    fieldPointer(name: string): Pointer {
        return this.tableVar.fields.find(f => f.name === name) !== undefined ?
            new FieldPointer() : undefined;
    }
    getKeys(): Field[] {
        return this.keys;
    }
    getFields(): Field[] {
        return this.tableVar.fields;
    }
    getArrTable(arr: string): Table {
        throw new Error("Method not implemented.");
    }
    protected internalCreateSchema() { };
}

export interface TempletFace {
    templet: string;
    params: string[];
}
export class Templet extends Entity {
    params: string[];
    subject: string;
    code: string;
    subjectSections: string[];
    sections: string[];
    get type(): string { return 'templet'; }
    get global(): boolean { return false; }
    parser(context: parser.PContext): parser.PElement {
        return new parser.PTemplet(this, context);
    }
    db(db: Builder): object { return; }
    protected internalCreateSchema() { new TempletSchemaBuilder(this.uq, this).build(this.schema as any); }
}
