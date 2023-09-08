"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PTemplet = void 0;
const _ = require("lodash");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PTemplet extends entity_1.PEntity {
    scanDoc2() {
        return true;
    }
    _parse() {
        this.setName();
        let params = [];
        if (this.ts.token === tokens_1.Token.LPARENTHESE) {
            this.ts.readToken();
            for (;;) {
                let { token } = this.ts;
                if (token === tokens_1.Token.RPARENTHESE) {
                    this.ts.readToken();
                    break;
                }
                if (token === tokens_1.Token.VAR) {
                    params.push(this.ts.lowerVar);
                    this.ts.readToken();
                }
                else {
                    this.expect('模板参数');
                }
                if (this.ts.token === tokens_1.Token.COMMA) {
                    this.ts.readToken();
                    continue;
                }
            }
        }
        this.entity.params = params;
        if (this.ts.isKeyword('subject') === true) {
            this.ts.readToken();
            if (this.ts.token !== tokens_1.Token.CODE) {
                this.expect('subject templet');
            }
            this.entity.subject = this.ts.text;
            this.ts.readToken();
        }
        if (this.ts.token !== tokens_1.Token.CODE) {
            this.expect('模板');
        }
        this.entity.code = this.ts.text;
        this.ts.readToken();
        if (this.ts.token !== tokens_1.Token.SEMICOLON) {
            this.expectToken(tokens_1.Token.SEMICOLON);
        }
    }
    scan(space) {
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
    sections(code, params) {
        let last = 0;
        let sections = [];
        for (;;) {
            let p = code.indexOf('{{', last);
            if (p < 0)
                break;
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
exports.PTemplet = PTemplet;
//# sourceMappingURL=templet.js.map