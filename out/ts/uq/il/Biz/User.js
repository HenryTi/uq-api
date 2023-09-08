"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BizUser = void 0;
const Entity_1 = require("./Entity");
class BizUser extends Entity_1.BizEntity {
    constructor() {
        super(...arguments);
        this.name = '$user';
        this.type = '$user';
    }
    parser(context) {
        return undefined;
    }
}
exports.BizUser = BizUser;
//# sourceMappingURL=User.js.map