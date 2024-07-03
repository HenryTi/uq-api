import { PElement } from '../element';
import { Space } from '../space';
import { Token } from '../tokens';
import { If, CompareExpression, BreakStatement, ContinueStatement, ReturnStatement, ValueExpression } from '../../il';
import { PStatement } from './statement';
import { ExpressionSpace } from '../expression';
import { PContext } from '../pContext';

export class PIf extends PStatement {
    _if: If;
    constructor(_if: If, context: PContext) {
        super(_if, context);
        this._if = _if;
    }

    protected _parse() {
        let condition = this._if.condition = new CompareExpression();
        let parser: PElement = condition.parser(this.context);
        parser.parse();

        let then = this.context.createStatements(this._if);
        this._if.then = then;
        then.level = this._if.level;
        this.context.parseElement(then);
        // parser = then.parser(this.context);
        // parser.parse();

        while (this.ts.token === Token.SEMICOLON) this.ts.readToken();
        if (this.ts.varBrace === true) return;
        for (; this.ts.isKeyword('elseif') === true;) {
            let { elseIfs } = this._if;
            if (elseIfs === undefined) {
                this._if.elseIfs = elseIfs = [];
            }
            this.ts.readToken();
            condition = new CompareExpression();
            condition.parser(this.context).parse();
            let statements = this.context.createStatements(this._if);
            statements.level = this._if.level;
            statements.parser(this.context).parse();
            elseIfs.push({
                condition: condition,
                statements: statements,
            });
        }
        if (this.ts.isKeyword('else') === true) {
            this.ts.readToken();
            let elseif = this._if.else = this.context.createStatements(this._if);
            elseif.level = this._if.level;
            parser = elseif.parser(this.context);
            parser.parse();
            return;
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let expSpace = new ExpressionSpace(space);
        if (this._if.condition.pelement.scan(expSpace) === false) ok = false;
        let { then: ifThen, else: ifElse, elseIfs } = this._if;
        if (ifThen.pelement.scan(space) === false) ok = false;
        if (ifElse !== undefined) {
            if (ifElse.pelement.scan(space) === false) ok = false;
        }
        elseIfs?.forEach(elseIf => {
            let { condition, statements } = elseIf;
            if (condition.pelement.scan(space) === false) ok = false;
            if (statements.pelement.scan(space) === false) ok = false;
        });
        return ok;
    }
}

export class PBreakStatement extends PStatement {
    private breakStatement: BreakStatement;
    constructor(breakStatement: BreakStatement, context: PContext) {
        super(breakStatement, context);
        this.breakStatement = breakStatement;
    }

    protected _parse() {
    }

    scan(space: Space): boolean {
        this.breakStatement.setLoop();
        if (this.breakStatement.loop === undefined) {
            this.log('break must be in foreach');
            return false;
        }
        return true;
    }
}

export class PContinueStatement extends PStatement {
    private continueStatement: ContinueStatement;
    constructor(continueStatement: ContinueStatement, context: PContext) {
        super(continueStatement, context);
        this.continueStatement = continueStatement;
    }

    protected _parse() {
    }

    scan(space: Space): boolean {
        this.continueStatement.setLoop();
        if (this.continueStatement.loop === undefined) {
            this.log('break must be in foreach');
            return false;
        }
        return true;
    }
}

export class PReturnStatement extends PStatement {
    private returnStatement: ReturnStatement;
    constructor(returnStatement: ReturnStatement, context: PContext) {
        super(returnStatement, context);
        this.returnStatement = returnStatement;
    }

    protected _parse() {
        if (this.ts.token !== Token.SEMICOLON) {
            let exp = new ValueExpression();
            exp.parser(this.context).parse();
            this.returnStatement.exp = exp;
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { exp } = this.returnStatement;
        if (exp) {
            let expSpace = new ExpressionSpace(space);
            if (exp.pelement.scan(expSpace) === false) ok = false;
        }
        return ok;
    }
}
