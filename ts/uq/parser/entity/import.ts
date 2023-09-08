import { Import } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntity } from './entity';

export class PImport extends PEntity<Import> {
    protected _parse() {
        this.setName();
        if (this.ts.token !== Token.EQU as any) {
            this.expectToken(Token.EQU);
        }
        this.ts.readToken();
        if (this.ts.token === Token.DIV) {
            this.ts.readToken();
            this.entity.uqOwner = '$$$';
        }
        else {
            if (this.ts.token !== Token.VAR as any) {
                this.expectToken(Token.VAR);
            }
            this.entity.uqOwner = this.ts.lowerVar;
            this.ts.readToken();
            if (this.ts.token !== Token.DIV as any) {
                this.expectToken(Token.DIV);
            }
            this.ts.readToken();
        }
        if (this.ts.token !== Token.VAR as any) {
            this.expectToken(Token.VAR);
        }
        this.entity.uqName = this.ts.lowerVar;
        this.ts.readToken();
        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
        }
        this.ts.readToken();
    }

    scan(space: Space): boolean {
        let ok = true;
        return ok;
    }
}
