import { Text } from '../../../il';
import { SqlBuilder } from "../sqlBuilder";

export class MySqlBuilder extends SqlBuilder {
    entityTableName(name: string): SqlBuilder { this.append(this.twProfix).append(name); return this; }   // entity table
    entityTable(name: string): SqlBuilder { this.append('`').entityTableName(name).append('`'); return this; }   // entity table
    var(p: string): SqlBuilder { this.append('`_').append(p).append('`'); return this; }   // proc var
    fld(f: string): SqlBuilder { this.append('`').append(f).append('`'); return this; }  // field: alias.field
    param(p: string): SqlBuilder { this.var(p); return this; }   // proc parameter
    funcName(func: string): void {
        this.append(func.toUpperCase());
    }
    text(dt: Text) {
        let tSize: string;
        switch (dt.size) {
            default: tSize = ''; break;
            case 'tiny': tSize = 'TINY'; break;
            case 'medium': tSize = 'MEDIUM'; break;
            case 'long':
            case 'big': tSize = 'LONG'; break;
        }
        this.append(tSize).append('TEXT');
    }
}
