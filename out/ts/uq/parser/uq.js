"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUqBiz = exports.PUq = void 0;
const element_1 = require("./element");
const space_1 = require("./space");
const tokens_1 = require("./tokens");
const il_1 = require("../il");
class PUq extends element_1.PElement {
    constructor(uq, context) {
        super(uq, context);
        this.parseOpen = () => {
            if (this.ts.varBrace === true) {
                this.ts.expect('TUID', 'MAP', 'TAG', 'ACT');
                return;
            }
            let entity;
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
        };
        this.parseUq = () => this.parseUqDoc(1);
        this.parseUq2 = () => this.parseUqDoc(2);
        this.parseRole = () => {
            let role = new il_1.Role(this.uq);
            let parser = role.parser(this.context);
            parser.parse();
            if (this.uq.role !== undefined) {
                this.error('ROLE 只能定义一次');
                return false;
            }
            if (this.checkEntityName(role) === false)
                return;
            this.uq.role = role;
        };
        this.parseTuid = (isOpen = false) => {
            let tuid = new il_1.Tuid(this.uq);
            tuid.isOpen = isOpen;
            let parser = tuid.parser(this.context);
            parser.parse();
            if (this.checkEntityName(tuid) === false)
                return;
            this.uq.tuids[tuid.name] = tuid;
            return tuid;
        };
        this.parseEnum = () => {
            let enm = new il_1.Enum(this.uq);
            let parser = enm.parser(this.context);
            parser.parse();
            if (this.checkEntityName(enm) === false)
                return;
            this.uq.enums[enm.name] = enm;
        };
        this.parseConst = () => {
            let _const = new il_1.Const(this.uq);
            let parser = _const.parser(this.context);
            parser.parse();
            if (this.checkEntityName(_const) === false)
                return;
            this.uq.consts[_const.name] = _const;
        };
        this.parseDataTypeDefine = () => {
            let dataTypeDefine = new il_1.DataTypeDefine(this.uq);
            let parser = dataTypeDefine.parser(this.context);
            parser.parse();
            this.uq.dataTypes = dataTypeDefine.datatypes;
        };
        this.parseQueue = () => {
            let queue = new il_1.Queue(this.uq);
            let parser = queue.parser(this.context);
            parser.parse();
            if (this.checkEntityName(queue) === false)
                return;
            this.uq.queues[queue.name] = queue;
        };
        this.parseImport = () => {
            let imp = new il_1.Import(this.uq);
            let parser = imp.parser(this.context);
            parser.parse();
            if (this.checkEntityName(imp) === false)
                return;
            this.uq.imports[imp.name] = imp;
        };
        this.parseBook = () => {
            let book = new il_1.Book(this.uq);
            let parser = book.parser(this.context);
            parser.parse();
            if (this.checkEntityName(book) === false)
                return;
            this.uq.books[book.name] = book;
        };
        this.parseMap = (isOpen = false) => {
            let map = new il_1.Map(this.uq);
            map.isOpen = isOpen;
            let parser = map.parser(this.context);
            parser.parse();
            if (this.checkEntityName(map) === true) {
                this.uq.maps[map.name] = map;
            }
            return map;
        };
        this.parseHistory = () => {
            let history = new il_1.History(this.uq);
            let parser = history.parser(this.context);
            parser.parse();
            if (this.checkEntityName(history) === false)
                return;
            this.uq.histories[history.name] = history;
        };
        this.parsePending = () => {
            let pending = new il_1.Pending(this.uq);
            let parser = pending.parser(this.context);
            parser.parse();
            if (this.checkEntityName(pending) === false)
                return;
            this.uq.pendings[pending.name] = pending;
        };
        this.parseAct = (isOpen = false) => {
            let act = new il_1.Act(this.uq);
            act.isOpen = isOpen;
            let parser = act.parser(this.context);
            parser.parse();
            if (this.checkEntityName(act) === false)
                return;
            this.uq.acts[act.name] = act;
            return act;
        };
        this.parseSysProc = () => {
            let sysproc = new il_1.SysProc(this.uq);
            let parser = sysproc.parser(this.context);
            parser.parse();
            if (this.checkEntityName(sysproc) === false)
                return;
            this.uq.sysprocs[sysproc.name] = sysproc;
        };
        this.parseProc = () => {
            let proc = new il_1.Proc(this.uq);
            let parser = proc.parser(this.context);
            parser.parse();
            if (this.checkEntityName(proc) === false)
                return;
            this.uq.procs[proc.name] = proc;
        };
        this.parseFunction = () => {
            let func = new il_1.Function(this.uq);
            let parser = func.parser(this.context);
            parser.parse();
            if (this.checkEntityName(func) === false)
                return;
            this.uq.funcs[func.name] = func;
        };
        this.parseQuery = () => {
            let query = new il_1.Query(this.uq);
            let parser = query.parser(this.context);
            parser.parse();
            if (this.checkEntityName(query) === false)
                return;
            this.uq.queries[query.name] = query;
        };
        this.parseBus = () => {
            let bus = new il_1.Bus(this.uq);
            let parser = bus.parser(this.context);
            parser.parse();
            let { name } = bus;
            let ent = this.uq.entities[name];
            if (ent !== undefined) {
                let { type } = ent;
                if (type !== 'bus') {
                    this.error(`实体名 ${name} 已经定义为 ${type.toUpperCase()} 了，不能重新定义 BUS`);
                }
                let { busOwner, busName } = ent;
                if (busOwner !== bus.busOwner || busName !== bus.busName) {
                    this.error(`Another bus is from ${busOwner}/${busName}`);
                }
                // bus 是所有实体里面，唯一允许重名的。主要是为了针对多个face，可以分开写accept
                let err = bus.merge(ent);
                if (err !== undefined) {
                    this.error(err); // duplicate query in BUS.
                }
                // this.error('实体名"' + name + '"已经被使用了，不能重复');
                // return false;
            }
            this.uq.entities[name] = bus;
            this.uq.buses[name] = bus;
        };
        this.parseTemplet = () => {
            let templet = new il_1.Templet(this.uq);
            let parser = templet.parser(this.context);
            parser.parse();
            if (this.checkEntityName(templet) === false)
                return;
            this.uq.templets[templet.name] = templet;
        };
        this.parseID = () => {
            let idEntity = new il_1.ID(this.uq);
            let parser = idEntity.parser(this.context);
            parser.parse();
            if (this.checkEntityName(idEntity) === false)
                return;
            this.uq.IDs[idEntity.name] = idEntity;
        };
        this.parseIX = () => {
            let assign = new il_1.IX(this.uq);
            let parser = assign.parser(this.context);
            parser.parse();
            if (this.checkEntityName(assign) === false)
                return;
            this.uq.IXs[assign.name] = assign;
        };
        this.parseIDX = () => {
            let iBook = new il_1.IDX(this.uq);
            let parser = iBook.parser(this.context);
            parser.parse();
            if (this.checkEntityName(iBook) === false)
                return;
            this.uq.IDXs[iBook.name] = iBook;
        };
        this.parseBiz = () => {
            let parser = this.uq.biz.parser(this.context);
            parser.parse();
        };
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
        };
    }
    _parse() {
        this.ts.readToken();
        for (;;) {
            if (this.ts.token === tokens_1.Token.SEMICOLON) {
                this.ts.readToken();
                continue;
            }
            switch (this.ts.token) {
                case tokens_1.Token._FINISHED: break;
                case tokens_1.Token.VAR:
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
    parseUqDoc(docType = 1) {
        if (this.uq.name !== undefined) {
            this.error('只能定义一次uq');
        }
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.expect('uq的名字');
        }
        this.uq.owner = this.ts.lowerVar;
        this.uq.docType = docType;
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.DIV);
        this.ts.readToken();
        this.uq.name = this.ts.lowerVar;
        this.ts.readToken();
        for (;;) {
            switch (this.ts.lowerVar) {
                case 'author':
                    if (this.uq.author !== undefined)
                        this.error('只能定义一次author');
                    this.ts.readToken();
                    this.ts.assertToken(tokens_1.Token.EQU);
                    this.ts.readToken();
                    if (this.ts.token !== tokens_1.Token.STRING)
                        this.error('应该是加引号的字符串');
                    this.uq.author = this.ts.text;
                    this.ts.readToken();
                    continue;
                case 'version':
                    if (this.uq.author !== undefined)
                        this.error('只能定义一次version');
                    this.ts.readToken();
                    this.ts.assertToken(tokens_1.Token.EQU);
                    this.ts.readToken();
                    if (this.ts.token !== tokens_1.Token.STRING)
                        this.error('应该是加引号的字符串');
                    let ver = new il_1.UqVersion(this.ts.text);
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
        if (this.ts.token === tokens_1.Token.LBRACE) {
            let statement = new il_1.UqStatement(undefined);
            statement.level = 0;
            this.context.createStatements = statement.createStatements;
            let parser = statement.parser(this.context);
            parser.parse();
            this.uq.statement = statement;
        }
        if (this.ts.token === tokens_1.Token.SEMICOLON) {
            this.ts.readToken();
        }
    }
    checkEntityName(entity) {
        let ret = this.uq.checkEntityName(entity);
        if (ret === undefined)
            return true;
        this.error(ret);
        return false;
    }
    scan(space) {
        try {
            let ok = true;
            let all = {};
            this.uq.eachChild(el => {
                let pelement = el.pelement;
                if (pelement === undefined)
                    return;
                if (pelement.scaned === true)
                    return;
                let en = el;
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
                if (pelement === undefined)
                    return;
                if (pelement.scan0(appSpace) === false)
                    ok = false;
            });
            this.uq.eachChild(el => {
                let pelement = el.pelement;
                if (pelement === undefined)
                    return;
                if (pelement.scaned === true)
                    return;
                switch (this.uq.docType) {
                    case 1:
                        if (pelement.scanDoc1() === false)
                            ok = false;
                        break;
                    case 2:
                        if (pelement.scanDoc2() === false)
                            ok = false;
                        break;
                }
                if (pelement.scan(appSpace) === false)
                    ok = false;
                pelement.scaned = true;
            });
            this.uq.eachChild(el => {
                let pelement = el.pelement;
                if (pelement === undefined)
                    return;
                if (pelement.scan2ed === true)
                    return;
                if (pelement.scan2(this.uq) === false)
                    ok = false;
                pelement.scan2ed = true;
            });
            let { buses } = this.uq;
            let busNames = {};
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
                    const stat = accept.statement = new il_1.BusAcceptStatement(undefined, accept);
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
            let errText;
            if (typeof err === 'string')
                errText = err;
            else
                errText = err.message;
            this.log('!!!编译器程序错误!!! ' + errText);
            return false;
        }
    }
}
exports.PUq = PUq;
class UqSpace extends space_1.Space {
    constructor(uq) {
        super(undefined);
        this.statementNo = 1;
        this.uq = uq;
    }
    _getEnum(name) { return this.uq.enums[name]; }
    _getBus(name) { return this.uq.buses[name]; }
    _getEntity(name) {
        return this.uq.entities[name];
    }
    _getEntityTable(name) {
        return this.uq.getEntityTable(name);
    }
    _getTableByAlias(alias) { return; }
    _varPointer(name, isField) {
        let _const = this.uq.consts[name];
        if (!_const)
            return;
        return new il_1.ConstPointer(_const.values['$']);
    }
    _getConst(name) {
        return this.uq.consts[name];
    }
    _getBizFromEntityFromAlias(name) {
        /*
        let bizEntity = this.uq.biz.bizEntities.get(name);
        if (bizEntity === undefined) return undefined;
        return {
            bizEntityArr: [bizEntity],
        } as BizFromEntity;
        */
        return undefined;
    }
    _getBizFromEntityFromName(name) {
        let bizEntity = this.uq.biz.bizEntities.get(name);
        if (bizEntity === undefined)
            return undefined;
        return {
            bizEntityArr: [bizEntity],
        };
    }
    getRole() {
        return this.uq.role;
    }
    getDataType(typeName) {
        return this.uq.dataTypes[typeName];
    }
    newStatementNo() { return this.statementNo++; }
    setStatementNo(value) { }
    getBizBase(bizName) {
        return this.uq.biz.getBizBase(bizName);
    }
}
class PUqBiz extends PUq {
    _parse() {
        this.ts.readToken();
        for (;;) {
            if (this.ts.token === tokens_1.Token.SEMICOLON) {
                this.ts.readToken();
                continue;
            }
            switch (this.ts.token) {
                case tokens_1.Token._FINISHED: break;
                case tokens_1.Token.VAR:
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
exports.PUqBiz = PUqBiz;
//# sourceMappingURL=uq.js.map