import { EntityRunner } from "../../core";
import { CompileOptions, DbContext } from "../builder";
import { Biz, BizBin, BizBud, BizEntity } from "../il";
import { BizPhraseType } from "../il/Biz/BizPhraseType";
import { Compiler } from "./Compiler";
import { UqParser } from "./UqParser";

const sqlType = 'mysql';

export class UqBuilder {
    protected readonly compiler: Compiler;
    protected readonly biz: Biz;
    protected readonly runner: EntityRunner;
    protected readonly site: number;
    protected readonly user: number;
    protected newSoleEntityId: number;    // 本次刚刚编译的唯一Entity

    constructor(compiler: Compiler, uqParser: UqParser) {
        this.compiler = compiler;
        this.biz = uqParser.uq.biz;
        this.runner = compiler.runner;
        this.site = compiler.site;
        this.user = compiler.user;
    }

    isIdNameOk(): boolean { return true }

    private async saveBizObject(entity: BizEntity) {
        const { objIds, objNames, res } = this.compiler;
        const { phrase, ui: { caption }, source } = entity;
        const memo = undefined;
        if (phrase === undefined) debugger;
        if (source === undefined) debugger;
        let budParams = [];
        let buds: BizBud[] = [];
        entity.forEachBud(bud => {
            let { phrase, ui: { caption }, memo, dataType: dataTypeNum, objName, flag, show } = bud;
            if (dataTypeNum === 0) {
                // Bin：Pick 和 Prop 可能重名
                // pick.dataType=0 input.dataType=0
                return;
            }
            buds.push(bud);
            const typeNum = bud.typeNum;
            let objId: number;
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
            if (group.buds.length === 0) return;
            const { id, phrase, ui, typeNum, memo } = group;
            let caption: string;
            if (ui !== undefined) caption = ui.caption;
            budParams.push({
                id,
                name: phrase, caption,
                type: typeNum, memo,
                dataType: 0,
                objId: 0,
                flag: 0,
            });
        });

        let [[ret], budIds] = await this.runner.unitUserTablesFromProc(
            'SaveBizObject'
            , this.site, this.user, this.newSoleEntityId
            , phrase, caption, entity.typeNum, memo, source
            , JSON.stringify(budParams));
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
                if (caption) res[phrase] = caption;
            }
        }
        entity.forEachGroup(group => {
            if (group.buds.length === 0) return;
            group.id = budIds[i++].id;
            const { phrase, ui } = group;
            if (ui) {
                const { caption } = ui;
                if (caption) res[phrase] = caption;
            }
        });
    }

    private async saveBizSchema(entity: BizEntity) {
        const { id, schema } = entity;
        let schemaText = JSON.stringify(schema);
        await this.runner.unitUserTableFromProc('SaveBizSchema', this.site, this.user, id, schemaText);
    }
    async build(res: any, log: (msg: string) => boolean) {
        const { newest } = this.compiler;
        await Promise.all(newest.map(entity => {
            return this.saveBizObject(entity);
        }));
        const ixPairs = this.biz.getEntityIxPairs(newest);
        await this.runner.unitUserTableFromProc('SaveBizIX'
            , this.site, this.user, JSON.stringify(ixPairs));
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
        this.biz.buildSchema(res);
        await Promise.all(newest.map(entity => {
            return this.saveBizSchema(entity);
        }));
    }

    private async buildSiteDbs(context: DbContext, log: (msg: string) => boolean) {
        const compileOptions: CompileOptions = {
            uqIds: [],
            user: 0,
            action: 'thoroughly',
            autoRemoveTableField: false,
            autoRemoveTableIndex: false,
        }
        const { newest } = this.compiler;
        for (let bizEntity of newest) {
            try {
                let builder = bizEntity.db(context);
                if (builder === undefined) continue;
                await builder.buildTables();
            }
            catch (e) {
                console.error(e);
                debugger;
            }
        }

        for (let bizEntity of newest) {
            console.log(bizEntity.name/*, bizEntity*/);
            try {
                let builder = bizEntity.db(context);
                if (builder === undefined) continue;
                await builder.buildProcedures();
                await this.mayBuildSheet(context, bizEntity, newest);
                await builder.buildDirectSqls();
            }
            catch (e) {
                console.error(e);
                debugger;
            }
        }

        await context.coreObjs.updateDb(this.runner, compileOptions);
        for (let sql of context.sqls) {
            await this.runner.sql(sql, []);
        }
    }

    // Bin 里面变化了，则相关的 Sheet 也要重新生成存储过程
    // 因为Out的影响
    private async mayBuildSheet(context: DbContext, entity: BizEntity, newest: BizEntity[]) {
        if (entity.bizPhraseType !== BizPhraseType.bin) return;
        const { sheetArr } = entity as BizBin;
        for (let sheet of sheetArr) {
            if (newest.findIndex(v => v === sheet) < 0) {
                let builder = sheet.db(context);
                if (builder === undefined) continue;
                await builder.buildProcedures();
            }
        }
    }

    private buildBudsValue(context: DbContext) {
        for (let bizEntity of this.biz.bizArr) {
            let builder = bizEntity.db(context);
            if (builder === undefined) continue;
            builder.buildBudsValue();
        }
    }
}
