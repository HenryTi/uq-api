"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPending = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PPending extends entity_1.PEntityWithTable {
    _parse() {
        this.setName();
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (;;) {
            let { lowerVar } = this.ts;
            switch (lowerVar) {
                default:
                    this.parseField();
                    break;
                case 'index':
                    this.ts.readToken();
                    this.parseIndex();
                    break;
                case 'id':
                    this.parseId();
                    break;
                case 'done':
                    this.parseDone();
                    break;
                case 'key':
                    this.ts.readToken();
                    this.parseKey();
                    break;
                case 'date':
                    this.ts.readToken();
                    this.parseDate();
                    break;
            }
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.RPARENTHESE)
                    continue;
                this.ts.readToken();
                break;
            }
            else if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                break;
            }
            else {
                this.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
                return false;
            }
        }
        if (this.ts.token !== tokens_1.Token.SEMICOLON) {
            this.expectToken(tokens_1.Token.SEMICOLON);
        }
        this.ts.readToken();
        if (this.entity.id === undefined) {
            this.error('必须定义id字段');
            return false;
        }
        else {
            this.entity.keyFields.push(this.entity.id);
        }
        if (this.entity.keyFields.length === 0) {
            this.error('PENDING必须定义key字段');
            return false;
        }
        return true;
    }
    parseDate() {
        //if (this.entity.date !== undefined) {
        //    this.error('流水date字段重复定义');
        //}
        let field = new il_1.Field();
        field.name = 'date';
        if (this.ts.token === tokens_1.Token.VAR) {
            field.parser(this.context).parse();
        }
        else {
            field.nullable = true;
            field.dataType = new il_1.DateTime(6);
        }
        this.entity.fields.push(field);
        //this.entity.date = field;
    }
    parseId() {
        this.ts.readToken();
        let field = new il_1.Field();
        field.dataType = new il_1.BigInt();
        field.autoInc = true;
        let n = this.ts.lowerVar;
        if (n === undefined) {
            n = 'id';
        }
        else {
            this.ts.readToken();
        }
        field.name = n;
        field.nullable = false;
        this.entity.id = field;
        this.entity.fields.push(field);
    }
    parseDone() {
        this.ts.readToken();
        let field = new il_1.Field();
        field.dataType = new il_1.TinyInt();
        let n = this.ts.lowerVar;
        if (n === undefined) {
            n = 'done';
        }
        else {
            this.ts.readToken();
        }
        field.name = n;
        field.nullable = false;
        field.defaultValue = '0'; // 0: pending, 1: done, -1: cancelled, -2: red
        this.entity.done = field;
        this.entity.fields.push(field);
        this.entity.keyFields.push(field);
    }
    parseField() {
        this.entity.fields.push(this.field(true));
    }
    parseKey() {
        let field = this.field(false);
        if (field.nullable === undefined) {
            field.nullable = false;
        }
        else if (field.nullable === true) {
            this.error('key字段不可以null');
        }
        this.entity.fields.push(field);
        this.entity.keyFields.push(field);
    }
}
exports.PPending = PPending;
//# sourceMappingURL=pending.js.map