import * as jsonpack from 'jsonpack';
import { EntityRunner, getDbs } from "../../core";
import { UqBuilder } from "./UqBuilder";
import { UqParser } from './UqParser';
import { Biz, BizEntity } from '../il';
import { compileBizThoroughly } from './compileSource';
import { BizPhraseType } from '../il/Biz/BizPhraseType';
import { logger } from '../../tool';

const groups: { [name: string]: BizPhraseType[] } = {
    info: [BizPhraseType.atom, BizPhraseType.fork, BizPhraseType.book, BizPhraseType.assign, BizPhraseType.duo, BizPhraseType.combo],
    sheet: [BizPhraseType.sheet, BizPhraseType.bin, BizPhraseType.pend],
    query: [BizPhraseType.query],
    relate: [BizPhraseType.pick, BizPhraseType.options, BizPhraseType.tie, BizPhraseType.tree],
    report: [BizPhraseType.report],
    permit: [BizPhraseType.permit],           // BizPhraseType.role, 
    console: [BizPhraseType.console],
};

export class Compiler {
    readonly runner: EntityRunner;
    readonly site: number;
    readonly user: number;
    readonly msgs: string[] = [];
    readonly objNames: { [name: string]: any } = {};
    readonly objIds: { [id: number]: any } = {};
    readonly res: { [phrase: string]: string } = {};
    readonly buds: { [phrase: string]: any } = {};
    private objs: any[];
    private uqParser: UqParser;
    private readonly uqBuilder: UqBuilder;
    protected readonly biz: Biz;
    readonly newest: BizEntity[] = [];

    constructor(runner: EntityRunner, site: number, user: number) {
        this.runner = runner;
        this.site = site;
        this.user = user;
        this.uqParser = new UqParser(this);
        this.uqBuilder = new UqBuilder(this, this.uqParser);
        this.biz = this.uqParser.uq.biz;
    }

    async loadBizObjects() {
        const time = Date.now();
        const [objs, props] = await this.getBizObjects();
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
        logger.debug('loadBizObjects from DB ', Date.now() - time, 'ms');
    }

    private getSourceInternal(group: string, sources: string[]) {
        let arr = groups[group];
        if (arr !== undefined) {
            for (let entity of this.biz.bizArr) {
                let { name, bizPhraseType } = entity;
                if (arr.includes(bizPhraseType) === true) {
                    let { source } = this.objNames[name];
                    let s: string = source;
                    if (s.endsWith('\n') === false) s += '\n';
                    sources.push(s);
                }
            }
        }
        else {
            sources.push(
                `-- ${group} is not a valid source group
`);
        }
    }

    getSource(group: string) {
        let sources: string[] = [];
        if (group === undefined) {
            for (let i in groups) {
                this.getSourceInternal(i, sources);
            }
        }
        else {
            this.getSourceInternal(group, sources);
        }
        return sources.join('');
    }

    private setEntitysId(bizArr: BizEntity[]) {
        const { objNames, buds } = this;
        let len = bizArr.length;
        let indexTobeRemoved: number;
        for (let i = 0; i < len; i++) {
            let entity = bizArr[i];
            const { phrase } = entity;
            const obj = objNames[phrase];
            if (obj === undefined) continue;
            const { id, source } = obj;
            if (!source) continue;
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
                if (saveBud !== undefined) group.id = saveBud.id;
            });
        }
        // 
        if (indexTobeRemoved !== undefined) {
            bizArr.splice(indexTobeRemoved, 1);
        }
    }

    parseCode(code: string) {
        this.uqParser.parse(code, 'upload');
        this.newest.push(...this.biz.bizArr);
        if (this.uqParser.ok === false) {
            throw this.errorResult();
        }
    }

    // 单entity上传，校验
    // 1. 只有一个
    // 2. 没有改名
    checkSingle(entityId: number) {
        if (this.newest.length !== 1) return false;
        let obj = this.objIds[entityId];
        if (obj === undefined) return false;
        let entity = this.newest[0];
        if (obj.phrase !== entity.name) return false;
        return true;
    }

    changeName(entityId: number, entityName: string) {
        const obj = this.objIds[entityId];
        if (obj === false) return undefined;
        const { source: code } = obj;
        this.parseCode(code);
        let entity = this.newest[0];
        let p = entity.nameStartAt;
        let c: string = (code as string);
        c = c.substring(0, p) + entityName + c.substring(p + (entityName as string).length);
        this.newest.splice(0);
        this.uqParser = new UqParser(this);
        this.parseCode(c);
        return c;
    }

    delEntity(entityId: number) {
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
        }
    }

    isNewest(phrase: string) {
        return this.newest.find(v => v.name === phrase) !== undefined;
    }

    parseBiz() {
        this.newest.splice(0);
        this.newest.push(...this.biz.bizArr);
        for (let obj of this.objs) {
            const { id, phrase, source } = obj;
            if (!source) continue;
            if (this.isNewest(phrase) === true) continue;
            this.uqParser.parse(source, phrase);
        }
    }

    protected setNewest() {
    }

    async buildDb() {
        const { uq } = this.uqParser;
        this.setEntitysId(uq.biz.bizArr);
        this.setNewest();
        await this.uqBuilder.build(this.res, this.log);
    }

    throwError(err: any) {
        if (err.hasError === true) {
            return err;
        }
        let logs = [err.message];
        let { stack } = err;
        let type = typeof stack;
        switch (type) {
            default: logs.push('typeof err.stack ' + type); break;
            case 'undefined': break;
            case 'object': logs.push(JSON.stringify(stack)); break;
            case 'string': logs.push(...stack.split('\n')); break;
        }
        return {
            hasError: true,
            logs,
        }
    }

    okResult() {
        let schemas = this.uqParser.uq.buildSchemas(this.res);
        return {
            schemas: jsonpack.pack(schemas.$biz),
            logs: this.msgs,
            hasError: false,
        }
    }

    scan() {
        this.uqParser.scan();
        if (this.uqParser.ok === false) {
            throw {
                logs: this.msgs,
                hasError: true,
            }
        }
    }

    async buildDbResult() {
        await this.buildDb();
        return this.okResult();
    }

    readonly log = (msg: string) => {
        this.msgs.push(msg);
        return true;
    }

    protected async getBizObjects() {
        let [[site], objs, props] = await this.runner.unitUserTablesFromProc('GetBizObjects', this.site, this.user, 'zh', 'cn');
        const { uqApiVersion, compilingTick } = site as { uqApiVersion: number; compilingTick: number; };
        const { uq_api_version } = getDbs();
        let now = Date.now() / 1000;
        if (compilingTick > 0 && now - compilingTick < 60) {
            return [[], []];
        }
        let parts = uq_api_version.split('.');
        let newVersion = Number(parts[0]) * 10000 + Number(parts[1]);
        if (compilingTick < 0 || (Number.isNaN(newVersion) === false && uqApiVersion > 0 && newVersion > uqApiVersion)) {
            await this.runner.call('$setSiteCompiling', [0, 0, this.site, uqApiVersion, now]);
            await this.recompileAll();
            await this.runner.call('$setSiteCompiling', [0, 0, this.site, newVersion, 0]);
        }
        return [objs, props];
    }

    async recompileAll() {
        await compileBizThoroughly(this.runner, this.site, this.user);
    }
}

export class CompilerThoroughly extends Compiler {
    async getBizObjects() {
        let [[site], objs, props] = await this.runner.unitUserTablesFromProc('GetBizObjects', this.site, this.user, 'zh', 'cn');
        return [objs, props];
    }

    protected setNewest() {
        this.newest.splice(0);
        this.newest.push(...this.biz.bizArr);
    }
}
