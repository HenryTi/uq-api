// import config from '../config';
// import { UqBuildApi } from '../core';
// import { CompileOptions } from '../compile';
import { Entity, Uq } from './il';
import { log } from './log';
import { TokenStream, PContext, PSysContext, PEntity } from './parser';
import { DbContext, BUq as BUq } from './builder';
import { EntityRunner } from '../core';

export class UqRunner {
    private readonly compilerVersion: string;
    private log: log;
    private bUq: BUq;
    readonly uq: Uq;
    ok: boolean;

    constructor(compilerVersion: string, log: log) {
        this.compilerVersion = compilerVersion;
        this.log = log || ((text: string) => true);
        this.ok = true;
        this.uq = new Uq();
    }

    setLog(log: log) {
        this.log = log;
    }

    parse(input: string, fileName: string, isSys: boolean = false) {
        try {
            let ts = new TokenStream(this.log, input);
            ts.file = fileName;
            let context: PContext = isSys === true ? new PSysContext(ts) : new PContext(ts);
            let parser = this.uq.bizParser(context);
            parser.parse();
        }
        catch (err) {
            this.ok = false;
            if (typeof err !== 'string')
                this.log(err.message);
        }
    }

    // 新传入的uq代码，保存已编译好的。后续操作，只处理最新的。
    // 老的uq代码，随后编译
    anchorLatest() {
        this.uq.biz.anchorLatest();
    }

    isLatest(phrase: string): boolean {
        return this.uq.biz.isLatest(phrase);
    }

    private parseBorn(bornCode: string[]) {
        for (let bes of bornCode) {
            try {
                let ts = new TokenStream(this.log, bes);
                ts.file = '$born';
                let context: PContext = new PSysContext(ts);
                let parser = this.uq.parser(context);
                parser.parse();
            }
            catch (err) {
                this.log('$born code error');
                this.log(bes);
            }
        }
    }

    scan() {
        let pelement = this.uq.pelement;
        if (pelement === undefined) return;
        this.uq.buildEmptyRole();

        // 解析生成的代码, 必须在scan之后解析
        // 因为生成代码要用到scan之后的值
        let bornCode: string[] = [];
        this.uq.eachChild(entity => {
            let pelement: PEntity<Entity> = entity.pelement as PEntity<Entity>;
            if (pelement === undefined) return;
            return pelement.born(bornCode);
        });
        this.parseBorn(bornCode);
        let ret = pelement.scan(undefined);
        if (ret === false) this.ok = false;
    }
    /*
    async updateDb(uqBuildApi: UqBuildApi, serviceId: number, uqId: number
        , hasUnit: boolean, uqUniqueUnit: number, options: CompileOptions):
        Promise<{ ok: boolean, modified: boolean, err: any }> {
        let { dbName, twProfix } = uqBuildApi;
        let context = new DbContext(this.compilerVersion, config.sqlType, dbName, twProfix, this.log, hasUnit);
        this.bUq = new BUq(this.uq, context);
        return await this.bUq.updateDb(uqBuildApi, serviceId, uqId, uqUniqueUnit, options);
    }
    */
}
