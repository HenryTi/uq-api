"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UqBuilder = void 0;
const builder_1 = require("../builder");
const il_1 = require("../il");
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
    async saveBizObject(entity) {
        const { objIds, objNames, res } = this.compiler;
        const { type, phrase, ui: { caption }, source } = entity;
        const memo = undefined;
        if (phrase === undefined)
            debugger;
        if (source === undefined)
            debugger;
        let budParams = [];
        let buds = [];
        entity.forEachBud(bud => {
            buds.push(bud);
            const { phrase, ui: { caption }, memo, dataType: dataTypeNum, objName, flag } = bud;
            const typeNum = bud.typeNum;
            let objId;
            if (objName !== undefined) {
                const obj = objNames[objName];
                if (obj !== undefined) {
                    objId = obj.id;
                }
            }
            budParams.push({
                id: bud.id,
                name: phrase, caption,
                type: typeNum, memo,
                dataType: dataTypeNum, objId, flag
            });
        });
        entity.forEachGroup(group => {
            if (group.buds.length === 0)
                return;
            const { id, phrase, ui, typeNum, memo } = group;
            let caption;
            if (ui !== undefined)
                caption = ui.caption;
            budParams.push({
                id,
                name: phrase, caption,
                type: typeNum, memo,
                dataType: 0,
                objId: 0,
                flag: 0,
            });
        });
        let [[ret], budIds] = await this.runner.unitUserTablesFromProc('SaveBizObject', this.site, this.user, this.newSoleEntityId, phrase, caption, entity.typeNum, memo, source, JSON.stringify(budParams));
        const { id } = ret;
        let obj = { id, phrase };
        entity.id = id;
        objIds[id] = obj;
        objNames[phrase] = obj;
        res[phrase] = caption;
        let i = 0;
        for (; i < buds.length; i++) {
            let bud = buds[i];
            let { id: budId, phrase, ui } = budIds[i];
            bud.id = budId;
            if (ui) {
                const { caption } = ui;
                if (caption)
                    res[phrase] = caption;
            }
        }
        entity.forEachGroup(group => {
            if (group.buds.length === 0)
                return;
            group.id = budIds[i++];
            const { phrase, ui } = group;
            if (ui) {
                const { caption } = ui;
                if (caption)
                    res[phrase] = caption;
            }
        });
    }
    async saveBizSchema(entity) {
        const { id, schema } = entity;
        let schemaText = JSON.stringify(schema);
        await this.runner.unitUserTableFromProc('SaveBizSchema', this.site, this.user, id, schemaText);
    }
    /*
    private async saveBizEntityBuds(entity: BizEntity) {
        let promises: Promise<any>[] = [];
        entity.forEachBud(bud => {
            promises.push(this.saveBud(entity, bud));
        })
        await Promise.all(promises);
    };

    private async saveBud(entity: BizEntity, bud: BizBud) {
        const { objNames, res } = this.compiler;
        const { phrase, ui: { caption }, memo, dataType: dataTypeNum, objName, flag } = bud;
        const typeNum = bud.typeNum;
        let objId: number;
        if (objName !== undefined) {
            const obj = objNames[objName];
            if (obj !== undefined) {
                objId = obj.id;
            }
        }
        let [{ id: budId }] = await this.runner.unitUserCall('SaveBizBud'
            , this.site, this.user, entity.id, bud.id, phrase, caption
            , typeNum, memo, dataTypeNum, objId, flag
        );
        bud.id = budId;
        res[phrase] = caption;
    }
    */
    async build(res, log) {
        const { newest } = this.compiler;
        await Promise.all(newest.map(entity => {
            return this.saveBizObject(entity);
        }));
        const ixPairs = this.biz.getEntityIxPairs(newest);
        await this.runner.unitUserTableFromProc('SaveBizIX', this.site, this.user, JSON.stringify(ixPairs));
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
        const { newest } = this.compiler;
        for (let bizEntity of newest) {
            let builder = bizEntity.db(context);
            if (builder === undefined)
                continue;
            await builder.buildProcedures();
            await this.mayBuildSheet(context, bizEntity, newest);
        }
        await context.coreObjs.updateDb(this.runner, compileOptions);
    }
    // Bin 里面变化了，则相关的 Sheet 也要重新生成存储过程
    // 因为Out的影响
    async mayBuildSheet(context, entity, newest) {
        if (entity.bizPhraseType !== il_1.BizPhraseType.bin)
            return;
        const { sheetArr } = entity;
        for (let sheet of sheetArr) {
            if (newest.findIndex(v => v === sheet) < 0) {
                let builder = sheet.db(context);
                if (builder === undefined)
                    continue;
                await builder.buildProcedures();
            }
        }
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