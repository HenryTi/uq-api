"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromSpace = exports.PFromStatement = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const space_1 = require("../../space");
const tokens_1 = require("../../tokens");
const statement_1 = require("../../statement/statement");
class PFromStatement extends statement_1.PStatement {
    constructor() {
        super(...arguments);
        this.ids = [];
        this.collColumns = {};
        this.pFromEntity = {
            tbls: [],
            ofIXs: [],
        };
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
    _parse() {
        this.parseFromEntity(this.pFromEntity);
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    parseFromEntity(pFromEntity) {
        this.parseTbls(pFromEntity);
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            pFromEntity.subs = [];
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                const sub = {
                    tbls: [],
                    ofIXs: [],
                };
                this.parseFromEntity(sub);
                pFromEntity.subs.push(sub);
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
            }
        }
        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            pFromEntity.alias = this.ts.passVar();
        }
        this.parseTblsOf(pFromEntity);
    }
    parseTbls(pFromEntity) {
        if (this.ts.isKeyword('as') === true) {
            return;
        }
        for (;;) {
            pFromEntity.tbls.push(this.ts.passVar());
            if (this.ts.token === tokens_1.Token.BITWISEOR) {
                this.ts.readToken();
            }
            else {
                break;
            }
        }
    }
    parseTblsOf(pFromEntity) {
        while (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            pFromEntity.ofIXs.push(this.ts.passVar());
        }
        if (pFromEntity.ofIXs.length > 0) {
            this.ts.passKey('on');
            let ofOn = new il_1.ValueExpression();
            this.context.parseElement(ofOn);
            pFromEntity.ofOn = ofOn;
        }
    }
    parseColumn() {
        if (this.ts.isKeyword('column') === true) {
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            this.parseIdColumns();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.token === tokens_1.Token.MOD) {
                    const { peekToken, lowerVar } = this.ts.peekToken();
                    if (peekToken !== tokens_1.Token.VAR) {
                        this.ts.expectToken(tokens_1.Token.VAR);
                    }
                    let val = new il_1.ValueExpression();
                    this.context.parseElement(val);
                    this.element.cols.push({ name: lowerVar, ui: null, val, bud: undefined, });
                }
                else {
                    let name = this.ts.passVar();
                    let ui = this.parseUI();
                    this.ts.passToken(tokens_1.Token.EQU);
                    let val = new il_1.ValueExpression();
                    this.context.parseElement(val);
                    this.element.cols.push({ name, ui, val, bud: undefined, });
                    if (this.collColumns[name] === true) {
                        this.ts.error(`duplicate column name ${name}`);
                    }
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.passToken(tokens_1.Token.COMMA);
            }
        }
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
            const value = 'value';
            if (this.ts.isKeyword(value) === true) {
                this.ts.readToken();
                let caption = this.ts.mayPassString();
                this.ts.passToken(tokens_1.Token.EQU);
                let val = new il_1.ValueExpression();
                this.context.parseElement(val);
                this.collColumns[value] === true;
                this.element.value = { name: value, ui: { caption }, val, bud: undefined };
                if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
                    this.ts.passToken(tokens_1.Token.COMMA);
                }
            }
        }
    }
    parseIdColumn() {
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
    parseWhere() {
        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            let where = new il_1.CompareExpression();
            this.context.parseElement(where);
            this.element.where = where;
        }
    }
    createFromSpace(space) {
        return new FromSpace(space, this.element);
    }
    scan(space) {
        let ok = true;
        space = this.createFromSpace(space);
        let scanner = new FromEntityScaner(space);
        let fromEntity = scanner.createFromEntity(this.pFromEntity);
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
    scanIDsWithCheck0() {
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
    scanIDs() {
        let ok = true;
        let idcLast;
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
            if (idcLast.fromEntity.bizPhraseType !== BizPhraseType_1.BizPhraseType.spec) {
                this.log(`FROM ${fromEntity.alias} must be SPEC`);
                ok = false;
            }
        }
        return ok;
    }
    scanCols(space) {
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
                if (bizEntitySpace === undefined)
                    debugger;
                let bud = new il_1.BizBudAny(bizEntitySpace.bizEntity, name, ui);
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
}
exports.PFromStatement = PFromStatement;
class FromEntityScaner {
    constructor(space) {
        this.msgs = [];
        this.space = space;
        this.sets = new Set();
        this.tAlias = 1;
    }
    log(...msg) {
        this.msgs.push(...msg);
    }
    createFromEntity(pFromEntity) {
        const fromEntity = new il_1.FromEntity();
        const { tbls } = pFromEntity;
        if (tbls.length === 0)
            return fromEntity;
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
    scan(fromEntity, pFromEntity) {
        if (fromEntity === undefined)
            return false;
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
                else if (entity.bizPhraseType !== BizPhraseType_1.BizPhraseType.tie) {
                    ok = false;
                    this.log(`${_of} is not a TIE`);
                }
                else {
                    ofIXs.push(entity);
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
            let subs;
            // let fields: string[];
            switch (fromEntity.bizPhraseType) {
                default:
                    if (length > 0) {
                        ok = false;
                        this.log('only COMBO, SPEC and DUO support sub join');
                    }
                    break;
                case BizPhraseType_1.BizPhraseType.duo:
                    if (length !== 0 && length !== 2) {
                        ok = false;
                        this.log('DUO must have 2 sub join');
                    }
                    let duo = new FromEntityScanDuo(this, fromEntity, pSubs[0], pSubs[1]);
                    subs = duo.createSubs();
                    break;
                case BizPhraseType_1.BizPhraseType.spec:
                    if (length !== 0 && length !== 1) {
                        ok = false;
                        this.log('SPEC must have 1 sub join');
                    }
                    let spec = new FromEntityScanSpec(this, fromEntity, pSubs[0]);
                    subs = spec.createSubs();
                    break;
                case BizPhraseType_1.BizPhraseType.combo:
                    const combo = fromEntity.bizEntityArr[0];
                    const keysLength = combo.keys.length;
                    if (length !== keysLength) {
                        ok = false;
                        this.log(`${combo.getJName()} must have ${keysLength} subs`);
                    }
                    let comboScan = new FromEntityScanCombo(this, fromEntity, pSubs);
                    subs = comboScan.createSubs();
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
class FEScanBase {
    constructor(scaner, fromEntity) {
        this.scaner = scaner;
        this.fromEntity = fromEntity;
    }
    createFromEntity(b) {
        let fromEntity = this.scaner.createFromEntity(b);
        return fromEntity;
    }
    scanSub(b, field, callbackOnEmpty) {
        let fromEntity = this.createFromEntity(b);
        if (fromEntity === undefined) {
            fromEntity = new il_1.FromEntity();
        }
        if (fromEntity.bizEntityArr.length === 0) {
            let entity = callbackOnEmpty();
            fromEntity.bizEntityArr.push(entity);
            fromEntity.bizPhraseType = entity.bizPhraseType;
            fromEntity.bizEntityTable = entity.getEnumSysTable();
        }
        if (this.scaner.scan(fromEntity, b) === false)
            return undefined;
        return {
            field,
            fromEntity,
            isSpecBase: undefined,
        };
    }
}
class FromEntityScanDuo extends FEScanBase {
    constructor(scaner, fromEntity, pSub0, pSub1) {
        super(scaner, fromEntity);
        this.onIEmpty = () => {
            return this.fromEntity.bizEntityArr[0].i.atoms[0];
        };
        this.onXEmpty = () => {
            return this.fromEntity.bizEntityArr[0].x.atoms[0];
        };
        this.pSub0 = pSub0;
        this.pSub1 = pSub1;
    }
    createSubs() {
        let subI = this.scanSub(this.pSub0, 'i', this.onIEmpty);
        if (subI === undefined)
            return;
        let subX = this.scanSub(this.pSub1, 'x', this.onXEmpty);
        if (subX === undefined)
            return;
        return [subI, subX];
    }
}
class FromEntityScanCombo extends FEScanBase {
    constructor(scaner, fromEntity, pSubs) {
        super(scaner, fromEntity);
        this.pSubs = pSubs;
    }
    createSubs() {
        const { bizEntityArr } = this.fromEntity;
        const { keys } = bizEntityArr[0];
        let ret = [];
        let len = this.pSubs.length;
        for (let i = 0; i < len; i++) {
            function onEmpty() {
                // keys[i].dataType === BudDataType.atom
                return undefined;
            }
            let pSub = this.pSubs[i];
            let sub = this.scanSub(pSub, keys[i].name, onEmpty);
            if (sub === undefined)
                return;
            ret.push(sub);
        }
        return ret;
    }
}
class FromEntityScanSpec extends FEScanBase {
    constructor(scaner, fromEntity, pSub) {
        super(scaner, fromEntity);
        this.onSpecEmpty = () => {
            let baseEntity = this.fromEntity.bizEntityArr[0].base;
            return baseEntity;
        };
        this.pSub = pSub;
    }
    createSubs() {
        let sub = this.scanSub(this.pSub, 'base', this.onSpecEmpty);
        if (sub === undefined)
            return;
        sub.isSpecBase = true;
        return [sub];
    }
}
class FromSpace extends space_1.Space {
    constructor(outer, from) {
        super(outer);
        this.from = from;
        this.createBizFieldSpace(from);
    }
    createBizFieldSpace(from) {
        this.bizFieldSpace = new il_1.FromInQueryFieldSpace(from);
    }
    _getEntityTable(name) {
        return;
    }
    _getTableByAlias(alias) {
        return;
    }
    _varPointer(name, isField) {
        return;
    }
    _getBizFieldSpace() {
        return this.bizFieldSpace;
    }
    _getBizFromEntityFromAlias(name) {
        return this.from.getBizFromEntityFromAlias(name);
    }
    get isReadonly() { return true; } // true: is in Biz From Statement
}
exports.FromSpace = FromSpace;
//# sourceMappingURL=biz.from.js.map