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

export class PBizQueryTable extends PBizQuery<BizQueryTable> {
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
                this.element.params.push(bud);
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
        let statements = new BizQueryTableStatements(undefined);
        statements.level = 0;
        this.context.createStatements = statements.createStatements;
        this.context.parseElement(statements);
        this.element.statement = statements;
    }

    scan(space: Space): boolean {
        let ok = true;
        space = new BizQuerySpace(space, this.element);
        const { statement } = this.element;
        if (this.element.statement.pelement.scan(space) === false) {
            ok = false;
        }
        const { statements } = statement;
        const { length } = statements;
        if (length > 0) {
            const lastStatement = statements[length - 1];
            if (lastStatement.type !== 'from') {
                this.log(`FROM must be the last statement in QUERY`);
                ok = false;
            }
            else {
                this.element.from = lastStatement as FromStatement;
                const { props, from } = this.element;
                const coll: { [col: string]: boolean } = {};
                for (let col of from.cols) {
                    const { caption, bud } = col;
                    if (caption !== null) {
                        const { name } = bud;
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
            case 'put': return new PutStatement(parent);
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
