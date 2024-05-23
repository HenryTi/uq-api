import { Select } from './select';
import * as il from '../../il';
import { Factory } from './factory';
import { Exp } from './exp';

export const unitFieldName = '$unit';
export const userParamName = '$user';

export abstract class SqlBuilder implements il.DataTypeBuilder {
    private _sql: string = '';
    private _l: string = '';
    private _tab: number = 0;
    private _nAuto: number = -1;
    private _delimiter: string;
    private _sep: string;
    private _seps: { d: string, s: string }[] = [];

    constructor(factory: Factory) {
        this.isBuildingTable;
        this.factory = factory;
        this.twProfix = this.factory.dbContext.twProfix;
    }
    readonly twProfix: string;
    protected isBuildingTable: boolean = false;    // 正在编译状态，生成table的行值, $unit=0, $user=0
    setIsBuildingTable() { this.isBuildingTable = true; }
    abstract get forClient(): boolean;

    var$unit(): SqlBuilder {
        if (this.isBuildingTable === false) this.var('$unit');
        else this.append(0);
        return this;
    }
    var$user(): SqlBuilder {
        if (this.isBuildingTable === false) return this.var('$user');
        return this.append(0);
    }
    readonly factory: Factory;
    get sql(): string { if (this._l.length > 0) { this._sql += this._l; this._l = ''; } return this._sql }
    get pos(): number { return this._l.length; }
    readonly lineLen = 60;
    readonly tabLen = 2;
    unit: il.Field;
    hasUnit: boolean;
    fieldValue0: boolean = false;
    private fieldValue0Stack: boolean[];

    pushFieldValue0(is0: boolean) {
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
    append(str: string | number): SqlBuilder { this._l += str; return this; }
    appendIf(cond: boolean, str: string | number): SqlBuilder { if (cond === true) this._l += str; return this; }
    string(str: string): SqlBuilder { this._l += '\''; this._l += str; this._l += '\''; return this; }
    tab(tab?: number): SqlBuilder { this._tab = tab; this._l += ' '.repeat(tab * this.tabLen); return this; }
    nTab(inc: number = 0): SqlBuilder { this.n(); this._l += ' '.repeat((this._tab + inc) * this.tabLen); return this; }
    nAuto(): SqlBuilder {
        if (this.pos > this.lineLen) this.nTab(1);
        else {
            this.space();
            this._nAuto = this.pos;
        }
        return this;
    }
    n(): SqlBuilder {
        if (this._nAuto > 0) {
            if (this.pos > this.lineLen) {
                this._sql += this._l.substring(0, this._nAuto) + '\n';
                this._l = ' '.repeat((this._tab + 1) * this.tabLen) + this._l.substring(this._nAuto);
            }
            this._nAuto = -1;
        }
        this._sql += this._l + '\n'; this._l = '';
        return this;
    }
    sepStart(delimiter: string = ', '): SqlBuilder {
        this._seps.push({ d: this._delimiter, s: this._sep });
        this._delimiter = delimiter; this._sep = undefined;
        return this;
    }
    sep(): SqlBuilder {
        if (this._sep !== undefined) this.append(this._sep);
        else this._sep = this._delimiter;
        return this;
    }
    sepEnd(): SqlBuilder {
        let r = this._seps.pop();
        this._delimiter = r.d;
        this._sep = r.s;
        return this;
    }
    ln(): SqlBuilder { this._l += ';', this.n(); return this; }
    space(): SqlBuilder { this._l += ' '; return this; }
    exp(exp: Exp): SqlBuilder { if (exp !== undefined) exp.to(this); return this; }
    l(): SqlBuilder { this._l += '('; return this; } // (
    r(): SqlBuilder { this._l += ')'; return this; } // )
    dot(): SqlBuilder { this._l += '.'; return this; } // .
    comma(): SqlBuilder { this._l += ','; return this; } // ,
    semicolon(): SqlBuilder { this._l += ';'; return this; } // ,
    alias(alias: string): SqlBuilder { this._l += alias; return this; }   // alias
    aliasDot(alias: string): SqlBuilder { if (alias !== undefined) this._l += alias + '.'; return this; } // alias.
    fld(f: string): SqlBuilder { this.append('`').append(f).append('`'); return this; }
    param(p: string): SqlBuilder { this.append(p); return this; }   // proc parameter
    var(p: string): SqlBuilder { this.append(p); return this; }   // proc var
    collate(collate: string): SqlBuilder { if (collate) { this.append(' COLLATE ').append(collate); } return this; };
    exists(select: Select): SqlBuilder { this.append('exists('); select.to(this, 0); this.r(); return this; }
    key(key: string): SqlBuilder { this.space().append(key).space(); return this; }

    name(name: string): SqlBuilder { this.append('`').append(name).append('`'); return this; }
    dbName(): SqlBuilder { this.append('`').append(this.factory.dbContext.dbName).append('`'); return this; }
    entityTable(name: string): SqlBuilder { this.append('`').append(name).append('`'); return this; }   // entity table
    entityTableName(name: string): SqlBuilder { this.append(name); return this; }   // entity table

    private idType(idSize: il.IdSize) {
        if (this.hasUnit === true) {
            this.append('BIG');
        }
        else {
            switch (idSize) {
                default:
                case '': break;
                case 'big': this.append('BIG'); break;
                case 'small': this.append('SMALL'); break;
                case 'tiny': this.append('TINY'); break;
            }
        }
        this.append('INT');
    }

    // datatypes
    id(id: il.IdDataType) {
        let { idSize } = id;
        this.idType(idSize);
    }
    textId(id: il.TextId): void {
        this.append('INT');
    }
    /*
    tagDataType(tagDataType: il.TagDataType):void {
        this.append('SMALLINT');
    }
    */
    of(of: il.Of) {
        let { idSize } = of;
        this.idType(idSize);
    }
    dec(dec: il.Dec) { this.append('DECIMAL').l().append(dec.precision).comma().append(dec.scale).r(); }
    tinyInt() { this.append('TINYINT'); }
    smallInt() { this.append('SMALLINT'); }
    int() { this.append('INT'); }
    bigInt() { this.append('BIGINT'); }
    float() { this.append('FLOAT'); }
    double() { this.append('DOUBLE'); }
    date() { this.append('DATE'); }
    time() { this.append('TIME'); }
    dateTime(dt: il.DateTime) { this.append('DATETIME').l().append(dt.precision).r(); }
    json() { this.append('JSON'); }
    char(char: il.Char) {
        this.append('VARCHAR').l().append(char.size).r();
    }
    bin(bin: il.Bin) { this.append('VARBINARY').l().append(bin.size).r(); }
    text(dt: il.Text) {
        this.append(dt.size).append('TEXT');
    }
    timestamp() { this.append('TIMESTAMP'); }

    func(func: string, isUqFunc: boolean): void {
        if (isUqFunc === true) {
            func = this.twProfix + func;
            this.dbName().dot().name(func.toUpperCase());
        }
        else {
            this.append(func.toUpperCase());
        }
    }
    funcParams(params: Exp[]) {
        this.l();
        this.sepStart();
        for (let p of params) this.sep().exp(p);
        this.sepEnd().r();
    }
}

export class ClientBuilder extends SqlBuilder {
    readonly forClient = true;

    fld(f: string): SqlBuilder { this.append(f); return this; }
}
