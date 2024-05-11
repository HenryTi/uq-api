"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlBuilder = void 0;
const sqlBuilder_1 = require("../sqlBuilder");
class MySqlBuilder extends sqlBuilder_1.SqlBuilder {
    constructor() {
        super(...arguments);
        this.forClient = false;
    }
    entityTableName(name) { this.append(this.twProfix).append(name); return this; } // entity table
    entityTable(name) { this.append('`').entityTableName(name).append('`'); return this; } // entity table
    var(p) { this.append('`_').append(p).append('`'); return this; } // proc var
    fld(f) { this.append('`').append(f).append('`'); return this; } // field: alias.field
    param(p) { this.var(p); return this; } // proc parameter
    text(dt) {
        let tSize;
        switch (dt.size) {
            default:
                tSize = '';
                break;
            case 'tiny':
                tSize = 'TINY';
                break;
            case 'medium':
                tSize = 'MEDIUM';
                break;
            case 'long':
            case 'big':
                tSize = 'LONG';
                break;
        }
        this.append(tSize).append('TEXT');
    }
}
exports.MySqlBuilder = MySqlBuilder;
//# sourceMappingURL=mySqlBuilder.js.map