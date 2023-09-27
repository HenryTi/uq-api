import * as jsonpack from 'jsonpack';
import { DbContext, EnumSysTable, max_promises_uq_api, sysTable } from "./dbContext";
// import { CompileOptions } from "../../compile";
// import { UqBuildApi } from "../../core";
import { Act, Biz, Entity, ImportFrom, Int, Map, Role, SharpField, Sheet, SheetAction, Tuid, Uq } from "../il";
import { Procedure, ExpEQ, ExpNum, ExpNull, ExpField, ExpIsNull, ExpVar, ExpGT } from './sql';
import { EntityTable } from './sql/statementWithFrom';
import { Sqls } from './bstatement';
import { BEntity } from './entity';

const constStrs = [
    '$', '-', '#', '$role', 'access', 'bus', 'tuid', 'action', 'sheet', 'query'
    , 'history', 'pending', 'book', 'enum', 'const', 'pull', 'map', 'tuid.arr', 'templet'
    , 'tag', 'proc', 'id', 'idx', 'ix', 'act', 'sysproc', 'queue', 'biz', 'biz.spec', 'biz.atom'
];

interface ModifiedEntity {
    oldId: number, name: string, type: number, text: string,
    runText: string,
    source: string, fromStr: string, open: number, isPrivate: number,
};

export class Modified {
    private context: DbContext;
    private uq: Uq;
    // private runner: UqBuildApi;
    // private options: CompileOptions;
    private schemas: { [name: string]: any };
    private modifiedEntities: ModifiedEntity[] = [];
    private constStrsColl: { [name: string]: number } = {};

    constructor(context: DbContext, uq: Uq/*, runner: UqBuildApi, options: CompileOptions*/) {
        this.context = context;
        this.uq = uq;
        // this.runner = runner;
        // this.options = options;
    }
    /*
    async save(): Promise<boolean> {
        let constIds = await this.runner.saveConstStr(constStrs.join('\t'));
        let len = constStrs.length;
        for (let i = 0; i < len; i++) {
            let str = constIds[i];
            let [id, name] = str.split('\t');
            this.constStrsColl[name] = Number(id);
        }
        this.uq.eachEntity(entity => {
            let type = this.constStrsColl[entity.type];
            if (type === undefined) return;
            entity.buildSchema();
        });
        await this.uq.eachEntityAsync(async (entity: Entity): Promise<void> => {
            await this.calcModified(entity);
        });
        await this.invalidateEntities();
        let ret = await this.saveModified();
        return ret;
    }

    async loadSchemas(hasSource: boolean) {
        let result = await this.runner.loadSchemas(hasSource);
        let schemaRows: { id: number, name: string, type: number, version: number, schema: string, run: string }[] = result[0];
        this.schemas = {} as any;
        for (let row of schemaRows) {
            this.schemas[row.name] = row;
        }
        this.sourceChanged();
    }

    private setEntitySourceChanged(entity: Entity): void {
        let { source, name } = entity;
        if (source === null) source = undefined;
        let schema = this.schemas[name];
        if (schema === undefined || source !== schema.source) {
            entity.isSourceChanged = true;
        }
    }

    private sourceChanged(): void {
        this.uq.eachEntity(entity => {
            this.setEntitySourceChanged(entity);
        });
        if (this.uq.isAnyConstChanged() === true) {
            this.uq.eachEntity(entity => entity.isSourceChanged = true);
        }
        this.uq.eachEntity(entity => {
            let { sharpFields } = entity;
            this.sharpFieldChanged(entity, sharpFields);
            let returns = entity.getReturns();
            if (returns === undefined) return;
            for (let ret of returns.returns) {
                this.sharpFieldChanged(entity, ret.sharpFields);
            }
        });
    }

    private sharpFieldChanged(entity: Entity, sharpFields: SharpField[]) {
        if (sharpFields === undefined) return;
        for (let sf of sharpFields) {
            let e = this.uq.entities[sf.IDName];
            if (e.isSourceChanged === true) {
                entity.isSourceChanged = true;
                break;
            }
        }
    }

    async buildEntityTables(): Promise<void> {
        await this.uq.eachEntityAsync(async entity => {
            if (this.options.action !== 'thoroughly'
                && entity.isSourceChanged === false) {
                return;
            }
            let builder = entity.db(this.context) as BEntity<any>;
            if (builder === undefined) return;
            builder.buildTables();
        });
    }

    async buildEntityProcedures(): Promise<void> {
        if (this.uq.statement) {
            let procUq = this.context.createProcedure('$uq');
            this.buildUqProcedure(procUq);
            this.context.appObjs.procedures.push(procUq);
        }

        await this.uq.eachEntityAsync(async entity => {
            if (this.options.action !== 'thoroughly'
                && entity.isSourceChanged === false) {
                return;
            }
            let builder = entity.db(this.context) as BEntity<any>;
            if (builder === undefined) return;
            builder.buildProcedures();
        });
    }

    async buildBizPhrases(): Promise<void> {
        let { biz } = this.uq;
        if (this.options.action !== 'thoroughly'
            && biz.isSourceChanged === false) {
            return;
        }
        let { phrases, roles } = biz;
        if (phrases === undefined) return;
        if (phrases.length === 0) return;
        await this.runner.savePhrases(
            phrases.map(v => v.join('\t')).join('\n'),
            JSON.stringify(roles),
        );
    }

    private async calcModified(entity: Entity) {
        try {
            let type = this.constStrsColl[entity.type];
            if (type === undefined) return;
            let { name, schema, source, isPrivate } = entity;
            let run = entity.createRun();
            let text = JSON.stringify(schema);
            let runText = JSON.stringify(run);
            let oldId: number;
            if (entity.isSourceChanged === false) {
                let orgSchema = this.schemas[name];
                if (orgSchema !== undefined) {
                    oldId = orgSchema.id;
                    if (this.options.action !== 'thoroughly') {
                        let { run: _run, schema: _schema, source: _source } = orgSchema;
                        if (_run === null) _run = undefined;
                        if (_schema === null) _schema = undefined;
                        if (_source === null) {
                            _source = undefined;
                            if (source === null) source = undefined;
                        }
                        if (_schema === text && _run === runText && _source === source) {
                            return;
                        }
                    }
                }
            }
            let op: string;
            let from: ImportFrom, open: number = 0;
            switch (entity.type) {
                case 'biz':
                    let bizEntities = (entity as Biz).getEntitys();
                    for (let be of bizEntities) {
                        let { name, type, schema } = be;
                        this.pushModifiedEntity({
                            oldId: undefined,
                            name,
                            type: this.constStrsColl[type],
                            text: schema,
                            runText: undefined,
                            source: undefined,
                            fromStr: undefined,
                            open: 0,
                            isPrivate: 1,
                        });
                    }
                    break;
                case '$role':
                    let role: Role = entity as Role;
                    for (let i in role.names) {
                        let arr = Array.from(role.names[i]);
                        if (i !== '$') {
                            arr = arr.map(v => `${i}.${v}`);
                        }
                        await Promise.all(arr.map(v => this.runner.saveTextId(v)));
                    }
                    break;
                case 'sheet':
                    let sheet: Sheet = entity as Sheet;
                    await this.saveActionConst(sheet.start.actions);
                    let states = sheet.states;
                    let stateArr: string[] = [];
                    for (let i in states) {
                        await this.runner.saveConstStr(i);
                        stateArr.push(i);
                        await this.saveActionConst(states[i].actions);
                    }
                    op = stateArr.join(',');
                    break;
                case 'query':
                    op = 'query';
                    break;
                case 'action':
                    op = 'act';
                    open = (entity as Act).isOpen === true ? 1 : 0;
                    break;
                case 'tuid':
                    op = 'new,read,write,del,list';
                    from = (entity as Tuid).from;
                    open = (entity as Tuid).isOpen === true ? 1 : 0;
                    let tuidArrs = (entity as Tuid).arrs;
                    if (tuidArrs === undefined) break;
                    for (let arr of tuidArrs) {
                        this.pushModifiedEntity({
                            oldId: undefined,
                            name: name + '.' + arr.sName,
                            type: this.constStrsColl[entity.type + '.arr'],
                            text: undefined,
                            runText: undefined,
                            source: undefined,
                            fromStr: undefined,
                            open,
                            isPrivate: isPrivate === true ? 1 : 0,
                        });
                    }
                    break;
                case 'map':
                    from = (entity as Map).from;
                    open = (entity as Tuid).isOpen === true ? 1 : 0;
                    break;
            }
            let fromStr: string;
            if (from !== undefined) {
                let { uqOwner, uqName } = from.imp;
                fromStr = uqOwner + '/' + uqName;
            }
            this.pushModifiedEntity({
                oldId,
                name, type, text, runText,
                source,
                fromStr, open,
                isPrivate: isPrivate === true ? 1 : 0
            });
        }
        catch (err) {
            console.error(err);
        }
    }

    private pushModifiedEntity(modifiedEntity: ModifiedEntity) {
        this.modifiedEntities.push(modifiedEntity);
    }

    private async invalidateEntities() {
        let invalidEntities = [];
        for (let i in this.schemas) {
            if (i === '$user' || i === '$sheet' || i === '$biz') continue;
            if (this.uq.entities[i] === undefined) invalidEntities.push(i);
        }
        if (invalidEntities.length === 0) return;
        let invalidEntitiesText = invalidEntities.join('\t');
        await this.runner.setEntityValid(invalidEntitiesText, 0);
    }

    private async saveModified(): Promise<boolean> {
        if (this.modifiedEntities.length === 0) return false;
        let rows: any[] = [];
        let promises: Promise<void>[] = [];
        let afterPromises = async () => {
            let all = await Promise.all(promises);
            for (let i = 0; i < all.length; i++) {
                let row = rows[i];
                let ret = all[i];
                this.context.log(`entity ${row.name} changed: id=${ret[0].id}`);
            }
            rows = [];
            promises = [];
        }
        for (let row of this.modifiedEntities) {
            let { oldId, name, type, text, runText,
                source,
                fromStr, open, isPrivate } = row;
            if (text === undefined) continue;
            if (text.length > 512) {
                text = jsonpack.pack(text);
            }
            if (promises.length >= max_promises_uq_api) {
                await afterPromises();
            }
            rows.push(row);
            promises.push(this.runner.saveEntity(
                oldId, name, type, text, runText,
                source,
                fromStr, open, isPrivate));
        }
        await afterPromises();
        return true;
    }

    private async saveActionConst(actions: { [name: string]: SheetAction }) {
        if (actions === undefined) return;
        for (let i in actions) {
            await this.runner.saveConstStr(i);
        }
    }

    // entity UQ 自带的语句，生成存储过程
    private buildUqProcedure(proc: Procedure) {
        let { factory } = this.context;
        let { statement } = this.uq;
        //proc.addUnitParameter();
        let { statements } = proc;
        let declare = factory.createDeclare();
        statements.push(declare);
        declare.var('$unit', new Int());
        declare.var('$uq_p', new Int());
        let set0 = factory.createSet();
        statements.push(set0);
        set0.equ('$uq_p', ExpNum.num0);
        let loop = factory.createWhile();
        statements.push(loop);
        loop.cmp = new ExpEQ(ExpNum.num1, ExpNum.num1);
        let loopStats = loop.statements;
        // loopStats.add(proc.createTransaction());

        let setNull = factory.createSet();
        loopStats.add(setNull);
        setNull.equ('$unit', ExpVal.null);
        let selectUnit = factory.createSelect();
        loopStats.add(selectUnit);
        selectUnit.toVar = true;
        selectUnit.column(new ExpField('unit'), '$unit');
        selectUnit.from(sysTable(EnumSysTable.unit));
        selectUnit.where(new ExpGT(new ExpField('unit'), new ExpVar('$uq_p')));
        selectUnit.order(new ExpField('unit'), 'asc');
        selectUnit.limit(ExpNum.num1);

        let ifNull = factory.createIf();
        loopStats.add(ifNull);
        ifNull.cmp = new ExpIsNull(new ExpVar('$unit'));
        let exit = factory.createBreak();
        ifNull.then(exit);
        exit.no = loop.no;
        let setP = factory.createSet();
        loopStats.add(setP);
        setP.equ('$uq_p', new ExpVar('$unit'));

        let delQueueAct = factory.createDelete();
        loopStats.add(delQueueAct);

        delQueueAct.tables = ['a'];
        delQueueAct.from(new EntityTable('$queue_act', false, 'a'));
        delQueueAct.where(new ExpEQ(new ExpField('unit', 'a'), new ExpVar('$unit')));

        let sqls = new Sqls(this.context, loopStats.statements);
        const { statements: stats } = statement;
        sqls.head(stats);
        sqls.body(stats);
        sqls.foot(stats);
        sqls.done(proc);
        //loopStats.add(proc.createCommit());
    }
    */
}
