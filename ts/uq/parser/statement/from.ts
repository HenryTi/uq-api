import { BizBudNone, CompareExpression, Entity, FromStatement, Pointer, Table, ValueExpression } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PStatement } from "./statement";

export class PFromStatement extends PStatement<FromStatement> {
    private readonly tbls: string[] = [];
    protected _parse(): void {
        for (; ;) {
            this.tbls.push(this.ts.passVar());
            if (this.ts.token === Token.BITWISEOR) {
                this.ts.readToken();
            }
            else {
                break;
            }
        }
        if (this.ts.isKeyword('column') === true) {
            const coll: { [name: string]: boolean } = {};
            this.ts.readToken();
            this.ts.passToken(Token.LPARENTHESE);
            this.ts.passKey('id');
            if (this.ts.isKeyword('asc') === true) {
                this.element.asc = 'asc';
            }
            else if (this.ts.isKeyword('desc') === true) {
                this.element.asc = 'desc';
            }
            else {
                this.ts.expect('ASC', 'DESC');
            }
            coll['id'] = true;
            this.ts.readToken();
            if (this.ts.token !== Token.RPARENTHESE) {
                this.ts.passToken(Token.COMMA);
                const ban = 'ban';
                if (this.ts.isKeyword(ban) === true) {
                    this.ts.readToken();
                    let caption = this.ts.mayPassString();
                    this.ts.passToken(Token.EQU);
                    let val = new CompareExpression();
                    this.context.parseElement(val);
                    coll[ban] = true;
                    this.element.ban = { caption, val };
                    if (this.ts.token !== Token.RPARENTHESE as any) {
                        this.ts.passToken(Token.COMMA);
                    }
                }
            }

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
                    this.element.cols.push({ name: lowerVar, caption: null, val });
                }
                else {
                    let name = this.ts.passVar();
                    let caption = this.ts.mayPassString();
                    this.ts.passToken(Token.EQU);
                    let val = new ValueExpression();
                    this.context.parseElement(val);
                    this.element.cols.push({ name, caption, val });
                    if (coll[name] === true) {
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
        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            let where = new CompareExpression();
            this.context.parseElement(where);
            this.element.where = where;
        }
        this.ts.passToken(Token.SEMICOLON);
    }

    scan(space: Space): boolean {
        let ok = true;
        const { biz } = space.uq;
        space = new FromSpace(space, this.element);
        const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(this.tbls);
        this.element.bizEntityArr = entityArr;
        this.element.bizPhraseType = bizPhraseType;
        this.element.bizEntityTable = bizEntityTable;
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else if (entityArr.length > 0) {
            for (let col of this.element.cols) {
                const { name, caption, val } = col;
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
                if (caption === null) {
                    // from entity bud
                    //if (bizEntity0.hasField(name) === false) {
                    let [bizEntity, bud] = this.element.getBud(name);
                    if (bud !== undefined) {
                        col.entity = bizEntity;
                        col.bud = bud;
                    }
                    //}
                }
                else {
                    // Query bud
                    let bud = new BizBudNone(biz, name, caption);
                    col.bud = bud;
                }
            }
        }

        const { where, asc, ban } = this.element;
        if (where !== undefined) {
            if (where.pelement.scan(space) === false) {
                ok = false;
            }
        }
        if (asc === undefined) this.element.asc = 'asc';
        if (ban !== undefined) {
            if (ban.val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}

class FromSpace extends Space {
    private readonly from: FromStatement;

    constructor(outer: Space, from: FromStatement) {
        super(outer);
        this.from = from;
    }

    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableByAlias(alias: string): Table {
        return;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        return;
    }
    protected override _getBizFrom(): FromStatement {
        return this.from;
    }
}