"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
const db_1 = require("../db");
let Faces;
let lastHour;
function writeDataToBus(runner, face, unit, from, body) {
    return __awaiter(this, void 0, void 0, function* () {
        if (Faces === undefined) {
            Faces = {};
            let ret = yield runner.tuidGetAll(core_1.consts.Face, undefined, undefined);
            for (let row of ret) {
                let { id, str } = row;
                Faces[str] = id;
            }
        }
        let faceId = Faces[face];
        if (faceId === undefined) {
            let ret = yield runner.tuidSave(core_1.consts.Face, undefined, undefined, [undefined, face]);
            if (ret === undefined)
                return;
            if (ret.length === 0)
                return;
            let { id } = ret[0];
            if (id < 0)
                id = -id;
            faceId = id;
            Faces[face] = faceId;
        }
        let hour = Math.floor(Date.now() / (3600 * 1000));
        if (lastHour === undefined || hour > lastHour) {
            yield runner.call('$set_bus_queue_seed', ['busqueue', hour * 1000000000]);
            lastHour = hour;
        }
        yield runner.tuidSave(core_1.consts.BusQueue, unit, undefined, [undefined, unit, faceId, from, body]);
    });
}
exports.writeDataToBus = writeDataToBus;
function processBusMessage(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        // 处理 bus message，发送到相应的usq服务器
        console.log('bus:', msg);
        let runner = yield db_1.getRunner(core_1.consts.$unitx);
        let { unit, body, from, busOwner, bus, face } = msg;
        let faceUrl = busOwner + '/' + bus + '/' + face;
        yield writeDataToBus(runner, faceUrl, unit, from, body);
        /*
        if (Faces === undefined) {
            Faces = {};
            let ret = await runner.tuidGetAll(Face, undefined, undefined);
            for (let row of ret) {
                let {id, type} = row;
                Faces[type] = id;
            }
        }
        let {unit, body, busOwner, bus, face} = msg;
        let faceUrl = busOwner + '/' + bus + '/' + face;
        let faceId = Faces[faceUrl];
        if (faceId === undefined) {
             let ret = await runner.tuidSave(Face, undefined, undefined, [undefined, faceUrl]);
             faceId = ret[0].id;
             Faces[faceUrl] = faceId;
        }
    
        let hour = Math.floor(Date.now()/(3600*1000));
        if (lastHour === undefined || hour > lastHour) {
            await runner.call('$set_bus_queue_seed', ['busqueue', hour*1000000000]);
            lastHour = hour;
        }
        await runner.tuidSave(BusQueue, unit, undefined, [undefined, unit, faceId, body]);
        */
    });
}
exports.processBusMessage = processBusMessage;
//# sourceMappingURL=processBusMessage.js.map