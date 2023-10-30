import { TokenStream, Token } from './tokens';
import { Space } from './space';
import { IElement, Field, Uq, ValueExpression } from '../il';
import { PContext } from './pContext';

export abstract class PElementBase {
    protected context: PContext;
    protected ts: TokenStream;
    protected at: number;
    protected line: number;
    protected sourceStart: number;
    protected saveSource() { };

    constructor(context: PContext) {
        this.context = context;
        this.ts = context.ts;

    }
    protected abstract _parse(): void;
    parse() {
        this.savePos();
        this._parse();
        this.saveSource();
    }

    protected savePos() {
        this.at = this.ts.prevAt;
        this.line = this.ts.prevLine;
        this.sourceStart = this.ts.getP(); // this.ts.lastP - 1;
    }

    protected getSource() {
        return this.ts.getSourceAt(this.sourceStart);
    }

    private errorAt() {
        let line = this.ts.startLine + 1;
        let at = this.ts.startAt + 1;
        return this.ts.file + ' 错误在' + line + '行' + at + '列: \n' + this.ts.getSourceNearby(this.sourceStart) + '\n';
    }

    log(...msg: string[]) {
        let err: string;
        if (this.line === undefined)
            err = msg.join('');
        else {
            let line = this.line + 1;
            let at = this.at + 1;
            err = `=== x --- ${this.ts.file} 错误在${line}行${at}列:
${this.ts.getSourceNearby(this.sourceStart)}
${msg.join('\n')}
`;
        }
        this.ts.log(err);
    }

    msg(...msg: string[]) {
        let err: string;
        if (this.line === undefined)
            err = msg.join('');
        else {
            let line = this.line + 1;
            let at = this.at + 1;
            err = `--- ! --- ${this.ts.file} 提醒在${line}行${at}列: ${msg.join('')}`;
        }
        this.ts.log(err);
    }

    error(...msg: string[]) {
        let err = this.errorAt() + msg.join('');
        this.ts.log(err);
        throw err;
    }

    expectToken(...tokens: Token[]) {
        let err = this.errorAt() + '应该是' + tokens.map(v => Token[v]).join('或');
        this.ts.log(err);
        throw err;
    }

    expect(...msg: string[]) {
        let err = this.errorAt() + '应该是' + msg.join('或');
        this.ts.log(err);
        throw err;
    }
}

export abstract class PElement<E extends IElement = IElement> extends PElementBase {
    readonly element: E;
    scaned: boolean;
    scan2ed: boolean;
    constructor(element: E, context: PContext) {
        super(context);
        this.element = element;
    }
    parse() {
        this.element.pelement = this;
        super.parse();
    }

    preScan(space: Space): boolean {
        return true;
    }

    scan(space: Space): boolean {
        return this.childScan(space);
    }

    scanDoc1(): boolean {
        return true;
    }

    scanDoc2(): boolean {
        return true;
    }

    scanReturnMessage(space: Space): string {
        return;
    }

    scan2(uq: Uq): boolean {
        return true;
    }

    protected childScan(space: Space): boolean {
        let ok = true;
        this.element.eachChild((child, name) => {
            let pelement = child.pelement;
            if (pelement === undefined) return;
            if (pelement.scan(space) === false) ok = false;
        });
        return ok;
    }

    protected field(defaultNullable: boolean) {
        let field = new Field();
        let parser = field.parser(this.context);
        parser.parse();
        if (field.nullable === undefined) field.nullable = defaultNullable;
        return field;
    }

    protected parseValueArray(): ValueExpression[] {
        let vals: ValueExpression[] = [];
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            if (this.ts.token as any !== Token.RPARENTHESE) {
                this.ts.expectToken(Token.RPARENTHESE);
            }
            this.ts.readToken();
        }
        else {
            let val = new ValueExpression();
            val.parser(this.context).parse();
            vals = [val];
        }
        return vals;
    }

    protected scanValueArray(space: Space, vals: ValueExpression[]): boolean {
        let ok = true;
        for (let val of vals) {
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
