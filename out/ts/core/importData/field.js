"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Field = void 0;
const __1 = require("..");
class Field {
    static create(runner, schema, fieldName, header, source) {
        let field;
        let schemaField = schema.fields.find(v => v.name === fieldName);
        if (schemaField === undefined) {
            let keys = schema.keys;
            if (keys === undefined)
                return;
            schemaField = keys.find(v => v.name === fieldName);
            if (schemaField === undefined)
                return;
        }
        let { name, type } = schemaField;
        switch (type) {
            default: return;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'dec':
                field = Field.createNumberField(name, type);
                break;
            case 'char':
                field = Field.createCharField(name, type);
                break;
            case 'bigint':
                let tuid = schemaField.tuid;
                if (tuid !== undefined) {
                    let tField = Field.createTuidField(name, tuid, header);
                    tField.runner = runner;
                    tField.source = source;
                    field = tField;
                }
                else {
                    field = Field.createNumberField(name, type);
                }
                break;
        }
        field.colIndex = header[name];
        return field;
    }
    static createNumberField(name, type) {
        let f = new NumberField();
        f.name = name;
        f.type = type;
        return f;
    }
    static createCharField(name, type) {
        let f = new StringField();
        f.name = name;
        f.type = type;
        return f;
    }
    static createTuidField(name, tuid, header) {
        let f = new TuidField();
        f.name = name;
        f.type = 'bigint';
        f.tuid = tuid;
        return f;
    }
    static createSpecialField(schema, fieldName, header) {
        let pos = fieldName.indexOf('@');
        if (pos < 0)
            return;
        let name = fieldName.substring(0, pos);
        let owner;
        let divUnqiue;
        if (fieldName[pos + 1] === '/') {
            owner = fieldName.substring(pos + 2);
            divUnqiue = false;
        }
        else {
            owner = fieldName.substring(pos + 1);
            divUnqiue = true;
        }
        let schemaField = schema.fields.find(v => v.name === fieldName);
        let { tuid } = schemaField;
        let f = new TuidDivField();
        f.name = name;
        f.tuid = tuid;
        f.unique = divUnqiue;
        f.owner = owner;
        return f;
    }
    static createIdField(runner, source, tuid, div) {
        let field = new IdField();
        field.source = source;
        field.tuid = tuid;
        field.div = div;
        field.runner = runner;
        return field;
    }
    static createUserField() {
        return new UserField();
    }
    static createOwnerField(schema) {
        let field = new OwnerField();
        return field;
    }
    getValue(row) { return null; }
    async getId(unit, row) {
        return undefined;
    }
}
exports.Field = Field;
class NumberField extends Field {
    getValue(row) {
        let v = row[this.colIndex];
        if (v !== undefined)
            return Number(v);
    }
}
class StringField extends Field {
    getValue(row) {
        return row[this.colIndex];
    }
}
class UserField extends Field {
    async getId(unit, row) {
        return await __1.centerApi.userIdFromName(row[this.colIndex]);
    }
}
class BaseTuidField extends Field {
}
class IdField extends BaseTuidField {
    async getId(unit, row) {
        return await this.runner.importVId(unit, undefined, this.source, this.tuid, this.div, row[this.colIndex]);
    }
}
class OwnerField extends BaseTuidField {
    async getId(unit, row) {
        return undefined;
    }
}
class TuidField extends BaseTuidField {
    async getId(unit, row) {
        return await this.runner.importVId(unit, undefined, this.source, this.tuid, undefined, row[this.colIndex]);
    }
}
class TuidDivField extends BaseTuidField {
    async getId(unit, row) {
        return undefined;
    }
}
class ImportField extends BaseTuidField {
    async getId(unit, row) {
        return undefined;
    }
}
class TuidImportField extends ImportField {
    async getId(unit, row) {
        return undefined;
    }
}
class TuidDivImportField extends ImportField {
    async getId(unit, row) {
        return undefined;
    }
}
//# sourceMappingURL=field.js.map