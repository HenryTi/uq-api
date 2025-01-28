import {
    CompareExpression, FromStatement, ValueExpression, FromInQueryFieldSpace, BizBudAny
    , EnumAsc, IdColumn, FromColumn,
    FromStatementInQuery
} from "../../../il";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { FromSpace, PFromStatement } from "./biz.from";
import { BizSelectStatementSpace, PBizSelectStatement, PIdColumn } from "./BizSelectStatement";

const valueColumn = 'value';

export class PFromStatementInQuery extends PFromStatement<FromStatementInQuery> {
    /*
    private readonly ids: PIdColumn[] = [];
    private readonly showIds: PIdColumn[] = [];
    private readonly collColumns: { [name: string]: boolean } = {};
    */
    protected _parse(): void {
        this.parseFromEntity(this.pFromEntity);
        this.parseColumns();
        this.parseWhere();
        this.ts.passToken(Token.SEMICOLON);
    }

    protected parseColumns() {
        if (this.ts.isKeyword('column') === true) {
            this.ts.readToken();
            this.ts.passToken(Token.LPARENTHESE);
            this.parseIdColumns();
            for (; ;) {
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.isKeyword('main') === true) {
                    this.ts.readToken();
                    this.parseMainColumns();
                }
                else {
                    this.parseColumn();
                }
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.passToken(Token.COMMA);
            }
        }
    }

    protected parseColumn() {
        let col: FromColumn;
        if (this.ts.token === Token.MOD) {
            const { peekToken, lowerVar } = this.ts.peekToken();
            if (peekToken !== Token.VAR) {
                this.ts.expectToken(Token.VAR);
            }
            let val = new ValueExpression();
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
                let hide: boolean;
                if (this.ts.isKeyword('hide') === true) {
                    this.ts.readToken();
                    hide = true;
                }
                let ui = this.parseUI();
                this.ts.passToken(Token.EQU);
                let val = new ValueExpression();
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

    protected parseIdColumns() {
        if (this.ts.isKeyword('id') !== true) return;
        this.ts.readToken();
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.parseIdColumn();
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            }
        }
        else {
            this.parseIdColumn();
        }
        this.collColumns['id'] = true;
        if (this.ts.token !== Token.RPARENTHESE) {
            this.ts.passToken(Token.COMMA);
            const ban = 'ban';
            if (this.ts.isKeyword(ban) === true) {
                this.ts.readToken();
                let caption = this.ts.mayPassString();
                this.ts.passToken(Token.EQU);
                let val = new CompareExpression();
                this.context.parseElement(val);
                this.collColumns[ban] = true;
                this.element.ban = { caption, val };
                if (this.ts.token !== Token.RPARENTHESE as any) {
                    this.ts.passToken(Token.COMMA);
                }
            }
            // this.parseValue();
        }
    }

    protected parseValue() {
        if (this.element.value !== undefined) {
            this.ts.error('duplicate VALUE');
        }
        let caption = this.ts.mayPassString();
        this.ts.passToken(Token.EQU);
        let val = new ValueExpression();
        this.context.parseElement(val);
        this.collColumns[valueColumn] === true;
        this.element.value = { name: valueColumn, ui: { caption }, val, bud: undefined };
        /*
        if (this.ts.token !== Token.RPARENTHESE as any) {
            this.ts.passToken(Token.COMMA);
        }
        */
    }

    protected parseIdColumn() {
        if (this.ts.token === Token.COLON) {
            this.ts.readToken();
            let ui = this.parseUI();
            this.ts.passKey('of');
            let alias = this.ts.passVar();
            this.showIds.push({ ui, asc: EnumAsc.asc, alias });
            return;
        }
        let ui = this.parseUI();
        let asc: EnumAsc;
        if (this.ts.isKeyword('asc') === true) {
            asc = EnumAsc.asc;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('desc') === true) {
            asc = EnumAsc.desc;
            this.ts.readToken();
        }
        if (asc === undefined) asc = EnumAsc.asc;
        let alias: string;
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
    /*
    override scan(space: Space): boolean {
        let ok = super.scan(space);
        space = this.createFromSpace(space);
        if (this.element.fromEntity !== undefined) {
            if (this.scanCols(space) === false) {
                ok = false;
                return ok;
            }
            const { ban, value } = this.element;
            if (ban !== undefined) {
                if (ban.val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            if (value !== undefined) {
                const { val, ui, name } = value;
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
                else {
                    let bizEntity = space.getBizEntity();
                    let bud = new BizBudAny(bizEntity, name, ui);
                    value.bud = bud;
                }
            }
            if (this.scanIDsWithCheck0() === false) {
                ok = false;
            }
        }
        return ok;
    }

    protected createFromSpace(space: Space): FromSpace {
        return new FromSpace(space, this.element);
    }

    protected scanIDsWithCheck0() {
        let ok = true;
        if (this.ids.length === 0) {
            this.log(`no ID defined`);
            return false;
        }
        if (this.scanIDs() === false) {
            ok = false;
        }
        return ok;
    }

    protected scanIDs() {
        let ok = true;
        let ret = this.convertIds(this.ids);
        if (ret === undefined) {
            ok = false;
        }
        else {
            this.element.ids.push(...ret);
        }
        ret = this.convertIds(this.showIds);
        if (ret === undefined) {
            ok = false;
        }
        else {
            this.element.showIds = ret;
        }
        return ok;
    }
    */
}
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