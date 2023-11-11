import * as il from '.';
import { PElement, PUq, PContext } from '../parser';
import { IElement } from './element';
import { Entity, Index, Role, Queue, ID } from './entity';
import { Biz } from './Biz';
import { ShareSchema } from './busSchema';
import { DataType, Dec } from './datatype';
import { bigIntField, charField, intField, tinyIntField, textField, smallIntField, idField, timeStampField, Table } from './field';
import { ActionStatement } from './statement';
import { PUqBiz } from '../parser/uq';

export class UqVersion {
    private parts: number[];
    readonly error: string;
    constructor(v: string) {
        if (!v) {
            this.parts = [0, 0, 0];
            return;
        }
        let ver = this.parts = [];
        let vParts = v.split('.');
        let errVersion = 'UQ的版本号，必须是点号分开的不多于三段数字';
        if (vParts.length > 3) {
            this.error = errVersion;
        }
        for (let p of vParts) {
            if (p.length === 0) {
                this.error = errVersion;
            }
            let n = Number.parseInt(p);
            if (isNaN(n) === true) {
                this.error = errVersion;
            }
            ver.push(n);
        }
        for (let i = ver.length; i < 3; i++) ver.push(0);
    }

    toString() {
        return this.parts.join('.');
    }

    compare(ver: UqVersion): number {
        let { parts } = ver;
        if (!parts) throw new Error('invalid UqVersion, ver is not set');
        if (!this.parts) throw new Error('invalid UqVersion, this.parts is not set');
        for (let i = 0; i < 3; i++) {
            let v = parts[i];
            let meV = this.parts[i];
            if (meV > v) return 1;
            if (meV < v) return -1;
        }
        return 0;
    }
}

export class Uq extends IElement {
    get type(): string { return 'uq'; }
    owner: string;
    name: string;
    docType: 1 | 2;
    version: UqVersion;
    author: string;
    date: string;
    statement: ActionStatement;

    role: Role;
    entities: { [key: string]: il.Entity } = {};
    enums: { [key: string]: il.Enum } = {};
    consts: { [key: string]: il.Const } = {};
    queues: { [key: string]: il.Queue } = {};
    imports: { [key: string]: il.Import } = {};
    tuids: { [key: string]: il.Tuid } = {};
    IDs: { [key: string]: il.ID } = {};
    IDXs: { [key: string]: il.IDX } = {};
    IXs: { [key: string]: il.IX } = {};
    acts: { [key: string]: il.Act } = {};
    funcs: { [key: string]: il.Function } = {};
    books: { [key: string]: il.Book } = {};
    maps: { [key: string]: il.Map } = {};
    histories: { [key: string]: il.History } = {};
    pendings: { [key: string]: il.Pending } = {};
    sysprocs: { [key: string]: il.SysProc } = {};
    procs: { [key: string]: il.Proc } = {};
    queries: { [key: string]: il.Query } = {};
    buses: { [key: string]: il.Bus } = {};
    templets: { [key: string]: il.Templet } = {};

    dataTypes: { [name: string]: DataType } = {
        value: new Dec(18, 6),
    };

    readonly biz: Biz = new Biz(this);

    init() {
        this.addTuid(this.buildTuidSheet());
        this.addQueue(this.buildQueueIn());
        this.addID(this.buildPhrase());
        // this.addIX(this.buildIxPhrase());
    }

    calcKeyValue(v0: string, v1: string): string | number {
        let entity = this.entities[v0];
        if (entity === undefined) return undefined;
        return entity.calcKeyValue(v1);
    }

    private addTuid(tuid: il.Tuid) { this.tuids[tuid.name] = tuid; }
    private addQueue(queue: il.Queue) { this.queues[queue.name] = queue; }
    private addID(id: ID) {
        let { name } = id;
        this.IDs[name] = id;
        this.entities[name] = id;
    }
    private addIX(ix: il.IX) {
        let { name } = ix;
        this.IXs[name] = ix;
        this.entities[name] = ix;
    }

    buildSchemas(res: { [phrase: string]: string }): any {
        let ret = {};
        for (let i in this.entities) {
            const entity = this.entities[i];
            const { name } = entity;
            if (name.indexOf('$') > 0) {
                if (name !== '$biz') continue;
            }
            entity.buildSchema();
            if (entity.isPrivate === true) continue;
            ret[i] = entity.schema;
        }
        this.biz.buildSchema(res);
        ret['$biz'] = this.biz.schema;
        return ret;
    }


    buildEmptyRole() {
        if (this.role !== undefined) return;
        this.role = new Role(this);
        this.role.name = '$role';
        this.role.jName = '$Role';
    }

    checkEntityName(entity: Entity): string {
        let { name } = entity;
        let ent = this.entities[name];
        if (ent !== undefined) {
            return ('实体名"' + name + '"已经被使用了，不能重复');
        }
        this.entities[name] = entity;
    }

    private buildPhrase(): ID {
        let entity = new ID(this);
        entity.name = '$phrase';
        entity.id = bigIntField('id');
        entity.onlyForSyntax = true;
        let index = tinyIntField('index');
        index.defaultValue = 0;
        entity.fields.push(
            charField('name', 200),
            charField('caption', 100),
            bigIntField('base'),
            tinyIntField('valid'),
            bigIntField('owner'),
            tinyIntField('type'),
            index,
        );
        return entity;
    }
    /*
        private buildIxPhrase(): il.IX {
            let entity = new il.IX(this);
            entity.name = '$ixphrase';
            entity.i = bigIntField('i');
            entity.x = bigIntField('x');
            entity.onlyForSyntax = true;
            let type = tinyIntField('type');
            type.nullable = false;
            type.defaultValue = 0;
            entity.fields.push(
                type,
            );
            return entity;
        }
    
        private buildTuidUser(): il.Tuid {
            let tuid = new il.Tuid(this);
            tuid.name = '$user';
            let id = idField('id', 'big');
            tuid.id = id;
            tuid.id
            tuid.id.autoInc = false;
            let name = charField('name', 100);
            let nick = charField('nick', 100);
            let icon = charField('icon', 200);
            let assigned = charField('assigned', 100);
            let poke = tinyIntField('poke');
            let timeZone = tinyIntField('timezone');
            poke.defaultValue = 0;
            tuid.main = [name, nick, icon, assigned, poke, timeZone];
            tuid.fields = [];
            tuid.source = null;
            return tuid;
        }
    */
    private buildTuidSheet(): il.Tuid {
        let tuid = new il.Tuid(this);
        tuid.name = '$sheet';
        let id = idField('id', 'big');
        tuid.id = id;
        tuid.id.autoInc = true;
        let no = charField('no', 30);
        let user = bigIntField('user');
        let date = timeStampField('date');
        let sheet = intField('sheet');
        let version = intField('version');
        let flow = smallIntField('flow');
        let app = intField('app');
        let state = intField('state');
        let discription = charField('discription', 50);
        let data = textField('data');
        let processing = tinyIntField('processing');

        tuid.main = [no];
        tuid.fields = [user, date, sheet, version, flow, app, state, discription, data, processing];
        function buildIndex(name: string, unique: boolean, ...fields: il.Field[]): Index {
            let ret = new Index(name, unique);
            //ret.unit = true;
            ret.fields = fields;
            return ret;
        }
        tuid.indexes = [
            buildIndex('no', true, sheet, no),
            buildIndex('sheet_state_user_id', true, sheet, state, user, id),
        ];
        tuid.source = null;
        return tuid;
    }

    private buildQueueIn(): il.Queue {
        let queue = new il.Queue(this);
        queue.name = '$queue_in';
        return queue;
    }

    parser(context: PContext): PElement { return new PUq(this, context); }
    bizParser(context: PContext): PElement { return new PUqBiz(this, context); }

    isAnyConstChanged(): boolean {
        for (let i in this.consts) {
            let cst = this.consts[i];
            if (cst.isSourceChanged === true) return true;
        }
        return false;
    }
    eachChild(callback: (el: IElement) => void) {
        if (this.role) callback(this.role);
        let arr: { [key: string]: il.Entity }[] = [
            this.imports, this.enums, this.tuids, this.IDs, this.IXs, this.IDXs,
            this.funcs, this.books, this.maps, this.histories, this.pendings,
            this.acts, this.sysprocs, this.procs, this.queries,
            this.buses, this.templets, this.consts, this.queues,
        ]
        arr.forEach(v => {
            for (let i in v) callback(v[i])
        });
        callback(this.biz);
    }
    eachEntity(callback: (entity: il.Entity) => void): void {
        if (this.role) callback(this.role);
        let arr: { [key: string]: il.Entity }[] = [
            this.imports, this.enums, this.tuids, this.IDs, this.IXs, this.IDXs,
            this.funcs, this.books, this.maps, this.histories, this.pendings,
            this.acts, this.sysprocs, this.queries, this.procs,
            this.buses, this.templets, this.consts, this.queues
        ]
        arr.forEach(v => {
            for (let i in v) callback(v[i])
        });
        callback(this.biz);
    }
    async eachEntityAsync(callback: (entity: il.Entity) => Promise<void>): Promise<void> {
        if (this.role) await callback(this.role);
        let arr: { [key: string]: il.Entity }[] = [
            this.queues,
            this.imports, this.enums, this.tuids, this.IDs, this.IXs, this.IDXs,
            this.funcs, this.books, this.maps, this.histories, this.pendings,
            this.acts, this.sysprocs, this.procs, this.queries,
            this.buses, this.templets, this.consts
        ]
        for (let item of arr) {
            for (let i in item) await callback(item[i])
        }
        await callback(this.biz);
    }
    async eachOpenType(callback: (entity: il.Entity) => Promise<void>) {
        let arr: { [key: string]: il.Entity }[] = [
            this.tuids, this.IDs,
            this.acts, this.queries, this.IXs,
        ]
        for (let item of arr) {
            for (let i in item) await callback(item[i])
        }
    }

    getServiceBus(): string {
        let buses: { [busOwner: string]: { [busName: string]: { [busFace: string]: number } } } = {};
        for (let i in this.buses) {
            let bus = this.buses[i];
            function getBfFromBus(bs: il.Bus) {
                let { busOwner, busName } = bs;
                let bn = buses[busOwner];
                if (bn === undefined) {
                    bn = buses[busOwner] = {};
                }
                let bf = bn[busName];
                if (bf === undefined) {
                    bf = bn[busName] = {};
                }
                return bf;
            }
            let bf = getBfFromBus(bus);
            function setMethod(bf: { [busFace: string]: number; }, faceName: string, method: number) {
                let m = bf[faceName];
                if (m === undefined) {
                    m = 0;
                }
                m |= method;
                bf[faceName] = m;
            }

            let { accepts, queries } = bus;
            for (let i in accepts) {
                let { name } = accepts[i];
                setMethod(bf, name, 1);
                /*
                if (inBuses === undefined) continue;
                for (let inBus of inBuses) {
                    let { bus, faceName } = inBus;
                    let bf = getBfFromBus(bus);
                    setMethod(bf, faceName, 2);
                }
                */
            }
            for (let q of queries) {
                setMethod(bf, q.name, 2);
            }
        }
        let ret = '';
        for (let busOwner in buses) {
            let bn = buses[busOwner];
            for (let busName in bn) {
                let faces = bn[busName];
                for (let faceName in faces) {
                    let method = faces[faceName];
                    ret += `${busOwner}|${busName}|${faceName}|${method};`;
                }
            }
        }
        return ret;
    }

    getEntities(): string {
        let ret: string[] = [];

        function enumEntities(type: string, entities: { [name: string]: Entity }) {
            ret.push(type);
            for (let i in entities) {
                let entity = entities[i];
                if (entity.isSys === true) continue;
                ret.push(entity.sName);
            }
            ret.push('');
        }

        enumEntities('tuid', this.tuids);
        enumEntities('ID', this.IDs);
        enumEntities('assign', this.IXs);
        enumEntities('ibook', this.IDXs);
        enumEntities('action', this.acts);
        enumEntities('map', this.maps);
        enumEntities('query', this.queries);
        enumEntities('book', this.books);
        enumEntities('history', this.histories);
        enumEntities('pending', this.pendings);
        enumEntities('templet', this.templets);
        enumEntities('queue', this.queues);
        return ret.join('\n');
    }

    getImports(): string {
        let ret = '';
        for (let i in this.imports) {
            let imp = this.imports[i];
            let { uqOwner, uqName } = imp;
            ret += uqOwner + '\t' + uqName + '\n';
        }
        return ret;
    }

    getEntityTable(name: string): Entity & Table {
        let tuid = this.tuids[name];
        if (tuid !== undefined) return tuid;
        let book = this.books[name];
        if (book !== undefined) return book;
        let map = this.maps[name];
        if (map !== undefined) return map;
        let history = this.histories[name];
        if (history !== undefined) return history;
        let pending = this.pendings[name];
        if (pending !== undefined) return pending;
        let idx = this.IDXs[name];
        if (idx !== undefined) return idx;
        let id = this.IDs[name];
        if (id !== undefined) return id;
        let ix = this.IXs[name];
        if (ix !== undefined) return ix;
    }

    getQueue(name: string): Queue {
        return this.queues[name];
    }

    async loadBusSchemas(log: (text: string) => boolean): Promise<boolean> {
        let ok = true;
        let buses = this.buses;
        let shareSchemas: { [share: string]: ShareSchema } = {};
        let schemaPromises: Promise<any>[] = [];
        let busArr: il.Bus[] = [];
        for (let i in buses) {
            let bus = buses[i];
            let { busOwner, busName } = bus;
            let share = busOwner + '/' + busName;
            let shareSchema = shareSchemas[share];
            if (shareSchema === undefined) {
                shareSchemas[share] = shareSchema = new ShareSchema();
                busArr.push(bus);
                schemaPromises.push(shareSchema.loadSchema(busOwner, busName));
            }
            bus.shareSchema = shareSchema;
        }
        let rets = await Promise.all(schemaPromises);
        for (let i = 0; i < rets.length; i++) {
            let ret = rets[i];
            if (ret !== undefined) {
                let bus = busArr[i];
                let { busOwner, busName } = bus;
                log(`bus ${busOwner}/${busName} error: ${ret}`);
                ok = false;
            }
        }
        return ok;
    }
}
