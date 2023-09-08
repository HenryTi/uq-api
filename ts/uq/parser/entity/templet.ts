import * as _ from 'lodash';
import { Templet } from '../../il';
import { Space } from '../space';
import { Token } from '../tokens';
import { PEntity } from './entity';

export class PTemplet extends PEntity<Templet> {
    scanDoc2(): boolean {
        return true;
    }
    protected _parse() {
        this.setName();
        let params: string[] = [];
        if (this.ts.token === Token.LPARENTHESE as any) {
            this.ts.readToken();
            for (; ;) {
                let { token } = this.ts;
                if (token === Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (token === Token.VAR) {
                    params.push(this.ts.lowerVar);
                    this.ts.readToken();
                }
                else {
                    this.expect('模板参数');
                }
                if (this.ts.token === Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
            }
        }
        this.entity.params = params;

        if (this.ts.isKeyword('subject') === true) {
            this.ts.readToken();
            if (this.ts.token !== Token.CODE) {
                this.expect('subject templet');
            }
            this.entity.subject = this.ts.text;
            this.ts.readToken();
        }

        if (this.ts.token !== Token.CODE) {
            this.expect('模板');
        }
        this.entity.code = this.ts.text;
        this.ts.readToken();
        if (this.ts.token !== Token.SEMICOLON as any) {
            this.expectToken(Token.SEMICOLON);
        }
    }

    scan(space: Space): boolean {
        let ok = true;
        let { params, subject, code } = this.entity;
        let uniquParams = _.uniq(params);
        if (uniquParams.length !== params.length) {
            this.ts.error('template parameters can not duplicate');
            ok = false;
        }
        if (subject !== undefined) {
            let subjectSections = this.sections(subject, uniquParams);
            if (subjectSections === undefined) {
                ok = false;
            }
            else {
                this.entity.subjectSections = subjectSections;
            }
        }
        let sections = this.sections(code, uniquParams);
        if (sections === undefined) {
            ok = false;
        }
        else {
            this.entity.sections = sections;
        }
        return ok;
    }

    private sections(code: string, params: string[]): string[] {
        let last = 0;
        let sections: string[] = [];
        for (; ;) {
            let p = code.indexOf('{{', last);
            if (p < 0) break;
            sections.push(code.substring(last, p));
            let pe = code.indexOf('}}', p);
            let t = code.substring(p + 2, pe);
            if (params.indexOf(t) < 0) {
                this.ts.error(t + ' is not templet parameter');
                return undefined;
            }
            sections.push(t);
            last = pe + 2;
        }
        sections.push(code.substring(last));
        return sections;
    }
}
