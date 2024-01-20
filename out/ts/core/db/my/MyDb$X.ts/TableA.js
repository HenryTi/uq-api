"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableA = void 0;
const Table_1 = require("./Table");
class TableA extends Table_1.Table {
    constructor() {
        super(...arguments);
        this.name = 'a';
        this.body = `
time TIMESTAMP(6) NOT NULL,
uq INT(10) NULL DEFAULT NULL,
unit BIGINT(19) NULL DEFAULT NULL,
subject VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
content TEXT NULL DEFAULT NULL COLLATE 'utf8mb3_general_ci',
PRIMARY KEY (time) USING BTREE
`;
    }
}
exports.TableA = TableA;
//# sourceMappingURL=TableA.js.map