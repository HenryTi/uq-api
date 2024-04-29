import {
    BizQuery, BizQueryTable, BizQueryTableStatements, BizQueryValue, BizQueryValueStatements
    , Entity, FromStatement, Pointer, PutStatement, Statement, Table, VarPointer
} from "../../il";
import { Space } from "../space";
import { PStatements } from "../statement";
import { Token } from "../tokens";
import { PBizEntity } from "./Base";

abstract class PBizQuery<T extends BizQuery> extends PBizEntity<T> {
}

export class PBizQueryTable<T extends BizQueryTable = BizQueryTable> extends PBizQuery<T> {
    protected readonly keyColl = {};
    protected _parse(): void {
        if (this.ts.token === Token.VAR) {
            super.parseHeader();
        }
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                let bud = this.parseSubItem();
                const { name: budName } = bud;
                const { params } = this.element;
                if (params.findIndex(v => v.name === budName) >= 0) {
                    this.ts.expect(`duplicate ${budName}`);
                }
                params.push(bud);
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    if (this.ts.token === Token.RPARENTHESE as any) {
                        this.ts.readToken();
                        break;
                    }
                    continue;
                }
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            }
        }
        let statements = this.createStatements();
        statements.level = 0;
        this.context.createStatements = statements.createStatements;
        this.context.parseElement(statements);
        this.element.statement = statements;
        const { statements: arr } = statements;
        const { length } = arr;
        if (length > 0) {
            const lastStatement = arr[length - 1];
            this.element.from = lastStatement as FromStatement;
        }
    }

    protected createStatements(): BizQueryTableStatements {
        return new BizQueryTableStatements(undefined);
    }

    scan(space: Space): boolean {
        let ok = true;
        space = new BizQuerySpace(space, this.element);
        const { from, props, params } = this.element;
        if (this.element.statement.pelement.scan(space) === false) {
            ok = false;
            return ok;
        }
        if (from === undefined || from.type !== 'from') {
            this.log(`FROM must be the last statement in QUERY`);
            ok = false;
        }
        else {
            const coll: { [col: string]: boolean } = {};
            for (let col of from.cols) {
                let { ui, field } = col;
                if (ui !== null) {
                    let bud = field.getBud();
                    if (bud === undefined) {
                        this.log(`Bud can not be undefined`);
                        ok = false;
                    }
                    else {
                        let { name } = bud;
                        if (coll[name] === true) {
                            this.log(`duplicate ${name} in columns`);
                            ok = false;
                        }
                        else {
                            coll[name] = true;
                        }
                        if (this.element.hasParam(name) === true) {
                            this.log(`column ${name} duplicate with parameter`);
                            ok = false;
                        }
                        props.set(name, bud);
                    }
                }
            }
        }
        for (let param of params) {
            props.set(param.name, param);
        }
        if (this.scanBuds(space, props) === false) ok = false;
        return ok;
    }
}

export class PBizQueryValue extends PBizQuery<BizQueryValue> {
    protected readonly keyColl = {};
    protected _parse(): void {
        let statements = new BizQueryValueStatements(undefined);
        statements.level = 0;
        this.context.createStatements = statements.createStatements;
        this.context.parseElement(statements);
        this.element.statement = statements;
        this.parseOn();
    }
    protected parseOn() {
        if (this.ts.isKeyword('on') === false) return;
        let on: string[] = [];
        this.ts.readToken();
        if (this.ts.token === Token.LPARENTHESE) {
            this.ts.readToken();
            for (; ;) {
                on.push(this.ts.passVar());
                if (this.ts.token === Token.COMMA as any) {
                    this.ts.readToken();
                    continue;
                }
                if (this.ts.token === Token.RPARENTHESE as any) {
                    this.ts.readToken();
                    break;
                }
                this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
            }
        }
        else {
            on.push(this.ts.passVar());
        }
        this.element.on = on;
    }
    scan(space: Space): boolean {
        let ok = true;
        space = new BizQuerySpace(space, this.element);
        if (this.element.statement.pelement.scan(space) === false) {
            ok = false;
        }
        return ok;
    }
}

export class PBizQueryValueStatements extends PStatements {
    protected statementFromKey(parent: Statement, key: string): Statement {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'return': return new PutStatement(parent);
        }
    }
}

export class PBizQueryTableStatements extends PStatements {
    protected statementFromKey(parent: Statement, key: string): Statement {
        switch (key) {
            default: return super.statementFromKey(parent, key);
            case 'from': return new FromStatement(parent);
        }
    }
}

class BizQuerySpace extends Space {
    private readonly query: BizQuery
    constructor(outer: Space, query: BizQuery) {
        super(outer);
        this.query = query;
    }
    protected _getEntityTable(name: string): Entity & Table {
        return;
    }
    protected _getTableByAlias(alias: string): Table {
        return;
    }
    protected _varPointer(name: string, isField: boolean): Pointer {
        if (isField === true) return;
        if (this.query.hasParam(name) === true) {
            return new VarPointer();
        }
    }
}
