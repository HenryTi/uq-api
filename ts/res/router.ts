import * as fs from 'fs';
import * as path from 'path';
import { Router } from "express";
import * as multer from 'multer';
// import { getResDbRunner } from './resDb';
import { env } from '../tool';
import { getDbs } from '../core';

export const router: Router = Router({ mergeParams: true });

export function initResPath() {
    let dbs = getDbs();
    let { resFilesPath } = env;

    if (resFilesPath === undefined) {
        resFilesPath = path.resolve('../res-files');
    }
    if (fs.existsSync(resFilesPath) === false) {
        fs.mkdirSync(resFilesPath);
    }
    let uploadPath = resFilesPath + '/upload/';

    let upload = multer({ dest: uploadPath });

    router.get('/hello', (req, res) => {
        res.end('hello! ' + req.method + '#' + req.originalUrl);
    });

    router.get('/path/:resId', (req, res) => {
        let resId: string = req.params['resId'];
        let p = path.resolve(resFilesPath, resId.replace('-', '/'));
        res.end('res path: ' + p);
    });

    router.get('/:resId', (req, res) => {
        let resId: string = req.params['resId'];
        let p = path.resolve(resFilesPath, resId.replace('-', '/'));
        res.setHeader('Cache-Control', 'max-age=31557600');
        let d = new Date;
        res.setHeader('Expires', new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()).toUTCString());
        res.sendFile(p);
    });

    router.post('/upload', (req, res) => {
        let s = req.body;
        let reqHandler = upload.any();
        reqHandler(req, res, async function (err?: any) {
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
            let id = ret[0][0].id;
            let dir = String(Math.floor(id / 10000));
            let file = String(10000 + (id % 10000)).substring(1);
            let dirPath = resFilesPath + '/' + dir;
            if (fs.existsSync(dirPath) === false) {
                fs.mkdirSync(dirPath);
            }
            let pos = (originalname as string).lastIndexOf('.');
            let suffix: string;
            if (pos >= 0) suffix = (originalname as string).substring(pos);
            let toPath = dirPath + '/' + file + suffix;
            await copyFile(path, toPath);
            res.json({
                ok: true,
                res: { id: dir + '-' + file + suffix }
            });
            return;
        });
    });

    async function copyFile(from: string, to: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let source = fs.createReadStream(from);
            let dest = fs.createWriteStream(to);
            source.on('end', function () { /* copied */ resolve(); });
            source.on('error', function (err: any) { /* error */ reject(err); });
            source.pipe(dest);
        });
    }
}

