"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PReturnStatement = exports.PContinueStatement = exports.PBreakStatement = exports.PIf = void 0;
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const statement_1 = require("./statement");
const expression_1 = require("../expression");
class PIf extends statement_1.PStatement {
    constructor(_if, context) {
        super(_if, context);
        this._if = _if;
    }
    _parse() {
        let condition = this._if.condition = new il_1.CompareExpression();
        let parser = condition.parser(this.context);
        parser.parse();
        let then = this.context.createStatements(this._if);
        this._if.then = then;
        then.level = this._if.level;
        this.context.parseElement(then);
        // parser = then.parser(this.context);
        // parser.parse();
        while (this.ts.token === tokens_1.Token.SEMICOLON)
            this.ts.readToken();
        if (this.ts.varBrace === true)
            return;
        let { lowerVar } = this.ts;
        for (; lowerVar === 'elseif';) {
            let { elseIfs } = this._if;
            if (elseIfs === undefined) {
                this._if.elseIfs = elseIfs = [];
            }
            this.ts.readToken();
            condition = new il_1.CompareExpression();
            condition.parser(this.context).parse();
            let statements = this.context.createStatements(this._if);
            statements.level = this._if.level;
            statements.parser(this.context).parse();
            elseIfs.push({
                condition: condition,
                statements: statements,
            });
            lowerVar = this.ts.lowerVar;
        }
        if (lowerVar === 'else') {
            this.ts.readToken();
            let elseif = this._if.else = this.context.createStatements(this._if);
            elseif.level = this._if.level;
            parser = elseif.parser(this.context);
            parser.parse();
            return;
        }
    }
    scan(space) {
        let ok = true;
        let expSpace = new expression_1.ExpressionSpace(space);
        if (this._if.condition.pelement.scan(expSpace) === false)
            ok = false;
        let { then: ifThen, else: ifElse, elseIfs } = this._if;
        if (ifThen.pelement.scan(space) === false)
            ok = false;
        if (ifElse !== undefined) {
            if (ifElse.pelement.scan(space) === false)
                ok = false;
        }
        elseIfs === null || elseIfs === void 0 ? void 0 : elseIfs.forEach(elseIf => {
            let { condition, statements } = elseIf;
            if (condition.pelement.scan(space) === false)
                ok = false;
            if (statements.pelement.scan(space) === false)
                ok = false;
        });
        return ok;
    }
}
exports.PIf = PIf;
class PBreakStatement extends statement_1.PStatement {
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
class PContinueStatement extends statement_1.PStatement {
    constructor(continueStatement, context) {
        super(continueStatement, context);
        this.continueStatement = continueStatement;
    }
    _parse() {
    }
    scan(space) {
        this.continueStatement.setLoop();
        if (this.continueStatement.loop === undefined) {
            this.log('break must be in foreach');
            return false;
        }
        return true;
    }
}
exports.PContinueStatement = PContinueStatement;
class PReturnStatement extends statement_1.PStatement {
    constructor(returnStatement, context) {
        super(returnStatement, context);
        this.returnStatement = returnStatement;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.SEMICOLON) {
            let exp = new il_1.ValueExpression();
            exp.parser(this.context).parse();
            this.returnStatement.exp = exp;
        }
    }
    scan(space) {
        let ok = true;
        let { exp } = this.returnStatement;
        if (exp) {
            let expSpace = new expression_1.ExpressionSpace(space);
            if (exp.pelement.scan(expSpace) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PReturnStatement = PReturnStatement;
//# sourceMappingURL=if.js.map