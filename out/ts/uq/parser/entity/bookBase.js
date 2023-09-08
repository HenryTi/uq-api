"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBookBase = void 0;
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PBookBase extends entity_1.PEntityWithTable {
    afterDefine() { }
    _parse() {
        this.setName();
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (;;) {
            let { lowerVar } = this.ts;
            if (lowerVar === 'index') {
                this.ts.readToken();
                this.parseIndex();
            }
            else {
                this.parseField(lowerVar);
            }
            /*
            switch (this.ts.lowerVar) {
                case 'key':
                    this.ts.readToken();
                    this.parseKey();
                    break;
                default:
                    this.parseField();
                    break;
            }*/
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
            }
        }
        this.afterDefine();
        if (this.ts.token !== tokens_1.Token.SEMICOLON) {
            this.expectToken(tokens_1.Token.SEMICOLON);
        }
        this.ts.readToken();
        if (this.entity.keys.length === 0) {
            this.error('必须至少一个key字段');
        }
        /*
        if (this.book.fields.length === 0) {
            this.error('必须至少一个普通字段');
        }*/
    }
    parseKey() {
        let field;
        field = this.field(false);
        if (field.nullable === undefined) {
            field.nullable = false;
        }
        else if (field.nullable === true) {
            this.error('key字段不可以null');
        }
        this.entity.keys.push(field);
    }
    parseField(lowerVar) {
        switch (lowerVar) {
            case 'key':
                this.ts.readToken();
                this.parseKey();
                break;
            default:
                this.entity.fields.push(this.field(true));
                //this.parseField();
                break;
        }
    }
    scan(space) {
        let ok = super.scan(space);
        let { keys, fields } = this.entity;
        if (keys.length === 0) {
            ok = false;
            this.log('book must have key field');
        }
        if (this.scanTuidFields(space, this.entity, [...keys, ...fields]) === false)
            ok = false;
        return ok;
    }
    scan2(uq) {
        let ok = super.scan2(uq);
        let { keys, fields } = this.entity;
        if (fields === undefined) {
            debugger;
        }
        if (this.scanOwnerFields(this.entity, [...keys, ...fields]) === false) {
            ok = false;
        }
        return ok;
    }
}
exports.PBookBase = PBookBase;
//# sourceMappingURL=bookBase.js.map