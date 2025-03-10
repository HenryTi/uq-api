"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizSelectStatementSpace = exports.PBizSelectStatement = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const space_1 = require("../../space");
const tokens_1 = require("../../tokens");
const PStatement_1 = require("../../PStatement");
class PBizSelectStatement extends PStatement_1.PStatement {
    constructor() {
        super(...arguments);
        this.pFromEntity = {
            tbls: [],
            ofIXs: [],
        };
    }
    parseFromEntity(pFromEntity) {
        this.parseTbls(pFromEntity);
        /*
        if (this.ts.token === Token.DOT) {
            pFromEntity.isDot = true;
            this.ts.readToken();
        }
        */
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
        if (this.ts.token === tokens_1.Token.MUL) {
            this.ts.readToken();
            pFromEntity.tbls = undefined;
            switch (this.ts.passKey()) {
                default:
                    this.ts.expect('atom', 'fork');
                    break;
                case 'atom':
                    pFromEntity.bizPhraseType = BizPhraseType_1.BizPhraseType.atom;
                    return;
                case 'fork':
                    pFromEntity.bizPhraseType = BizPhraseType_1.BizPhraseType.fork;
                    return;
            }
        }
        const { tbls } = pFromEntity;
        for (;;) {
            tbls.push(this.ts.passVar());
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
    parseWhere() {
        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            let where = new il_1.CompareExpression();
            this.context.parseElement(where);
            this.element.where = where;
        }
    }
    scan(space) {
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
exports.PBizSelectStatement = PBizSelectStatement;
class BizSelectStatementSpace extends space_1.Space {
    constructor(outer, from) {
        super(outer);
        this.from = from;
        this.bizFieldSpace = this.createBizFieldSpace(from);
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
    _getBizField(names) { return this.bizFieldSpace.getBizField(names); }
    get _isReadonly() { return true; } // true: is in Biz From Statement
}
exports.BizSelectStatementSpace = BizSelectStatementSpace;
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
    createFromEntity(parent, pFromEntity, sameTypeEntityArr) {
        const fromEntity = new il_1.BizFromEntity(parent);
        const { tbls } = pFromEntity;
        if (tbls === undefined || tbls.length === 0) {
            let bizPhraseType = fromEntity.bizPhraseType = pFromEntity.bizPhraseType;
            let bizEntityTable;
            switch (bizPhraseType) {
                case BizPhraseType_1.BizPhraseType.atom:
                    bizEntityTable = il_1.EnumSysTable.idu;
                    break;
                case BizPhraseType_1.BizPhraseType.fork:
                    bizEntityTable = il_1.EnumSysTable.idu;
                    break;
            }
            if (tbls === undefined) {
                fromEntity.bizEntityArr = undefined;
            }
            fromEntity.bizEntityTable = bizEntityTable;
            return fromEntity;
        }
        const { biz } = this.space.uq;
        let ret;
        if (sameTypeEntityArr === undefined)
            ret = biz.sameTypeEntityArr(tbls);
        else
            ret = sameTypeEntityArr(tbls);
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
    scan(fromEntity, pFromEntity) {
        if (fromEntity === undefined)
            return false;
        let ok = true;
        const { ofIXs, ofOn } = fromEntity;
        const { subs: pSubs, alias /*, isDot*/ } = pFromEntity;
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
            let scanBase;
            switch (bizPhraseType) {
                default:
                    if (bizPhraseType === undefined) {
                        ok = false;
                        this.log('no BizPhraseType');
                        break;
                    }
                    if (length > 0) {
                        ok = false;
                        this.log(`${BizPhraseType_1.BizPhraseType[bizPhraseType].toUpperCase()} can not join sub. Only COMBO, FORK and SHEET can join sub`);
                    }
                    break;
                case BizPhraseType_1.BizPhraseType.sheet:
                    if (length > 2) {
                        ok = false;
                        this.log('SHEET can not have more than 2 subs');
                        break;
                    }
                    scanBase = new FromEntityScanSheet(this, fromEntity, pSubs);
                    break;
                case BizPhraseType_1.BizPhraseType.fork:
                    if (length !== 0 && length !== 1) {
                        ok = false;
                        this.log('FORK must have 1 sub join');
                    }
                    scanBase = new FromEntityScanFork(this, fromEntity, pSubs[0]);
                    break;
                case BizPhraseType_1.BizPhraseType.combo:
                    if (bizEntityArr.length !== 1) {
                        ok = false;
                        this.log(`only one COMBO here`);
                    }
                    const combo = bizEntityArr[0];
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
class FEScanBase {
    constructor(scaner, fromEntity) {
        this.logs = [];
        this.scaner = scaner;
        this.fromEntity = fromEntity;
    }
    createFromEntity(b) {
        let fromEntity = this.scaner.createFromEntity(this.fromEntity, b, undefined);
        return fromEntity;
    }
    scanSub(b, field, fieldBud, callbackOnEmpty) {
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
        if (this.scaner.scan(fromEntity, b) === false)
            return undefined;
        return {
            field,
            fieldBud,
            fromEntity,
            isForkBase: undefined,
        };
    }
}
class FromEntityScanCombo extends FEScanBase {
    constructor(scaner, fromEntity, pSubs) {
        super(scaner, fromEntity);
        this.sameTypeEntityArr = (entityNames) => {
            const { keys } = this.combo;
            const en = entityNames[0];
            let key = keys.find(v => v.name === en);
            if (key === undefined) {
                let ret = {
                    ok: false,
                    entityArr: [],
                    logs: [`${this.combo.name} has not key ${en} `],
                    bizPhraseType: undefined,
                    bizEntityTable: undefined,
                };
                return ret;
            }
            else {
                const { ID } = key;
                if (ID === undefined) {
                    let ret = {
                        ok: false,
                        entityArr: [],
                        logs: [`${this.combo.name} key ${en} is not ID`],
                        bizPhraseType: undefined,
                        bizEntityTable: undefined,
                    };
                    return ret;
                }
                else {
                    let ret = {
                        ok: true,
                        entityArr: [ID],
                        logs: [],
                        bizPhraseType: ID.bizPhraseType,
                        bizEntityTable: ID.getEnumSysTable(),
                    };
                    return ret;
                }
            }
        };
        this.pSubs = pSubs;
        const { bizEntityArr } = this.fromEntity;
        this.combo = bizEntityArr[0];
    }
    createSubs() {
        const { keys } = this.combo;
        let ret = [];
        let len = this.pSubs.length;
        for (let i = 0; i < len; i++) {
            function onEmpty() {
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
    createFromEntity(b) {
        let fromEntity = this.scaner.createFromEntity(this.fromEntity, b, this.sameTypeEntityArr);
        return fromEntity;
    }
}
class FromEntityScanFork extends FEScanBase {
    constructor(scaner, fromEntity, pSub) {
        super(scaner, fromEntity);
        this.onForkEmpty = () => {
            const { bizEntityArr } = this.fromEntity;
            if (bizEntityArr.length === 0)
                return;
            let baseEntity = bizEntityArr[0].base;
            return baseEntity;
        };
        this.pSub = pSub;
    }
    createSubs() {
        let sub = this.scanSub(this.pSub, 'seed', undefined, this.onForkEmpty);
        if (sub === undefined)
            return;
        sub.isForkBase = true;
        return [sub];
    }
}
class FromEntityScanSheet extends FEScanBase {
    constructor(scaner, fromEntity, pSubs) {
        super(scaner, fromEntity);
        this.sameTypeEntityArr = (entityNames) => {
            const { main, details } = this.sheet;
            const en = entityNames[0];
            if (main.name === en) {
                let ret = {
                    ok: true,
                    entityArr: [main],
                    logs: [],
                    bizPhraseType: main.bizPhraseType,
                    bizEntityTable: il_1.EnumSysTable.bizBin,
                };
                return ret;
            }
            let detail = details.find(v => v.bin.name === en);
            if (detail !== undefined) {
                const { bin } = detail;
                let ret = {
                    ok: true,
                    entityArr: [bin],
                    logs: [],
                    bizPhraseType: bin.bizPhraseType,
                    bizEntityTable: il_1.EnumSysTable.bizBin,
                };
                return ret;
            }
            let ret = {
                ok: false,
                entityArr: [],
                logs: [`${this.sheet.name} has not ${en} `],
                bizPhraseType: undefined,
                bizEntityTable: undefined,
            };
            return ret;
        };
        this.pSubs = pSubs;
        const { bizEntityArr } = this.fromEntity;
        this.sheet = bizEntityArr[0];
    }
    createSubs() {
        let ret = [];
        for (let pSub of this.pSubs) {
            function onEmpty() {
                return undefined;
            }
            let field = undefined;
            let fieldBud = undefined;
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
    createFromEntity(b) {
        let fromEntity = this.scaner.createFromEntity(this.fromEntity, b, this.sameTypeEntityArr);
        return fromEntity;
    }
}
//# sourceMappingURL=BizSelectStatement.js.map