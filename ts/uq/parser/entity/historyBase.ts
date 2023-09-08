import { Field, BigInt, SmallInt, Int, DateTime, HistoryBase, ID } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntityWithTable } from './entity';

export abstract class PHistoryBase<T extends HistoryBase> extends PEntityWithTable<T> {
    protected _parse(): boolean {
        this.setName();
        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
            let { lowerVar } = this.ts;
            if (lowerVar === 'index') {
                this.ts.readToken();
                this.parseIndex();
            }
            else {
                this.onSpecificField(lowerVar);
            }
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token !== Token.RPARENTHESE as any) continue;
                this.ts.readToken();
                break;
            }
            else if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
            else {
                this.expectToken(Token.RPARENTHESE, Token.COMMA);
                return false;
            }
        }
        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
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
            if (sheetType === undefined) this.error('定义了sheet，必须定义type');
            if (row === undefined) this.error('定义了sheet，必须定义row');
        }
    }

    // 2020-12-19
    // 去掉所有的自定义字段。由开发者自定定义。
    // 只保留最主要的date字段
    // 以后再去掉il和build里面的相关字段
    protected onSpecificField(fieldType: string) {
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

    private parseField() {
        this.entity.fields.push(this.field(true));
    }

    private defined(def: string): Field {
        let field = new Field();
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
        if (this.ts.token === Token.VAR) {
            field.parser(this.context).parse();
        }
        return field;
    }

    private parseDate() {
        if (this.entity.date !== undefined) {
            this.error('流水date字段重复定义');
        }
        let field = this.defined('date');
        field.nullable = false;
        field.dataType = new DateTime(6);
        this.entity.date = field;
    }

    private parseSheet() {
        if (this.entity.sheet !== undefined) {
            this.error('流水sheet字段重复定义');
        }
        let field = this.defined('sheet');
        if (field.dataType) {
            this.entity.fields.push(field);
        }
        else {
            field.dataType = new BigInt();
            this.entity.sheet = field;
        }
    }

    private parseSheetType() {
        if (this.entity.sheetType !== undefined) {
            this.error('流水sheetType字段重复定义');
        }
        let field = this.defined('type');
        if (field.dataType) {
            this.entity.fields.push(field);
        }
        else {
            field.dataType = new Int();
            this.entity.sheetType = field;
        }
    }

    private parseRow() {
        if (this.entity.row !== undefined) {
            this.error('流水row字段重复定义');
        }
        let field = this.defined('row');
        if (field.dataType) {
            this.entity.fields.push(field);
        }
        else {
            field.dataType = new SmallInt();
            this.entity.row = field;
        }
    }

    private parseUserInHistory() {
        if (this.entity.user !== undefined) {
            this.error('流水user字段重复定义');
        }
        let field = this.defined('user');
        if (field.dataType) {
            this.entity.fields.push(field);
        }
        else {
            field.dataType = new BigInt();
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

    scan(space: Space): boolean {
        let ok = super.scan(space);
        let { fields } = this.entity;
        if (this.scanTuidFields(space, this.entity, fields) === false) ok = false;
        return ok;
    }
}
