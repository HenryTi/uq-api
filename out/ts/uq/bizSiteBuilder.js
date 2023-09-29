"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSiteBuilder = void 0;
const builder_1 = require("./builder");
const sqlType = 'mysql';
const dbSiteName = '$site';
class BizSiteBuilder {
    constructor(biz, runner, site, user) {
        this.res = {};
        this.objNames = {};
        this.objIds = {};
        this.buds = {};
        this.biz = biz;
        this.runner = runner;
        this.site = site;
        this.user = user;
    }
    async loadObjects(objs, props) {
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
    get sysEntitySources() { return sysSiteBizEntities; }
    async saveBizObject(entity) {
        const { type, phrase, caption, source } = entity;
        const memo = undefined;
        if (phrase === undefined)
            debugger;
        let [{ id }] = await this.runner.unitUserTableFromProc('SaveBizObject', this.site, this.user, phrase, caption, entity.typeNum, memo, source, undefined);
        let obj = { id, phrase };
        entity.id = id;
        this.objIds[id] = obj;
        this.objNames[phrase] = obj;
        this.res[phrase] = caption;
    }
    async saveBizEntityBuds(entity) {
        let { id } = this.objNames[entity.phrase];
        let promises = [];
        entity.forEachBud(bud => {
            promises.push(this.saveBud(id, bud));
        });
        // let buds = entity.getAllBuds();
        await Promise.all(promises);
    }
    ;
    async saveBud(id, bud) {
        const { phrase, caption, memo, dataType: dataTypeNum, objName, flag } = bud;
        const typeNum = bud.typeNum;
        let objId;
        if (objName !== undefined) {
            const obj = this.objNames[objName];
            if (obj !== undefined) {
                objId = obj.id;
            }
        }
        if (phrase === undefined)
            debugger;
        let [{ id: budId }] = await this.runner.unitUserCall('SaveBizBud', this.site, this.user, id, phrase, caption, typeNum, memo, dataTypeNum, objId, flag);
        bud.id = budId;
        this.res[phrase] = caption;
    }
    async build(log) {
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizObject(entity);
        }));
        const atomPairs = this.biz.getAtomExtendsPairs();
        console.log(atomPairs);
        await this.runner.unitUserTableFromProc('SaveBizIX', this.site, this.user, JSON.stringify(atomPairs));
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizEntityBuds(entity);
        }));
        const hasUnit = false;
        const compilerVersion = '0.0';
        let context = new builder_1.DbContext(compilerVersion, sqlType, this.runner.dbName, '', log, hasUnit);
        context.site = this.site;
        context.ownerDbName = '$site';
        await this.buildSiteDbs(context, log);
        this.buildBudsValue(context);
    }
    async buildSiteDbs(context, log) {
        const compileOptions = {
            uqIds: [],
            user: 0,
            action: 'thoroughly',
            autoRemoveTableField: false,
            autoRemoveTableIndex: false,
        };
        for (let bizEntity of this.biz.latestBizArr) {
            let builder = bizEntity.db(context);
            if (builder === undefined)
                continue;
            await builder.buildProcedures();
        }
        await context.coreObjs.updateDb(this.runner, compileOptions);
    }
    buildBudsValue(context) {
        for (let bizEntity of this.biz.bizArr) {
            this.buildBudsId(bizEntity);
            let builder = bizEntity.db(context);
            if (builder === undefined)
                continue;
            builder.buildBudsValue();
        }
    }
    buildBudsId(bizEntity) {
        bizEntity.forEachBud(bud => {
            let { phrase } = bud;
            bud.id = this.buds[phrase].id;
        });
    }
    buildSchemas() {
        return this.biz.uq.buildSchemas(this.res);
    }
}
exports.BizSiteBuilder = BizSiteBuilder;
const sysSiteBizEntities = [
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
//# sourceMappingURL=bizSiteBuilder.js.map