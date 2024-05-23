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
exports.compileRename = void 0;
const Compiler_1 = require("./Compiler");
function compileRename(runner, unit, user, id, entityName) {
    return __awaiter(this, void 0, void 0, function* () {
        const compiler = new Compiler_1.Compiler(runner, unit, user);
        try {
            yield compiler.loadBizObjects();
            let newCode = compiler.changeName(id, entityName);
            if (newCode === undefined) {
                return {
                    hasError: true,
                    logs: ['不能改实体名，也不能新增实体'],
                };
            }
            compiler.parseBiz();
            compiler.scan();
            yield runner.call('RenameEntity', [unit, user, id, entityName, newCode]);
            return yield compiler.buildDbResult();
        }
        catch (err) {
            return compiler.throwError(err);
        }
    });
}
exports.compileRename = compileRename;
//# sourceMappingURL=compileRename.js.map