"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PQueue = void 0;
const entity_1 = require("./entity");
class PQueue extends entity_1.PEntity {
    scanDoc2() {
        return true;
    }
    _parse() {
        this.setName();
        if (this.ts.isKeyword('asc') === true) {
            this.ts.readToken();
            this.entity.orderBy = 'asc';
        }
        else if (this.ts.isKeyword('desc') === true) {
            this.ts.readToken();
            this.entity.orderBy = 'desc';
        }
        if (this.ts.isKeyword('once') === true) {
            this.ts.readToken();
            if (this.ts.isKeyword('only') === false) {
                this.ts.expect('ONLY');
            }
            this.ts.readToken();
            this.entity.onceOnly = true;
        }
        ;
    }
}
exports.PQueue = PQueue;
//# sourceMappingURL=queue.js.map