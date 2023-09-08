"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PElement = exports.PElementBase = void 0;
const tokens_1 = require("./tokens");
const il_1 = require("../il");
class PElementBase {
    saveSource() { }
    ;
    constructor(context) {
        this.context = context;
        this.ts = context.ts;
    }
    parse() {
        this.savePos();
        this._parse();
        this.saveSource();
    }
    savePos() {
        this.at = this.ts.prevAt;
        this.line = this.ts.prevLine;
        this.sourceStart = this.ts.LastP - 1;
    }
    getSource() {
        return this.ts.getSourceAt(this.sourceStart);
    }
    errorAt() {
        let line = this.ts.startLine + 1;
        let at = this.ts.startAt + 1;
        return this.ts.file + ' 错误在' + line + '行' + at + '列: \n' + this.ts.getSourceNearby(this.sourceStart) + '\n';
    }
    log(...msg) {
        let err;
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
    msg(...msg) {
        let err;
        if (this.line === undefined)
            err = msg.join('');
        else {
            let line = this.line + 1;
            let at = this.at + 1;
            err = `--- ! --- ${this.ts.file} 提醒在${line}行${at}列: ${msg.join('')}`;
        }
        this.ts.log(err);
    }
    error(...msg) {
        let err = this.errorAt() + msg.join('');
        this.ts.log(err);
        throw err;
    }
    expectToken(...tokens) {
        let err = this.errorAt() + '应该是' + tokens.map(v => tokens_1.Token[v]).join('或');
        this.ts.log(err);
        throw err;
    }
    expect(...msg) {
        let err = this.errorAt() + '应该是' + msg.join('或');
        this.ts.log(err);
        throw err;
    }
}
exports.PElementBase = PElementBase;
class PElement extends PElementBase {
    constructor(element, context) {
        super(context);
        this.element = element;
    }
    parse() {
        this.element.pelement = this;
        super.parse();
    }
    preScan(space) {
        return true;
    }
    scan(space) {
        return this.childScan(space);
    }
    scanDoc1() {
        return true;
    }
    scanDoc2() {
        return true;
    }
    scanReturnMessage(space) {
        return;
    }
    scan2(uq) {
        return true;
    }
    childScan(space) {
        let ok = true;
        this.element.eachChild((child, name) => {
            let pelement = child.pelement;
            if (pelement === undefined)
                return;
            if (pelement.scan(space) === false)
                ok = false;
        });
        return ok;
    }
    field(defaultNullable) {
        let field = new il_1.Field();
        let parser = field.parser(this.context);
        parser.parse();
        if (field.nullable === undefined)
            field.nullable = defaultNullable;
        return field;
    }
    parseValueArray() {
        let vals = [];
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
                this.ts.expectToken(tokens_1.Token.RPARENTHESE);
            }
            this.ts.readToken();
        }
        else {
            let val = new il_1.ValueExpression();
            val.parser(this.context).parse();
            vals = [val];
        }
        return vals;
    }
    scanValueArray(space, vals) {
        let ok = true;
        for (let val of vals) {
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PElement = PElement;
//# sourceMappingURL=element.js.map