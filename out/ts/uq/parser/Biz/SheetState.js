"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSheetState = void 0;
const tokens_1 = require("../tokens");
const Base_1 = require("./Base");
class PSheetState extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseMain = () => {
        };
        this.parseDetail = () => {
        };
        this.parseAct = () => {
        };
        this.keyColl = {
            main: this.parseMain,
            detail: this.parseDetail,
            act: this.parseAct,
        };
    }
    parseHeader() {
        this.element.name = this.ts.token === tokens_1.Token.VAR ?
            this.ts.passVar() : '$';
        this.element.ui = this.parseUI();
    }
    scan(space) {
        let ok = true;
        return ok;
    }
}
exports.PSheetState = PSheetState;
//# sourceMappingURL=SheetState.js.map