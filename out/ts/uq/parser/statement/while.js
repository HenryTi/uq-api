"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PContinueStatement = exports.PBreakStatement = exports.PWhile = void 0;
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
const expression_1 = require("../expression");
class PWhile extends PStatement_1.PStatement {
    constructor(whileLoop, context) {
        super(whileLoop, context);
        this.whileLoop = whileLoop;
    }
    _parse() {
        let condition = this.whileLoop.condition = new il_1.CompareExpression();
        let parser = condition.parser(this.context);
        parser.parse();
        let stats = this.whileLoop.statements = this.context.createStatements(this.whileLoop);
        //this.whileLoop.level = 
        //then.level = this._if.level;
        parser = stats.parser(this.context);
        parser.parse();
    }
    scan(space) {
        let ok = true;
        let expSpace = new expression_1.ExpressionSpace(space);
        let { condition, statements } = this.whileLoop;
        if (condition.pelement.scan(expSpace) === false)
            ok = false;
        if (statements.pelement.scan(space) === false)
            ok = false;
        return ok;
    }
}
exports.PWhile = PWhile;
class PBreakStatement extends PStatement_1.PStatement {
    constructor(breakStatement, context) {
        super(breakStatement, context);
        this.breakStatement = breakStatement;
    }
    _parse() {
    }
    scan(space) {
        this.breakStatement.setLoop();
        if (this.breakStatement.loop === undefined) {
            this.log('break must be in foreach');
            return false;
        }
        return true;
    }
}
exports.PBreakStatement = PBreakStatement;
class PContinueStatement extends PStatement_1.PStatement {
    constructor(continueStatement, context) {
        super(continueStatement, context);
        this.continueStatement = continueStatement;
    }
    _parse() {
    }
    scan(space) {
        this.continueStatement.setLoop();
        if (this.continueStatement.loop === undefined) {
            this.log('break must be in foreach or while');
            return false;
        }
        return true;
    }
}
exports.PContinueStatement = PContinueStatement;
//# sourceMappingURL=while.js.map