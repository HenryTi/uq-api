"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHistory = void 0;
const historyBase_1 = require("./historyBase");
class PHistory extends historyBase_1.PHistoryBase {
    onSpecificField(fieldType) {
        switch (fieldType) {
            default:
                super.onSpecificField(fieldType);
                break;
            /*
            case 'key':
                this.ts.readToken();
                this.parseKey();
                break;
            */
        }
    }
}
exports.PHistory = PHistory;
//# sourceMappingURL=history.js.map