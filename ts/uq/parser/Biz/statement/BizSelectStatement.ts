import {
    BizTie, CompareExpression,
    Entity, Pointer, Table, ValueExpression,
    BizFieldSpace, BizFromEntity,
    UI,
    EnumAsc,
    BizFromEntitySub,
    BizFork,
    BizEntity,
    BizCombo,
    BizBudID,
    BizSelectStatement,
    BizField,
    EnumSysTable,
    BizBud,
    BizSheet
} from "../../../il";
import { BizPhraseType } from "../../../il/Biz/BizPhraseType";
import { Space } from "../../space";
import { Token } from "../../tokens";
import { PStatement } from "../../PStatement";
import { SameTypeEntityArrReturn } from "../../../il/Biz/Biz";

interface PFromEntity {
    tbls: string[];
    bizPhraseType: BizPhraseType.atom | BizPhraseType.fork;
    ofIXs: string[];
    ofOn: ValueExpression;
    alias: string;
    subs: PFromEntity[];
    // isDot: boolean;
}

export interface PIdColumn {
    ui: Partial<UI>;
    asc: EnumAsc;
    alias: string;
}

export abstract class PBizSelectStatement<T extends BizSelectStatement> extends PStatement<T> {
    protected pFromEntity: PFromEntity = {
        tbls: [],
        ofIXs: [],
    } as PFromEntity;

    protected parseFromEntity(pFromEntity: PFromEntity) {
        this.parseTbls(pFromEntity);
        /*
        if (this.ts.token === Token.DOT) {
            pFromEntity.isDot = true;
            this.ts.readToken();
        }
        */
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
        if (this.ts.token === Token.MUL) {
            this.ts.readToken();
            pFromEntity.tbls = undefined;
            switch (this.ts.passKey()) {
                default:
                    this.ts.expect('atom', 'fork');
                    break;
                case 'atom':
                    pFromEntity.bizPhraseType = BizPhraseType.atom;
                    return;
                case 'fork':
                    pFromEntity.bizPhraseType = BizPhraseType.fork;
                    return;
            }

        }
        const { tbls } = pFromEntity;
        for (; ;) {
            tbls.push(this.ts.passVar());
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

    protected parseWhere() {
        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            let where = new CompareExpression();
            this.context.parseElement(where);
            this.element.where = where;
        }
    }

    protected abstract createFromSpace(space: Space): BizSelectStatementSpace;

    override scan(space: Space): boolean {
        let ok = true;
        space = this.createFromSpace(space);
        let scanner = new FromEntityScaner(space);
        let fromEntity = scanner.createFromEntity(undefined, this.pFromEntity, undefined);
        if (scanner.scan(fromEntity, this.pFromEntity) === false) {
            this.log(...scanner.msgs);
            ok = false;
        }
        else {
            this.element.fromEntity = fromEntity;
            const { where } = this.element;
            if (where !== undefined) {
                if (where.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        return ok;
    }
}

export abstract class BizSelectStatementSpace<T extends BizSelectStatement = BizSelectStatement> extends Space {
    protected readonly from: T;
    protected bizFieldSpace: BizFieldSpace;

    constructor(outer: Space, from: T) {
        super(outer);
        this.from = from;
        this.bizFieldSpace = this.createBizFieldSpace(from);
    }

    protected abstract createBizFieldSpace(from: T): BizFieldSpace;

    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableByAlias(alias: string): Table {
        return;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        return;
    }
    protected _getBizField(names: string[]): BizField { return this.bizFieldSpace.getBizField(names); }

    get isReadonly(): boolean { return true; }    // true: is in Biz From Statement
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

    createFromEntity(parent: BizFromEntity, pFromEntity: PFromEntity, sameTypeEntityArr: (entityNames: string[]) => SameTypeEntityArrReturn): BizFromEntity {
        const fromEntity = new BizFromEntity(parent);
        const { tbls } = pFromEntity;
        if (tbls === undefined || tbls.length === 0) {
            let bizPhraseType = fromEntity.bizPhraseType = pFromEntity.bizPhraseType;
            let bizEntityTable: EnumSysTable;
            switch (bizPhraseType) {
                case BizPhraseType.atom:
                    bizEntityTable = EnumSysTable.idu;
                    break;
                case BizPhraseType.fork:
                    bizEntityTable = EnumSysTable.idu;
                    break;
            }
            if (tbls === undefined) {
                fromEntity.bizEntityArr = undefined;
            }
            fromEntity.bizEntityTable = bizEntityTable;
            return fromEntity;
        }
        const { biz } = this.space.uq;
        let ret: SameTypeEntityArrReturn;
        if (sameTypeEntityArr === undefined) ret = biz.sameTypeEntityArr(tbls);
        else ret = sameTypeEntityArr(tbls);
        const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = ret;
        if (entityArr.length === 0) {
            this.log(...logs);
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

    scan(fromEntity: BizFromEntity, pFromEntity: PFromEntity): boolean {
        if (fromEntity === undefined) return false;
        let ok = true;
        const { ofIXs, ofOn } = fromEntity;
        const { subs: pSubs, alias/*, isDot*/ } = pFromEntity;
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
                let entity = this.space.uq.biz.bizEntities.get(_of);
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
                    if (bizPhraseType === undefined) {
                        ok = false;
                        this.log('no BizPhraseType');
                        break;
                    }
                    if (length > 0) {
                        ok = false;
                        this.log(`${BizPhraseType[bizPhraseType].toUpperCase()} can not join sub. Only COMBO, FORK and SHEET can join sub`);
                    }
                    break;
                case BizPhraseType.sheet:
                    if (length > 2) {
                        ok = false;
                        this.log('SHEET can not have more than 2 subs');
                        break;
                    }
                    scanBase = new FromEntityScanSheet(this, fromEntity, pSubs);
                    break;
                case BizPhraseType.fork:
                    if (length !== 0 && length !== 1) {
                        ok = false;
                        this.log('FORK must have 1 sub join');
                    }
                    scanBase = new FromEntityScanFork(this, fromEntity, pSubs[0]);
                    break;
                case BizPhraseType.combo:
                    if (bizEntityArr.length !== 1) {
                        ok = false;
                        this.log(`only one COMBO here`);
                    }
                    const combo = bizEntityArr[0] as BizCombo;
                    const keysLength = combo.keys.length;
                    if (length !== keysLength) { // && isDot !== true) {
                        ok = false;
                        this.log(`${combo.getJName()} must have ${keysLength} subs`);
                    }
                    scanBase = new FromEntityScanCombo(this, fromEntity, pSubs);
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
    readonly fromEntity: BizFromEntity;
    constructor(scaner: FromEntityScaner, fromEntity: BizFromEntity) {
        this.scaner = scaner;
        this.fromEntity = fromEntity;
    }

    abstract createSubs(): BizFromEntitySub[];

    protected createFromEntity(b: PFromEntity) {
        let fromEntity = this.scaner.createFromEntity(this.fromEntity, b, undefined);
        return fromEntity;
    }

    protected scanSub(b: PFromEntity, field: string, fieldBud: BizBud, callbackOnEmpty: () => BizEntity): BizFromEntitySub {
        let fromEntity = this.createFromEntity(b);
        if (fromEntity === undefined) {
            return;
        }
        let { bizEntityArr } = fromEntity;
        if (bizEntityArr === undefined) {
            fromEntity.bizEntityArr = bizEntityArr = [];
        }
        if (bizEntityArr.length === 0) {
            let entity = callbackOnEmpty();
            if (entity !== undefined) {
                fromEntity.bizEntityArr.push(entity);
                fromEntity.bizPhraseType = entity.bizPhraseType;
                fromEntity.bizEntityTable = entity.getEnumSysTable();
            }
        }
        if (this.scaner.scan(fromEntity, b) === false) return undefined;
        return {
            field,
            fieldBud,
            fromEntity,
            isForkBase: undefined,
        };
    }
}

class FromEntityScanCombo extends FEScanBase {
    private readonly pSubs: PFromEntity[];
    private readonly combo: BizCombo;
    constructor(scaner: FromEntityScaner, fromEntity: BizFromEntity, pSubs: PFromEntity[]) {
        super(scaner, fromEntity);
        this.pSubs = pSubs;
        const { bizEntityArr } = this.fromEntity;
        this.combo = bizEntityArr[0] as BizCombo;
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
            let sub = this.scanSub(pSub, keyName, key, onEmpty);
            if (sub === undefined) {
                this.logs.push(`${pSub.tbls.join(',').toUpperCase()} undefined`);
                return undefined;
            }
            else {
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
        let fromEntity = this.scaner.createFromEntity(this.fromEntity, b, this.sameTypeEntityArr);
        return fromEntity;
    }
}

class FromEntityScanFork extends FEScanBase {
    private readonly pSub: PFromEntity;
    constructor(scaner: FromEntityScaner, fromEntity: BizFromEntity, pSub: PFromEntity) {
        super(scaner, fromEntity);
        this.pSub = pSub;
    }

    private onForkEmpty = (): BizEntity => {
        const { bizEntityArr } = this.fromEntity;
        if (bizEntityArr.length === 0) return;
        let baseEntity = (bizEntityArr[0] as BizFork).base;
        return baseEntity;
    }

    createSubs(): BizFromEntitySub[] {
        let sub = this.scanSub(this.pSub, 'seed', undefined, this.onForkEmpty);
        if (sub === undefined) return;
        sub.isForkBase = true;
        return [sub];
    }
}

class FromEntityScanSheet extends FEScanBase {
    private readonly pSubs: PFromEntity[];
    private readonly sheet: BizSheet;
    constructor(scaner: FromEntityScaner, fromEntity: BizFromEntity, pSubs: PFromEntity[]) {
        super(scaner, fromEntity);
        this.pSubs = pSubs;
        const { bizEntityArr } = this.fromEntity;
        this.sheet = bizEntityArr[0] as BizSheet;
    }

    createSubs(): BizFromEntitySub[] {
        let ret: BizFromEntitySub[] = [];
        for (let pSub of this.pSubs) {
            function onEmpty(): BizEntity {
                return undefined;
            }
            let field: string = undefined;
            let fieldBud: BizBud = undefined;
            let sub = this.scanSub(pSub, field, fieldBud, onEmpty);
            if (sub === undefined) {
                this.logs.push(`${pSub.tbls.join(',').toUpperCase()} undefined`);
                return undefined;
            }
            else {
                if (sub.fromEntity.bizEntityArr[0] === this.sheet.main) {
                    sub.field = 'id';
                }
                else {
                    sub.field = 'sheet';
                }
            }
            ret.push(sub);
        }
        return ret;
    }

    private sameTypeEntityArr = (entityNames: string[]): SameTypeEntityArrReturn => {
        const { main, details } = this.sheet;
        const en = entityNames[0];
        if (main.name === en) {
            let ret: SameTypeEntityArrReturn = {
                ok: true,
                entityArr: [main],
                logs: [],
                bizPhraseType: main.bizPhraseType,
                bizEntityTable: EnumSysTable.bizBin,
            }
            return ret;
        }
        let detail = details.find(v => v.bin.name === en);
        if (detail !== undefined) {
            const { bin } = detail;
            let ret: SameTypeEntityArrReturn = {
                ok: true,
                entityArr: [bin],
                logs: [],
                bizPhraseType: bin.bizPhraseType,
                bizEntityTable: EnumSysTable.bizBin,
            }
            return ret;
        }
        let ret: SameTypeEntityArrReturn = {
            ok: false,
            entityArr: [],
            logs: [`${this.sheet.name} has not ${en} `],
            bizPhraseType: undefined,
            bizEntityTable: undefined,
        }
        return ret;
    }

    protected createFromEntity(b: PFromEntity) {
        let fromEntity = this.scaner.createFromEntity(this.fromEntity, b, this.sameTypeEntityArr);
        return fromEntity;
    }
}