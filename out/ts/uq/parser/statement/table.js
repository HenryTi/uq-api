"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PTableStatement = void 0;
const tokens_1 = require("../tokens");
const PStatement_1 = require("../PStatement");
class PTableStatement extends PStatement_1.PStatement {
    constructor(table, context) {
        super(table, context);
        this.table = table;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR)
            this.expect('变量名称');
        let table = this.table.table;
        table.name = this.ts.lowerVar;
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.LPARENTHESE);
        this.ts.readToken();
        for (;;) {
            let isKey = false;
            if (this.ts.isKeyword('key')) {
                this.ts.readToken();
                isKey = true;
            }
            let field = this.field(!isKey);
            table.fields.push(field);
            if (isKey === true) {
                if (table.keys === undefined)
                    table.keys = [];
                table.keys.push(field);
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
        }
        if (this.ts.isKeyword('no') === true) {
            this.ts.readToken();
            this.ts.passKey('drop');
            this.table.noDrop = true;
        }
        this.ts.passToken(tokens_1.Token.SEMICOLON);
    }
    preScan(space) {
        let ok = true;
        let { table } = this.table;
        if (space.addTableVar(table) === false) {
            this.log('重复定义表变量 ' + table.name);
            ok = false;
        }
        if (space.varPointer(table.name, false) !== undefined) {
            this.log('重复定义变量 ' + table.name);
            ok = false;
        }
        return ok;
    }
}
exports.PTableStatement = PTableStatement;
//# sourceMappingURL=table.js.map