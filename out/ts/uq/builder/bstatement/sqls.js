"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sqls = void 0;
class Sqls {
    constructor(context, statements) {
        this.singleHeads = {};
        this.singleFoots = {};
        this.varTables = {};
        this.context = context;
        this.statements = statements !== null && statements !== void 0 ? statements : [];
    }
    push(...statement) { this.statements.push(...statement); }
    addStatements(statements) {
        if (statements === undefined)
            return;
        for (let s of statements) {
            if (s === undefined)
                continue;
            this.statements.push(s);
        }
    }
    head(statements) {
        if (statements === undefined)
            return;
        for (let s of statements) {
            let b = s.db(this.context);
            if (b === undefined)
                continue;
            let { singleKey } = b;
            if (singleKey !== undefined) {
                if (this.singleHeads[singleKey] !== true) {
                    b.singleHead(this);
                    this.singleHeads[singleKey] = true;
                }
            }
            b.head(this);
        }
        ;
    }
    foot(statements) {
        if (statements === undefined)
            return;
        for (let s of statements) {
            let b = s.db(this.context);
            if (b === undefined)
                continue;
            let { singleKey } = b;
            if (singleKey !== undefined) {
                if (this.singleFoots[singleKey] !== true) {
                    b.singleFoot(this);
                    this.singleFoots[singleKey] = true;
                }
            }
            b.foot(this);
        }
        ;
    }
    body(statements) {
        if (statements === undefined)
            return;
        for (let s of statements) {
            let b = s.db(this.context);
            if (b !== undefined)
                b.body(this);
        }
        ;
    }
    done(proc) {
        for (let i in this.varTables) {
            let vt = this.varTables[i];
            this.statements.unshift(vt);
        }
    }
}
exports.Sqls = Sqls;
//# sourceMappingURL=sqls.js.map