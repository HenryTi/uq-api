"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileDelEntity = void 0;
const Compiler_1 = require("./Compiler");
function compileDelEntity(runner, unit, user, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const [{ code }] = yield runner.tableFromProc('GetEntityCode', [unit, user, id]);
        const compiler = new Compiler_1.Compiler(runner, unit, user);
        try {
            yield compiler.loadBizObjects();
            compiler.parseCode(code);
            compiler.parseBiz();
            compiler.delEntity(id);
            compiler.scan();
            return yield compiler.buildDbResult();
        }
        catch (err) {
            return compiler.throwError(err);
        }
    });
}
exports.compileDelEntity = compileDelEntity;
//# sourceMappingURL=compileDelEntity.js.map