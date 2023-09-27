"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
class Factory {
    constructor(dbContext) {
        this.func_sum = 'sum';
        this.dbContext = dbContext;
    }
    createClientBuilder() { return this.createSqlBuilder(); }
}
exports.Factory = Factory;
//# sourceMappingURL=factory.js.map