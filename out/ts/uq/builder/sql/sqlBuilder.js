"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientBuilder = exports.SqlBuilder = exports.userParamName = exports.unitFieldName = void 0;
exports.unitFieldName = '$unit';
exports.userParamName = '$user';
class SqlBuilder {
    constructor(factory) {
        this._sql = '';
        this._l = '';
        this._tab = 0;
        this._nAuto = -1;
        this._seps = [];
        this.isBuildingTable = false; // 正在编译状态，生成table的行值, $unit=0, $user=0
        this.lineLen = 60;
        this.tabLen = 2;
        this.fieldValue0 = false;
        this.isBuildingTable;
        this.factory = factory;
        this.twProfix = this.factory.dbContext.twProfix;
    }
    setIsBuildingTable() { this.isBuildingTable = true; }
    var$unit() {
        if (this.isBuildingTable === false)
            this.var('$unit');
        else
            this.append(0);
        return this;
    }
    var$user() {
        if (this.isBuildingTable === false)
            return this.var('$user');
        return this.append(0);
    }
    get sql() { if (this._l.length > 0) {
        this._sql += this._l;
        this._l = '';
    } return this._sql; }
    get pos() { return this._l.length; }
    pushFieldValue0(is0) {
        if (this.fieldValue0Stack === undefined) {
            this.fieldValue0Stack = [];
        }
        this.fieldValue0Stack.push(this.fieldValue0);
        this.fieldValue0 = is0;
    }
    popFieldValue0() {
        if (this.fieldValue0Stack === undefined || this.fieldValue0Stack.length === 0) {
            throw new Error('no fieldValue0 pushed');
        }
        this.fieldValue0 = this.fieldValue0Stack.pop();
    }
    append(str) { this._l += str; return this; }
    appendIf(cond, str) { if (cond === true)
        this._l += str; return this; }
    string(str) { this._l += '\''; this._l += str; this._l += '\''; return this; }
    tab(tab) { this._tab = tab; this._l += ' '.repeat(tab * this.tabLen); return this; }
    nTab(inc = 0) { this.n(); this._l += ' '.repeat((this._tab + inc) * this.tabLen); return this; }
    nAuto() {
        if (this.pos > this.lineLen)
            this.nTab(1);
        else {
            this.space();
            this._nAuto = this.pos;
        }
        return this;
    }
    n() {
        if (this._nAuto > 0) {
            if (this.pos > this.lineLen) {
                this._sql += this._l.substring(0, this._nAuto) + '\n';
                this._l = ' '.repeat((this._tab + 1) * this.tabLen) + this._l.substring(this._nAuto);
            }
            this._nAuto = -1;
        }
        this._sql += this._l + '\n';
        this._l = '';
        return this;
    }
    sepStart(delimiter = ', ') {
        this._seps.push({ d: this._delimiter, s: this._sep });
        this._delimiter = delimiter;
        this._sep = undefined;
        return this;
    }
    sep() {
        if (this._sep !== undefined)
            this.append(this._sep);
        else
            this._sep = this._delimiter;
        return this;
    }
    sepEnd() {
        let r = this._seps.pop();
        this._delimiter = r.d;
        this._sep = r.s;
        return this;
    }
    ln() { this._l += ';', this.n(); return this; }
    space() { this._l += ' '; return this; }
    exp(exp) { if (exp !== undefined)
        exp.to(this); return this; }
    l() { this._l += '('; return this; } // (
    r() { this._l += ')'; return this; } // )
    dot() { this._l += '.'; return this; } // .
    comma() { this._l += ','; return this; } // ,
    semicolon() { this._l += ';'; return this; } // ,
    alias(alias) { this._l += alias; return this; } // alias
    aliasDot(alias) { if (alias !== undefined)
        this._l += alias + '.'; return this; } // alias.
    fld(f) { this.append('`').append(f).append('`'); return this; }
    param(p) { this.append(p); return this; } // proc parameter
    var(p) { this.append(p); return this; } // proc var
    collate(collate) { if (collate) {
        this.append(' COLLATE ').append(collate);
    } return this; }
    ;
    exists(select) { this.append('exists('); select.to(this, 0); this.r(); return this; }
    key(key) { this.space().append(key).space(); return this; }
    name(name) { this.append('`').append(name).append('`'); return this; }
    dbName() { this.append('`').append(this.factory.dbContext.dbName).append('`'); return this; }
    entityTable(name) { this.append('`').append(name).append('`'); return this; } // entity table
    entityTableName(name) { this.append(name); return this; } // entity table
    idType(idSize) {
        if (this.hasUnit === true) {
            this.append('BIG');
        }
        else {
            switch (idSize) {
                default:
                case '': break;
                case 'big':
                    this.append('BIG');
                    break;
                case 'small':
                    this.append('SMALL');
                    break;
                case 'tiny':
                    this.append('TINY');
                    break;
            }
        }
        this.append('INT');
    }
    // datatypes
    id(id) {
        let { idSize } = id;
        this.idType(idSize);
    }
    textId(id) {
        this.append('INT');
    }
    /*
    tagDataType(tagDataType: il.TagDataType):void {
        this.append('SMALLINT');
    }
    */
    of(of) {
        let { idSize } = of;
        this.idType(idSize);
    }
    dec(dec) { this.append('DECIMAL').l().append(dec.precision).comma().append(dec.scale).r(); }
    tinyInt() { this.append('TINYINT'); }
    smallInt() { this.append('SMALLINT'); }
    int() { this.append('INT'); }
    bigInt() { this.append('BIGINT'); }
    float() { this.append('FLOAT'); }
    double() { this.append('DOUBLE'); }
    date() { this.append('DATE'); }
    time() { this.append('TIME'); }
    dateTime(dt) { this.append('DATETIME').l().append(dt.precision).r(); }
    json() { this.append('JSON'); }
    char(char) {
        this.append('VARCHAR').l().append(char.size).r();
    }
    bin(bin) { this.append('VARBINARY').l().append(bin.size).r(); }
    text(dt) {
        this.append(dt.size).append('TEXT');
    }
    timestamp() { this.append('TIMESTAMP'); }
    func(func, isUqFunc) {
        if (isUqFunc === true) {
            func = this.twProfix + func;
            this.dbName().dot().name(func.toUpperCase());
        }
        else {
            this.append(func.toUpperCase());
        }
    }
    funcParams(params) {
        this.l();
        this.sepStart();
        for (let p of params)
            this.sep().exp(p);
        this.sepEnd().r();
    }
}
exports.SqlBuilder = SqlBuilder;
class ClientBuilder extends SqlBuilder {
}
exports.ClientBuilder = ClientBuilder;
//# sourceMappingURL=sqlBuilder.js.map