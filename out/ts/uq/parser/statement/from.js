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
        this.ts.readToken();
        this.ts.passKey('column');
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
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
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
            }
            else if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
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
        let entityArr = [];
        for (let tbl of this.tbls) {
            let entity = space.getBizEntity(tbl);
            if (entity === undefined) {
                this.log(`${tbl} is not defined`);
                ok = false;
            }
            else {
                entityArr.push(entity);
            }
        }
        let { length } = entityArr;
        if (length > 0) {
            let bizEntity = entityArr[0];
            this.element.bizEntity0 = bizEntity;
            const { bizPhraseType } = bizEntity;
            for (let i = 1; i < length; i++) {
                let ent = entityArr[i];
                if (ent.bizPhraseType !== bizPhraseType) {
                    this.log(`${entityArr.map(v => v.getJName()).join(', ')} must be the same type`);
                    ok = false;
                }
            }
            this.element.bizPhraseType = bizPhraseType;
            let bizEntityTable;
            this.element.bizEntityArr = entityArr;
            switch (bizPhraseType) {
                default:
                    this.log(`FROM can only be one of ATOM, SPEC, BIN, SHEET, PEND`);
                    ok = false;
                    break;
                case il_1.BizPhraseType.atom:
                    bizEntityTable = il_1.EnumSysTable.atom;
                    break;
                case il_1.BizPhraseType.spec:
                    bizEntityTable = il_1.EnumSysTable.spec;
                    break;
                case il_1.BizPhraseType.bin:
                    bizEntityTable = il_1.EnumSysTable.bizBin;
                    break;
                case il_1.BizPhraseType.sheet:
                    bizEntityTable = il_1.EnumSysTable.sheet;
                    break;
                case il_1.BizPhraseType.pend:
                    bizEntityTable = il_1.EnumSysTable.pend;
                    break;
            }
            this.element.bizEntityTable = bizEntityTable;
            if (bizEntity !== undefined) {
                for (let col of this.element.cols) {
                    const { name, caption, val } = col;
                    if (val.pelement.scan(space) === false) {
                        ok = false;
                    }
                    if (caption === null) {
                        // from entity bud
                        if (bizEntity.hasField(name) === false) {
                            let bud = this.element.getBud(name);
                            if (bud !== undefined) {
                                col.entity = bizEntity;
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
        }
        const { where } = this.element;
        if (where !== undefined) {
            if (where.pelement.scan(space) === false) {
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