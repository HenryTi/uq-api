"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBookWrite = void 0;
const space_1 = require("../space");
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
class PBookWrite extends PStatement_1.PStatement {
    constructor(write, context) {
        super(write, context);
        this.write = write;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.expect('book名称');
        }
        this.bookName = this.ts.lowerVar;
        this.hasStar = false;
        this.ts.readToken();
        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expect('table aliase');
            }
            this.write.alias = this.ts.lowerVar;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('pull') === true) {
            this.write.isPull = true;
            this.ts.readToken();
        }
        this.ts.assertKey('at');
        this.ts.readToken();
        this.ts.assertToken(tokens_1.Token.LPARENTHESE);
        this.ts.readToken();
        for (;;) {
            let valueExp;
            if (this.ts.token === tokens_1.Token.MUL) {
                this.ts.readToken();
                this.hasStar = true;
                this.write.at.push(undefined);
            }
            else {
                valueExp = new il_1.ValueExpression();
                this.write.at.push(valueExp);
                let parser = valueExp.parser(this.context);
                parser.parse();
            }
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
        }
        if (this.ts.lowerVar !== 'set')
            return;
        this.ts.assertKey('set');
        this.ts.readToken();
        for (;;) {
            this.ts.assertToken(tokens_1.Token.VAR);
            let col = this.ts.lowerVar;
            this.ts.readToken();
            let equ;
            switch (this.ts.token) {
                case tokens_1.Token.ADDEQU:
                    equ = il_1.SetEqu.add;
                    break;
                case tokens_1.Token.SUBEQU:
                    equ = il_1.SetEqu.sub;
                    break;
                case tokens_1.Token.EQU:
                    equ = il_1.SetEqu.equ;
                    break;
                default:
                    this.expectToken(tokens_1.Token.ADDEQU, tokens_1.Token.SUBEQU, tokens_1.Token.EQU);
                    break;
            }
            this.ts.readToken();
            let valueExp = new il_1.ValueExpression();
            let parser = valueExp.parser(this.context);
            parser.parse();
            this.write.set.push({ col: col, field: undefined, equ: equ, value: valueExp });
            if (this.ts.token === tokens_1.Token.SEMICOLON) {
                this.ts.readToken();
                return;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
        }
    }
    scan(space) {
        let ok = true;
        let bookName = this.bookName;
        let book;
        let entity = space.getEntityTable(bookName);
        if (entity === undefined) {
            let table = space.getLocalTable(bookName);
            if (table === undefined) {
                this.log(bookName + ' 没有定义');
                return false;
            }
            book = table;
        }
        else {
            let { type } = entity;
            if (type === 'map') {
                let ent = entity;
                if (ent.from !== undefined && !(this.write.isPull === true)) {
                    this.log(`导入的Map ${bookName}不可以直接创建和写入，只能从源拉取`);
                    ok = false;
                }
            }
            else if (type === 'book') {
                if (this.hasStar === true) {
                    this.log('BOOK 不支持 * 写入');
                    ok = false;
                }
            }
            else {
                this.log(bookName + ' 不是book也不是map');
                ok = false;
            }
            book = entity;
        }
        this.write.book = book;
        let at = this.write.at;
        if (at.length !== book.keys.length) {
            this.log('write at 关键字数跟' + bookName + '的关键字数不等');
            ok = false;
        }
        let theSpace = new BookWriteSpace(space, this.write);
        for (let a of at) {
            if (a === undefined)
                continue;
            if (a.pelement.scan(theSpace) === false)
                ok = false;
        }
        let set = this.write.set;
        for (let s of set) {
            let { col, value } = s;
            let field = book.getField(col);
            if (field === undefined) {
                ok = false;
                this.log(`book or map ${bookName} 不存在字段 ${col}`);
            }
            else {
                s.field = field;
            }
            if (value.pelement.scan(theSpace) === false)
                ok = false;
        }
        return ok;
    }
}
exports.PBookWrite = PBookWrite;
class BookWriteSpace extends space_1.Space {
    constructor(outer, bookWrite) {
        super(outer);
        this._groupType = il_1.GroupType.Both;
        this.bookWrite = bookWrite;
    }
    get groupType() { return this._groupType; }
    set groupType(value) { this._groupType = value; }
    _getEntityTable(name) {
        return;
    }
    _getTableByAlias(alias) {
        if (alias === this.bookWrite.alias)
            return this.bookWrite.book;
    }
    _varPointer(name, isField) {
        if (isField === true)
            return this.bookWrite.book.fieldPointer(name);
    }
}
//# sourceMappingURL=bookWrite.js.map