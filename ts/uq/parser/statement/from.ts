import {
    BizBudNone
    , BizTie, CompareExpression
    , Entity, EnumSysTable, FromStatement, FromStatementInPend, Pointer, Table, ValueExpression
    , BizField, BizFieldBud, BizFieldSpace, FromInQueryFieldSpace, FromInPendFieldSpace
} from "../../il";
import { BizPhraseType } from "../../il";
import { Space } from "../space";
import { Token } from "../tokens";
import { PStatement } from "./statement";

export class PFromStatement<T extends FromStatement = FromStatement> extends PStatement<T> {
    private readonly tbls: string[] = [];
    private readonly ofs: string[] = [];
    protected _parse(): void {
        this.parseTbls();
        this.parseTblsOf();
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseTbls() {
        for (; ;) {
            this.tbls.push(this.ts.passVar());
            if (this.ts.token === Token.BITWISEOR) {
                this.ts.readToken();
            }
            else {
                break;
            }
        }
    }

    protected parseTblsOf() {
        while (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            this.ofs.push(this.ts.passVar());
        }
        if (this.ofs.length > 0) {
            this.ts.passKey('on');
            let ofOn = new ValueExpression();
            this.context.parseElement(ofOn);
            this.element.ofOn = ofOn;
        }
    }

    private parseColumn() {
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
                    this.element.cols.push({ name: lowerVar, ui: { caption: null }, val, field: undefined, });
                }
                else {
                    let name = this.ts.passVar();
                    let ui = this.parseUI();
                    this.ts.passToken(Token.EQU);
                    let val = new ValueExpression();
                    this.context.parseElement(val);
                    this.element.cols.push({ name, ui, val, field: undefined, });
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
    }

    protected parseWhere() {
        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            let where = new CompareExpression();
            this.context.parseElement(where);
            this.element.where = where;
        }
    }

    protected createFromSpace(space: Space): FromSpace {
        return new FromSpace(space, this.element);
    }

    override scan(space: Space): boolean {
        let ok = true;
        space = this.createFromSpace(space);
        if (this.scanEntityArr(space) === false) {
            ok = false;
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

    protected scanEntityArr(space: Space) {
        let ok = true;
        const { biz } = space.uq;
        let bizFieldSpace = space.getBizFieldSpace();
        const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(this.tbls);
        this.element.bizEntityArr = entityArr;
        this.element.bizPhraseType = bizPhraseType;
        this.element.bizEntityTable = bizEntityTable;
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else if (entityArr.length > 0) {
            const { ofIXs, ofOn, cols } = this.element;
            for (let _of of this.ofs) {
                let entity = space.getBizEntity(_of);
                if (entity === undefined) {
                    ok = false;
                    this.log(`${_of} is not defined`);
                }
                else if (entity.bizPhraseType !== BizPhraseType.tie) {
                    ok = false;
                    this.log(`${_of} is not a TIE`);
                }
                else {
                    ofIXs.push(entity as BizTie);
                }
            }
            if (ofOn !== undefined) {
                if (ofOn.pelement.scan(space) === false) {
                    ok = false;
                }
            }

            for (let col of cols) {
                const { name, ui, val } = col;
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
                if (ui.caption === null) {
                    let field = bizFieldSpace.getBizField([name]); // this.element.getBizField(name);
                    if (field !== undefined) {
                        col.field = field;
                    }
                    else {
                        debugger;
                        bizFieldSpace.getBizField([name]);
                        // 'no', 'ex' 不能出现这样的情况
                        col.field = undefined;
                    }
                }
                else {
                    // Query bud
                    let bud = new BizBudNone(biz, name, ui);
                    let field = bizFieldSpace.getBizField([name]); // new BizFieldBud(bizFieldSpace, bud);
                    if (field !== undefined) {
                        debugger;
                        // field.bud = bud;
                    }
                    else {
                        field = new BizFieldBud(undefined, undefined, undefined, bud);
                    }
                    col.field = field;
                }
            }
        }
        return ok;
    }
}

export class PFromStatementInPend extends PFromStatement<FromStatementInPend> {
    protected _parse(): void {
        this.parseTblsOf();
        this.parseWhere();
        this.ts.passToken(Token.SEMICOLON);
    }

    protected createFromSpace(space: Space): FromSpace {
        return new FromInPendSpace(space, this.element);
    }

    override scan(space: Space): boolean {
        return super.scan(space);
    }

    protected scanEntityArr(space: Space) {
        this.element.bizEntityArr = [space.getBizEntity(undefined)];
        this.element.bizPhraseType = BizPhraseType.pend;
        this.element.bizEntityTable = EnumSysTable.pend;
        return true;
    }
}

class FromSpace extends Space {
    protected bizFieldSpace: BizFieldSpace;

    constructor(outer: Space, from: FromStatement) {
        super(outer);
        this.createBizFieldSpace(from);
    }

    protected createBizFieldSpace(from: FromStatement) {
        this.bizFieldSpace = new FromInQueryFieldSpace(from);
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
    protected override _getBizFieldSpace(): BizFieldSpace {
        return this.bizFieldSpace;
    }
}

class FromInPendSpace extends FromSpace {
    protected override createBizFieldSpace(from: FromStatementInPend) {
        this.bizFieldSpace = new FromInPendFieldSpace(from);
    }
}
