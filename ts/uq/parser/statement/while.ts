import { PElement } from '../element';
import { Space } from '../space';
import { While, CompareExpression, BreakStatement, ContinueStatement } from '../../il';
import { PStatement } from '../PStatement';
import { ExpressionSpace } from '../expression';
import { PContext } from '../pContext';

export class PWhile extends PStatement {
    whileLoop: While;
    constructor(whileLoop: While, context: PContext) {
        super(whileLoop, context);
        this.whileLoop = whileLoop;
    }

    protected _parse() {
        let condition = this.whileLoop.condition = new CompareExpression();
        let parser: PElement = condition.parser(this.context);
        parser.parse();
        let stats = this.whileLoop.statements = this.context.createStatements(this.whileLoop);
        //this.whileLoop.level = 
        //then.level = this._if.level;
        parser = stats.parser(this.context);
        parser.parse();
    }

    scan(space: Space): boolean {
        let ok = true;
        let expSpace = new ExpressionSpace(space);
        let { condition, statements } = this.whileLoop;
        if (condition.pelement.scan(expSpace) === false) ok = false;
        if (statements.pelement.scan(space) === false) ok = false;
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
            this.log('break must be in foreach or while');
            return false;
        }
        return true;
    }
}
