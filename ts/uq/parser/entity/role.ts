import { Role } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntity } from './entity';

export class PRole extends PEntity<Role> {
    protected _parse() {
        this.entity.name = '$role';
        this.entity.jName = '$Role';
        this.parseVersion();
        function checkOwnerAdmin(name: string) {
            switch (name) {
                case 'admin':
                case 'owner':
                    this.ts.error('admin or owner can not be role name');
                    break;
            }
        }
        if (this.ts.token !== Token.LPARENTHESE) {
            this.ts.expectToken(Token.LPARENTHESE);
        }
        this.ts.readToken();
        let { names } = this.entity;
        let { $ } = names;
        for (; ;) {
            if (this.ts.token !== Token.VAR) {
                this.error('应该是 role 的名称');
            }
            let roleName = this.ts.lowerVar;
            checkOwnerAdmin(roleName);
            this.ts.readToken();

            if (this.ts.token === Token.LPARENTHESE) {
                let subs = names[roleName];
                if (!subs) {
                    names[roleName] = subs = new Set<string>();
                }
                else if ($.has(roleName) === true) {
                    this.ts.error(`duplicate role '${roleName}`);
                }

                this.ts.readToken();
                let subName: string;
                for (; ;) {
                    if (this.ts.token as any !== Token.VAR) {
                        this.ts.expectToken(Token.VAR);
                    }
                    subName = this.ts.lowerVar;
                    checkOwnerAdmin(subName);

                    if (subs.has(subName) === true) {
                        this.ts.error(`duplicate role '${subName}`);
                    }
                    subs.add(subName);
                    this.ts.readToken();
                    if (this.ts.token === Token.COMMA as any) {
                        this.ts.readToken();
                        if (this.ts.token === Token.RPARENTHESE as any) {
                            this.ts.readToken();
                            break;
                        }
                        continue;
                    }
                    if (this.ts.token === Token.RPARENTHESE as any) {
                        this.ts.readToken();
                        break;
                    }
                    this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
                }
            }
            else {
                if ($.has(roleName) === true) {
                    this.ts.error(`duplicate role '${roleName}`);
                }
                $.add(roleName);
            }

            if (this.ts.token === Token.RPARENTHESE as any) {
                this.ts.readToken();
                break;
            }
            if (this.ts.token === Token.COMMA as any) {
                this.ts.readToken();
                if (this.ts.token === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                continue;
            }
            this.ts.expectToken(Token.COMMA, Token.RPARENTHESE);
        }
    }
    scan(space: Space): boolean {
        let ok = true;
        return ok;
    }
}
