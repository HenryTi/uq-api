"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIDX = void 0;
const il_1 = require("../../il");
const tokens_1 = require("../tokens");
const entity_1 = require("./entity");
class PIDX extends entity_1.PEntityWithTable {
    _parse() {
        this.setName();
        if (this.ts.token !== tokens_1.Token.LPARENTHESE) {
            this.expectToken(tokens_1.Token.LPARENTHESE);
        }
        this.ts.readToken();
        let hasSysCreateUpdate = false;
        for (;;) {
            switch (this.ts.lowerVar) {
                case 'id':
                    if (this.entity.id) {
                        this.error('duplicate id defined');
                    }
                    this.ts.readToken();
                    let idSize = 'big';
                    if (this.ts.token === tokens_1.Token.VAR && this.ts.varBrace === false) {
                        let { lowerVar } = this.ts;
                        switch (lowerVar) {
                            default: this.ts.expect('small', 'big');
                            case 'small':
                            case 'big':
                            case 'tiny':
                                idSize = lowerVar;
                                break;
                        }
                        this.ts.readToken();
                    }
                    this.entity.setId((0, il_1.idField)('id', idSize));
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
            if (this.ts.token === tokens_1.Token.COMMA) {
                this.ts.readToken();
                if (this.ts.token !== tokens_1.Token.RPARENTHESE)
                    continue;
                this.ts.readToken();
                this.entity.permit = this.parsePermit();
                break;
            }
            else if (this.ts.token === tokens_1.Token.RPARENTHESE) {
                this.ts.readToken();
                this.entity.permit = this.parsePermit();
                break;
            }
            else {
                this.expectToken(tokens_1.Token.RPARENTHESE, tokens_1.Token.COMMA);
            }
        }
        if (hasSysCreateUpdate === false) {
            this.entity.stampUpdate = true; // 对于IDX，默认有update stamp标记
        }
        if (this.ts.token === tokens_1.Token.ADD) {
            this.ts.readToken();
            this.parseFieldsValuesList();
        }
        if (this.ts.token !== tokens_1.Token.SEMICOLON) {
            this.expectToken(tokens_1.Token.SEMICOLON);
        }
        this.ts.readToken();
    }
    scanDoc2() {
        return true;
    }
    scan(space) {
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
        if (this.scanPermit(space, permit) === false)
            ok = false;
        return ok;
    }
}
exports.PIDX = PIDX;
//# sourceMappingURL=IDX.js.map