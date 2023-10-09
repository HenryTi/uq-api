import { EntityRunner } from "../core";
import { BBiz, BUq, CompileOptions, DbContext } from "./builder";
import { Biz, BizBud, BizBudValue, BizEntity/*, IBud*/ } from "./il";

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
    private readonly buds: { [phrase: string]: any } = {};
    private newSoleEntityId: number;    // 本次刚刚编译的唯一Entity
    private newMatchOldObj: any;

    constructor(biz: Biz, runner: EntityRunner, site: number, user: number) {
        this.biz = biz;
        this.runner = runner;
        this.site = site;
        this.user = user;
    }

    markNewEntityId(entityId: number): boolean {
        const { latestBizArr } = this.biz;
        let entity = latestBizArr[0];
        if (entity === undefined) return true;

        this.newSoleEntityId = entityId;
        let { name } = entity;
        let obj = this.objNames[name];
        if (obj === undefined) {
            let objId = this.objIds[entityId];
            this.newMatchOldObj = objId;
            return true;
        }
        let { id } = obj;
        if (id !== entityId) return false;
        if (name !== obj.phrase) {
        }
        return true;
    }

    setEntitysId() {
        const { bizArr } = this.biz;
        let len = bizArr.length;
        let indexTobeRemoved: number;
        for (let i = 0; i < len; i++) {
            let entity = bizArr[i];
            const { phrase } = entity;
            const obj = this.objNames[phrase];
            if (obj === undefined) continue;
            if (obj === this.newMatchOldObj) indexTobeRemoved = i;
            const { id, source } = obj;
            if (!source) continue;
            entity.id = id;
            entity.forEachBud(bud => {
                let e = entity;
                let savedBud = this.buds[bud.phrase];
                if (savedBud === undefined) {
                    return;
                }
                bud.id = savedBud.id;
            });
        }
        // 
        if (indexTobeRemoved !== undefined) {
            bizArr.splice(indexTobeRemoved, 1);
        }
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
            this.buds[phrase] = prop;
            this.res[phrase] = caption;
        }
    }

    get sysEntitySources(): string[] { return sysSiteBizEntities; }

    private async saveBizObject(entity: BizEntity) {
        const { type, phrase, caption, source } = entity;
        const memo = undefined;
        if (phrase === undefined) debugger;
        let [{ id }] = await this.runner.unitUserTableFromProc('SaveBizObject'
            , this.site, this.user, this.newSoleEntityId, phrase, caption, entity.typeNum, memo, source
            , undefined);
        let obj = { id, phrase };
        entity.id = id;
        this.objIds[id] = obj;
        this.objNames[phrase] = obj;
        this.res[phrase] = caption;
    }

    private async saveBizEntityBuds(entity: BizEntity) {
        // let { id } = this.objNames[entity.phrase];
        let promises: Promise<any>[] = [];
        entity.forEachBud(bud => {
            promises.push(this.saveBud(entity, bud));
        })
        await Promise.all(promises);
    };

    private async saveBud(entity: BizEntity, bud: BizBud) {
        const { phrase, caption, memo, dataType: dataTypeNum, objName, flag } = bud;
        const typeNum = bud.typeNum;
        let objId: number;
        if (objName !== undefined) {
            const obj = this.objNames[objName];
            if (obj !== undefined) {
                objId = obj.id;
            }
        }
        let [{ id: budId }] = await this.runner.unitUserCall('SaveBizBud'
            , this.site, this.user, entity.id, bud.id, phrase, caption
            , typeNum, memo, dataTypeNum, objId, flag
            , null
        );
        bud.id = budId;
        this.res[phrase] = caption;
    }

    async build(log: (msg: string) => boolean) {
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizObject(entity);
        }));
        const ixPairs = this.biz.getEntityIxPairs();
        console.log(ixPairs);
        await this.runner.unitUserTableFromProc('SaveBizIX'
            , this.site, this.user, JSON.stringify(ixPairs));
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizEntityBuds(entity);
        }));

        const ixBizRoles = this.biz.getIxRoles();
        await this.runner.unitUserTableFromProc('SaveIxPermission'
            , this.site, this.user, JSON.stringify(ixBizRoles));

        const hasUnit = false;
        const compilerVersion = '0.0';
        let context = new DbContext(compilerVersion, sqlType, this.runner.dbName, '', log, hasUnit);
        context.site = this.site;
        context.ownerDbName = '$site';
        await this.buildSiteDbs(context, log);
        this.buildBudsValue(context);
    }

    private async buildSiteDbs(context: DbContext, log: (msg: string) => boolean) {
        const compileOptions: CompileOptions = {
            uqIds: [],
            user: 0,
            action: 'thoroughly',
            autoRemoveTableField: false,
            autoRemoveTableIndex: false,
        }
        for (let bizEntity of this.biz.latestBizArr) {
            let builder = bizEntity.db(context);
            if (builder === undefined) continue;
            await builder.buildProcedures();
        }

        await context.coreObjs.updateDb(this.runner, compileOptions);
    }

    private buildBudsValue(context: DbContext) {
        for (let bizEntity of this.biz.bizArr) {
            let builder = bizEntity.db(context);
            if (builder === undefined) continue;
            builder.buildBudsValue();
        }
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
        Title $ {
            PROP uom;
        };
        `
    */
];
