"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPendingWrite = void 0;
const space_1 = require("../space");
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const statement_1 = require("./statement");
class PPendingWrite extends statement_1.PStatement {
    constructor(write, context) {
        super(write, context);
        this.write = write;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.expect('pending名称');
        }
        this.pendingName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.isKeyword('as') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.ts.expect('table aliase');
            }
            this.write.alias = this.ts.lowerVar;
            this.ts.readToken();
        }
        switch (this.ts.token) {
            default:
                this.ts.expectToken(tokens_1.Token.ADD, tokens_1.Token.SUB, tokens_1.Token.EQU);
                return;
            case tokens_1.Token.ADD:
                this.write.act = '+';
                break;
            case tokens_1.Token.SUB:
                this.write.act = '-';
                break;
            case tokens_1.Token.EQU:
                this.write.act = '=';
                break; // 直接设值
        }
        this.ts.readToken();
        if (this.write.act === '+') {
            this.ts.assertToken(tokens_1.Token.LPARENTHESE);
            this.ts.readToken();
            this.parseFieldVals();
            if (this.ts.isKeyword('to') === true) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.VAR)
                    this.ts.expectToken(tokens_1.Token.VAR);
                this.write.idVar = this.ts.lowerVar;
                this.ts.readToken();
            }
            return;
        }
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            this.parseFieldVals();
        }
        if (this.ts.isKeyword('at') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR)
                this.ts.expectToken(tokens_1.Token.VAR);
            let idExp = new il_1.ValueExpression();
            idExp.parser(this.context).parse();
            this.write.idExp = idExp;
        }
        if (this.ts.token !== tokens_1.Token.VAR)
            return;
        if (this.ts.varBrace === true)
            return;
        let { lowerVar } = this.ts;
        if (lowerVar === 'del') {
            this.ts.readToken();
            this.write.doneAction = 'del';
        }
        else if (lowerVar === 'done') {
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.VAR && this.ts.varBrace === false) {
                switch (this.ts.lowerVar) {
                    case 'del':
                        this.ts.readToken();
                        this.write.doneAction = 'del';
                        break;
                    case 'red':
                        this.ts.readToken();
                        this.write.doneAction = 'red';
                        break;
                    case 'cancel':
                        this.ts.readToken();
                        this.write.doneAction = 'cancel';
                        break;
                }
            }
        }
        else {
            this.ts.expect('done');
        }
        if (this.ts.isKeyword('if') === true) {
            this.ts.readToken();
            let cmp = this.write.doneIf = new il_1.CompareExpression();
            let parser = cmp.parser(this.context);
            parser.parse();
        }
    }
    parseFieldVals() {
        let ret = this.write.set;
        for (;;) {
            if (this.ts.token !== tokens_1.Token.VAR)
                this.ts.expectToken(tokens_1.Token.VAR);
            let name = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token === tokens_1.Token.COLON)
                this.ts.readToken();
            let val = new il_1.ValueExpression();
            let parser = val.parser(this.context);
            parser.parse();
            ret.push({
                col: name,
                field: undefined,
                value: val
            });
            if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                continue;
            }
            this.ts.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
        }
    }
    scan(space) {
        let ok = true;
        let { idVar, set, idExp, act, doneIf: delIf } = this.write;
        let entity = space.getEntityTable(this.pendingName);
        if (entity === undefined) {
            this.log(this.pendingName + ' 没有定义');
            ok = false;
            return ok;
        }
        if (entity.type !== 'pending') {
            this.log(this.pendingName + ' 不是pending');
            ok = false;
        }
        if (idVar !== undefined) {
            let idPointer = this.write.idPointer = space.varPointer(idVar, undefined);
            if (idPointer === undefined) {
                this.log(idVar + ' is not defined');
                ok = false;
            }
        }
        if (idExp !== undefined) {
            if (idExp.pelement.scan(space) === false)
                ok = false;
        }
        let pending = this.write.pending = entity;
        /*
        if (fieldVals !== undefined) {
            let mySpace = space;
            if (act === '-') {
                mySpace = new PendingSpace(space, this.write);
            }
            for (let i in fieldVals) {
                let f = pending.fields.find(v => v.name === i);
                if (f === undefined) {
                    this.log(i + ' 不是pending' + pendingName + '的字段');
                    ok = false;
                }
                let val = fieldVals[i];
                if (val.pelement.scan(mySpace) === false) ok = false;
            }
        }
        */
        let theSpace = space;
        if (act === '-') {
            theSpace = new PendingSpace(space, this.write);
        }
        for (let s of set) {
            let { col, value } = s;
            let field = pending.getField(col);
            if (field === undefined) {
                ok = false;
                this.log(`pending ${this.pendingName} 不存在字段 ${col}`);
            }
            else {
                s.field = field;
            }
            if (value.pelement.scan(theSpace) === false)
                ok = false;
        }
        if (delIf !== undefined) {
            let mySpace = new PendingSpace(space, this.write);
            delIf.pelement.scan(mySpace);
        }
        return ok;
    }
}
exports.PPendingWrite = PPendingWrite;
class PendingSpace extends space_1.Space {
    constructor(outer, pendingWrite) {
        super(outer);
        this._groupType = il_1.GroupType.Both;
        this.pendingWrite = pendingWrite;
    }
    get groupType() { return this._groupType; }
    set groupType(value) { this._groupType = value; }
    _getEntityTable(name) {
        return;
    }
    _getTableByAlias(alias) {
        if (alias !== this.pendingWrite.alias)
            return;
        return this.pendingWrite.pending;
    }
    _varPointer(name, isField) {
        let ft = this.pendingWrite.pending;
        if (ft === undefined)
            return;
        if (isField === false) {
            if (this.pendingWrite.alias !== undefined)
                return undefined;
        }
        return ft.fieldPointer(name);
    }
}
//# sourceMappingURL=pendingWrite.js.map