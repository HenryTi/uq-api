"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = void 0;
const jsonpack = require("jsonpack");
const biz_sys_1 = require("../biz-sys");
const UqBuilder_1 = require("./UqBuilder");
const UqParser_1 = require("./UqParser");
const il_1 = require("../il");
const groups = {
    info: [il_1.BizPhraseType.atom, il_1.BizPhraseType.spec, il_1.BizPhraseType.title, il_1.BizPhraseType.assign, il_1.BizPhraseType.duo],
    sheet: [il_1.BizPhraseType.sheet, il_1.BizPhraseType.bin, il_1.BizPhraseType.pend],
    query: [il_1.BizPhraseType.query],
    relate: [il_1.BizPhraseType.pick, il_1.BizPhraseType.options, il_1.BizPhraseType.tie, il_1.BizPhraseType.tree],
    report: [il_1.BizPhraseType.report],
    permit: [il_1.BizPhraseType.permit], // BizPhraseType.role, 
    console: [il_1.BizPhraseType.console],
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
    async loadBizObjects() {
        let [objs, props] = await this.runner.unitUserTablesFromProc('GetBizObjects', this.site, this.user, 'zh', 'cn');
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
        this.parseSysCode();
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
    parseSysCode() {
        for (let part of biz_sys_1.default) {
            this.uqParser.parse(part, 'sys', true);
        }
    }
    async buildDb() {
        const { uq } = this.uqParser;
        this.setEntitysId(uq.biz.bizArr);
        await this.uqBuilder.build(this.res, this.log);
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
    async buildDbResult() {
        await this.buildDb();
        return this.okResult();
    }
}
exports.Compiler = Compiler;
//# sourceMappingURL=Compiler.js.map