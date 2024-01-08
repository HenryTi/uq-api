"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcA = void 0;
const Proc_1 = require("./Proc");
class ProcA extends Proc_1.Proc {
    constructor() {
        super(...arguments);
        this.name = 'A';
        this.body = `
(db VARCHAR(200), site BIGINT, atomPhrase VARCHAR(200), base BIGINT, keys0 VARCHAR(500), ex VARCHAR(200))
BEGIN
    DECLARE b INT;
END;
`;
    }
}
exports.ProcA = ProcA;
//# sourceMappingURL=ProcA.js.map