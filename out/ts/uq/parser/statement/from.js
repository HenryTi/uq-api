"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFromStatementInPend = exports.PFromStatement = void 0;
const il_1 = require("../../il");
const il_2 = require("../../il");
const space_1 = require("../space");
const tokens_1 = require("../tokens");
const statement_1 = require("./statement");
class PFromStatement extends statement_1.PStatement {
    constructor() {
        super(...arguments);
        this.tbls = [];
        this.ofIXs = [];
    }
    _parse() {
        this.parseTbls();
        this.parseTblsOf();
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    parseTbls() {
        for (;;) {
            this.tbls.push(this.ts.passVar());
            if (this.ts.token === tokens_1.Token.BITWISEOR) {
                this.ts.readToken();
            }
            else {
                break;
            }
        }
    }
    parseTblsOf() {
        while (this.ts.isKeyword('of') === true) {
            this.ts.readToken();
            this.ofIXs.push(this.ts.passVar());
        }
        if (this.ofIXs.length > 0) {
            this.ts.passKey('on');
            let ofOn = new il_1.ValueExpression();
            this.context.parseElement(ofOn);
            this.element.ofOn = ofOn;
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
        if (this.scanEntityArr(space) === false) {
            ok = false;
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
    setEntityArr(space) {
        const { biz } = space.uq;
        const { entityArr, logs, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(this.tbls);
        this.element.bizEntityArr = entityArr;
        this.element.bizPhraseType = bizPhraseType;
        this.element.bizEntityTable = bizEntityTable;
        this.log(...logs);
        return retOk;
    }
    scanEntityArr(space) {
        let ok = true;
        const { biz } = space.uq;
        let bizFieldSpace = space.getBizFieldSpace();
        let retOk = this.setEntityArr(space);
        if (retOk === false) {
            return false;
        }
        let { bizEntityArr: entityArr } = this.element;
        if (entityArr.length > 0) {
            const { ofIXs, ofOn, cols } = this.element;
            for (let _of of this.ofIXs) {
                let entity = space.getBizEntity(_of);
                if (entity === undefined) {
                    ok = false;
                    this.log(`${_of} is not defined`);
                }
                else if (entity.bizPhraseType !== il_2.BizPhraseType.tie) {
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
                    let bud = new il_1.BizBudNone(biz, name, ui);
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
        }
        return ok;
    }
}
exports.PFromStatement = PFromStatement;
class PFromStatementInPend extends PFromStatement {
    _parse() {
        this.parseTblsOf();
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    createFromSpace(space) {
        return new FromInPendSpace(space, this.element);
    }
    scan(space) {
        return super.scan(space);
    }
    setEntityArr(space) {
        this.element.bizEntityArr = [space.getBizEntity(undefined)];
        this.element.bizPhraseType = il_2.BizPhraseType.pend;
        this.element.bizEntityTable = il_1.EnumSysTable.pend;
        return true;
    }
}
exports.PFromStatementInPend = PFromStatementInPend;
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
class FromInPendSpace extends FromSpace {
    createBizFieldSpace(from) {
        this.bizFieldSpace = new il_1.FromInPendFieldSpace(from);
    }
}
//# sourceMappingURL=from.js.map