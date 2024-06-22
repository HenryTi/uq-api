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
    BizDuo,
    IdColumn,
    BizCombo,
    BizBudID
} from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { PStatement } from "../../statement/statement";
import { SameTypeEntityArrReturn } from "../../../il/Biz/Biz";

interface PFromEntity {
    tbls: string[];
    ofIXs: string[];
    ofOn: ValueExpression;
    alias: string;
    subs: PFromEntity[];
    isDot: boolean;
}

interface PIdColumn {
    ui: Partial<UI>;
    asc: EnumAsc;
    alias: string;
}

export class PFromStatement<T extends FromStatement = FromStatement> extends PStatement<T> {
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
        if (this.ts.token === Token.DOT) {
            pFromEntity.isDot = true;
            this.ts.readToken();
        }
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
        let scanner = new FromEntityScaner(space);
        let fromEntity = scanner.createFromEntity(this.pFromEntity, undefined);
        if (scanner.scan(fromEntity, this.pFromEntity) === false) {
            this.log(...scanner.msgs);
            ok = false;
        }
        else {
            this.element.fromEntity = fromEntity;
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
        let idcLast: IdColumn;
        for (let idc of this.ids) {
            const { asc, alias, ui } = idc;
            let fromEntity = this.element.getIdFromEntity(alias);
            if (fromEntity === undefined) {
                this.log(`${alias} not defined`);
                ok = false;
            }
            else {
                idcLast = {
                    ui,
                    asc,
                    fromEntity,
                };
                this.element.ids.push(idcLast);
            }
        }
        if (this.element.groupByBase === true) {
            const { fromEntity } = idcLast;
            if (idcLast.fromEntity.bizPhraseType !== BizPhraseType.fork) {
                this.log(`FROM ${fromEntity.alias} must be SPEC`);
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
                col.bud = bud;
            }
        }
        return ok;
    }
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

    createFromEntity(pFromEntity: PFromEntity, sameTypeEntityArr: (entityNames: string[]) => SameTypeEntityArrReturn): FromEntity {
        const fromEntity = new FromEntity();
        const { tbls } = pFromEntity;
        if (tbls.length === 0) return fromEntity;
        const { biz } = this.space.uq;
        let ret: SameTypeEntityArrReturn;
        if (sameTypeEntityArr === undefined) ret = biz.sameTypeEntityArr(tbls);
        else ret = sameTypeEntityArr(tbls);
        const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = ret;
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
        if (fromEntity === undefined) return false;
        let ok = true;
        const { ofIXs, ofOn } = fromEntity;
        const { subs: pSubs, alias, isDot } = pFromEntity;
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

        const { bizEntityArr, bizPhraseType } = fromEntity;
        if (bizEntityArr.length > 0) {
            for (let _of of pFromEntity.ofIXs) {
                let entity = this.space.getBizBase([_of]);
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
            let scanBase: FEScanBase;
            switch (bizPhraseType) {
                default:
                    if (length > 0) {
                        ok = false;
                        this.log(`${BizPhraseType[bizPhraseType].toUpperCase()} can not join sub. Only COMBO, SPEC and DUO can join sub`);
                    }
                    break;
                case BizPhraseType.duo:
                    if (length !== 0 && length !== 2) {
                        ok = false;
                        this.log('DUO must have 2 sub join');
                    }
                    if (isDot === true) {
                        this.log('DUO. is not allowed');
                        ok = false;
                    }
                    scanBase = new FromEntityScanDuo(this, fromEntity, pSubs[0], pSubs[1]);
                    break;
                case BizPhraseType.fork:
                    if (length !== 0 && length !== 1) {
                        ok = false;
                        this.log('SPEC must have 1 sub join');
                    }
                    if (isDot === true) {
                        this.log('SPEC. is not allowed');
                        ok = false;
                    }
                    scanBase = new FromEntityScanSpec(this, fromEntity, pSubs[0]);
                    break;
                case BizPhraseType.combo:
                    if (bizEntityArr.length !== 1) {
                        ok = false;
                        this.log(`only one COMBO here`);
                    }
                    const combo = bizEntityArr[0] as BizCombo;
                    const keysLength = combo.keys.length;
                    if (length !== keysLength && isDot !== true) {
                        ok = false;
                        this.log(`${combo.getJName()} must have ${keysLength} subs`);
                    }
                    scanBase = new FromEntityScanCombo(this, fromEntity, pSubs, isDot);
                    break;
            }
            if (scanBase !== undefined) {
                subs = scanBase.createSubs();
                if (subs === undefined) {
                    ok = false;
                    this.log(...scanBase.logs);
                }
                else {
                    fromEntity.subs = subs;
                }
            }
        }
        return ok;
    }
}

abstract class FEScanBase {
    protected readonly scaner: FromEntityScaner;
    readonly logs: string[] = [];
    readonly fromEntity: FromEntity;
    constructor(scaner: FromEntityScaner, fromEntity: FromEntity) {
        this.scaner = scaner;
        this.fromEntity = fromEntity;
    }

    abstract createSubs(): BizFromEntitySub[];

    protected createFromEntity(b: PFromEntity) {
        let fromEntity = this.scaner.createFromEntity(b, undefined);
        return fromEntity;
    }

    protected scanSub(b: PFromEntity, field: string, callbackOnEmpty: () => BizEntity): BizFromEntitySub {
        let fromEntity = this.createFromEntity(b);
        if (fromEntity === undefined) {
            fromEntity = new FromEntity();
        }
        if (fromEntity.bizEntityArr.length === 0) {
            let entity = callbackOnEmpty();
            if (entity === undefined) return undefined;
            fromEntity.bizEntityArr.push(entity);
            fromEntity.bizPhraseType = entity.bizPhraseType;
            fromEntity.bizEntityTable = entity.getEnumSysTable();
        }
        if (this.scaner.scan(fromEntity, b) === false) return undefined;
        return {
            field,
            fromEntity,
            isSpecBase: undefined,
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

class FromEntityScanCombo extends FEScanBase {
    private readonly pSubs: PFromEntity[];
    private readonly combo: BizCombo;
    private readonly isDot: boolean;
    constructor(scaner: FromEntityScaner, fromEntity: FromEntity, pSubs: PFromEntity[], isDot: boolean) {
        super(scaner, fromEntity);
        this.pSubs = pSubs;
        const { bizEntityArr } = this.fromEntity;
        this.combo = bizEntityArr[0] as BizCombo;
        if (isDot !== true) this.sameTypeEntityArr = undefined;
        else this.isDot = true;
    }

    createSubs(): BizFromEntitySub[] {
        const { keys } = this.combo;
        let ret: BizFromEntitySub[] = [];
        let len = this.pSubs.length;
        for (let i = 0; i < len; i++) {
            function onEmpty(): BizEntity {
                return undefined;
            }
            let key = keys[i];
            let pSub = this.pSubs[i];
            let { name: keyName } = key;
            let sub = this.scanSub(pSub, keyName, onEmpty);
            if (sub !== undefined) {
                if (this.isDot === true) sub.field = keyName;
            }
            else {
                this.logs.push(`${pSub.tbls.join(',').toUpperCase()} undefined`);
                return undefined;
            }
            ret.push(sub);
        }
        return ret;
    }

    private sameTypeEntityArr = (entityNames: string[]): SameTypeEntityArrReturn => {
        const { keys } = this.combo;
        const en = entityNames[0];
        let key = keys.find(v => v.name === en);
        if (key === undefined) {
            let ret: SameTypeEntityArrReturn = {
                ok: false,
                entityArr: [],
                logs: [`${this.combo.name} has not key ${en} `],
                bizPhraseType: undefined,
                bizEntityTable: undefined,
            }
            return ret;
        }
        else {
            const { ID } = key as BizBudID;
            if (ID === undefined) {
                let ret: SameTypeEntityArrReturn = {
                    ok: false,
                    entityArr: [],
                    logs: [`${this.combo.name} key ${en} is not ID`],
                    bizPhraseType: undefined,
                    bizEntityTable: undefined,
                }
                return ret;
            }
            else {
                let ret: SameTypeEntityArrReturn = {
                    ok: true,
                    entityArr: [ID],
                    logs: [],
                    bizPhraseType: ID.bizPhraseType,
                    bizEntityTable: ID.getEnumSysTable(),
                }
                return ret;
            }
        }
    }

    protected createFromEntity(b: PFromEntity) {
        let fromEntity = this.scaner.createFromEntity(b, this.sameTypeEntityArr);
        return fromEntity;
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
        sub.isSpecBase = true;
        return [sub];
    }
}

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

