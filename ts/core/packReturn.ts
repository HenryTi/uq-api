interface Field {
    name: string;
    type: string;
}
interface Arr {
    name: string;
    fields: Field[];
}
const timezoneOffset = new Date().getTimezoneOffset() * 60000;
const tab = '\t';
const ln = '\n';
export function packParam(schema: any, data: any): string {
    let { fields, arrs } = schema;
    let ret: string[] = [];
    if (fields !== undefined) packRow(ret, fields, data);
    if (arrs !== undefined) {
        for (let arr of arrs) {
            let arrFields = arr.fields;
            packArr(ret, arrFields, data[arr.name]);
        }
    }
    return ret.join('');
}

export function packReturnsFromSchema(schema: any, data: any): string {
    if (schema === undefined) return;
    return packReturns(schema['returns'], data);
}

export function packReturns(returns: any[], data: any) {
    if (data === undefined) return;
    if (returns === undefined) return '';
    let ret: string[] = [];
    let len = returns.length;
    if (len === 1) {
        let fields = returns[0].fields;
        packArr(ret, fields, data);
    }
    else {
        for (let i = 0; i < len; i++) {
            let arr = returns[i];
            packArr(ret, arr.fields, data[i]);
        }
    }
    return ret.join('');
}

interface BusSchema {
    fields: Field[];
    arrs: Arr[];
}

export function packBus(schema: BusSchema, data: any): string {
    let result: string[] = [];
    if (data !== undefined) {
        let len = data.length;
        for (let i = 0; i < len; i++) packBusMain(result, schema, data[0]);
    }
    return result.join('');
}

function packBusMain(result: string[], schema: BusSchema, main: any) {
    let { fields, arrs } = schema;
    packRow(result, fields, main);
    if (arrs !== undefined && arrs.length > 0) {
        for (let arr of arrs) {
            let { name, fields } = arr;
            packArr(result, fields, main[name]);
        }
        result.push(ln);
    }
    else {
        result.push(ln, ln, ln);
    }
}

function escape(d: any, field: Field): any {
    //if (d === null) return '\b';
    if (d === null) return '';
    switch (field.type) {
        case 'bin': return d;
        case 'json': return JSON.stringify(d);
        case 'text':
            let len = d.length;
            let r = '', p = 0;
            for (let i = 0; i < len; i++) {
                let c = d.charCodeAt(i);
                switch (c) {
                    case 9: r += d.substring(p, i) + '\\t'; p = i + 1; break;
                    case 10: r += d.substring(p, i) + '\\n'; p = i + 1; break;
                }
            }
            return r + d.substring(p);
    }
    switch (typeof d) {
        default:
            if (d instanceof Date) return (d as Date).getTime() / 1000; //-timezoneOffset-timezoneOffset;
            return d;
        case 'string':
            if (field.type === 'datetime') {
                return new Date(d).getTime() / 1000;
            }
            return d;
        case 'undefined': return '';
    }
}

function packRow(result: string[], fields: Field[], data: any, exFields?: string[]) {
    let ret = '';
    let len = fields.length;
    let f: Field;
    if (len > 0) {
        f = fields[0];
        ret += escape(data[f.name], f);
    }
    for (let i = 1; i < len; i++) {
        f = fields[i];
        ret += tab + escape(data[f.name], f);
    }
    if (exFields !== undefined) {
        for (let xf of exFields) {
            ret += tab + data[xf];
        }
    }
    result.push(ret + ln);
}

export function packArr(result: string[], fields: Field[], data: any[], exFields?: string[]) {
    if (data !== undefined) {
        if (data.length === 0) {
            result.push(ln);
        }
        else {
            for (let row of data) {
                packRow(result, fields, row, exFields);
            }
        }
    }
    else {
        result.push(ln);
    }
    result.push(ln);
}

export function unpack(schema: any, data: string): any {
    let ret: any = {};
    if (schema === undefined || data === undefined) return;
    let fields = schema.fields;
    let p = 0;
    if (fields !== undefined) p = unpackRow(ret, schema.fields, data, p);
    let arrs = schema['arrs'];
    if (arrs !== undefined) {
        for (let arr of arrs) {
            p = unpackArr(ret, arr, data, p);
        }
    }
    return ret;
}

function unpackRow(ret: any, fields: Field[], data: string, p: number): number {
    let c = p, i = 0, len = data.length, fLen = fields.length;
    for (; p < len; p++) {
        let ch = data.charCodeAt(p);
        if (ch === 9) {
            let f = fields[i];
            let v = data.substring(c, p);
            ret[f.name] = to(v, f.type);
            c = p + 1;
            ++i;
            if (i >= fLen) break;
        }
        else if (ch === 10) {
            let f = fields[i];
            let v = data.substring(c, p);
            ret[f.name] = to(v, f.type);
            ++p;
            ++i;
            break;
        }
    }
    return p;
    function to(v: string, type: string): any {
        switch (type) {
            default: return v;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'bigint':
            case 'dec': return Number(v);
        }
    }
}

function unpackArr(ret: any, arr: Arr, data: string, p: number): number {
    let p0 = p;
    let vals: any[] = [], len = data.length;
    let { name, fields } = arr;
    while (p < len) {
        let ch = data.charCodeAt(p);
        if (ch === 10) {
            if (p === p0) {
                ch = data.charCodeAt(p);
                if (ch !== 10) {
                    throw new Error('upackArr: arr第一个字符是10，则必须紧跟一个10，表示整个arr的结束')
                }
                ++p;
            }
            ++p;
            break;
        }
        let val: any = {};
        vals.push(val);
        p = unpackRow(val, fields, data, p);
    }
    ret[name] = vals;
    return p;
}
