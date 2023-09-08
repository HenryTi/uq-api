"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PQuery = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
const returns_1 = require("./returns");
class PQuery extends entity_1.PActionBase {
    _parse() {
        this.setName();
        this.parseProxyAuth();
        this.parseParams(false);
        let returns = this.entity.returns = new il_1.Returns();
        returns.parser(this.context, this.entity).parse();
        let statement = new il_1.QueryStatement(undefined);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context);
        parser.parse();
        this.entity.statement = statement;
        if (this.ts.token === tokens_1.Token.SEMICOLON) {
            this.ts.readToken();
        }
    }
    scan(space) {
        let ok = true;
        if (this.scanProxyAuth(space) === false) {
            return false;
        }
        let theSpace = new QuerySpace(space, this.entity);
        let { returns } = this.entity;
        if (this.scanParamsTuid(space, this.entity, this.entity) === false)
            ok = false;
        let s2 = new returns_1.ReturnsSpace(theSpace, returns);
        if (returns.pelement.scan(s2) === false)
            ok = false;
        let statement = this.entity.statement;
        if (statement === undefined) {
            ok = false;
        }
        else {
            for (let stat of statement.statements) {
                if (stat.pelement.preScan(s2) === false) {
                    ok = false;
                }
            }
            if (statement.pelement.scan(s2) === false) {
                ok = false;
            }
        }
        return ok;
    }
    scan2(uq) {
        let ok = true;
        if (this.scanParamsOwner(this.entity, this.entity) === false)
            ok = false;
        for (let ret of this.entity.returns.returns) {
            if (this.scanOwnerFields(this.entity, ret.fields) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PQuery = PQuery;
const dollarVarsInPageQuery = [
    '$pagestart', '$pagesize',
];
class QuerySpace extends entity_1.ActionBaseSpace {
    constructor(outer, query) {
        super(outer, query);
        this.query = query;
    }
    isSupportedDollarVar(name) {
        if (this.query.returns.page !== undefined) {
            if (dollarVarsInPageQuery.indexOf(name) >= 0)
                return true;
        }
        return false;
    }
    _isOrderSwitch(_orderSwitch) {
        let { returns } = this.query;
        let { page } = returns;
        if (!page)
            return false;
        let { orderSwitch } = page;
        if (!orderSwitch)
            return false;
        return orderSwitch.findIndex(v => v === _orderSwitch) >= 0;
    }
    _getEntity(name) {
        if (name === undefined) {
            return this.query;
        }
        ;
        return super._getEntity(name);
    }
    _varPointer(name, isField) {
        if (isField === false) {
            if (name === '$date')
                return;
            if (this.isSupportedDollarVar(name) === true) {
                return new il_1.VarPointer();
            }
        }
        return super._varPointer(name, isField);
    }
}
/*
class PageReturnsSpace extends ReturnsSpace {
    private page: Return;
    constructor(outer:Space, returns:Returns, page: Return) {
        super(outer, returns);
        this.page = page;
    }
    getLocalTable(name:string) {
        if (name === undefined) return this.page;
        return super.getLocalTable(name);
    }
}
*/ 
//# sourceMappingURL=query.js.map