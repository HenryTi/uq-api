"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SBuilder = void 0;
class SBuilder {
    constructor() {
        this.paramPrefix = '_';
        this.buf = '';
    }
    toString() { return this.buf; }
    add(s) { this.buf += s; return this; }
    sp() { this.buf += ' '; return this; }
    l() { this.buf += '('; return this; }
    r() { this.buf += ')'; return this; }
    lb() { this.buf += '['; return this; }
    rb() { this.buf += ']'; return this; }
    lbrace() { this.buf += '{'; return this; }
    rbrace() { this.buf += '}'; return this; }
    comma() { this.buf += ','; return this; }
    semi() { this.buf += ';'; return this; }
    ln() { this.buf += '\r\n'; return this; }
    arr(sep, ...items) { this.buf += items.join(sep); return this; }
    dataType(dt, paramPrefix) {
        this.sp();
        dt.sql(this, paramPrefix);
    }
    param(field, dt) {
        this.lb().add(this.paramPrefix).add(field.sName).rb();
        if (dt === true)
            this.dataType(field.dataType, this.paramPrefix);
        return this;
    }
    params(fields, dt) {
        let first;
        first = true;
        for (let field of fields) {
            if (first === false)
                this.buf += ',';
            else
                first = false;
            this.param(field, dt);
        }
        return this;
    }
    field(field, dt, alias) {
        if (alias !== undefined)
            this.buf += alias + '.';
        this.lb().add(field.sName).rb();
        if (dt === true)
            this.dataType(field.dataType, '');
        return this;
    }
    fields(fields, dt, alias) {
        let first;
        first = true;
        for (let field of fields) {
            if (first === false)
                this.buf += ',\n';
            else
                first = false;
            this.field(field, dt, alias);
        }
        return this;
    }
    id(id) {
        this.buf += 'id';
        let { idType, arrName } = id;
        if (idType !== undefined) {
            this.buf += ' ' + idType;
            if (arrName !== undefined)
                this.buf += '.' + arrName;
        }
    }
    textId(id) {
        this.buf += 'textid';
    }
    /*
    tagDataType(tagDataType: TagDataType) {
        this.buf += 'tag';
        let {tagType} = tagDataType;
        this.buf += ' ' + tagType;
    }
    */
    of(of, paramPrefix) {
        this.buf += 'of ' + paramPrefix + of.owner + '.' + of.arr;
    }
    dec(dec) {
        this.buf += 'dec(' + dec.precision + ',' + dec.scale + ')';
    }
    tinyInt() { this.buf += 'tinyint'; }
    smallInt() { this.buf += 'smallint'; }
    int() { this.buf += 'int'; }
    bigInt() { this.buf += 'bigint'; }
    float() { this.buf += 'float'; }
    double() { this.buf += 'double'; }
    date() { this.buf += 'date'; }
    time() { this.buf += 'time'; }
    dateTime(dt) { this.buf += 'datetime(' + dt.precision + ')'; }
    char(c) { this.buf += 'varchar(' + c.size + ')'; }
    bin(b) { this.buf += 'varbinary(' + b.size + ')'; }
    text(dt) { this.buf += dt.size + 'text'; }
    timestamp() { this.buf += 'timestamp'; }
    json() { this.buf += 'json'; }
}
exports.SBuilder = SBuilder;
//# sourceMappingURL=SBuilder.js.map