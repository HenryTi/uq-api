"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnsSpace = exports.PReturns = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PReturns extends entity_1.PEntityBase {
    constructor(owner, returns, context) {
        super(returns, context);
        this.owner = owner;
        this.returns = returns;
        this.returnSharpFieldsColl = {};
    }
    _parse() {
        if (this.ts.isKeyword('page') === true) {
            this.ts.readToken();
            this.returns.addPage(this.parsePage());
        }
        for (;;) {
            if (this.ts.isKeyword('returns') === false)
                break;
            this.ts.readToken();
            this.returns.addRet(this.parseReturn());
        }
    }
    parseRetField(ret) {
        let { name, fields } = ret;
        if (this.ts.token === tokens_1.Token.SHARP || this.ts.token === tokens_1.Token.MUL) {
            let returnSharpFields = this.returnSharpFieldsColl[name];
            if (!returnSharpFields) {
                this.returnSharpFieldsColl[name] = ret.sharpFields = returnSharpFields = [];
            }
            let sharpField = this.parseSharpField(fields.length);
            returnSharpFields.push(sharpField);
        }
        else {
            fields.push(this.field(true));
        }
    }
    parseReturn() {
        if (this.ts.token !== tokens_1.Token.VAR)
            this.ts.expect('表名');
        //let fields:Field[] = [];
        let ret = {
            name: this.ts.lowerVar,
            jName: this.ts._var,
            sName: this.ts._var,
            fields: [],
            needTable: true,
            sharpFields: undefined,
        };
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.LPARENTHESE);
        this.ts.readToken();
        for (;;) {
            this.parseRetField(ret);
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
        }
        if (this.ts.isKeyword('convert') === true) {
            this.ts.readToken();
            let words = ['license'];
            if (this.ts.isKeywords(...words) === false) {
                this.ts.expect(...words);
            }
            ret.convertType = this.ts.lowerVar;
            this.ts.readToken();
        }
        return ret;
    }
    parsePage() {
        // order switch
        let orderSwitch = [];
        if (this.ts.isKeyword('order') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('switch') === false) {
                this.ts.expect('switch');
            }
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
                this.ts.expectToken(tokens_1.Token.LPARENTHESE);
            }
            this.ts.readToken();
            for (;;) {
                if (this.ts.token !== tokens_1.Token.VAR) {
                    this.ts.expectToken(tokens_1.Token.VAR);
                }
                orderSwitch.push(this.ts.lowerVar);
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }
        let page = {
            name: '$page',
            jName: '$page',
            sName: '$page',
            fields: [],
            sharpFields: undefined,
            needTable: true,
            start: undefined,
            order: undefined,
            orderSwitch,
        };
        page.name = '$page';
        this.ts.assertToken(tokens_1.Token.LPARENTHESE);
        this.ts.readToken();
        this.parseRetField(page);
        let firstField = page.fields[0];
        let dataType;
        if (firstField !== undefined) {
            dataType = firstField.dataType;
        }
        else {
            dataType = new il_1.IdDataType();
        }
        if (orderSwitch.length > 0) {
            if (dataType.isId === false) {
                this.ts.error('if defined order switch, first field must ID type');
            }
        }
        else {
            if (this.ts.token !== tokens_1.Token.VAR || this.ts.varBrace === true) {
                this.ts.expect('start', 'asc', 'desc');
            }
            switch (this.ts.lowerVar) {
                default:
                    this.ts.expect('start', 'asc', 'desc');
                    break;
                case 'start':
                    this.ts.readToken();
                    let start = page.start = new il_1.ValueExpression();
                    start.parser(this.context).parse();
                    switch (this.ts.lowerVar) {
                        default:
                            page.order = 'asc';
                            break;
                        case 'asc':
                            page.order = 'asc';
                            this.ts.readToken();
                            break;
                        case 'desc':
                            page.order = 'desc';
                            this.ts.readToken();
                            break;
                    }
                    break;
                case 'asc':
                    page.order = 'asc';
                    this.ts.readToken();
                    page.start = il_1.ValueExpression.const(dataType.min());
                    break;
                case 'desc':
                    page.order = 'desc';
                    this.ts.readToken();
                    page.start = il_1.ValueExpression.const(dataType.max());
                    break;
            }
        }
        for (;;) {
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                    break;
                case tokens_1.Token.COMMA:
                    this.ts.readToken();
                    if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                        this.ts.readToken();
                        return page;
                    }
                    break;
                case tokens_1.Token.RPARENTHESE:
                    this.ts.readToken();
                    return page;
            }
            this.parseRetField(page);
        }
    }
    scan(outer) {
        let ok = true;
        let { type } = this.owner;
        let { page, returns } = this.returns;
        if (page?.orderSwitch?.length > 0) {
            page.fields.unshift((0, il_1.intField)('$order'));
        }
        for (let r of returns) {
            let { fields, name } = r;
            let rpf = this.returnSharpFieldsColl[name];
            if (rpf) {
                if (this.replaceSharpFields(outer, rpf, fields) === false)
                    ok = false;
            }
            for (let f of fields) {
                let { pelement } = f.dataType;
                if (pelement === undefined)
                    continue;
                let ret = pelement.scanReturnMessage(outer);
                if (ret === undefined)
                    continue;
                ok = false;
                this.log(`${type} ${this.owner.name} return 字段 ${f.name} ${ret}`);
            }
        }
        return ok;
    }
}
exports.PReturns = PReturns;
class ReturnsSpace extends entity_1.EntitySpace {
    constructor(outer, returns) {
        super(outer);
        this.returns = returns;
    }
    getReturn(name) {
        if (this.returns === undefined)
            return;
        return this.returns.returns.find(r => r.name === name);
    }
}
exports.ReturnsSpace = ReturnsSpace;
//# sourceMappingURL=returns.js.map