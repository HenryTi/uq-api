import { IDX, idField, IdSize } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntityWithTable } from './entity';

export class PIDX extends PEntityWithTable<IDX> {
    protected _parse() {
        this.setName();
        if (this.ts.token !== Token.LPARENTHESE as any) {
            this.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        let hasSysCreateUpdate = false;
        for (; ;) {
            switch (this.ts.lowerVar) {
                case 'id':
                    if (this.entity.id) {
                        this.error('duplicate id defined');
                    }
                    this.ts.readToken();
                    let idSize: IdSize = 'big';
                    if (this.ts.token === Token.VAR && this.ts.varBrace === false) {
                        let { lowerVar } = this.ts;
                        switch (lowerVar as any) {
                            default: this.ts.expect('small', 'big');
                            case 'small':
                            case 'big':
                            case 'tiny': idSize = lowerVar as any; break;
                        }
                        this.ts.readToken();
                    }
                    this.entity.setId(idField('id', idSize));
                    break;
                case 'index':
                    this.ts.readToken();
                    this.parseIndex();
                    break;
                case 'sys':
                    this.parseSys();
                    hasSysCreateUpdate = true;
                    break;
                default:
                    let field = this.field(undefined);
                    this.entity.fields.push(field);
                    break;
            }

            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token !== Token.RPARENTHESE as any) continue;
                this.ts.readToken();
                this.entity.permit = this.parsePermit();
                break;
            }
            else if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                this.entity.permit = this.parsePermit();
                break;
            }
            else {
                this.expectToken(Token.RPARENTHESE, Token.COMMA);
            }
        }
        if (hasSysCreateUpdate === false) {
            this.entity.stampUpdate = true;  // 对于IDX，默认有update stamp标记
        }
        if (this.ts.token === Token.ADD) {
            this.ts.readToken();
            this.parseFieldsValuesList();
        }
        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
        }
        this.ts.readToken();
    }

    scanDoc2(): boolean {
        return true;
    }

    scan(space: Space): boolean {
        let ok = super.scan(space);
        let { id, jName, permit } = this.entity;
        if (id === undefined) {
            ok = false;
            this.log(`there is no id field be defined in ${jName}`);
        }
        if (this.scanTuidFields(space, this.entity, this.entity.fields) === false) {
            ok = false;
        }
        if (this.fieldsValuesList !== undefined) {
            if (this.scanFieldsValuesList(space) === false) {
                ok = false;
            }
        }
        if (this.scanPermit(space, permit) === false) ok = false;
        return ok;
    }
}
