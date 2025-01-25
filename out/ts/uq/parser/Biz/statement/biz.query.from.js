"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFromStatementInQuery = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const biz_from_1 = require("./biz.from");
const valueColumn = 'value';
class PFromStatementInQuery extends biz_from_1.PFromStatement {
    /*
    private readonly ids: PIdColumn[] = [];
    private readonly showIds: PIdColumn[] = [];
    private readonly collColumns: { [name: string]: boolean } = {};
    */
    _parse() {
        this.parseFromEntity(this.pFromEntity);
        this.parseColumns();
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    parseColumns() {
        if (this.ts.isKeyword('column') === true) {
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            this.parseIdColumns();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.isKeyword('sub') === true) {
                    this.ts.readToken();
                    this.parseSubColumns();
                }
                else {
                    this.parseColumn();
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.passToken(tokens_1.Token.COMMA);
            }
        }
    }
    parseColumn() {
        let col;
        if (this.ts.token === tokens_1.Token.MOD) {
            const { peekToken, lowerVar } = this.ts.peekToken();
            if (peekToken !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            col = { name: lowerVar, ui: null, val, bud: undefined, };
        }
        else {
            let name = this.ts.passVar();
            if (name === valueColumn && this.ts.varBrace === false) {
                this.parseValue();
                return;
            }
            else {
                let hide;
                if (this.ts.isKeyword('hide') === true) {
                    this.ts.readToken();
                    hide = true;
                }
                let ui = this.parseUI();
                this.ts.passToken(tokens_1.Token.EQU);
                let val = new il_1.ValueExpression();
                this.context.parseElement(val);
                col = { name, ui, val, bud: undefined, hide };
                if (this.collColumns[name] === true) {
                    this.ts.error(`duplicate column name ${name}`);
                }
            }
        }
        this.element.cols.push(col);
        return col;
    }
    parseIdColumns() {
        if (this.ts.isKeyword('id') !== true)
            return;
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.parseIdColumn();
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
            }
        }
        else {
            this.parseIdColumn();
        }
        this.collColumns['id'] = true;
        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
            this.ts.passToken(tokens_1.Token.COMMA);
            const ban = 'ban';
            if (this.ts.isKeyword(ban) === true) {
                this.ts.readToken();
                let caption = this.ts.mayPassString();
                this.ts.passToken(tokens_1.Token.EQU);
                let val = new il_1.CompareExpression();
                this.context.parseElement(val);
                this.collColumns[ban] = true;
                this.element.ban = { caption, val };
                if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
                    this.ts.passToken(tokens_1.Token.COMMA);
                }
            }
            // this.parseValue();
        }
    }
    parseValue() {
        if (this.element.value !== undefined) {
            this.ts.error('duplicate VALUE');
        }
        let caption = this.ts.mayPassString();
        this.ts.passToken(tokens_1.Token.EQU);
        let val = new il_1.ValueExpression();
        this.context.parseElement(val);
        this.collColumns[valueColumn] === true;
        this.element.value = { name: valueColumn, ui: { caption }, val, bud: undefined };
        /*
        if (this.ts.token !== Token.RPARENTHESE as any) {
            this.ts.passToken(Token.COMMA);
        }
        */
    }
    parseIdColumn() {
        if (this.ts.token === tokens_1.Token.COLON) {
            this.ts.readToken();
            let ui = this.parseUI();
            this.ts.passKey('of');
            let alias = this.ts.passVar();
            this.showIds.push({ ui, asc: il_1.EnumAsc.asc, alias });
            return;
        }
        let ui = this.parseUI();
        let asc;
        if (this.ts.isKeyword('asc') === true) {
            asc = il_1.EnumAsc.asc;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('desc') === true) {
            asc = il_1.EnumAsc.desc;
            this.ts.readToken();
        }
        if (asc === undefined)
            asc = il_1.EnumAsc.asc;
        let alias;
        if (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            alias = this.ts.passVar();
        }
        /*
        if (this.ts.isKeyword('group') === true) {
            if (this.element.groupByBase === true) {
                this.ts.error('ID GROUP BY can only be the last');
            }
            this.ts.readToken();
            this.ts.passKey('by');
            this.ts.passKey('base');
            this.element.groupByBase = true;
        }
        */
        this.ids.push({ ui, asc, alias });
    }
}
exports.PFromStatementInQuery = PFromStatementInQuery;
/*
export class FromSpace extends BizSelectStatementSpace<FromStatement> {
    protected createBizFieldSpace(from: FromStatement) {
        return new FromInQueryFieldSpace(from);
    }

    protected override _getBizFromEntityFromAlias(name: string) {
        return this.from.getBizFromEntityFromAlias(name);
    }
}
*/ 
//# sourceMappingURL=biz.query.from.js.map