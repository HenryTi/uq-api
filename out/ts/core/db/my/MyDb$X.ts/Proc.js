"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proc = void 0;
class Proc {
    async build(x) {
        let { name } = x;
        let sql = `DROP PROCEDURE IF EXISTS ${name}.saveAtom;
        CREATE PROCEDURE ${name}.${this.name.toLowerCase()}${this.body};
`;
        x.sql(sql);
    }
}
exports.Proc = Proc;
//# sourceMappingURL=Proc.js.map