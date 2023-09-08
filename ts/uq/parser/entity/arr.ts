import { Arr } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntity } from './entity';

export class PArr extends PEntity<Arr> {
    protected saveSource() {
        this.entity.source = this.getSource();
    }

    protected _parse() {
        if (this.ts.token !== Token.VAR) {
            // this.arr.name = '$';
            this.expect('arr name');
        }
        else {
            this.setName();
        }
        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        for (; ;) {
            if (this.ts.token === Token.SHARP || this.ts.token === Token.MUL) {
                this.pushSharpField(this.parseSharpField(this.entity.fields.length));
            }
            else {
                this.parseField();
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
            }
        }
    }

    private parseField() {
        this.entity.fields.push(this.field(true));
    }

    scan(space: Space): boolean {
        let ok = super.scan(space);
        if (this.replaceSharpFields(space, this.sharpFields, this.entity.fields) === false) {
            ok = false;
        }
        return ok;
    }
}
