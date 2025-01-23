"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromSpace = exports.PFromStatement = void 0;
const il_1 = require("../../../il");
const tokens_1 = require("../../tokens");
const BizSelectStatement_1 = require("./BizSelectStatement");
const valueColumn = 'value';
class PFromStatement extends BizSelectStatement_1.PBizSelectStatement {
    constructor() {
        super(...arguments);
        this.ids = [];
        this.showIds = [];
        this.collColumns = {};
    }
    _parse() {
        this.parseFromEntity(this.pFromEntity);
        this.parseColumns();
        this.parseWhere();
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    parseColumns() {
        if (this.ts.isKeyword('column') === true) {
            this.ts.readToken();
            this.ts.passToken(tokens_1.Token.LPARENTHESE);
            this.parseIdColumns();
            for (;;) {
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (this.ts.isKeyword('sub') === true) {
                    this.ts.readToken();
                    this.parseSubColumns();
                }
                else {
                    this.parseColumn();
                }
                if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                this.ts.passToken(tokens_1.Token.COMMA);
            }
        }
    }
    parseSubColumns() {
        let { subCols } = this.element;
        if (subCols === undefined)
            this.element.subCols = subCols = [];
        this.ts.passToken(tokens_1.Token.LPARENTHESE);
        for (;;) {
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            let col = this.parseColumn();
            if (col !== undefined) {
                subCols.push(col);
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            this.ts.passToken(tokens_1.Token.COMMA);
        }
    }
    parseColumn() {
        let col;
        if (this.ts.token === tokens_1.Token.MOD) {
            const { peekToken, lowerVar } = this.ts.peekToken();
            if (peekToken !== tokens_1.Token.VAR) {
                this.ts.expectToken(tokens_1.Token.VAR);
            }
            let val = new il_1.ValueExpression();
            this.context.parseElement(val);
            col = { name: lowerVar, ui: null, val, bud: undefined, };
        }
        else {
            let name = this.ts.passVar();
            if (name === valueColumn && this.ts.varBrace === false) {
                this.parseValue();
                return;
            }
            else {
                let hide;
                if (this.ts.isKeyword('hide') === true) {
                    this.ts.readToken();
                    hide = true;
                }
                let ui = this.parseUI();
                this.ts.passToken(tokens_1.Token.EQU);
                let val = new il_1.ValueExpression();
                this.context.parseElement(val);
                col = { name, ui, val, bud: undefined, hide };
                if (this.collColumns[name] === true) {
                    this.ts.error(`duplicate column name ${name}`);
                }
            }
        }
        this.element.cols.push(col);
        return col;
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
            // this.parseValue();
        }
    }
    parseValue() {
        if (this.element.value !== undefined) {
            this.ts.error('duplicate VALUE');
        }
        let caption = this.ts.mayPassString();
        this.ts.passToken(tokens_1.Token.EQU);
        let val = new il_1.ValueExpression();
        this.context.parseElement(val);
        this.collColumns[valueColumn] === true;
        this.element.value = { name: valueColumn, ui: { caption }, val, bud: undefined };
        /*
        if (this.ts.token !== Token.RPARENTHESE as any) {
            this.ts.passToken(Token.COMMA);
        }
        */
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
        if (this.element.fromEntity !== undefined) {
            if (this.scanCols(space) === false) {
                ok = false;
                return ok;
            }
            const { ban, value } = this.element;
            if (ban !== undefined) {
                if (ban.val.pelement.scan(space) === false) {
                    ok = false;
                }
            }
            if (value !== undefined) {
                const { val, ui, name } = value;
                if (val.pelement.scan(space) === false) {
                    ok = false;
                }
                else {
                    let bizEntity = space.getBizEntity();
                    let bud = new il_1.BizBudAny(bizEntity, name, ui);
                    value.bud = bud;
                }
            }
            if (this.scanIDsWithCheck0() === false) {
                ok = false;
            }
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
        return ok;
    }
    scanCols(space) {
        let ok = true;
        const { cols } = this.element;
        for (let col of cols) {
            const { name, ui, val } = col;
            if (val.pelement.scan(space) === false) {
                ok = false;
            }
            else {
                this.element.setValBud(col);
            }
            if (ui === null) {
                // let field = bizFieldSpace.getBizField([name]);
                let names = [name];
                let field = space.getBizField(names);
                if (field !== undefined) {
                    if ((col.bud = field.getBud()) === undefined) {
                        //debugger;
                        // field = bizFieldSpace.getBizField([name]);
                        // field = space.getBizField(names);
                        // Query From 不支持 no, ex 两个字段获取，会自动提取
                        ok = false;
                        this.log(`%${name} not needed here`);
                    }
                }
                else {
                    debugger;
                    // bizFieldSpace.getBizField([name]);
                    space.getBizField(names);
                    // 'no', 'ex' 不能出现这样的情况
                    col.bud = undefined;
                    this.log(`${names.join('.')} not valid`);
                    ok = false;
                }
            }
            else {
                // Query bud
                // let bizEntitySpace = space.getBizEntitySpace();
                // if (bizEntitySpace === undefined) debugger;
                // let bud = new BizBudAny(bizEntitySpace.bizEntity, name, ui);
                let bizEntity = space.getBizEntity();
                if (bizEntity === undefined)
                    debugger;
                let bud = new il_1.BizBudAny(bizEntity, name, ui);
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