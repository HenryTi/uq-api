"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserX = void 0;
const centerApi_1 = require("../centerApi");
const tool_1 = require("../../tool");
const userxCache = new tool_1.Cache(3, 10);
async function buildUserX(runner, to, busOwner, busName, face) {
    // runner 可以做本地数据库缓存，不一定每次都到中央服务器获取，减轻中央服务器压力
    let results = await centerApi_1.centerApi.userxBusFace(to, busOwner, busName, face);
    return results;
}
async function getUserX(runner, to, bus, busOwner, busName, face) {
    // 如果发给指定用户
    // unit为指定service id，并且为负数
    let faceUserX;
    let userXArr;
    let busUserX = userxCache.get(to);
    if (busUserX === undefined) {
        busUserX = {};
        userxCache.set(to, busUserX);
    }
    faceUserX = busUserX[bus];
    if (faceUserX === undefined) {
        faceUserX = busUserX[bus] = {};
    }
    userXArr = faceUserX[face];
    if (userXArr === undefined) {
        userXArr = await buildUserX(runner, to, busOwner, busName, face);
        faceUserX[face] = userXArr;
    }
    return userXArr.map(v => -v.service);
}
exports.getUserX = getUserX;
//# sourceMappingURL=getUserX.js.map