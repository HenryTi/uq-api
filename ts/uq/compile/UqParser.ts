import { Entity, Uq } from '../il';
import { log } from '../log';
import { TokenStream, PContext, PSysContext, PEntity } from '../parser';
import { Compiler } from './Compiler';

export class UqParser {
    protected log: log;
    readonly uq: Uq;
    ok: boolean;

    constructor(compiler: Compiler) {
        this.log = compiler.log;
        this.ok = true;
        this.uq = new Uq();
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
}
