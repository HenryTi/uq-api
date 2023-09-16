import { EntityRunner } from "../core";
import { BBiz, BUq, DbContext } from "./builder";
import { Biz, BizBud, BizEntity, IBud } from "./il";

const sqlType = 'mysql';
const dbSiteName = '$site';

export class BizSiteBuilder {
    private biz: Biz;
    private readonly runner: EntityRunner;
    private readonly site: number;
    private readonly user: number;
    private readonly res: { [phrase: string]: string } = {};
    private readonly objNames: { [name: string]: any } = {};
    private readonly objIds: { [id: number]: any } = {};

    constructor(biz: Biz, runner: EntityRunner, site: number, user: number) {
        this.biz = biz;
        this.runner = runner;
        this.site = site;
        this.user = user;
    }

    async parse(objs: any, props: any) {
        // let [objs, props] = await this.runner.unitUserTablesFromProc('GetBizObjects', this.site, this.user, 'zh', 'cn');
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
            this.res[phrase] = caption;
        }
    }

    /*
        // biz.bizArr.splice(0);
        if (clientSource) {
            uqRunner.parse(clientSource, 'upload');
            uqRunner.anchorLatest();
        }
        // let bizArr = [...biz.bizArr];
        for (let obj of objs) {
            const { phrase, source } = obj;
            if (!source) continue;
            if (override === true) {
                if (uqRunner.isLatest(phrase) === true) continue;
            }
            uqRunner.parse(source, phrase);
        }
    
        uqRunner.scan();
        if (uqRunner.ok === false) {
            return {
                logs: msgs,
            }
        }
        await uqRunner.saveLatest(runner);
        */

    private async saveBizObject(entity: BizEntity) {
        const { type, phrase, caption, source } = entity;
        const memo = undefined;
        let [{ id }] = await this.runner.unitUserTableFromProc('SaveBizObject'
            , this.site, this.user, phrase, caption, entity.typeNum, memo, source
            , undefined);
        let obj = { id, phrase };
        entity.id = id;
        this.objIds[id] = obj;
        this.objNames[phrase] = obj;
    }

    private async saveBizEntityBuds(entity: BizEntity) {
        let { id } = this.objNames[entity.phrase];
        let buds = entity.getAllBuds();
        await Promise.all(buds.map(v => {
            return this.saveBud(id, v);
        }));
    };

    private async saveBud(id: number, bud: IBud) {
        const { phrase, caption, memo, dataTypeNum, objName, flag } = bud;
        const typeNum = bud.typeNum;
        let objId: number;
        if (objName !== undefined) {
            const obj = this.objNames[objName];
            if (obj !== undefined) {
                objId = obj.id;
            }
        }
        await this.runner.unitUserCall('SaveBizBud'
            , this.site, this.user, id, phrase, caption
            , typeNum, memo, dataTypeNum, objId, flag
        );
    }

    async build(log: (msg: string) => boolean) {
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizObject(entity);
        }));
        const atomPairs = this.biz.getAtomExtendsPairs();
        await this.runner.unitUserTableFromProc('SaveBizIX'
            , this.site, this.user, JSON.stringify(atomPairs));
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizEntityBuds(entity);
        }));
        /*
        let schemas = uq.buildSchemas(this.res);
        return {
            schemas: jsonpack.pack(schemas.$biz), //: uqRunner.uq.biz.schema, //.bizArr.map(v => v.buildSchema()),
            logs: msgs,
        }
        */
        this.buildSiteDbs(log);
    }

    private async buildSiteDbs(log: (msg: string) => boolean) {
        const hasUnit = false;
        const compilerVersion = '0.0';
        let context = new DbContext(compilerVersion, sqlType, dbSiteName, '', log, hasUnit);
        //const bUq = new BUq(this.biz.uq, context);
        // let bizDbBuilder = this.biz.db(context);
        //let a = this.biz.db(context) as BBiz;
        //a.buildProcedures();
        for (let bizEntity of this.biz.latestBizArr) {
            let builder = bizEntity.db(context);
            await builder.buildProcedures();
        }
    }

    buildSchemas() {
        return this.biz.uq.buildSchemas(this.res);
    }
}
