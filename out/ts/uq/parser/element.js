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
        this.sourceStart = this.ts.getP(); // this.ts.lastP - 1;
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
    parseUI() {
        let ui = {};
        switch (this.ts.token) {
            case tokens_1.Token.STRING:
                ui.caption = this.ts.text;
                this.ts.readToken();
                break;
            case tokens_1.Token.LT:
                this.ts.readToken();
                this.parseStyle(ui);
                break;
        }
        return ui;
    }
    parseStyle(ui) {
        for (;;) {
            let moniker;
            if (this.ts.token === tokens_1.Token.STRING) {
                moniker = this.ts.text;
                this.ts.readToken();
                const { token } = this.ts;
                if (token === tokens_1.Token.GT) {
                    ui.caption = moniker;
                    this.ts.readToken();
                    break;
                }
                if (token === tokens_1.Token.COMMA || token === tokens_1.Token.SEMICOLON) {
                    ui.caption = moniker;
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.GT) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                this.ts.passToken(tokens_1.Token.COLON);
            }
            else if (this.ts.token === tokens_1.Token.VAR) {
                moniker = this.ts.lowerVar;
                this.ts.readToken();
                this.ts.passToken(tokens_1.Token.COLON);
            }
            let value;
            switch (this.ts.token) {
                default:
                    value = null;
                    break;
                case tokens_1.Token.NUM:
                    value = this.ts.dec;
                    break;
                case tokens_1.Token.STRING:
                    value = this.ts.text;
                    break;
                case tokens_1.Token.VAR:
                    value = this.ts.lowerVar;
                    break;
            }
            if (value === null) {
                this.ts.expectToken(tokens_1.Token.NUM, tokens_1.Token.VAR, tokens_1.Token.STRING);
            }
            this.ts.readToken();
            ui[moniker] = value;
            if (this.ts.token === tokens_1.Token.GT) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA || this.ts.token === tokens_1.Token.SEMICOLON) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.GT) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
        }
    }
    preScan(space) {
        return true;
    }
    scan(space) {
        return this.childScan(space);
    }
    scan0(space) {
        return this.childScan0(space);
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
    childScan0(space) {
        let ok = true;
        this.element.eachChild((child, name) => {
            let { pelement } = child;
            if (pelement === undefined)
                return;
            if (pelement.scan0(space) === false)
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