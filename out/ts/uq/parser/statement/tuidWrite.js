"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PTuidWrite = void 0;
const tokens_1 = require("../tokens");
const il_1 = require("../../il");
const statement_1 = require("./statement");
class PTuidWrite extends statement_1.PStatement {
    constructor(write, context) {
        super(write, context);
        this.write = write;
    }
    _parse() {
        if (this.ts.token !== tokens_1.Token.VAR) {
            this.expect('tuid名称');
        }
        let tuidName = this.write.tuidName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token === tokens_1.Token.DOT) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR) {
                this.expect(`'${tuidName}' 的div名称`);
            }
            this.write.divName = this.ts.lowerVar;
            this.ts.readToken();
            this.ts.assertKey('of');
            this.ts.readToken();
            let of = this.write.of = new il_1.ValueExpression();
            let parser = of.parser(this.context);
            parser.parse();
        }
        if (this.ts.isKeyword('into') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR)
                this.expect('into变量名');
            this.write.into = this.ts.lowerVar;
            this.ts.readToken();
        }
        else if (this.ts.isKeyword('flag') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.VAR)
                this.expect('flag变量名');
            this.write.into = this.ts.lowerVar;
            this.write.isFlagInto = true;
            this.ts.readToken();
        }
        if (this.ts.isKeyword('id') === true) {
            this.ts.readToken();
            let id = this.write.id = new il_1.ValueExpression();
            let parser = id.parser(this.context);
            parser.parse();
        }
        if (this.ts.isKeyword('unique') === true) {
            this.ts.readToken();
            this.parseUnique();
        }
        if (this.ts.isKeyword('set')) {
            this.ts.readToken();
            for (;;) {
                this.ts.assertToken(tokens_1.Token.VAR);
                let col = this.ts.lowerVar;
                this.ts.readToken();
                let equ;
                switch (this.ts.token) {
                    default:
                        this.ts.expectToken(tokens_1.Token.EQU, tokens_1.Token.ADDEQU, tokens_1.Token.SUBEQU);
                        break;
                    case tokens_1.Token.ADDEQU:
                        equ = il_1.SetEqu.add;
                        break;
                    case tokens_1.Token.SUBEQU:
                        equ = il_1.SetEqu.sub;
                        break;
                    case tokens_1.Token.EQU:
                        equ = il_1.SetEqu.equ;
                        break;
                }
                this.ts.readToken();
                let valueExp = new il_1.ValueExpression();
                let parser = valueExp.parser(this.context);
                parser.parse();
                this.write.set.push({ col: col, field: undefined, value: valueExp, equ: equ });
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
    }
    parseUnique() {
        let unique = this.write.unique = [];
        this.ts.assertToken(tokens_1.Token.LPARENTHESE);
        this.ts.readToken();
        for (;;) {
            let valueExp = new il_1.ValueExpression();
            let parser = valueExp.parser(this.context);
            parser.parse();
            unique.push(valueExp);
            switch (this.ts.token) {
                default:
                    this.ts.expectToken(tokens_1.Token.COMMA, tokens_1.Token.RPARENTHESE);
                    break;
                case tokens_1.Token.COMMA:
                    this.ts.readToken();
                    continue;
                case tokens_1.Token.RPARENTHESE:
                    this.ts.readToken();
                    return;
            }
        }
    }
    scan(space) {
        let ok = true;
        let { tuidName, divName, of, set, into, id: idExp, unique: writeUnique } = this.write;
        let entity = space.getEntityTable(tuidName);
        if (entity === undefined) {
            this.log(tuidName + ' 没有定义');
            ok = false;
        }
        else if (entity.type !== 'tuid') {
            this.log(tuidName + ' 不是tuid');
            ok = false;
        }
        if (entity === undefined)
            return ok;
        let tuid = this.write.tuid = entity;
        let div;
        if (divName !== undefined) {
            div = tuid.getArr(divName);
            if (div === undefined) {
                this.log(`${tuidName} 不包含 div ${divName}`);
            }
            this.write.div = div;
        }
        let { id, unique } = tuid;
        if (id === undefined) {
            if (unique === undefined) {
                ok = false;
                this.log(`tuid ${tuidName} 必须有id或者unique`);
            }
        }
        let tuidObj;
        let tuidObjName;
        if (div) {
            tuidObj = div;
            tuidObjName = `${tuid.name}.${div.name}`;
            if (of.pelement.scan(space) === false)
                ok = false;
        }
        else {
            tuidObj = tuid;
            tuidObjName = tuid.name;
        }
        for (let s of set) {
            let { col } = s;
            if (col === id.name) {
                ok = false;
                this.log('不能包含id字段');
            }
            if (div === undefined
                && unique !== undefined
                && unique.fields.findIndex(f => f.name === col) >= 0) {
                ok = false;
                this.log('不能包含unique字段');
            }
            if (s.value.pelement.scan(space) === false)
                ok = false;
            if (tuidObj.getField(col) === undefined) {
                ok = false;
                this.log(`${tuidObjName} 中没有字段 ${col}`);
            }
        }
        if (into !== undefined) {
            let pointer = space.varPointer(into, undefined);
            if (pointer === undefined) {
                ok = false;
                this.log('into ' + into + ' is not defined');
            }
            this.write.intoPointer = pointer;
        }
        if (idExp !== undefined) {
            idExp.pelement.scan(space);
        }
        else {
            for (let s of set) {
                let { equ } = s;
                if (equ === il_1.SetEqu.add || equ === il_1.SetEqu.sub) {
                    this.log(`tuid ${tuidName} set += must have id defined`);
                    ok = false;
                }
            }
        }
        if (writeUnique !== undefined) {
            if (unique === undefined) {
                ok = false;
                this.log(`tuid ${tuidName} 没有定义unique`);
            }
            else {
                let wuLen = writeUnique.length;
                let uLen = unique.fields.length;
                if (wuLen !== uLen) {
                    ok = false;
                    this.log(`tuid ${tuidName} unique has ${uLen} fields, unique used ${wuLen} unique fields`);
                }
                else {
                    for (let wu of writeUnique) {
                        if (wu.pelement.scan(space) === false)
                            ok = false;
                    }
                }
            }
        }
        return ok;
    }
}
exports.PTuidWrite = PTuidWrite;
//# sourceMappingURL=tuidWrite.js.map