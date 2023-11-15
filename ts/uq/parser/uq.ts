import { PElement } from './element';
import { Space } from './space';
import { Token } from './tokens';
import { PContext } from './pContext';
import {
    Entity, Uq, Tuid, Import, Book, History, Map, Query, Act, Table, Bus
    , Templet, SysProc, Pending, Pointer, Role, Enum, Proc
    , IX, ID, IDX, Const, ConstPointer, UqVersion, Function, Queue
    , UqStatement, DataTypeDefine, DataType, BusAcceptStatement, BizBase, BizEntity
} from '../il';

export class PUq extends PElement {
    private readonly parseEntitys: { [key: string]: () => void }
    private readonly uq: Uq;
    constructor(uq: Uq, context: PContext) {
        super(uq, context);
        this.uq = uq;
        this.parseEntitys = {
            uq: this.parseUq,
            uq2: this.parseUq2,
            act: this.parseAct,
            id: this.parseID,
            idx: this.parseIDX,
            ix: this.parseIX,
            biz: this.parseBiz,

            usq: this.parseUq,
            role: this.parseRole,
            func: this.parseFunction,
            function: this.parseFunction,
            open: this.parseOpen,
            tuid: this.parseTuid,
            enum: this.parseEnum,
            const: this.parseConst,
            datatype: this.parseDataTypeDefine,
            queue: this.parseQueue,
            import: this.parseImport,
            book: this.parseBook,
            map: this.parseMap,
            history: this.parseHistory,
            pending: this.parsePending,
            action: this.parseAct,
            query: this.parseQuery,
            bus: this.parseBus,
            templet: this.parseTemplet,
            sysproc: this.parseSysProc,
            proc: this.parseProc,
        }
    }

    protected _parse() {
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token === Token.SEMICOLON) {
                this.ts.readToken();
                continue;
            }
            switch (this.ts.token) {
                case Token._FINISHED: break;
                case Token.VAR:
                    if (this.ts.varBrace === true) {
                        this.ts.expect('关键字');
                        break;
                    }
                    let key = this.ts.lowerVar;
                    this.ts.readToken();
                    let parseEntity = this.parseEntitys[key];
                    if (parseEntity !== undefined) {
                        parseEntity();
                        continue;
                    }
                    else {
                        this.error('unknown key word: ', key);
                    }
                    break;
                default:
                    this.expect('某个entity类型');
                    break;
            }
            break;
        }
    }

    private parseOpen = () => {
        if (this.ts.varBrace === true) {
            this.ts.expect('TUID', 'MAP', 'TAG', 'ACT');
            return;
        }
        let entity: Entity;
        switch (this.ts.lowerVar) {
            default:
                this.ts.expect('TUID', 'MAP', 'TAG', 'ACT');
                return;
            case 'tuid':
                this.ts.readToken();
                entity = this.parseTuid(true);
                break;
            case 'map':
                this.ts.readToken();
                entity = this.parseMap(true);
                break;
            case 'act':
                this.ts.readToken();
                entity = this.parseAct(true);
                break;
        }
        entity.source = 'OPEN ' + entity.source;
    }

    private parseUq = () => this.parseUqDoc(1);
    private parseUq2 = () => this.parseUqDoc(2);

    private parseUqDoc(docType: 1 | 2 = 1) {
        if (this.uq.name !== undefined) {
            this.error('只能定义一次uq');
        }
        if (this.ts.token !== Token.VAR) {
            this.expect('uq的名字');
        }
        this.uq.owner = this.ts.lowerVar;
        this.uq.docType = docType;
        this.ts.readToken();
        this.ts.assertToken(Token.DIV);
        this.ts.readToken();
        this.uq.name = this.ts.lowerVar;
        this.ts.readToken();
        for (; ;) {
            switch (this.ts.lowerVar) {
                case 'author':
                    if (this.uq.author !== undefined) this.error('只能定义一次author');
                    this.ts.readToken();
                    this.ts.assertToken(Token.EQU);
                    this.ts.readToken();
                    if (this.ts.token !== Token.STRING) this.error('应该是加引号的字符串');
                    this.uq.author = this.ts.text;
                    this.ts.readToken();
                    continue;
                case 'version':
                    if (this.uq.author !== undefined) this.error('只能定义一次version');
                    this.ts.readToken();
                    this.ts.assertToken(Token.EQU);
                    this.ts.readToken();
                    if (this.ts.token !== Token.STRING) this.error('应该是加引号的字符串');
                    let ver = new UqVersion(this.ts.text);
                    let verError = ver.error;
                    if (verError) {
                        this.error(verError);
                    }
                    this.uq.version = ver;
                    this.ts.readToken();
                    continue;
            }
            break;
        }

        if (this.ts.token === Token.LBRACE) {
            let statement = new UqStatement(undefined);
            statement.level = 0;
            this.context.createStatements = statement.createStatements;
            let parser = statement.parser(this.context)
            parser.parse();
            this.uq.statement = statement;
        }

        if (this.ts.token === Token.SEMICOLON) {
            this.ts.readToken();
        }
    }

    private checkEntityName(entity: Entity): boolean {
        let ret = this.uq.checkEntityName(entity);
        if (ret === undefined) return true;
        this.error(ret);
        return false;
    }

    private parseRole = () => {
        let role = new Role(this.uq);
        let parser = role.parser(this.context);
        parser.parse();
        if (this.uq.role !== undefined) {
            this.error('ROLE 只能定义一次');
            return false;
        }
        if (this.checkEntityName(role) === false) return;
        this.uq.role = role;
    }

    private parseTuid = (isOpen: boolean = false) => {
        let tuid = new Tuid(this.uq);
        tuid.isOpen = isOpen;
        let parser = tuid.parser(this.context);
        parser.parse();
        if (this.checkEntityName(tuid) === false) return;
        this.uq.tuids[tuid.name] = tuid;
        return tuid;
    }

    private parseEnum = () => {
        let enm = new Enum(this.uq);
        let parser = enm.parser(this.context);
        parser.parse();
        if (this.checkEntityName(enm) === false) return;
        this.uq.enums[enm.name] = enm;
    }

    private parseConst = () => {
        let _const = new Const(this.uq);
        let parser = _const.parser(this.context);
        parser.parse();
        if (this.checkEntityName(_const) === false) return;
        this.uq.consts[_const.name] = _const;
    }

    private parseDataTypeDefine = () => {
        let dataTypeDefine = new DataTypeDefine(this.uq);
        let parser = dataTypeDefine.parser(this.context);
        parser.parse();
        this.uq.dataTypes = dataTypeDefine.datatypes;
    }

    private parseQueue = () => {
        let queue = new Queue(this.uq);
        let parser = queue.parser(this.context);
        parser.parse();
        if (this.checkEntityName(queue) === false) return;
        this.uq.queues[queue.name] = queue;
    }

    private parseImport = () => {
        let imp = new Import(this.uq);
        let parser = imp.parser(this.context);
        parser.parse();
        if (this.checkEntityName(imp) === false) return;
        this.uq.imports[imp.name] = imp;
    }

    private parseBook = () => {
        let book = new Book(this.uq);
        let parser = book.parser(this.context);
        parser.parse();
        if (this.checkEntityName(book) === false) return;
        this.uq.books[book.name] = book;
    }

    private parseMap = (isOpen: boolean = false) => {
        let map = new Map(this.uq);
        map.isOpen = isOpen;
        let parser = map.parser(this.context);
        parser.parse();
        if (this.checkEntityName(map) === true) {
            this.uq.maps[map.name] = map;
        }
        return map;
    }

    private parseHistory = () => {
        let history = new History(this.uq);
        let parser = history.parser(this.context);
        parser.parse();
        if (this.checkEntityName(history) === false) return;
        this.uq.histories[history.name] = history;
    }

    private parsePending = () => {
        let pending = new Pending(this.uq);
        let parser = pending.parser(this.context);
        parser.parse();
        if (this.checkEntityName(pending) === false) return;
        this.uq.pendings[pending.name] = pending;
    }

    private parseAct = (isOpen: boolean = false): Act => {
        let act = new Act(this.uq);
        act.isOpen = isOpen;
        let parser = act.parser(this.context);
        parser.parse();
        if (this.checkEntityName(act) === false) return;
        this.uq.acts[act.name] = act;
        return act;
    }

    private parseSysProc = () => {
        let sysproc = new SysProc(this.uq);
        let parser = sysproc.parser(this.context);
        parser.parse();
        if (this.checkEntityName(sysproc) === false) return;
        this.uq.sysprocs[sysproc.name] = sysproc;
    }

    private parseProc = () => {
        let proc = new Proc(this.uq);
        let parser = proc.parser(this.context);
        parser.parse();
        if (this.checkEntityName(proc) === false) return;
        this.uq.procs[proc.name] = proc;
    }

    private parseFunction = () => {
        let func = new Function(this.uq);
        let parser = func.parser(this.context);
        parser.parse();
        if (this.checkEntityName(func) === false) return;
        this.uq.funcs[func.name] = func;
    }

    private parseQuery = () => {
        let query = new Query(this.uq);
        let parser = query.parser(this.context);
        parser.parse();
        if (this.checkEntityName(query) === false) return;
        this.uq.queries[query.name] = query;
    }

    private parseBus = () => {
        let bus = new Bus(this.uq);
        let parser = bus.parser(this.context);
        parser.parse();
        let { name } = bus;
        let ent = this.uq.entities[name];
        if (ent !== undefined) {
            let { type } = ent;
            if (type !== 'bus') {
                this.error(`实体名 ${name} 已经定义为 ${type.toUpperCase()} 了，不能重新定义 BUS`);
            }
            let { busOwner, busName } = ent as Bus;
            if (busOwner !== bus.busOwner || busName !== bus.busName) {
                this.error(`Another bus is from ${busOwner}/${busName}`);
            }
            // bus 是所有实体里面，唯一允许重名的。主要是为了针对多个face，可以分开写accept
            let err = bus.merge(ent as Bus);
            if (err !== undefined) {
                this.error(err); // duplicate query in BUS.
            }
            // this.error('实体名"' + name + '"已经被使用了，不能重复');
            // return false;
        }
        this.uq.entities[name] = bus;
        this.uq.buses[name] = bus;
    }

    private parseTemplet = () => {
        let templet = new Templet(this.uq);
        let parser = templet.parser(this.context);
        parser.parse();
        if (this.checkEntityName(templet) === false) return;
        this.uq.templets[templet.name] = templet;
    }

    private parseID = () => {
        let idEntity = new ID(this.uq);
        let parser = idEntity.parser(this.context);
        parser.parse();
        if (this.checkEntityName(idEntity) === false) return;
        this.uq.IDs[idEntity.name] = idEntity;
    }

    private parseIX = () => {
        let assign = new IX(this.uq);
        let parser = assign.parser(this.context);
        parser.parse();
        if (this.checkEntityName(assign) === false) return;
        this.uq.IXs[assign.name] = assign;
    }

    private parseIDX = () => {
        let iBook = new IDX(this.uq);
        let parser = iBook.parser(this.context);
        parser.parse();
        if (this.checkEntityName(iBook) === false) return;
        this.uq.IDXs[iBook.name] = iBook;
    }

    protected parseBiz = () => {
        let parser = this.uq.biz.parser(this.context);
        parser.parse();
    }

    scan(space: Space): boolean {
        try {
            let ok = true;
            let all: { [key: string]: Entity } = {};
            this.uq.eachChild(el => {
                let pelement = el.pelement;
                if (pelement === undefined) return;
                if (pelement.scaned === true) return;
                let en = el as Entity;
                let { name: n, type } = en;
                let en0 = all[n];
                if (en0 === undefined) {
                    all[n] = en;
                }
                else {
                    ok = false;
                    this.log(en.type + '[' + n + ']与' + en0.type + '[' + n + ']重名');
                }
                if (this.context.inDenyList(n) === true) {
                    ok = false;
                    this.log(`'${n}' should not be used as entity name`);
                }
            });

            let appSpace = new UqSpace(this.uq);
            this.uq.eachChild(el => {
                let pelement = el.pelement;
                if (pelement === undefined) return;
                if (pelement.scan0(appSpace) === false) ok = false;
            });
            this.uq.eachChild(el => {
                let pelement = el.pelement;
                if (pelement === undefined) return;
                if (pelement.scaned === true) return;
                switch (this.uq.docType) {
                    case 1:
                        if (pelement.scanDoc1() === false) ok = false;
                        break;
                    case 2: if (pelement.scanDoc2() === false) ok = false;
                        break;
                }
                if (pelement.scan(appSpace) === false) ok = false;
                pelement.scaned = true;
            });
            this.uq.eachChild(el => {
                let pelement = el.pelement;
                if (pelement === undefined) return;
                if (pelement.scan2ed === true) return;
                if (pelement.scan2(this.uq) === false) ok = false;
                pelement.scan2ed = true;
            });
            let { buses } = this.uq;
            let busNames: { [name: string]: Bus } = {};
            for (let i in buses) {
                let bus = buses[i];
                let { busOwner, busName, accepts } = bus;
                let name = `${busOwner}/${busName}`;
                let bus0 = busNames[name];
                if (!bus0) {
                    busNames[name] = bus;
                }
                else {
                    this.log(`Multiple BUS ${bus.name} AND ${bus0.name} FROM ${name}`);
                    ok = false;
                }
                for (let i in accepts) {
                    const accept = accepts[i];
                    const { statement, statements } = accept;
                    const stat = accept.statement = new BusAcceptStatement(undefined, accept);
                    let statStatements = stat.statements;
                    statStatements.push(...statement.statements);
                    for (let stat of statements) {
                        statStatements.push(...stat.statements);
                    }
                }
            }
            if (this.uq.statement) {
                if (this.uq.statement.pelement.scan(appSpace) === false) {
                    ok = false;
                }
            }
            return ok;
        }
        catch (err) {
            let errText: string;
            if (typeof err === 'string')
                errText = err;
            else
                errText = err.message;
            this.log('!!!编译器程序错误!!! ' + errText);
            return false;
        }
    }
}

class UqSpace extends Space {
    declare uq: Uq;
    private statementNo: number = 1;

    constructor(uq: Uq) {
        super(undefined);
        this.uq = uq;
    }
    protected _getEnum(name: string): Enum { return this.uq.enums[name] }
    protected _getBus(name: string): Bus { return this.uq.buses[name] }
    protected _getEntity(name: string): Entity {
        return this.uq.entities[name];
    }
    protected _getEntityTable(name: string): Entity & Table {
        return this.uq.getEntityTable(name);
    }
    protected _getTableByAlias(alias: string): Table { return; }
    protected _varPointer(name: string, isField: boolean): Pointer {
        let _const = this.uq.consts[name];
        if (!_const) return;
        return new ConstPointer(_const.values['$']);
    }
    protected _getConst(name: string): Const {
        return this.uq.consts[name];
    }
    protected _getBizEntity(name: string): BizEntity {
        let bizEntity = this.uq.biz.bizEntities.get(name);
        return bizEntity;
    }
    getRole(): Role {
        return this.uq.role;
    }

    getDataType(typeName: string): DataType {
        return this.uq.dataTypes[typeName];
    }

    newStatementNo() { return this.statementNo++; }
    setStatementNo(value: number) { /*this.statementNo = value;*/ }

    getBizBase(bizName: string[]): BizBase {
        return this.uq.biz.getBizBase(bizName);
    }
}

export class PUqBiz extends PUq {
    protected _parse() {
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token === Token.SEMICOLON) {
                this.ts.readToken();
                continue;
            }
            switch (this.ts.token) {
                case Token._FINISHED: break;
                case Token.VAR:
                    this.parseBiz();
                    continue;
                default:
                    this.expect('某个entity类型');
                    break;
            }
            break;
        }
    }

}
