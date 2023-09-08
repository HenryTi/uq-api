import { DataType, Entity, IdDataType, IElement, intField, PageReturn, Return, Returns, SharpField, ValueExpression } from "../../il";
import { Space } from '../space';
import { PContext } from "../pContext";
import { Token } from "../tokens";
import { EntitySpace, PEntityBase } from "./entity";

export class PReturns extends PEntityBase<IElement> {
    owner: Entity;
    returns: Returns;
    private readonly returnSharpFieldsColl: { [retName: string]: SharpField[] };

    constructor(owner: Entity, returns: Returns, context: PContext) {
        super(returns, context);
        this.owner = owner;
        this.returns = returns;
        this.returnSharpFieldsColl = {};
    }

    protected _parse() {
        if (this.ts.isKeyword('page') === true) {
            this.ts.readToken();
            this.returns.addPage(this.parsePage());
        }
        for (; ;) {
            if (this.ts.isKeyword('returns') === false) break;
            this.ts.readToken();
            this.returns.addRet(this.parseReturn());
        }
    }

    private parseRetField(ret: Return) {
        let { name, fields } = ret;
        if (this.ts.token === Token.SHARP || this.ts.token === Token.MUL) {
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

    private parseReturn(): Return {
        if (this.ts.token !== Token.VAR) this.ts.expect('表名');
        //let fields:Field[] = [];
        let ret: Return = {
            name: this.ts.lowerVar,
            jName: this.ts._var,
            sName: this.ts._var,
            fields: [],
            needTable: true,
            sharpFields: undefined,
        };
        this.ts.readToken();
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        for (; ;) {
            this.parseRetField(ret);
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token as any === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            if (this.ts.token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
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

    private parsePage(): PageReturn {
        // order switch
        let orderSwitch: string[] = [];
        if (this.ts.isKeyword('order') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('switch') === false) {
                this.ts.expect('switch');
            }
            this.ts.readToken();
            if (this.ts.token !== Token.LPARENTHESE) {
                this.ts.expectToken(Token.LPARENTHESE);
            }
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token !== Token.VAR) {
                    this.ts.expectToken(Token.VAR);
                }
                orderSwitch.push(this.ts.lowerVar);
                this.ts.readToken();
                if (this.ts.token === Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
        }

        let page: PageReturn = {
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
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        this.parseRetField(page);
        let firstField = page.fields[0];
        let dataType: DataType;
        if (firstField !== undefined) {
            dataType = firstField.dataType;
        }
        else {
            dataType = new IdDataType()
        }
        if (orderSwitch.length > 0) {
            if (dataType.isId === false) {
                this.ts.error('if defined order switch, first field must ID type');
            }
        }
        else {
            if (this.ts.token !== Token.VAR || this.ts.varBrace === true) {
                this.ts.expect('start', 'asc', 'desc');
            }
            switch (this.ts.lowerVar) {
                default:
                    this.ts.expect('start', 'asc', 'desc');
                    break;
                case 'start':
                    this.ts.readToken();
                    let start = page.start = new ValueExpression();
                    start.parser(this.context).parse();
                    switch (this.ts.lowerVar as any) {
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
                    page.start = ValueExpression.const(dataType.min());
                    break;
                case 'desc':
                    page.order = 'desc';
                    this.ts.readToken();
                    page.start = ValueExpression.const(dataType.max());
                    break;
            }
        }
        for (; ;) {
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
                    break;
                case Token.COMMA:
                    this.ts.readToken();
                    if (this.ts.token as any === Token.RPARENTHESE) {
                        this.ts.readToken();
                        return page;
                    }
                    break;
                case Token.RPARENTHESE:
                    this.ts.readToken();
                    return page;
            }
            this.parseRetField(page);
        }
    }

    scan(outer: Space): boolean {
        let ok = true;
        let { type } = this.owner;
        let { page, returns } = this.returns
        if (page?.orderSwitch?.length > 0) {
            page.fields.unshift(intField('$order'));
        }
        for (let r of returns) {
            let { fields, name } = r;
            let rpf = this.returnSharpFieldsColl[name];
            if (rpf) {
                if (this.replaceSharpFields(outer, rpf, fields) === false) ok = false;
            }
            for (let f of fields) {
                let { pelement } = f.dataType;
                if (pelement === undefined) continue;
                let ret = pelement.scanReturnMessage(outer);
                if (ret === undefined) continue;
                ok = false;
                this.log(`${type} ${this.owner.name} return 字段 ${f.name} ${ret}`);
            }
        }
        return ok;
    }
}

export class ReturnsSpace extends EntitySpace {
    private returns: Returns;
    constructor(outer: Space, returns: Returns) {
        super(outer);
        this.returns = returns;
    }
    getReturn(name: string) {
        if (this.returns === undefined) return;
        return this.returns.returns.find(r => r.name === name);
    }
}
