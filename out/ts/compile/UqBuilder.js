"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UqBuilder = void 0;
const builder_1 = require("../uq/builder");
const sqlType = 'mysql';
class UqBuilder {
    constructor(compiler, uqParser) {
        this.compiler = compiler;
        this.biz = uqParser.uq.biz;
        this.runner = compiler.runner;
        this.site = compiler.site;
        this.user = compiler.user;
    }
    isIdNameOk() { return true; }
    //async loadObjects(objs: any, props: any) {
    // }
    async saveBizObject(entity) {
        const { objIds, objNames, res } = this.compiler;
        const { type, phrase, ui: { caption }, source } = entity;
        const memo = undefined;
        if (phrase === undefined)
            debugger;
        let [{ id }] = await this.runner.unitUserTableFromProc('SaveBizObject', this.site, this.user, this.newSoleEntityId, phrase, caption, entity.typeNum, memo, source);
        let obj = { id, phrase };
        entity.id = id;
        objIds[id] = obj;
        objNames[phrase] = obj;
        res[phrase] = caption;
    }
    async saveBizSchema(entity) {
        const { id, schema } = entity;
        let schemaText = JSON.stringify(schema);
        await this.runner.unitUserTableFromProc('SaveBizSchema', this.site, this.user, id, schemaText);
    }
    async saveBizEntityBuds(entity) {
        let promises = [];
        entity.forEachBud(bud => {
            promises.push(this.saveBud(entity, bud));
        });
        await Promise.all(promises);
    }
    ;
    async saveBud(entity, bud) {
        const { objNames, res } = this.compiler;
        const { phrase, ui: { caption }, memo, dataType: dataTypeNum, objName, flag } = bud;
        const typeNum = bud.typeNum;
        let objId;
        if (objName !== undefined) {
            const obj = objNames[objName];
            if (obj !== undefined) {
                objId = obj.id;
            }
        }
        let [{ id: budId }] = await this.runner.unitUserCall('SaveBizBud', this.site, this.user, entity.id, bud.id, phrase, caption, typeNum, memo, dataTypeNum, objId, flag
        // , undefined // ex === undefined ? undefined : JSON.stringify(ex)
        );
        bud.id = budId;
        res[phrase] = caption;
    }
    async build(res, log) {
        const { newest } = this.compiler;
        await Promise.all(newest.map(entity => {
            return this.saveBizObject(entity);
        }));
        const ixPairs = this.biz.getEntityIxPairs(newest);
        console.log(ixPairs);
        await this.runner.unitUserTableFromProc('SaveBizIX', this.site, this.user, JSON.stringify(ixPairs));
        await Promise.all(newest.map(entity => {
            return this.saveBizEntityBuds(entity);
        }));
        const ixBizRoles = this.biz.getIxRoles();
        await this.runner.unitUserTableFromProc('SaveIxPermission', this.site, this.user, JSON.stringify(ixBizRoles));
        const hasUnit = false;
        const compilerVersion = '0.0';
        let context = new builder_1.DbContext(compilerVersion, sqlType, this.runner.dbName, '', log, hasUnit);
        context.site = this.site;
        context.ownerDbName = '$site';
        await this.buildSiteDbs(context, log);
        this.buildBudsValue(context);
        this.biz.buildSchema(res);
        await Promise.all(newest.map(entity => {
            return this.saveBizSchema(entity);
        }));
    }
    async buildSiteDbs(context, log) {
        const compileOptions = {
            uqIds: [],
            user: 0,
            action: 'thoroughly',
            autoRemoveTableField: false,
            autoRemoveTableIndex: false,
        };
        for (let bizEntity of this.compiler.newest) {
            let builder = bizEntity.db(context);
            if (builder === undefined)
                continue;
            await builder.buildProcedures();
        }
        await context.coreObjs.updateDb(this.runner, compileOptions);
    }
    buildBudsValue(context) {
        for (let bizEntity of this.biz.bizArr) {
            let builder = bizEntity.db(context);
            if (builder === undefined)
                continue;
            builder.buildBudsValue();
        }
    }
}
exports.UqBuilder = UqBuilder;
//# sourceMappingURL=UqBuilder.js.map