"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initResPath = exports.router = void 0;
const fs = require("fs");
const path = require("path");
const express_1 = require("express");
const multer = require("multer");
// import { getResDbRunner } from './resDb';
const tool_1 = require("../tool");
const core_1 = require("../core");
exports.router = (0, express_1.Router)({ mergeParams: true });
function initResPath() {
    let dbs = (0, core_1.getDbs)();
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
        reqHandler(req, res, async function (err) {
            if (err) {
                res.json({ 'error': 'error' });
                return;
            }
            let file0 = req.files[0];
            let { filename, originalname, mimetype } = file0;
            let path = uploadPath + filename;
            // let resDbRunner = await getResDbRunner();
            const { db$Res } = dbs;
            let ret = await db$Res.proc('createItem', [originalname, mimetype]);
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
            await copyFile(path, toPath);
            res.json({
                ok: true,
                res: { id: dir + '-' + file + suffix }
            });
            return;
        });
    });
    async function copyFile(from, to) {
        return new Promise((resolve, reject) => {
            let source = fs.createReadStream(from);
            let dest = fs.createWriteStream(to);
            source.on('end', function () { /* copied */ resolve(); });
            source.on('error', function (err) { /* error */ reject(err); });
            source.pipe(dest);
        });
    }
}
exports.initResPath = initResPath;
//# sourceMappingURL=router.js.map