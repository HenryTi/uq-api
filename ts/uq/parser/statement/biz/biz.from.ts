import {
    BizTie, CompareExpression
    , Entity, EnumSysTable, FromStatement, FromStatementInPend, Pointer, Table, ValueExpression
    , BizFieldBud, BizFieldSpace, FromInQueryFieldSpace, FromInPendFieldSpace, BizBudAny,
    FromEntity
} from "../../../il";
import { BizPhraseType } from "../../../il";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { PStatement } from "../statement";

interface PFromEntity {
    tbls: string[];
    ofIXs: string[];
    ofOn: ValueExpression;
    alias: string;
    subs: PFromEntity[];
    isGroupBy: boolean;
}

export class PFromStatement<T extends FromStatement = FromStatement> extends PStatement<T> {
    protected pFromEntity: PFromEntity = {
        tbls: [],
        ofIXs: [],
    } as PFromEntity;

    protected _parse(): void {
        this.parseFromEntity(this.pFromEntity);
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(Token.SEMICOLON);
    }

    private parseFromEntity(pFromEntity: PFromEntity) {
        this.parseTbls(pFromEntity);
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            pFromEntity.subs = [];
            for (; ;) {
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                const sub: PFromEntity = {
                    tbls: [],
                    ofIXs: [],
                } as PFromEntity;
                this.parseFromEntity(sub);
                pFromEntity.subs.push(sub);
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            }
        }
        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            pFromEntity.alias = this.ts.passVar();
        }
        if (this.ts.isKeyword('group') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('by') === true) {
                this.ts.readToken();
            }
            pFromEntity.isGroupBy = true;
        }
        this.parseTblsOf(pFromEntity);
    }

    private parseTbls(pFromEntity: PFromEntity) {
        for (; ;) {
            pFromEntity.tbls.push(this.ts.passVar());
            if (this.ts.token === Token.BITWISEOR) {
                this.ts.readToken();
            }
            else {
                break;
            }
        }
    }

    protected parseTblsOf(pFromEntity: PFromEntity) {
        while (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            pFromEntity.ofIXs.push(this.ts.passVar());
        }
        if (pFromEntity.ofIXs.length > 0) {
            this.ts.passKey('on');
            let ofOn = new ValueExpression();
            this.context.parseElement(ofOn);
            pFromEntity.ofOn = ofOn;
        }
    }

    protected parseColumn() {
        if (this.ts.isKeyword('column') === true) {
            const coll: { [name: string]: boolean } = {};
            this.ts.readToken();
            this.ts.passToken(Token.LPARENTHESE);
            if (this.ts.isKeyword('id') === true) {
                this.ts.readToken();
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
                    this.element.cols.push({ name: lowerVar, ui: null, val, field: undefined, });
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
        let aliasSet = new Set<string>();
        if (this.scanFromEntity(space, this.element.fromEntity, this.pFromEntity, aliasSet) === false) {
            ok = false;
            return ok;
        }
        if (this.scanCols(space) === false) {
            ok = false;
            return ok;
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

    private scanCols(space: Space) {
        let ok = true;
        const { cols } = this.element;
        let bizFieldSpace = space.getBizFieldSpace();
        for (let col of cols) {
            const { name, ui, val } = col;
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            if (ui === null) {
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
                let bud = new BizBudAny(undefined, name, ui);
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
        return ok;
    }

    protected scanFromEntity(space: Space, fromEntity: FromEntity, pFromEntity: PFromEntity, aliasSet: Set<string>) {
        let ok = true;
        let retOk = this.setEntityArr(space, pFromEntity);
        if (retOk === false) {
            return false;
        }
        const { bizEntityArr: entityArr, ofIXs, ofOn } = fromEntity;
        const { subs: pSubs, alias } = pFromEntity;
        if (aliasSet.has(alias) === true) {
            ok = false;
            this.log(`FROM as alias ${alias} duplicate`);
        }
        else {
            fromEntity.alias = alias;
            aliasSet.add(alias);
        }
        if (entityArr.length > 0) {
            for (let _of of pFromEntity.ofIXs) {
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
        }
        if (pSubs !== undefined) {
            for (let pSub of pSubs) {
                let subFromEntity: FromEntity = {
                } as FromEntity;
                if (this.scanFromEntity(space, subFromEntity, pSub, aliasSet) === false) {
                    ok = false;
                }
                else {
                    let { subs } = fromEntity;
                    if (subs === undefined) {
                        fromEntity.subs = subs = [];
                    }
                    subs.push(subFromEntity);
                }
            }
        }
        return ok;
    }

    protected setEntityArr(space: Space, pFromEntity: PFromEntity) {
        const { biz } = space.uq;
        const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(pFromEntity.tbls);
        const { fromEntity } = this.element;
        fromEntity.bizEntityArr = entityArr;
        fromEntity.bizPhraseType = bizPhraseType;
        fromEntity.bizEntityTable = bizEntityTable;
        if (retOk === false) this.log(...logs);
        return retOk;
    }
}

export class PFromStatementInPend extends PFromStatement<FromStatementInPend> {
    protected _parse(): void {
        this.parseTblsOf(this.pFromEntity);
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(Token.SEMICOLON);
    }

    protected createFromSpace(space: Space): FromSpace {
        return new FromInPendSpace(space, this.element);
    }

    override scan(space: Space): boolean {
        return super.scan(space);
    }

    protected setEntityArr(space: Space) {
        const { fromEntity } = this.element;
        fromEntity.bizEntityArr = [space.getBizEntity(undefined)];
        fromEntity.bizPhraseType = BizPhraseType.pend;
        fromEntity.bizEntityTable = EnumSysTable.pend;
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
