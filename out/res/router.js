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
exports.initResPath = exports.router = void 0;
const fs = require("fs");
const path = require("path");
const express_1 = require("express");
const multer = require("multer");
// import { getResDbRunner } from './resDb';
const tool_1 = require("../tool");
const core_1 = require("core");
exports.router = (0, express_1.Router)({ mergeParams: true });
function initResPath() {
    let { resFilesPath } = tool_1.env;
    if (resFilesPath === undefined) {
        resFilesPath = path.resolve('../res-files');
    }
    if (fs.existsSync(resFilesPath) === false) {
        fs.mkdirSync(resFilesPath);
    }
    let uploadPath = resFilesPath + '/upload/';
    let upload = multer({ dest: uploadPath });
    exports.router.get('/hello', (req, res) => {
        res.end('hello! ' + req.method + '#' + req.originalUrl);
    });
    exports.router.get('/path/:resId', (req, res) => {
        let resId = req.params['resId'];
        let p = path.resolve(resFilesPath, resId.replace('-', '/'));
        res.end('res path: ' + p);
    });
    exports.router.get('/:resId', (req, res) => {
        let resId = req.params['resId'];
        let p = path.resolve(resFilesPath, resId.replace('-', '/'));
        res.setHeader('Cache-Control', 'max-age=31557600');
        let d = new Date;
        res.setHeader('Expires', new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()).toUTCString());
        res.sendFile(p);
    });
    exports.router.post('/upload', (req, res) => {
        let s = req.body;
        let reqHandler = upload.any();
        reqHandler(req, res, function (err) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    res.json({ 'error': 'error' });
                    return;
                }
                let file0 = req.files[0];
                let { filename, originalname, mimetype } = file0;
                let path = uploadPath + filename;
                // let resDbRunner = await getResDbRunner();
                const { db$Res } = core_1.dbs;
                let ret = yield db$Res.proc('createItem', [originalname, mimetype]);
                let id = ret[0].id;
                let dir = String(Math.floor(id / 10000));
                let file = String(10000 + (id % 10000)).substring(1);
                let dirPath = resFilesPath + '/' + dir;
                if (fs.existsSync(dirPath) === false) {
                    fs.mkdirSync(dirPath);
                }
                let pos = originalname.lastIndexOf('.');
                let suffix;
                if (pos >= 0)
                    suffix = originalname.substring(pos);
                let toPath = dirPath + '/' + file + suffix;
                yield copyFile(path, toPath);
                res.json({
                    ok: true,
                    res: { id: dir + '-' + file + suffix }
                });
                return;
            });
        });
    });
    function copyFile(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let source = fs.createReadStream(from);
                let dest = fs.createWriteStream(to);
                source.on('end', function () { /* copied */ resolve(); });
                source.on('error', function (err) { /* error */ reject(err); });
                source.pipe(dest);
            });
        });
    }
}
exports.initResPath = initResPath;
//# sourceMappingURL=router.js.map