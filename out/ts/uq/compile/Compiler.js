"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilerThoroughly = exports.Compiler = void 0;
const jsonpack = require("jsonpack");
const core_1 = require("../../core");
const UqBuilder_1 = require("./UqBuilder");
const UqParser_1 = require("./UqParser");
const compileSource_1 = require("./compileSource");
const BizPhraseType_1 = require("../il/Biz/BizPhraseType");
const groups = {
    info: [BizPhraseType_1.BizPhraseType.atom, BizPhraseType_1.BizPhraseType.fork, BizPhraseType_1.BizPhraseType.title, BizPhraseType_1.BizPhraseType.assign, BizPhraseType_1.BizPhraseType.duo],
    sheet: [BizPhraseType_1.BizPhraseType.sheet, BizPhraseType_1.BizPhraseType.bin, BizPhraseType_1.BizPhraseType.pend],
    query: [BizPhraseType_1.BizPhraseType.query],
    relate: [BizPhraseType_1.BizPhraseType.pick, BizPhraseType_1.BizPhraseType.options, BizPhraseType_1.BizPhraseType.tie, BizPhraseType_1.BizPhraseType.tree],
    report: [BizPhraseType_1.BizPhraseType.report],
    permit: [BizPhraseType_1.BizPhraseType.permit], // BizPhraseType.role, 
    console: [BizPhraseType_1.BizPhraseType.console],
};
class Compiler {
    constructor(runner, site, user) {
        this.msgs = [];
        this.objNames = {};
        this.objIds = {};
        this.res = {};
        this.buds = {};
        this.newest = [];
        this.log = (msg) => {
            this.msgs.push(msg);
            return true;
        };
        this.runner = runner;
        this.site = site;
        this.user = user;
        this.uqParser = new UqParser_1.UqParser(this);
        this.uqBuilder = new UqBuilder_1.UqBuilder(this, this.uqParser);
        this.biz = this.uqParser.uq.biz;
    }
    loadBizObjects() {
        return __awaiter(this, void 0, void 0, function* () {
            const [objs, props] = yield this.getBizObjects();
            this.objs = objs;
            for (let obj of objs) {
                const { id, phrase, caption } = obj;
                this.objNames[phrase] = obj;
                this.objIds[id] = obj;
                this.res[phrase] = caption;
            }
            for (let prop of props) {
                const { id, phrase, base, caption } = prop;
                const obj = this.objIds[base];
                let { props } = obj;
                if (props === undefined) {
                    obj.props = props = [];
                }
                props.push(prop);
                this.buds[phrase] = prop;
                this.res[phrase] = caption;
            }
        });
    }
    getSource(group) {
        let sources = [];
        let arr = groups[group];
        if (arr !== undefined) {
            for (let entity of this.biz.bizArr) {
                let { name, bizPhraseType } = entity;
                if (arr.includes(bizPhraseType) === true) {
                    let { source } = this.objNames[name];
                    let s = source;
                    if (s.endsWith('\n') === false)
                        s += '\n';
                    sources.push(s);
                }
            }
        }
        else {
            sources.push(`-- ${group} is not a valid source group
`);
        }
        return sources.join('');
    }
    setEntitysId(bizArr) {
        const { objNames, buds } = this;
        let len = bizArr.length;
        let indexTobeRemoved;
        for (let i = 0; i < len; i++) {
            let entity = bizArr[i];
            const { phrase } = entity;
            const obj = objNames[phrase];
            if (obj === undefined)
                continue;
            const { id, source } = obj;
            if (!source)
                continue;
            entity.id = id;
            entity.forEachBud(bud => {
                let e = entity;
                let savedBud = buds[bud.phrase];
                if (savedBud === undefined) {
                    return;
                }
                bud.id = savedBud.id;
            });
            entity.forEachGroup(group => {
                let saveBud = buds[group.phrase];
                if (saveBud !== undefined)
                    group.id = saveBud.id;
            });
        }
        // 
        if (indexTobeRemoved !== undefined) {
            bizArr.splice(indexTobeRemoved, 1);
        }
    }
    parseCode(code) {
        this.uqParser.parse(code, 'upload');
        this.newest.push(...this.biz.bizArr);
        if (this.uqParser.ok === false) {
            throw this.errorResult();
        }
    }
    // 单entity上传，校验
    // 1. 只有一个
    // 2. 没有改名
    checkSingle(entityId) {
        if (this.newest.length !== 1)
            return false;
        let obj = this.objIds[entityId];
        if (obj === undefined)
            return false;
        let entity = this.newest[0];
        if (obj.phrase !== entity.name)
            return false;
        return true;
    }
    changeName(entityId, entityName) {
        const obj = this.objIds[entityId];
        if (obj === false)
            return undefined;
        const { source: code } = obj;
        this.parseCode(code);
        let entity = this.newest[0];
        let p = entity.nameStartAt;
        let c = code;
        c = c.substring(0, p) + entityName + c.substring(p + entityName.length);
        this.newest.splice(0);
        this.uqParser = new UqParser_1.UqParser(this);
        this.parseCode(c);
        return c;
    }
    delEntity(entityId) {
        delete this.objIds[entityId];
        for (let i in this.objNames) {
            if (this.objNames[i].id === entityId) {
                delete this.objNames[i];
                break;
            }
        }
        for (let i = 0; i < this.objs.length; i++) {
            let obj = this.objs[i];
            if (obj.id === entityId) {
                this.objs.splice(i, 1);
                break;
            }
        }
        this.biz.delEntity(entityId);
    }
    errorResult() {
        return {
            logs: this.msgs,
            hasError: true,
        };
    }
    isNewest(phrase) {
        return this.newest.find(v => v.name === phrase) !== undefined;
    }
    parseBiz() {
        this.newest.splice(0);
        this.newest.push(...this.biz.bizArr);
        for (let obj of this.objs) {
            const { id, phrase, source } = obj;
            if (!source)
                continue;
            if (this.isNewest(phrase) === true)
                continue;
            this.uqParser.parse(source, phrase);
        }
    }
    setNewest() {
    }
    buildDb() {
        return __awaiter(this, void 0, void 0, function* () {
            const { uq } = this.uqParser;
            this.setEntitysId(uq.biz.bizArr);
            this.setNewest();
            yield this.uqBuilder.build(this.res, this.log);
        });
    }
    throwError(err) {
        if (err.hasError === true) {
            return err;
        }
        let logs = [err.message];
        let { stack } = err;
        let type = typeof stack;
        switch (type) {
            default:
                logs.push('typeof err.stack ' + type);
                break;
            case 'undefined': break;
            case 'object':
                logs.push(JSON.stringify(stack));
                break;
            case 'string':
                logs.push(...stack.split('\n'));
                break;
        }
        return {
            hasError: true,
            logs,
        };
    }
    okResult() {
        let schemas = this.uqParser.uq.buildSchemas(this.res);
        return {
            schemas: jsonpack.pack(schemas.$biz),
            logs: this.msgs,
            hasError: false,
        };
    }
    scan() {
        this.uqParser.scan();
        if (this.uqParser.ok === false) {
            throw {
                logs: this.msgs,
                hasError: true,
            };
        }
    }
    buildDbResult() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.buildDb();
            return this.okResult();
        });
    }
    getBizObjects() {
        return __awaiter(this, void 0, void 0, function* () {
            let [[site], objs, props] = yield this.runner.unitUserTablesFromProc('GetBizObjects', this.site, this.user, 'zh', 'cn');
            const { uqApiVersion, compilingTick } = site;
            const { uq_api_version } = (0, core_1.getDbs)();
            let now = Date.now() / 1000;
            if (compilingTick > 0 && now - compilingTick < 60) {
                return [[], []];
            }
            let parts = uq_api_version.split('.');
            let newVersion = Number(parts[0]) * 10000 + Number(parts[1]);
            if (compilingTick < 0 || (Number.isNaN(newVersion) === false && uqApiVersion > 0 && newVersion > uqApiVersion)) {
                yield this.runner.call('$setSiteCompiling', [0, 0, this.site, uqApiVersion, now]);
                yield this.recompileAll();
                yield this.runner.call('$setSiteCompiling', [0, 0, this.site, newVersion, 0]);
            }
            return [objs, props];
        });
    }
    recompileAll() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, compileSource_1.compileBizThoroughly)(this.runner, this.site, this.user);
        });
    }
}
exports.Compiler = Compiler;
class CompilerThoroughly extends Compiler {
    getBizObjects() {
        return __awaiter(this, void 0, void 0, function* () {
            let [[site], objs, props] = yield this.runner.unitUserTablesFromProc('GetBizObjects', this.site, this.user, 'zh', 'cn');
            return [objs, props];
        });
    }
    setNewest() {
        this.newest.splice(0);
        this.newest.push(...this.biz.bizArr);
    }
}
exports.CompilerThoroughly = CompilerThoroughly;
//# sourceMappingURL=Compiler.js.map