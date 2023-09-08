"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHistoryBase = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PHistoryBase extends entity_1.PEntityWithTable {
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
                this.onSpecificField(lowerVar);
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
        /*
        if (this.history.keys.length === 0) {
            this.error('必须至少一个key字段');
        }*/
        if (this.entity.date === undefined) {
            this.error('必须定义date字段');
        }
        if (this.entity.fields.length === 0) {
            this.error('必须至少一个普通字段');
        }
        let { sheet, sheetType, row } = this.entity;
        if (sheet === undefined) {
            this.entity.sheetType = undefined;
            this.entity.row = undefined;
        }
        else {
            if (sheetType === undefined)
                this.error('定义了sheet，必须定义type');
            if (row === undefined)
                this.error('定义了sheet，必须定义row');
        }
    }
    // 2020-12-19
    // 去掉所有的自定义字段。由开发者自定定义。
    // 只保留最主要的date字段
    // 以后再去掉il和build里面的相关字段
    onSpecificField(fieldType) {
        switch (fieldType) {
            default:
                this.parseField();
                break;
            case 'date':
                this.ts.readToken();
                this.parseDate();
                break;
            // 还有用，先保留
            case 'sheet':
                this.ts.readToken();
                this.parseSheet();
                break;
            case 'type':
                this.ts.readToken();
                this.parseSheetType();
                break;
            case 'row':
                this.ts.readToken();
                this.parseRow();
                break;
            case 'user':
                this.ts.readToken();
                this.parseUserInHistory();
                break;
        }
    }
    parseField() {
        this.entity.fields.push(this.field(true));
    }
    defined(def) {
        let field = new il_1.Field();
        /*
        let name:string;
        if (this.ts.token === Token.VAR) {
            name = this.ts.lowerVar;
            this.ts.readToken();
        }
        else {
            name = def;
        }
        */
        field.name = def;
        if (this.ts.token === tokens_1.Token.VAR) {
            field.parser(this.context).parse();
        }
        return field;
    }
    parseDate() {
        if (this.entity.date !== undefined) {
            this.error('流水date字段重复定义');
        }
        let field = this.defined('date');
        field.nullable = false;
        field.dataType = new il_1.DateTime(6);
        this.entity.date = field;
    }
    parseSheet() {
        if (this.entity.sheet !== undefined) {
            this.error('流水sheet字段重复定义');
        }
        let field = this.defined('sheet');
        if (field.dataType) {
            this.entity.fields.push(field);
        }
        else {
            field.dataType = new il_1.BigInt();
            this.entity.sheet = field;
        }
    }
    parseSheetType() {
        if (this.entity.sheetType !== undefined) {
            this.error('流水sheetType字段重复定义');
        }
        let field = this.defined('type');
        if (field.dataType) {
            this.entity.fields.push(field);
        }
        else {
            field.dataType = new il_1.Int();
            this.entity.sheetType = field;
        }
    }
    parseRow() {
        if (this.entity.row !== undefined) {
            this.error('流水row字段重复定义');
        }
        let field = this.defined('row');
        if (field.dataType) {
            this.entity.fields.push(field);
        }
        else {
            field.dataType = new il_1.SmallInt();
            this.entity.row = field;
        }
    }
    parseUserInHistory() {
        if (this.entity.user !== undefined) {
            this.error('流水user字段重复定义');
        }
        let field = this.defined('user');
        if (field.dataType) {
            this.entity.fields.push(field);
        }
        else {
            field.dataType = new il_1.BigInt();
            this.entity.user = field;
        }
        /*
        let field = new Field();
        let name:string = 'user';
        field.name = name;
        field.parser(this.context).parse();
        */
        /*
        field.dataType = new Id();
        if (this.ts.token === Token.VAR) {
            this.ts.readToken();
            if (this.ts.token === Token.VAR) {
                this.ts.readToken();
            }
        }
        */
        //this.entity.user = field;
    }
    /*
    private parseUnit() {
        if (this.entity.unit !== undefined) {
            this.error('流水unit字段重复定义');
        }
        let field = this.defined('unit');
        field.dataType = new Int();
        this.entity.unit = field;
    }
    */
    scan(space) {
        let ok = super.scan(space);
        let { fields } = this.entity;
        if (this.scanTuidFields(space, this.entity, fields) === false)
            ok = false;
        return ok;
    }
}
exports.PHistoryBase = PHistoryBase;
//# sourceMappingURL=historyBase.js.map