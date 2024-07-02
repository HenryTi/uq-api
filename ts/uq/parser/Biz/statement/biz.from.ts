import { CompareExpression, FromStatement, ValueExpression, FromInQueryFieldSpace, BizBudAny, EnumAsc, IdColumn } from "../../../il";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { BizSelectStatementSpace, PBizSelectStatement, PIdColumn } from "./BizSelectStatement";

export class PFromStatement<T extends FromStatement = FromStatement> extends PBizSelectStatement<T> {
    private readonly ids: PIdColumn[] = [];
    private readonly showIds: PIdColumn[] = [];
    private readonly collColumns: { [name: string]: boolean } = {};

    protected _parse(): void {
        this.parseFromEntity(this.pFromEntity);
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(Token.SEMICOLON);
    }

    protected parseColumn() {
        if (this.ts.isKeyword('column') === true) {
            this.ts.readToken();
            this.ts.passToken(Token.LPARENTHESE);
            this.parseIdColumns();
            for (; ;) {
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token === Token.MOD) {
                    const { peekToken, lowerVar } = this.ts.peekToken();
                    if (peekToken !== Token.VAR) {
                        this.ts.expectToken(Token.VAR);
                    }
                    let val = new ValueExpression();
                    this.context.parseElement(val);
                    this.element.cols.push({ name: lowerVar, ui: null, val, bud: undefined, });
                }
                else {
                    let name = this.ts.passVar();
                    let ui = this.parseUI();
                    this.ts.passToken(Token.EQU);
                    let val = new ValueExpression();
                    this.context.parseElement(val);
                    this.element.cols.push({ name, ui, val, bud: undefined, });
                    if (this.collColumns[name] === true) {
                        this.ts.error(`duplicate column name ${name}`);
                    }
                }
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.passToken(Token.COMMA);
            }
        }
    }

    private parseIdColumns() {
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

            const value = 'value';
            if (this.ts.isKeyword(value) === true) {
                this.ts.readToken();
                let caption = this.ts.mayPassString();
                this.ts.passToken(Token.EQU);
                let val = new ValueExpression();
                this.context.parseElement(val);
                this.collColumns[value] === true;
                this.element.value = { name: value, ui: { caption }, val, bud: undefined };
                if (this.ts.token !== Token.RPARENTHESE as any) {
                    this.ts.passToken(Token.COMMA);
                }
            }
        }
    }

    private parseIdColumn() {
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
        if (this.ts.isKeyword('group') === true) {
            if (this.element.groupByBase === true) {
                this.ts.error('ID GROUP BY can only be the last');
            }
            this.ts.readToken();
            this.ts.passKey('by');
            this.ts.passKey('base');
            this.element.groupByBase = true;
        }
        this.ids.push({ ui, asc, alias });
    }

    override scan(space: Space): boolean {
        let ok = super.scan(space);
        space = this.createFromSpace(space);
        // let scanner = new FromEntityScaner(space);
        /*
        let fromEntity = scanner.createFromEntity(this.pFromEntity, undefined);
        if (scanner.scan(fromEntity, this.pFromEntity) === false) {
            this.log(...scanner.msgs);
            ok = false;
        }
        else {
            this.element.fromEntity = fromEntity;
        */
        if (this.element.fromEntity !== undefined) {
            if (this.scanCols(space) === false) {
                ok = false;
                return ok;
            }
            const { ban, value } = this.element;
            /*
            if (where !== undefined) {
                if (where.pelement.scan(space) === false) {
                    ok = false;
                }
            }
                */
            // if (asc === undefined) this.element.asc = 'asc';
            if (ban !== undefined) {
                if (ban.val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            if (value !== undefined) {
                if (value.val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            if (this.scanIDsWithCheck0() === false) {
                ok = false;
            }
            // }
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

    private convertIds(ids: PIdColumn[]) {
        let ok = true;
        let ret: IdColumn[] = [];
        for (let idc of ids) {
            const { asc, alias, ui } = idc;
            let fromEntity = this.element.getIdFromEntity(alias);
            if (fromEntity === undefined) {
                this.log(`${alias} not defined`);
                ok = false;
            }
            else {
                let idcLast: IdColumn = {
                    ui,
                    asc,
                    fromEntity,
                };
                ret.push(idcLast);
            }
        }
        if (ok === false) return;
        return ret;
    }
    protected scanIDs() {
        let ok = true;
        let ret = this.convertIds(this.ids);
        if (ret === undefined) {
            ok = false;
        }
        else {
            this.element.ids = ret;
        }
        ret = this.convertIds(this.showIds);
        if (ret === undefined) {
            ok = false;
        }
        else {
            this.element.showIds = ret;
        }
        /*
        if (this.element.groupByBase === true) {
            const { fromEntity } = idcLast;
            if (idcLast.fromEntity.bizPhraseType !== BizPhraseType.fork) {
                this.log(`FROM ${fromEntity.alias} must be SPEC`);
                ok = false;
            }
        }
        */
        return ok;
    }

    private scanCols(space: Space) {
        let ok = true;
        const { cols } = this.element;
        // let bizFieldSpace = space.getBizFieldSpace();
        for (let col of cols) {
            const { name, ui, val } = col;
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            if (ui === null) {
                // let field = bizFieldSpace.getBizField([name]);
                let names = [name];
                let field = space.getBizField(names);
                if (field !== undefined) {
                    col.bud = field.getBud();
                    if (col.bud === undefined) {
                        //debugger;
                        // field = bizFieldSpace.getBizField([name]);
                        field = space.getBizField(names);
                    }
                }
                else {
                    debugger;
                    // bizFieldSpace.getBizField([name]);
                    space.getBizField(names);
                    // 'no', 'ex' 不能出现这样的情况
                    col.bud = undefined;
                }
            }
            else {
                // Query bud
                // let bizEntitySpace = space.getBizEntitySpace();
                // if (bizEntitySpace === undefined) debugger;
                // let bud = new BizBudAny(bizEntitySpace.bizEntity, name, ui);
                let bizEntity = space.getBizEntity();
                if (bizEntity === undefined) debugger;
                let bud = new BizBudAny(bizEntity, name, ui);
                col.bud = bud;
            }
        }
        return ok;
    }
}

export class FromSpace extends BizSelectStatementSpace<FromStatement> {
    protected createBizFieldSpace(from: FromStatement) {
        return new FromInQueryFieldSpace(from);
    }

    protected override _getBizFromEntityFromAlias(name: string) {
        return this.from.getBizFromEntityFromAlias(name);
    }
}

