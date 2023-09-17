import { DataTypeBuilder, Field, ID, Of, Dec, DateTime, Char, DataType, Text, Bin, /*TagDataType, */IdDataType, TextId } from '../il';

export class SBuilder implements DataTypeBuilder {
    paramPrefix = '_';
    private buf: string = '';
    toString() { return this.buf }

    add(s: string) { this.buf += s; return this; }
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

    arr(sep: string, ...items: string[]) { this.buf += items.join(sep); return this; }
    dataType(dt: DataType, paramPrefix?: string) {
        this.sp();
        dt.sql(this, paramPrefix);
    }
    param(field: Field, dt: boolean) {
        this.lb().add(this.paramPrefix).add(field.sName).rb();
        if (dt === true) this.dataType(field.dataType, this.paramPrefix);
        return this;
    }
    params(fields: Field[], dt: boolean) {
        let first: boolean;
        first = true as any;
        for (let field of fields) {
            if (first === false) this.buf += ',';
            else first = false;
            this.param(field, dt);
        }
        return this;
    }
    field(field: Field, dt: boolean, alias?: string) {
        if (alias !== undefined) this.buf += alias + '.'
        this.lb().add(field.sName).rb();
        if (dt === true) this.dataType(field.dataType, '');
        return this;
    }
    fields(fields: Field[], dt: boolean, alias?: string) {
        let first: boolean;
        first = true as any;
        for (let field of fields) {
            if (first === false) this.buf += ',\n';
            else first = false;
            this.field(field, dt, alias);
        }
        return this;
    }

    id(id: IdDataType) {
        this.buf += 'id';
        let { idType, arrName } = id;
        if (idType !== undefined) {
            this.buf += ' ' + idType;
            if (arrName !== undefined) this.buf += '.' + arrName;
        }
    }
    textId(id: TextId) {
        this.buf += 'textid';
    }
    /*
    tagDataType(tagDataType: TagDataType) {
        this.buf += 'tag';
        let {tagType} = tagDataType;
        this.buf += ' ' + tagType;
    }
    */
    of(of: Of, paramPrefix?: string) {
        this.buf += 'of ' + paramPrefix + of.owner + '.' + of.arr;
    }
    dec(dec: Dec) {
        this.buf += 'dec(' + dec.precision + ',' + dec.scale + ')';
    }
    tinyInt() { this.buf += 'tinyint' }
    smallInt() { this.buf += 'smallint' }
    int() { this.buf += 'int' }
    bigInt() { this.buf += 'bigint' }
    float() { this.buf += 'float' }
    double() { this.buf += 'double' }
    date() { this.buf += 'date' }
    time() { this.buf += 'time' }
    dateTime(dt: DateTime) { this.buf += 'datetime(' + dt.precision + ')' }
    char(c: Char) { this.buf += 'varchar(' + c.size + ')' }
    bin(b: Bin) { this.buf += 'varbinary(' + b.size + ')' }
    text(dt: Text) { this.buf += dt.size + 'text' }
    timestamp() { this.buf += 'timestamp' }
    json(): void { this.buf += 'json'; }
}
