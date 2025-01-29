"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHistoryWrite = void 0;
const space_1 = require("../space");
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const PStatement_1 = require("../PStatement");
class PHistoryWrite extends PStatement_1.PStatement {
    constructor(write, context) {
        super(write, context);
        this.write = write;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.expect('history名称');
        }
        this.historyName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expect('table aliase');
            }
            this.write.alias = this.ts.lowerVar;
            this.ts.readToken();
        }
        /*
        if (this.ts.isKeyword('of')) this.ts.readToken();
        this.ts.assertToken(Token.LPARENTHESE);
        this.ts.readToken();
        for (;;) {
            let valueExp = new ValueExpression();
            this.write.of.push(valueExp);
            let parser = valueExp.parser(this.context);
            parser.parse();
            if (this.ts.token === Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
        */
        if (this.ts.isKeyword('date') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.EQU) {
                this.ts.expectToken(tokens_1.Token.EQU);
            }
            this.ts.readToken();
            let dateExp = new il_1.ValueExpression();
            let parser = dateExp.parser(this.context);
            parser.parse();
            this.write.date = dateExp;
        }
        this.ts.assertKey('set');
        this.ts.readToken();
        for (;;) {
            this.ts.assertToken(tokens_1.Token.VAR);
            let col = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.assertToken(tokens_1.Token.EQU);
            this.ts.readToken();
            let valueExp = new il_1.ValueExpression();
            let parser = valueExp.parser(this.context);
            parser.parse();
            this.write.set.push({ col: col, field: undefined, value: valueExp });
            if (this.ts.token === tokens_1.Token.SEMICOLON) {
                this.ts.readToken();
                return;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            /*
            if (this.ts.isKeyword('where')) {
                this.ts.readToken();
                let where = new CompareExpression();
                let parser = where.parser(this.context);
                parser.parse();
                this.write.where = where;
                this.ts.assertToken(Token.SEMICOLON);
                this.ts.readToken();
                return;
            }*/
        }
    }
    scan(space) {
        let ok = true;
        let { set, date } = this.write;
        let entity = space.getEntityTable(this.historyName);
        if (entity === undefined) {
            this.log(this.historyName + ' 没有定义');
            ok = false;
        }
        else if (entity.type !== 'history') {
            this.log(this.historyName + ' 不是history');
            ok = false;
        }
        let history = this.write.history = entity;
        /*
        let _of = this.write.of;
        if (_of.length !== history.keys.length) {
            this.log('write of 关键字数跟' + historyName + '的关键字数不等');
            ok = false;
        }
        for (let a of _of) {
            if (a.pelement.scan(space) === false) ok = false;
        }
        */
        if (date !== undefined) {
            if (date.pelement.scan(space) === false)
                ok = false;
        }
        let theSpace = new HistoryWriteSpace(space, this.write);
        for (let s of set) {
            let { col, value } = s;
            let field = history.getField(col);
            if (field === undefined) {
                ok = false;
                this.log(`history ${this.historyName} 不存在字段 ${col}`);
            }
            else {
                s.field = field;
            }
            if (value.pelement.scan(theSpace) === false)
                ok = false;
        }
        /*
        let where = this.write.where;
        if (where !== undefined) {
            if (where.pelement.scan(space) === false) ok = false;
        }*/
        return ok;
    }
}
exports.PHistoryWrite = PHistoryWrite;
class HistoryWriteSpace extends space_1.Space {
    constructor(outer, write) {
        super(outer);
        this._groupType = il_1.GroupType.Both;
        this.write = write;
    }
    get groupType() { return this._groupType; }
    set groupType(value) { this._groupType = value; }
    _getEntityTable(name) {
        return;
    }
    _getTableByAlias(alias) {
        return this.write.history;
    }
    _varPointer(name, isField) {
        if (isField === true)
            return this.write.history.fieldPointer(name);
    }
}
//# sourceMappingURL=historyWrite.js.map