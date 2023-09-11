import { Router, Response, Request } from 'express';
import * as fs from 'fs';
import * as multer from 'multer';
import { User, RouterBuilder } from './routerBuilder';
import { env } from '../tool';

export function buildImportRouter(router: Router, rb: RouterBuilder) {
    router.post('/import/', async (req: Request, res: Response) => {
        let userToken: User = (req as any).user;
        let { db, id: userId, unit } = userToken;
        let runner = await this.checkRunner(db, res);
        if (runner === undefined) return;
        let body = (req as any).body;
        let { source, entity } = body;
        if (!source) source = '#';

        let out = true;
        function log(log?: string): boolean {
            if (out === false) return true;
            if (log === undefined) log = '\n';
            else log += '\n';
            if (res.write(log) === false) {
                throw 'response error';
            }
            return true;
        }

        upload.any()(req, res, async function (err) {
            if (err) {
                res.json({ 'error': 'error' });
                return;
            }
            try {
                let parseResult = await eachUploadSourceFile(env.uploadPath, req.files, (fileContent: string, file: string) => {
                    try {
                        res.write('parsing ' + file + '\r\n');
                        res.write(fileContent);
                        //uqUpdator.parse(fileContent, file);
                    }
                    catch (err) {
                        res.write('parse error ' + JSON.stringify(err));
                    }
                });
            }
            catch (err) {
                log('import error: ');
                log(err);
            }
            finally {
                res.end();
            }
        });
    });
}

var upload = (function () {
    return multer({ dest: env.uploadPath });
})();

async function eachUploadSourceFile(uploadPath: string, files: any, callback: (fileContent: string, file: string) => void): Promise<string> {
    for (let f of files as Express.Multer.File[]) {
        let filename = uploadPath + f.filename;
        let text = await readFileAsync(filename, 'utf8');
        await callback(text, f.originalname);
        fs.unlinkSync(filename);
    }
    return undefined;
}
async function readFileAsync(filename?: string, code?: BufferEncoding) {
    return new Promise<string>(function (resolve, reject) {
        try {
            fs.readFile(filename, code, function (err, buffer) {
                if (err) reject(err); else resolve(buffer);
            });
        } catch (err) {
            reject(err);
        }
    });
};
