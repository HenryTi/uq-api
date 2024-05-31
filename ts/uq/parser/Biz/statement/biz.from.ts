import {
    BizTie, CompareExpression,
    Entity, FromStatement, Pointer, Table, ValueExpression,
    BizFieldSpace, FromInQueryFieldSpace, BizBudAny,
    FromEntity,
    UI,
    EnumAsc,
    BizFromEntitySub,
    BizSpec,
    BizEntity,
    BizDuo
} from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { PStatement } from "../../statement/statement";

interface PFromEntity {
    tbls: string[];
    ofIXs: string[];
    ofOn: ValueExpression;
    alias: string;
    subs: PFromEntity[];
}

interface PIdColumn {
    ui: Partial<UI>;
    asc: EnumAsc;
    alias: string;
}

export class PFromStatement<T extends FromStatement = FromStatement> extends PStatement<T> {
    // private idAlias: string;
    private readonly ids: PIdColumn[] = [];
    private readonly collColumns: { [name: string]: boolean } = {};
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
        this.parseTblsOf(pFromEntity);
    }

    private parseTbls(pFromEntity: PFromEntity) {
        if (this.ts.isKeyword('as') === true) {
            return;
        }
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
        this.ids.push({ ui, asc, alias });
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
        /*
        // let aliasSet = new Set<string>();
        let nAlias: NAlias = {
            sets: new Set<string>(),
            t: 1,
        };
        const { fromEntity } = this.element;
        let retOk = this.setEntityArr(space, fromEntity, this.pFromEntity);
        if (retOk === false) {
            return false;
        }
        */
        let scanner = new FromEntityScaner(space);
        let fromEntity = scanner.createFromEntity(this.pFromEntity);
        if (scanner.scan(fromEntity, this.pFromEntity) === false) {
            ok = false;
        }
        else {
            this.element.fromEntity = fromEntity;
        }
        /*
        if (this.scanFromEntity(space, nAlias, this.element.fromEntity, this.pFromEntity) === false) {
            ok = false;
            return ok;
        }
        */
        if (this.scanCols(space) === false) {
            ok = false;
            return ok;
        }
        const { where, ban, value } = this.element;
        if (where !== undefined) {
            if (where.pelement.scan(space) === false) {
                ok = false;
            }
        }
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
        return ok;
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
        for (let idc of this.ids) {
            const { asc, alias, ui } = idc;
            let fromEntity = this.element.getIdFromEntity(alias);
            if (fromEntity === undefined) {
                this.log(`${alias} not defined`);
                ok = false;
            }
            else {
                this.element.ids.push({
                    ui,
                    asc,
                    fromEntity,
                });
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
                let field = bizFieldSpace.getBizField([name]);
                if (field !== undefined) {
                    col.bud = field.getBud();
                    if (col.bud === undefined) {
                        //debugger;
                        field = bizFieldSpace.getBizField([name]);
                    }
                }
                else {
                    debugger;
                    bizFieldSpace.getBizField([name]);
                    // 'no', 'ex' 不能出现这样的情况
                    col.bud = undefined;
                }
            }
            else {
                // Query bud
                let bizEntitySpace = space.getBizEntitySpace();
                if (bizEntitySpace === undefined) debugger;
                let bud = new BizBudAny(bizEntitySpace.bizEntity, name, ui);
                /*
                let field = bizFieldSpace.getBizField([name]); // new BizFieldBud(bizFieldSpace, bud);
                if (field !== undefined) {
                    debugger;
                    // field.bud = bud;
                }
                else {
                    field = new BizFieldBud(undefined, undefined, bud);
                }
                col.field = field;
                */
                col.bud = bud;
            }
            // if (col.bud === undefined) debugger;
        }
        return ok;
    }
    /*
        protected scanFromEntity(space: Space, nAlias: NAlias, fromEntity: FromEntity, pFromEntity: PFromEntity) {
            let ok = true;
            const { sets } = nAlias;
            const { bizEntityArr, bizPhraseType, ofIXs, ofOn } = fromEntity;
            const { subs: pSubs, alias } = pFromEntity;
            if (alias !== undefined) {
                if (sets.has(alias) === true) {
                    ok = false;
                    this.log(`FROM as alias ${alias} duplicate`);
                }
                else {
                    fromEntity.alias = alias;
                    sets.add(alias);
                }
            }
            else {
                fromEntity.alias = '$t' + (nAlias.t++);
            }
            if (bizEntityArr.length > 0) {
                for (let _of of pFromEntity.ofIXs) {
                    let { bizEntityArr: [entity] } = space.getBizEntityArr(_of);
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
                const { length } = pSubs;
                let subs: BizFromEntitySub[];
                // let fields: string[];
                switch (bizPhraseType) {
                    default:
                        if (length > 0) {
                            ok = false;
                            this.log('only DUO and SPEC support sub join');
                        }
                        // fields = [];
                        break;
                    case BizPhraseType.duo:
                        if (length !== 0 && length !== 2) {
                            ok = false;
                            this.log('DUO must have 2 sub join');
                        }
                        subs = this.scanDuoSubs(space, nAlias, fromEntity, pSubs[0], pSubs[1]);
                        // fields = ['i', 'x'];
                        break;
                    case BizPhraseType.spec:
                        if (length !== 0 && length !== 1) {
                            ok = false;
                            this.log('SPEC must have 1 sub join');
                        }
                        subs = this.scanSpecSubs(space, nAlias, fromEntity, pSubs[0]);
                        // fields = ['base'];
                        break;
                }
                if (subs === undefined) {
                    ok = false;
                }
                else {
                    fromEntity.subs = subs;
                }
                for (let i = 0; i < length; i++) {
                    let pSub = pSubs[i];
                    let subFromEntity: FromEntity = {
                    } as FromEntity;
                    if (this.scanFromEntity(space, fromEntity, subFromEntity, pSub, aliasSet, nAlias) === false) {
                        ok = false;
                    }
                    else {
                        let { subs } = fromEntity;
                        if (subs === undefined) {
                            fromEntity.subs = subs = [];
                        }
                        subs.push({
                            field: fields[i],
                            fromEntity: subFromEntity
                        });
                    }
                }
            }
            return ok;
        }
    
        private scanDuoSubs(space: Space, nAlias: NAlias, fromEntity: FromEntity, bi: PFromEntity, bx: PFromEntity): BizFromEntitySub[] {
            let subI = this.scanDuoSub(space, nAlias, fromEntity, bi, 'i');
            if (subI === undefined) return;
            let subX = this.scanDuoSub(space, nAlias, fromEntity, bx, 'x');
            if (subX === undefined) return;
            return [subI, subX];
        }
    
        private scanDuoSub(space: Space, nAlias: NAlias, fromEntity: FromEntity, b: PFromEntity, field: string): BizFromEntitySub {
            let subFromEntity: FromEntity = {
            } as FromEntity;
            let retOk = this.setEntityArrDuo(space, fromEntity, subFromEntity, b);
            if (retOk === false) {
                return;
            }
            if (this.scanFromEntity(space, nAlias, subFromEntity, b) === false) {
                return;
            }
            return {
                field,
                fromEntity: subFromEntity
            };
        }
    
        private scanSpecSubs(space: Space, nAlias: NAlias, fromEntity: FromEntity, base: PFromEntity): BizFromEntitySub[] {
            let sub = this.scanSpecSub(space, nAlias, fromEntity, base);
            if (sub === undefined) return;
            return [sub];
        }
    
        private scanSpecSub(space: Space, nAlias: NAlias, fromEntity: FromEntity, b: PFromEntity): BizFromEntitySub {
            let subFromEntity: FromEntity = {
            } as FromEntity;
            let retOk = this.setEntityArrSpec(space, fromEntity, subFromEntity, b);
            if (retOk === false) {
                return;
            }
            if (this.scanFromEntity(space, nAlias, subFromEntity, b) === false) {
                return;
            }
            return {
                field: 'base',
                fromEntity: subFromEntity
            };
        }
    
        protected setEntityArr(space: Space, fromEntity: FromEntity, pFromEntity: PFromEntity) {
            const { biz } = space.uq;
            const { tbls } = pFromEntity;
            const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(tbls);
            fromEntity.bizEntityArr = entityArr;
            fromEntity.bizPhraseType = bizPhraseType;
            fromEntity.bizEntityTable = bizEntityTable;
            if (retOk === false) this.log(...logs);
            return retOk;
        }
    
        protected setEntityArrDuo(space: Space, parentFromEntity: FromEntity, fromEntity: FromEntity, pFromEntity: PFromEntity) {
            const { biz } = space.uq;
            const { tbls } = pFromEntity;
            const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(tbls);
            fromEntity.bizEntityArr = entityArr;
            fromEntity.bizPhraseType = bizPhraseType;
            fromEntity.bizEntityTable = bizEntityTable;
            if (retOk === false) this.log(...logs);
            return retOk;
        }
    
        protected setEntityArrSpec(space: Space, parentFromEntity: FromEntity, fromEntity: FromEntity, pFromEntity: PFromEntity) {
            const { biz } = space.uq;
            const { tbls } = pFromEntity;
            const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(tbls);
            fromEntity.bizEntityArr = entityArr;
            fromEntity.bizPhraseType = bizPhraseType;
            fromEntity.bizEntityTable = bizEntityTable;
            if (retOk === false) this.log(...logs);
            return retOk;
        }
    */
}

class FromEntityScaner {
    readonly space: Space;
    readonly sets: Set<string>;
    readonly msgs: string[] = [];
    tAlias: number;

    constructor(space: Space) {
        this.space = space;
        this.sets = new Set();
        this.tAlias = 1;
    }

    log(...msg: string[]) {
        this.msgs.push(...msg);
    }

    createFromEntity(pFromEntity: PFromEntity): FromEntity {
        const fromEntity = new FromEntity();
        const { tbls } = pFromEntity;
        if (tbls.length === 0) return fromEntity;
        const { biz } = this.space.uq;
        const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(tbls);
        if (entityArr.length === 0) {
            return;
        }
        fromEntity.bizEntityArr = entityArr;
        fromEntity.bizPhraseType = bizPhraseType;
        fromEntity.bizEntityTable = bizEntityTable;
        if (retOk === false) {
            this.log(...logs);
            return undefined;
        }
        return fromEntity;
    }

    scan(fromEntity: FromEntity, pFromEntity: PFromEntity): boolean {
        let ok = true;
        const { ofIXs, ofOn } = fromEntity;
        const { subs: pSubs, alias } = pFromEntity;
        if (alias !== undefined) {
            if (this.sets.has(alias) === true) {
                ok = false;
                this.log(`FROM as alias ${alias} duplicate`);
            }
            else {
                fromEntity.alias = alias;
                this.sets.add(alias);
            }
        }
        else {
            fromEntity.alias = '$t' + (this.tAlias++);
        }

        const { bizEntityArr } = fromEntity;
        if (bizEntityArr.length > 0) {
            for (let _of of pFromEntity.ofIXs) {
                let entity = this.space.getBizBase([_of]); // .getBizFromEntityArrFromAlias(_of);
                // let { bizEntityArr: [entity] }
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
                if (ofOn.pelement.scan(this.space) === false) {
                    ok = false;
                }
            }
        }
        if (pSubs !== undefined) {
            const { length } = pSubs;
            let subs: BizFromEntitySub[];
            // let fields: string[];
            switch (fromEntity.bizPhraseType) {
                default:
                    if (length > 0) {
                        ok = false;
                        this.log('only DUO and SPEC support sub join');
                    }
                    // fields = [];
                    break;
                case BizPhraseType.duo:
                    if (length !== 0 && length !== 2) {
                        ok = false;
                        this.log('DUO must have 2 sub join');
                    }
                    let duo = new FromEntityScanDuo(this, fromEntity, pSubs[0], pSubs[1]);
                    // subs = this.scanDuoSubs(this.space, this.nAlias, this.fromEntity, pSubs[0], pSubs[1]);
                    subs = duo.createSubs();
                    // fields = ['i', 'x'];
                    break;
                case BizPhraseType.spec:
                    if (length !== 0 && length !== 1) {
                        ok = false;
                        this.log('SPEC must have 1 sub join');
                    }
                    let spec = new FromEntityScanSpec(this, fromEntity, pSubs[0]);
                    subs = spec.createSubs();
                    // fields = ['base'];
                    break;
            }
            if (subs === undefined) {
                ok = false;
            }
            else {
                fromEntity.subs = subs;
            }
        }
        return ok;
    }
}

abstract class FEScanBase {
    protected readonly scaner: FromEntityScaner;
    readonly fromEntity: FromEntity;
    constructor(scaner: FromEntityScaner, fromEntity: FromEntity) {
        this.scaner = scaner;
        this.fromEntity = fromEntity;
    }

    abstract createSubs(): BizFromEntitySub[];

    protected createFromEntity(b: PFromEntity) {
        let fromEntity = this.scaner.createFromEntity(b);
        return fromEntity;
    }

    protected scanSub(b: PFromEntity, field: string, callbackOnEmpty: () => BizEntity): BizFromEntitySub {
        let fromEntity = this.createFromEntity(b);
        if (fromEntity === undefined) {
            fromEntity = new FromEntity();
        }
        if (fromEntity.bizEntityArr.length === 0) {
            let entity = callbackOnEmpty();
            fromEntity.bizEntityArr.push(entity);
            fromEntity.bizPhraseType = entity.bizPhraseType;
            fromEntity.bizEntityTable = entity.getEnumSysTable();
        }
        if (this.scaner.scan(fromEntity, b) === false) return undefined;
        return {
            field,
            fromEntity
        };
    }
}

class FromEntityScanDuo extends FEScanBase {
    private readonly pSub0: PFromEntity;
    private readonly pSub1: PFromEntity;
    constructor(scaner: FromEntityScaner, fromEntity: FromEntity, pSub0: PFromEntity, pSub1: PFromEntity) {
        super(scaner, fromEntity);
        this.pSub0 = pSub0;
        this.pSub1 = pSub1;
    }

    private onIEmpty = (): BizEntity => {
        return (this.fromEntity.bizEntityArr[0] as BizDuo).i.atoms[0];
    }

    private onXEmpty = (): BizEntity => {
        return (this.fromEntity.bizEntityArr[0] as BizDuo).x.atoms[0];
    }

    createSubs(): BizFromEntitySub[] {
        let subI = this.scanSub(this.pSub0, 'i', this.onIEmpty);
        if (subI === undefined) return;
        let subX = this.scanSub(this.pSub1, 'x', this.onXEmpty);
        if (subX === undefined) return;
        return [subI, subX];
    }
}

class FromEntityScanSpec extends FEScanBase {
    private readonly pSub: PFromEntity;
    constructor(scaner: FromEntityScaner, fromEntity: FromEntity, pSub: PFromEntity) {
        super(scaner, fromEntity);
        this.pSub = pSub;
    }

    private onSpecEmpty = (): BizEntity => {
        let baseEntity = (this.fromEntity.bizEntityArr[0] as BizSpec).base;
        return baseEntity;
    }

    createSubs(): BizFromEntitySub[] {
        let sub = this.scanSub(this.pSub, 'base', this.onSpecEmpty);
        if (sub === undefined) return;
        return [sub];
    }
}
/*
interface NAlias {
    sets: Set<string>;
    t: number;
}
*/
export class FromSpace extends Space {
    protected readonly from: FromStatement;
    protected bizFieldSpace: BizFieldSpace;

    constructor(outer: Space, from: FromStatement) {
        super(outer);
        this.from = from;
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

    protected override _getBizFromEntityFromAlias(name: string) {
        return this.from.getBizFromEntityFromAlias(name);
    }

    get isReadonly(): boolean { return true; }    // true: is in Biz From Statement
}

