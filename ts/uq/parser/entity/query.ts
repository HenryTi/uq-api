import {
    Query, QueryStatement,
    Returns, Uq, NamePointer, Pointer, Entity
} from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PActionBase, ActionBaseSpace } from './entity';
import { ReturnsSpace } from './returns';

export class PQuery extends PActionBase<Query> {
    protected _parse() {
        this.setName();
        this.parseProxyAuth();
        this.parseParams(false);
        let returns = this.entity.returns = new Returns();
        returns.parser(this.context, this.entity).parse();

        let statement = new QueryStatement(undefined);
        statement.level = 0;
        this.context.createStatements = statement.createStatements;
        let parser = statement.parser(this.context)
        parser.parse();
        this.entity.statement = statement;

        if (this.ts.token === Token.SEMICOLON as any) {
            this.ts.readToken();
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        if (this.scanProxyAuth(space) === false) {
            return false;
        }
        let theSpace = new QuerySpace(space, this.entity);
        let { returns } = this.entity;
        if (this.scanParamsTuid(space, this.entity, this.entity) === false) ok = false;
        let s2 = new ReturnsSpace(theSpace, returns);
        if (returns.pelement.scan(s2) === false) ok = false;

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

    scan2(uq: Uq): boolean {
        let ok = true;
        if (this.scanParamsOwner(this.entity, this.entity) === false) ok = false;
        for (let ret of this.entity.returns.returns) {
            if (this.scanOwnerFields(this.entity, ret.fields) === false) ok = false;
        }
        return ok;
    }
}

const dollarVarsInPageQuery = [
    '$pagestart', '$pagesize',
];
class QuerySpace extends ActionBaseSpace {
    private query: Query;
    constructor(outer: Space, query: Query) {
        super(outer, query);
        this.query = query;
    }

    private isSupportedDollarVar(name: string): boolean {
        if (this.query.returns.page !== undefined) {
            if (dollarVarsInPageQuery.indexOf(name) >= 0) return true;
        }
        return false;
    }

    protected _isOrderSwitch(_orderSwitch: string): boolean {
        let { returns } = this.query;
        let { page } = returns;
        if (!page) return false;
        let { orderSwitch } = page;
        if (!orderSwitch) return false;
        return orderSwitch.findIndex(v => v === _orderSwitch) >= 0;
    }

    protected _getEntity(name: string): Entity {
        if (name === undefined) { return this.query };
        return super._getEntity(name);
    }

    _varPointer(name: string, isField: boolean): Pointer {
        if (isField === false) {
            if (name === '$date') return;
            if (this.isSupportedDollarVar(name) === true) {
                return new NamePointer();
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