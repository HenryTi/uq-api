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
exports.UqBuilder = void 0;
const core_1 = require("../../core");
const builder_1 = require("../builder");
const BizPhraseType_1 = require("../il/Biz/BizPhraseType");
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
    saveBizObject(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const { objIds, objNames, res } = this.compiler;
            const { phrase, ui: { caption }, source } = entity;
            const memo = undefined;
            if (phrase === undefined)
                debugger;
            if (source === undefined)
                debugger;
            let budParams = [];
            let buds = [];
            entity.forEachBud(bud => {
                let { phrase, ui: { caption }, memo, dataType: dataTypeNum, objName, flag, show } = bud;
                if (dataTypeNum === 0) {
                    // Bin：Pick 和 Prop 可能重名
                    // pick.dataType=0 input.dataType=0
                    return;
                }
                buds.push(bud);
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
                    dataType: dataTypeNum, objId, flag, show
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
            let [[ret], budIds] = yield this.runner.unitUserTablesFromProc('SaveBizObject', this.site, this.user, this.newSoleEntityId, phrase, caption, entity.typeNum, memo, source, JSON.stringify(budParams));
            const { id } = ret;
            let obj = { id, phrase };
            entity.id = id;
            objIds[id] = obj;
            objNames[phrase] = obj;
            res[phrase] = caption;
            let i = 0;
            for (; i < buds.length; i++) {
                let bud = buds[i];
                let budIdValue = budIds[i];
                if (budIdValue === undefined) {
                    // 对应上面的
                    // Bin：Pick 和 Prop 可能重名
                    // pick.dataType=0 input.dataType=0
                    // 至于pick和input的名字怎么翻译，以后再考虑
                    continue;
                }
                let { id: budId, phrase, ui } = budIdValue; // budIds[i];
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
                group.id = budIds[i++].id;
                const { phrase, ui } = group;
                if (ui) {
                    const { caption } = ui;
                    if (caption)
                        res[phrase] = caption;
                }
            });
        });
    }
    saveBizSchema(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, schema } = entity;
            let schemaText = JSON.stringify(schema);
            yield this.runner.unitUserTableFromProc('SaveBizSchema', this.site, this.user, id, schemaText);
        });
    }
    build(res, log) {
        return __awaiter(this, void 0, void 0, function* () {
            const { newest } = this.compiler;
            yield Promise.all(newest.map(entity => {
                return this.saveBizObject(entity);
            }));
            const ixPairs = this.biz.getEntityIxPairs(newest);
            yield this.runner.unitUserTableFromProc('SaveBizIX', this.site, this.user, JSON.stringify(ixPairs));
            const ixBizRoles = this.biz.getIxRoles();
            yield this.runner.unitUserTableFromProc('SaveIxPermission', this.site, this.user, JSON.stringify(ixBizRoles));
            const hasUnit = false;
            const compilerVersion = '0.0';
            let context = new builder_1.DbContext(compilerVersion, sqlType, this.runner.dbName, '', log, hasUnit);
            context.site = this.site;
            context.ownerDbName = `$site.${this.site}`;
            yield this.buildSiteDbs(context, log);
            this.buildBudsValue(context);
            this.biz.buildSchema(res);
            yield Promise.all(newest.map(entity => {
                return this.saveBizSchema(entity);
            }));
        });
    }
    buildSiteDbs(context, log) {
        return __awaiter(this, void 0, void 0, function* () {
            const compileOptions = {
                uqIds: [],
                user: 0,
                action: 'thoroughly',
                autoRemoveTableField: false,
                autoRemoveTableIndex: false,
            };
            const { newest } = this.compiler;
            if (newest.length > 0) {
                const dbs = (0, core_1.getDbs)();
                yield dbs.createSiteDb(this.site);
            }
            for (let bizEntity of newest) {
                try {
                    let builder = bizEntity.db(context);
                    if (builder === undefined)
                        continue;
                    yield builder.buildTables();
                }
                catch (e) {
                    console.error(e);
                    debugger;
                }
            }
            for (let bizEntity of newest) {
                console.log(bizEntity.name);
                try {
                    let builder = bizEntity.db(context);
                    if (builder === undefined)
                        continue;
                    yield builder.buildProcedures();
                    yield this.mayBuildSheet(context, bizEntity, newest);
                    yield builder.buildDirectSqls();
                }
                catch (e) {
                    console.error(e);
                    debugger;
                }
            }
            yield context.coreObjs.updateDb(this.runner, compileOptions);
            for (let sql of context.sqls) {
                yield this.runner.sql(sql, []);
            }
        });
    }
    // Bin 里面变化了，则相关的 Sheet 也要重新生成存储过程
    // 因为Out的影响
    mayBuildSheet(context, entity, newest) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entity.bizPhraseType !== BizPhraseType_1.BizPhraseType.bin)
                return;
            const { sheetArr } = entity;
            for (let sheet of sheetArr) {
                if (newest.findIndex(v => v === sheet) < 0) {
                    let builder = sheet.db(context);
                    if (builder === undefined)
                        continue;
                    yield builder.buildProcedures();
                }
            }
        });
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