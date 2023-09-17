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
        this.biz = biz;
        this.runner = runner;
        this.site = site;
        this.user = user;
    }
    async parse(objs, props) {
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
    async saveBizObject(entity) {
        const { type, phrase, caption, source } = entity;
        const memo = undefined;
        let [{ id }] = await this.runner.unitUserTableFromProc('SaveBizObject', this.site, this.user, phrase, caption, entity.typeNum, memo, source, undefined);
        let obj = { id, phrase };
        entity.id = id;
        this.objIds[id] = obj;
        this.objNames[phrase] = obj;
    }
    async saveBizEntityBuds(entity) {
        let { id } = this.objNames[entity.phrase];
        let buds = entity.getAllBuds();
        await Promise.all(buds.map(v => {
            return this.saveBud(id, v);
        }));
    }
    ;
    async saveBud(id, bud) {
        const { phrase, caption, memo, dataTypeNum, objName, flag } = bud;
        const typeNum = bud.typeNum;
        let objId;
        if (objName !== undefined) {
            const obj = this.objNames[objName];
            if (obj !== undefined) {
                objId = obj.id;
            }
        }
        await this.runner.unitUserCall('SaveBizBud', this.site, this.user, id, phrase, caption, typeNum, memo, dataTypeNum, objId, flag);
    }
    async build(log) {
        await Promise.all(this.biz.latestBizArr.map(entity => {
            return this.saveBizObject(entity);
        }));
        const atomPairs = this.biz.getAtomExtendsPairs();
        await this.runner.unitUserTableFromProc('SaveBizIX', this.site, this.user, JSON.stringify(atomPairs));
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
        await this.buildSiteDbs(log);
    }
    async buildSiteDbs(log) {
        const hasUnit = false;
        const compilerVersion = '0.0';
        const compileOptions = {
            uqIds: [],
            user: 0,
            action: 'thoroughly',
            autoRemoveTableField: false,
            autoRemoveTableIndex: false,
        };
        let context = new builder_1.DbContext(compilerVersion, sqlType, this.runner.dbName, '', log, hasUnit);
        context.ownerDbName = '$site';
        //const bUq = new BUq(this.biz.uq, context);
        // let bizDbBuilder = this.biz.db(context);
        //let a = this.biz.db(context) as BBiz;
        //a.buildProcedures();
        for (let bizEntity of this.biz.latestBizArr) {
            let builder = bizEntity.db(context);
            if (builder === undefined)
                continue;
            await builder.buildProcedures();
        }
        await context.coreObjs.updateDb(this.runner, compileOptions);
    }
    buildSchemas() {
        return this.biz.uq.buildSchemas(this.res);
    }
}
exports.BizSiteBuilder = BizSiteBuilder;
//# sourceMappingURL=bizSiteBuilder.js.map