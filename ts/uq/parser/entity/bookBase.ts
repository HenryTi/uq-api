import { BookBase, Field, Uq } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntityWithTable } from './entity';

export abstract class PBookBase<T extends BookBase> extends PEntityWithTable<T> {
    protected afterDefine(): void { }

    protected _parse() {
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
            }
        }
        this.afterDefine();
        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
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

    private parseKey() {
        let field: Field;
        field = this.field(false);
        if (field.nullable === undefined) {
            field.nullable = false;
        }
        else if (field.nullable === true) {
            this.error('key字段不可以null');
        }
        this.entity.keys.push(field);
    }

    protected parseField(lowerVar: string) {
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

    scan(space: Space): boolean {
        let ok = super.scan(space);
        let { keys, fields } = this.entity;
        if (keys.length === 0) {
            ok = false;
            this.log('book must have key field');
        }
        if (this.scanTuidFields(space, this.entity, [...keys, ...fields]) === false) ok = false;
        return ok;
    }

    scan2(uq: Uq): boolean {
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
