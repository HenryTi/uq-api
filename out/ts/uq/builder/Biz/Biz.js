"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBiz = void 0;
const entity_1 = require("../entity/entity");
class BBiz extends entity_1.BEntity {
    // protected readonly bDetails: BBizBin[];
    constructor(context, entity) {
        super(context, entity);
        // this.bDetails = [];
        for (let [, value] of this.entity.bizEntities) {
            switch (value.type) {
                /*
                case 'sheet':
                    let bBizSheet = new BBizSheetOld(this.context, value as BizSheetOld);
                    this.bSheets.push(bBizSheet);
                    break;
                */
                // case 'detail':
                //let bBizDetail = new BBizBin(this.context, value as BizBin);
                //this.bDetails.push(bBizDetail);
                //break;
            }
        }
    }
    buildTables() {
        // for (let bDetail of this.bDetails) bDetail.buildTables();
    }
    buildProcedures() {
        /*
        let procName = `$biz.sheet`;
        let proc = this.context.createProcedure(procName);
        let { appObjs } = this.context;
        appObjs.procedures.push(proc);
        this.buildBizSheetProc(proc);

        let procBizSheetAct = `$biz.sheet.act`;
        let procAct = this.context.createProcedure(procBizSheetAct);
        procAct.logError = true;
        appObjs.procedures.push(procAct);
        this.buildBizSheetActProc(procAct);

        for (let bDetail of this.bDetails) bDetail.buildProcedures();
        */
    }
}
exports.BBiz = BBiz;
//# sourceMappingURL=Biz.js.map