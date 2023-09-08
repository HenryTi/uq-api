import { Pending, Field, BigInt, TinyInt, DateTime, TimeStamp } from '../../il';
import { PContext } from '../pContext';
import { Token } from '../tokens';
import { PEntityWithTable } from './entity';

export class PPending extends PEntityWithTable<Pending> {
    protected _parse(): boolean {
        this.setName();
        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
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
                    this.parseId(); break;
                case 'done':
                    this.parseDone(); break;
                case 'key':
                    this.ts.readToken();
                    this.parseKey();
                    break;
                case 'date':
                    this.ts.readToken();
                    this.parseDate();
                    break;
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

    private parseDate() {
        //if (this.entity.date !== undefined) {
        //    this.error('流水date字段重复定义');
        //}
        let field = new Field();
        field.name = 'date';
        if (this.ts.token === Token.VAR) {
            field.parser(this.context).parse();
        }
        else {
            field.nullable = true;
            field.dataType = new DateTime(6);
        }
        this.entity.fields.push(field);
        //this.entity.date = field;
    }

    private parseId() {
        this.ts.readToken();
        let field = new Field();
        field.dataType = new BigInt();
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

    private parseDone() {
        this.ts.readToken();
        let field = new Field();
        field.dataType = new TinyInt();
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

    private parseField() {
        this.entity.fields.push(this.field(true));
    }

    private parseKey() {
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
