"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uq = exports.UqVersion = void 0;
const il = require(".");
const parser_1 = require("../parser");
const IElement_1 = require("./IElement");
const entity_1 = require("./entity");
const Biz_1 = require("./Biz");
const busSchema_1 = require("./busSchema");
const datatype_1 = require("./datatype");
const field_1 = require("./field");
const uq_1 = require("../parser/uq");
class UqVersion {
    constructor(v) {
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
        for (let i = ver.length; i < 3; i++)
            ver.push(0);
    }
    toString() {
        return this.parts.join('.');
    }
    compare(ver) {
        let { parts } = ver;
        if (!parts)
            throw new Error('invalid UqVersion, ver is not set');
        if (!this.parts)
            throw new Error('invalid UqVersion, this.parts is not set');
        for (let i = 0; i < 3; i++) {
            let v = parts[i];
            let meV = this.parts[i];
            if (meV > v)
                return 1;
            if (meV < v)
                return -1;
        }
        return 0;
    }
}
exports.UqVersion = UqVersion;
class Uq extends IElement_1.IElement {
    constructor() {
        super(...arguments);
        this.entities = {};
        this.enums = {};
        this.consts = {};
        this.queues = {};
        this.imports = {};
        this.tuids = {};
        this.IDs = {};
        this.IDXs = {};
        this.IXs = {};
        this.acts = {};
        this.funcs = {};
        this.books = {};
        this.maps = {};
        this.histories = {};
        this.pendings = {};
        this.sysprocs = {};
        this.procs = {};
        this.queries = {};
        this.buses = {};
        this.templets = {};
        this.dataTypes = {
            value: new datatype_1.Dec(18, 6),
        };
        this.biz = new Biz_1.Biz(this);
    }
    get type() { return 'uq'; }
    init() {
        this.addTuid(this.buildTuidSheet());
        this.addQueue(this.buildQueueIn());
        this.addID(this.buildPhrase());
        // this.addIX(this.buildIxPhrase());
    }
    calcKeyValue(v0, v1) {
        let entity = this.entities[v0];
        if (entity === undefined)
            return undefined;
        return entity.calcKeyValue(v1);
    }
    addTuid(tuid) { this.tuids[tuid.name] = tuid; }
    addQueue(queue) { this.queues[queue.name] = queue; }
    addID(id) {
        let { name } = id;
        this.IDs[name] = id;
        this.entities[name] = id;
    }
    addIX(ix) {
        let { name } = ix;
        this.IXs[name] = ix;
        this.entities[name] = ix;
    }
    buildSchemas(res) {
        let ret = {};
        for (let i in this.entities) {
            const entity = this.entities[i];
            const { name } = entity;
            if (name.indexOf('$') > 0) {
                if (name !== '$biz')
                    continue;
            }
            entity.buildSchema();
            if (entity.isPrivate === true)
                continue;
            ret[i] = entity.schema;
        }
        this.biz.buildSchema(res);
        ret['$biz'] = this.biz.schema;
        return ret;
    }
    buildEmptyRole() {
        if (this.role !== undefined)
            return;
        this.role = new entity_1.Role(this);
        this.role.name = '$role';
        this.role.jName = '$Role';
    }
    checkEntityName(entity) {
        let { name } = entity;
        let ent = this.entities[name];
        if (ent !== undefined) {
            return ('实体名"' + name + '"已经被使用了，不能重复');
        }
        this.entities[name] = entity;
    }
    buildPhrase() {
        let entity = new entity_1.ID(this);
        entity.name = '$phrase';
        entity.id = (0, field_1.bigIntField)('id');
        entity.onlyForSyntax = true;
        let index = (0, field_1.tinyIntField)('index');
        index.defaultValue = 0;
        entity.fields.push((0, field_1.charField)('name', 200), (0, field_1.charField)('caption', 100), (0, field_1.bigIntField)('base'), (0, field_1.tinyIntField)('valid'), (0, field_1.bigIntField)('owner'), (0, field_1.tinyIntField)('type'), index);
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
    buildTuidSheet() {
        let tuid = new il.Tuid(this);
        tuid.name = '$sheet';
        let id = (0, field_1.idField)('id', 'big');
        tuid.id = id;
        tuid.id.autoInc = true;
        let no = (0, field_1.charField)('no', 30);
        let user = (0, field_1.bigIntField)('user');
        let date = (0, field_1.timeStampField)('date');
        let sheet = (0, field_1.intField)('sheet');
        let version = (0, field_1.intField)('version');
        let flow = (0, field_1.smallIntField)('flow');
        let app = (0, field_1.intField)('app');
        let state = (0, field_1.intField)('state');
        let discription = (0, field_1.charField)('discription', 50);
        let data = (0, field_1.textField)('data');
        let processing = (0, field_1.tinyIntField)('processing');
        tuid.main = [no];
        tuid.fields = [user, date, sheet, version, flow, app, state, discription, data, processing];
        function buildIndex(name, unique, ...fields) {
            let ret = new entity_1.Index(name, unique);
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
    buildQueueIn() {
        let queue = new il.Queue(this);
        queue.name = '$queue_in';
        return queue;
    }
    parser(context) { return new parser_1.PUq(this, context); }
    bizParser(context) { return new uq_1.PUqBiz(this, context); }
    isAnyConstChanged() {
        for (let i in this.consts) {
            let cst = this.consts[i];
            if (cst.isSourceChanged === true)
                return true;
        }
        return false;
    }
    eachChild(callback) {
        if (this.role)
            callback(this.role);
        let arr = [
            this.imports, this.enums, this.tuids, this.IDs, this.IXs, this.IDXs,
            this.funcs, this.books, this.maps, this.histories, this.pendings,
            this.acts, this.sysprocs, this.procs, this.queries,
            this.buses, this.templets, this.consts, this.queues,
        ];
        arr.forEach(v => {
            for (let i in v)
                callback(v[i]);
        });
        callback(this.biz);
    }
    eachEntity(callback) {
        if (this.role)
            callback(this.role);
        let arr = [
            this.imports, this.enums, this.tuids, this.IDs, this.IXs, this.IDXs,
            this.funcs, this.books, this.maps, this.histories, this.pendings,
            this.acts, this.sysprocs, this.queries, this.procs,
            this.buses, this.templets, this.consts, this.queues
        ];
        arr.forEach(v => {
            for (let i in v)
                callback(v[i]);
        });
        callback(this.biz);
    }
    async eachEntityAsync(callback) {
        if (this.role)
            await callback(this.role);
        let arr = [
            this.queues,
            this.imports, this.enums, this.tuids, this.IDs, this.IXs, this.IDXs,
            this.funcs, this.books, this.maps, this.histories, this.pendings,
            this.acts, this.sysprocs, this.procs, this.queries,
            this.buses, this.templets, this.consts
        ];
        for (let item of arr) {
            for (let i in item)
                await callback(item[i]);
        }
        await callback(this.biz);
    }
    async eachOpenType(callback) {
        let arr = [
            this.tuids, this.IDs,
            this.acts, this.queries, this.IXs,
        ];
        for (let item of arr) {
            for (let i in item)
                await callback(item[i]);
        }
    }
    getServiceBus() {
        let buses = {};
        for (let i in this.buses) {
            let bus = this.buses[i];
            function getBfFromBus(bs) {
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
            function setMethod(bf, faceName, method) {
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
    getEntities() {
        let ret = [];
        function enumEntities(type, entities) {
            ret.push(type);
            for (let i in entities) {
                let entity = entities[i];
                if (entity.isSys === true)
                    continue;
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
    getImports() {
        let ret = '';
        for (let i in this.imports) {
            let imp = this.imports[i];
            let { uqOwner, uqName } = imp;
            ret += uqOwner + '\t' + uqName + '\n';
        }
        return ret;
    }
    getEntityTable(name) {
        let tuid = this.tuids[name];
        if (tuid !== undefined)
            return tuid;
        let book = this.books[name];
        if (book !== undefined)
            return book;
        let map = this.maps[name];
        if (map !== undefined)
            return map;
        let history = this.histories[name];
        if (history !== undefined)
            return history;
        let pending = this.pendings[name];
        if (pending !== undefined)
            return pending;
        let idx = this.IDXs[name];
        if (idx !== undefined)
            return idx;
        let id = this.IDs[name];
        if (id !== undefined)
            return id;
        let ix = this.IXs[name];
        if (ix !== undefined)
            return ix;
    }
    getQueue(name) {
        return this.queues[name];
    }
    async loadBusSchemas(log) {
        let ok = true;
        let buses = this.buses;
        let shareSchemas = {};
        let schemaPromises = [];
        let busArr = [];
        for (let i in buses) {
            let bus = buses[i];
            let { busOwner, busName } = bus;
            let share = busOwner + '/' + busName;
            let shareSchema = shareSchemas[share];
            if (shareSchema === undefined) {
                shareSchemas[share] = shareSchema = new busSchema_1.ShareSchema();
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
exports.Uq = Uq;
//# sourceMappingURL=uq.js.map