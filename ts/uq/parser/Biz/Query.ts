import { BizQuery, BizQueryTable, BizQueryValue, BizQueryValueStatements, PutStatement, Statement } from "../../il";
import { PElement } from "../element";
import { Space } from "../space";
import { PStatements } from "../statement";
import { Token } from "../tokens";

abstract class PBizQuery<T extends BizQuery> extends PElement<T> {
}

export class PBizQueryTable extends PBizQuery<BizQueryTable> {
    protected _parse(): void {

    }
}

export class PBizQueryValue extends PBizQuery<BizQueryValue> {
    protected _parse(): void {
        let statements = new BizQueryValueStatements(undefined);
        statements.level = 0;
        this.context.createStatements = statements.createStatements;
        this.context.parseElement(statements);
        this.element.statement = statements;
        if (this.ts.isKeyword('on') === true) {
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
            return;
        }
    }
    scan(space: Space): boolean {
        let ok = true;
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
