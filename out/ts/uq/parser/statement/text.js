"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PTextStatement = void 0;
const tokens_1 = require("../tokens");
const PStatement_1 = require("../PStatement");
class PTextStatement extends PStatement_1.PStatement {
    constructor(text, context) {
        super(text, context);
        this.text = text;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR)
            this.expect('变量名称');
        this.text.textVar = this.ts.lowerVar;
        this.ts.readToken();
        this.text.sep = this.parseDilimiter('sep');
        this.text.ln = this.parseDilimiter('ln');
        this.ts.assertKey('into');
        this.ts.readToken();
        this.tableName = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.SEMICOLON);
        this.ts.readToken();
    }
    parseDilimiter(d) {
        if (this.ts.isKeyword(d) !== true)
            return;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.EQU) {
            this.ts.expectToken(tokens_1.Token.EQU);
        }
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.STRING) {
            this.ts.expectToken(tokens_1.Token.STRING);
        }
        let ret = this.ts.text;
        this.ts.readToken();
        return ret;
    }
    setTableName(tableName) { this.tableName = tableName; }
    scan(space) {
        let ok = true;
        let tv = space.getTableVar(this.tableName);
        if (tv === undefined) {
            this.log('没有定义表变量 ' + this.tableName);
            ok = false;
        }
        this.text.tableVar = tv;
        let no = space.newStatementNo();
        this.text.setNo(no++);
        space.setStatementNo(no);
        return ok;
    }
}
exports.PTextStatement = PTextStatement;
//# sourceMappingURL=text.js.map