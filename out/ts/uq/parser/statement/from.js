"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFromStatement = void 0;
const il_1 = require("../../il");
const space_1 = require("../space");
const tokens_1 = require("../tokens");
const statement_1 = require("./statement");
class PFromStatement extends statement_1.PStatement {
    constructor() {
        super(...arguments);
        this.tbls = [];
    }
    _parse() {
        for (;;) {
            this.tbls.push(this.ts.passVar());
            if (this.ts.token === tokens_1.Token.BITWISEOR) {
                this.ts.readToken();
            }
            else {
                break;
            }
        }
        if (this.ts.isKeyword('column') === true) {
            const coll = {};
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
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
                    this.element.cols.push({ name: lowerVar, caption: null, val });
                }
                else {
                    let name = this.ts.passVar();
                    let caption = this.ts.mayPassString();
                    this.ts.passToken(tokens_1.Token.EQU);
                    let val = new il_1.ValueExpression();
                    this.context.parseElement(val);
                    this.element.cols.push({ name, caption, val });
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
        if (this.ts.isKeyword('where') === true) {
            this.ts.readToken();
            let where = new il_1.CompareExpression();
            this.context.parseElement(where);
            this.element.where = where;
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    scan(space) {
        let ok = true;
        const { biz } = space.uq;
        space = new FromSpace(space, this.element);
        const { entityArr, logs, bizEntity0, ok: retOk, bizEntityTable, bizPhraseType } = biz.sameTypeEntityArr(this.tbls);
        this.element.bizEntityArr = entityArr;
        this.element.bizEntity0;
        this.element.bizPhraseType = bizPhraseType;
        this.element.bizEntityTable = bizEntityTable;
        this.element.bizEntity0 = bizEntity0;
        if (retOk === false) {
            this.log(...logs);
            ok = false;
        }
        else if (bizEntity0 !== undefined) {
            for (let col of this.element.cols) {
                const { name, caption, val } = col;
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
                if (caption === null) {
                    // from entity bud
                    if (bizEntity0.hasField(name) === false) {
                        let bud = this.element.getBud(name);
                        if (bud !== undefined) {
                            col.entity = bizEntity0;
                            col.bud = bud;
                        }
                    }
                }
                else {
                    // Query bud
                    let bud = new il_1.BizBudNone(biz, name, caption);
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
        if (asc === undefined)
            this.element.asc = 'asc';
        if (ban !== undefined) {
            if (ban.val.pelement.scan(space) === false) {
                ok = false;
            }
        }
        return ok;
    }
}
exports.PFromStatement = PFromStatement;
class FromSpace extends space_1.Space {
    constructor(outer, from) {
        super(outer);
        this.from = from;
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
    _getBizFrom() {
        return this.from;
    }
}
//# sourceMappingURL=from.js.map