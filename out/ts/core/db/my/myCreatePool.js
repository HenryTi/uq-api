"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myCreatePool = void 0;
const mysql2_1 = require("mysql2");
const fieldTypes = {};
function myCreatePool(poolOptions) {
    const options = Object.assign({}, poolOptions, {
        typeCast: function (field, next) {
            const { type } = field;
            if (fieldTypes[type] === undefined) {
                fieldTypes[type] = type;
            }
            switch (type) {
                case "DECIMAL":
                case "NEWDECIMAL":
                    let value = field.string();
                    return (value === null) ? null : Number(value);
                case 'DATE':
                    return field.string();
            }
            return next();
        }
    });
    return (0, mysql2_1.createPool)(options);
}
exports.myCreatePool = myCreatePool;
//# sourceMappingURL=myCreatePool.js.map