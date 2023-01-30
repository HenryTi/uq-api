"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildImportRouter = void 0;
const fs = require("fs");
const multer = require("multer");
const tool_1 = require("../tool");
function buildImportRouter(router, rb) {
    router.post('/import/', async (req, res) => {
        let userToken = req.user;
        let { db, id: userId, unit } = userToken;
        let runner = await this.checkRunner(db, res);
        if (runner === undefined)
            return;
        let body = req.body;
        let { source, entity } = body;
        if (!source)
            source = '#';
        let out = true;
        function log(log) {
            if (out === false)
                return true;
            if (log === undefined)
                log = '\n';
            else
                log += '\n';
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
                let parseResult = await eachUploadSourceFile(tool_1.env.uploadPath, req.files, (fileContent, file) => {
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
exports.buildImportRouter = buildImportRouter;
var upload = (function () {
    return multer({ dest: tool_1.env.uploadPath });
})();
async function eachUploadSourceFile(uploadPath, files, callback) {
    for (let f of files) {
        let filename = uploadPath + f.filename;
        let text = await readFileAsync(filename, 'utf8');
        await callback(text, f.originalname);
        fs.unlinkSync(filename);
    }
    return undefined;
}
async function readFileAsync(filename, code) {
    return new Promise(function (resolve, reject) {
        try {
            fs.readFile(filename, code, function (err, buffer) {
                if (err)
                    reject(err);
                else
                    resolve(buffer);
            });
        }
        catch (err) {
            reject(err);
        }
    });
}
;
//# sourceMappingURL=import.js.map