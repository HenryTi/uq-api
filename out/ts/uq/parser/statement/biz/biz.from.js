"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromSpace = exports.PFromStatement = void 0;
const il_1 = require("../../../il");
const BizPhraseType_1 = require("../../../il/Biz/BizPhraseType");
const space_1 = require("../../space");
const tokens_1 = require("../../tokens");
const statement_1 = require("../statement");
class PFromStatement extends statement_1.PStatement {
    constructor() {
        super(...arguments);
        this.pFromEntity = {
            tbls: [],
            ofIXs: [],
        };
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
        if (this.ts.isKeyword('group') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('by') === true) {
                this.ts.readToken();
            }
            pFromEntity.isGroupBy = true;
        }
        this.parseTblsOf(pFromEntity);
    }
    parseTbls(pFromEntity) {
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
            const coll = {};
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
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
                if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
                    this.ts.passToken(tokens_1.Token.COMMA);
                    const ban = 'ban';
                    if (this.ts.isKeyword(ban) === true) {
                        this.ts.readToken();
                        let caption = this.ts.mayPassString();
                        this.ts.passToken(tokens_1.Token.EQU);
                        let val = new il_1.CompareExpression();
                        this.context.parseElement(val);
                        coll[ban] = true;
                        this.element.ban = { caption, val };
                        if (this.ts.token !== tokens_1.Token.RPARENTHESE) {
                            this.ts.passToken(tokens_1.Token.COMMA);
                        }
                    }
                }
            }
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
                    this.element.cols.push({ name: lowerVar, ui: null, val, field: undefined, });
                }
                else {
                    let name = this.ts.passVar();
                    let ui = this.parseUI();
                    this.ts.passToken(tokens_1.Token.EQU);
                    let val = new il_1.ValueExpression();
                    this.context.parseElement(val);
                    this.element.cols.push({ name, ui, val, field: undefined, });
                    if (coll[name] === true) {
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
        let aliasSet = new Set();
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
        if (asc === undefined)
            this.element.asc = 'asc';
        if (ban !== undefined) {
            if (ban.val.pelement.scan(space) === false) {
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
                let bud = new il_1.BizBudAny(undefined, name, ui);
                let field = bizFieldSpace.getBizField([name]); // new BizFieldBud(bizFieldSpace, bud);
                if (field !== undefined) {
                    debugger;
                    // field.bud = bud;
                }
                else {
                    field = new il_1.BizFieldBud(undefined, undefined, undefined, bud);
                }
                col.field = field;
            }
        }
        return ok;
    }
    scanFromEntity(space, fromEntity, pFromEntity, aliasSet) {
        let ok = true;
        let retOk = this.setEntityArr(space, pFromEntity);
        if (retOk === false) {
            return false;
        }
        const { bizEntityArr, bizPhraseType, ofIXs, ofOn } = fromEntity;
        const { subs: pSubs, alias } = pFromEntity;
        if (aliasSet.has(alias) === true) {
            ok = false;
            this.log(`FROM as alias ${alias} duplicate`);
        }
        else {
            fromEntity.alias = alias;
            aliasSet.add(alias);
        }
        if (bizEntityArr.length > 0) {
            for (let _of of pFromEntity.ofIXs) {
                let entity = space.getBizEntity(_of);
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
                if (ofOn.pelement.scan(space) === false) {
                    ok = false;
                }
            }
        }
        if (pSubs !== undefined) {
            const { length } = pSubs;
            for (let pSub of pSubs) {
                let subFromEntity = {};
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
            switch (bizPhraseType) {
                default:
                    if (length > 0) {
                        ok = false;
                        this.log('only DUO and SPEC support sub join');
                    }
                    break;
                case BizPhraseType_1.BizPhraseType.duo:
                    if (length !== 0 && length !== 2) {
                        ok = false;
                        this.log('DUO must have 2 sub join');
                    }
                    break;
                case BizPhraseType_1.BizPhraseType.spec:
                    if (length !== 0 && length !== 1) {
                        ok = false;
                        this.log('SPEC must have 1 sub join');
                    }
                    break;
            }
        }
        return ok;
    }
    setEntityArr(space, pFromEntity) {
        const { biz } = space.uq;
        const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(pFromEntity.tbls);
        const { fromEntity } = this.element;
        fromEntity.bizEntityArr = entityArr;
        fromEntity.bizPhraseType = bizPhraseType;
        fromEntity.bizEntityTable = bizEntityTable;
        if (retOk === false)
            this.log(...logs);
        return retOk;
    }
}
exports.PFromStatement = PFromStatement;
class FromSpace extends space_1.Space {
    constructor(outer, from) {
        super(outer);
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
}
exports.FromSpace = FromSpace;
//# sourceMappingURL=biz.from.js.map