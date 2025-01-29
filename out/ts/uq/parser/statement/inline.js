"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PInlineStatement = void 0;
const PStatement_1 = require("../PStatement");
const dbTypes = ['mysql', 'mssql', 'oracle'];
class PInlineStatement extends PStatement_1.PStatement {
    constructor(inline, context) {
        super(inline, context);
        this.inline = inline;
    }
    _parse() {
        let { text } = this.ts;
        let code;
        for (let dbType of dbTypes) {
            if (text.startsWith(dbType) === true) {
                this.inline.dbType = dbType;
                let len = dbType.length;
                let pos = text.indexOf('\n', len);
                if (pos >= 0) {
                    this.inline.memo = text.substring(len, pos - 1);
                    this.inline.code = text.substring(pos + 1);
                }
                else {
                    this.inline.code = text.substring(len);
                }
                break;
            }
        }
        //this.ts.readToken();
    }
    scan(space) {
        return true;
    }
}
exports.PInlineStatement = PInlineStatement;
//# sourceMappingURL=inline.js.map