"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBizTie = void 0;
const Base_1 = require("./Base");
class PBizTie extends Base_1.PBizEntity {
    constructor() {
        super(...arguments);
        this.parseI = () => {
            this.parseIField(this.element.i);
        };
        this.parseX = () => {
            this.parseXField(this.element.x);
        };
        this.keyColl = {
            i: this.parseI,
            x: this.parseX,
        };
    }
    scan(space) {
        let ok = true;
        let { i, x } = this.element;
        if (this.scanIxField(space, i) === false)
            ok = false;
        if (this.scanIxField(space, x) === false) {
            ok = false;
        }
        else {
            if (x.atoms === undefined) {
                this.log(`TIE X can not be ME`);
                ok = false;
            }
        }
        return ok;
    }
}
exports.PBizTie = PBizTie;
//# sourceMappingURL=Tie.js.map