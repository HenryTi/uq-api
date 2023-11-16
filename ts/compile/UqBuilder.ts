import { EntityRunner } from "../core";
import { CompileOptions, DbContext } from "../uq/builder";
import { Biz, BizBud, BizEntity } from "../uq/il";
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
        const { type, phrase, ui: { caption }, source } = entity;
        const memo = undefined;
        if (phrase === undefined) debugger;
        let budParams = [];
        let buds: BizBud[] = [];
        entity.forEachBud(bud => {
            buds.push(bud);
            const { phrase, ui: { caption }, memo, dataType: dataTypeNum, objName, flag } = bud;
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
                dataType: dataTypeNum, objId, flag
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

        for (let i = 0; i < buds.length; i++) {
            let bud = buds[i];
            let { id: budId, phrase } = budIds[i];
            bud.id = budId;
            res[phrase] = caption;
        }
    }

    private async saveBizSchema(entity: BizEntity) {
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
    async build(res: any, log: (msg: string) => boolean) {
        const { newest } = this.compiler;
        await Promise.all(newest.map(entity => {
            return this.saveBizObject(entity);
        }));
        const ixPairs = this.biz.getEntityIxPairs(newest);
        console.log(ixPairs);
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
        for (let bizEntity of this.compiler.newest) {
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
}
