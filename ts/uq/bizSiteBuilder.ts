import { EntityRunner } from "../core";
import { BBiz, BUq, CompileOptions, DbContext } from "./builder";
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

    async loadObjects(objs: any, props: any) {
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

    get sysEntitySources(): string[] { return sysSiteBizEntities; }

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
        this.res[phrase] = caption;
    }

    private async saveBizEntityBuds(entity: BizEntity) {
        let { id } = this.objNames[entity.phrase];
        let buds = entity.getAllBuds();
        await Promise.all(buds.map(v => {
            return this.saveBud(id, v);
        }));
    };

    private async saveBud(id: number, bud: IBud) {
        const { phrase, caption, memo, dataType: dataTypeNum, objName, flag } = bud;
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
        this.res[phrase] = caption;
    }

    async build(log: (msg: string) => boolean) {
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizObject(entity);
        }));
        const atomPairs = this.biz.getAtomExtendsPairs();
        console.log(atomPairs);
        await this.runner.unitUserTableFromProc('SaveBizIX'
            , this.site, this.user, JSON.stringify(atomPairs));
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizEntityBuds(entity);
        }));
        await this.buildSiteDbs(log);
    }

    private async buildSiteDbs(log: (msg: string) => boolean) {
        const hasUnit = false;
        const compilerVersion = '0.0';
        const compileOptions: CompileOptions = {
            uqIds: [],
            user: 0,
            action: 'thoroughly',
            autoRemoveTableField: false,
            autoRemoveTableIndex: false,
        }
        let context = new DbContext(compilerVersion, sqlType, this.runner.dbName, '', log, hasUnit);
        context.site = this.site;
        context.ownerDbName = '$site';
        for (let bizEntity of this.biz.latestBizArr) {
            let builder = bizEntity.db(context);
            if (builder === undefined) continue;
            await builder.buildProcedures();
        }

        await context.coreObjs.updateDb(this.runner, compileOptions);
    }

    buildSchemas() {
        return this.biz.uq.buildSchemas(this.res);
    }
}

const sysSiteBizEntities: string[] = [
    /*
    定义bud等同于atom，所以不再需要下面的定义。
        `
        ATOM $UomAtom {
            -- BASE;                没有定义base，保存的时候，也可以自己设定
            PROP uom ATOM;
        };
        Moniker $ {
            PROP uom;
        };
        `
    */
];
