"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromSpace = exports.PFromStatement = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const BizSelectStatement_1 = require("./BizSelectStatement");
class PFromStatement extends BizSelectStatement_1.PBizSelectStatement {
    constructor() {
        super(...arguments);
        this.ids = [];
        this.showIds = [];
        this.collColumns = {};
    }
    _parse() {
        this.parseFromEntity(this.pFromEntity);
        this.parseColumn();
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
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
        if (this.ts.token === tokens_1.Token.COLON) {
            this.ts.readToken();
            let ui = this.parseUI();
            this.ts.passKey('of');
            let alias = this.ts.passVar();
            this.showIds.push({ ui, asc: il_1.EnumAsc.asc, alias });
            return;
        }
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
    scan(space) {
        let ok = super.scan(space);
        space = this.createFromSpace(space);
        // let scanner = new FromEntityScaner(space);
        /*
        let fromEntity = scanner.createFromEntity(this.pFromEntity, undefined);
        if (scanner.scan(fromEntity, this.pFromEntity) === false) {
            this.log(...scanner.msgs);
            ok = false;
        }
        else {
            this.element.fromEntity = fromEntity;
        */
        if (this.element.fromEntity !== undefined) {
            if (this.scanCols(space) === false) {
                ok = false;
                return ok;
            }
            const { ban, value } = this.element;
            /*
            if (where !== undefined) {
                if (where.pelement.scan(space) === false) {
                    ok = false;
                }
            }
                */
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
            // }
        }
        return ok;
    }
    createFromSpace(space) {
        return new FromSpace(space, this.element);
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
    convertIds(ids) {
        let ok = true;
        let ret = [];
        for (let idc of ids) {
            const { asc, alias, ui } = idc;
            let fromEntity = this.element.getIdFromEntity(alias);
            if (fromEntity === undefined) {
                this.log(`${alias} not defined`);
                ok = false;
            }
            else {
                let idcLast = {
                    ui,
                    asc,
                    fromEntity,
                };
                ret.push(idcLast);
            }
        }
        if (ok === false)
            return;
        return ret;
    }
    scanIDs() {
        let ok = true;
        let ret = this.convertIds(this.ids);
        if (ret === undefined) {
            ok = false;
        }
        else {
            this.element.ids = ret;
        }
        ret = this.convertIds(this.showIds);
        if (ret === undefined) {
            ok = false;
        }
        else {
            this.element.showIds = ret;
        }
        /*
        if (this.element.groupByBase === true) {
            const { fromEntity } = idcLast;
            if (idcLast.fromEntity.bizPhraseType !== BizPhraseType.fork) {
                this.log(`FROM ${fromEntity.alias} must be SPEC`);
                ok = false;
            }
        }
        */
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
                col.bud = bud;
            }
        }
        return ok;
    }
}
exports.PFromStatement = PFromStatement;
class FromSpace extends BizSelectStatement_1.BizSelectStatementSpace {
    createBizFieldSpace(from) {
        return new il_1.FromInQueryFieldSpace(from);
    }
    _getBizFromEntityFromAlias(name) {
        return this.from.getBizFromEntityFromAlias(name);
    }
}
exports.FromSpace = FromSpace;
//# sourceMappingURL=biz.from.js.map