"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenStream = void 0;
const token_1 = require("./token");
const char_1 = require("./char");
class TokenStream {
    constructor(log, input, options) {
        if (options !== undefined) {
            const { bracket, isSys } = options;
            this.bracket = bracket;
            this.isSys = isSys;
        }
        this.log = log;
        this.lastP = 1;
        this.buffer = input;
        this.len = input.length;
        this.p = 0;
        this.at = 0;
        this.line = 0;
        this.advance();
    }
    getSourceAt(pos) {
        return this.buffer.substring(pos, this.lastP - 1);
    }
    getEntitySource(pos) {
        let p = this.p;
        switch (this.token) {
            default:
            case token_1.Token.SEMICOLON:
                p = this.skipSpace(this.p);
                break;
            case token_1.Token.VAR:
                p = this.skipSpace(this.lastP - 1);
                break;
        }
        let ret = this.buffer.substring(pos, p);
        return ret;
    }
    getSourceNearby(sourceAt) {
        return ' ...' + this.buffer.substring(sourceAt, sourceAt + 50) + '... ';
    }
    getSource(start, end) {
        return this.buffer.substring(start, end);
    }
    getP() {
        return this.p;
    }
    errorAt() {
        let line = this.startLine + 1;
        let charAt = this.startAt + 1;
        return this.file + ' 错误在' + line + '行' + charAt + '列: \n' + this.getSourceNearby(this.p - 1) + '\n';
    }
    error(...msg) {
        let err = this.errorAt() + msg.join('');
        this.log(err);
        throw err;
    }
    expectToken(...tokens) {
        let err = this.errorAt() + '应该是' + tokens.map(v => token_1.Token[v]).join('或');
        this.log(err);
        throw err;
    }
    expect(...msg) {
        let err = this.errorAt() + '应该是' + msg.join('或');
        this.log(err);
        throw err;
    }
    assertToken(token) {
        if (this.token !== token)
            this.expectToken(token);
    }
    passToken(token) {
        if (this.token !== token)
            this.expectToken(token);
        this.readToken();
    }
    mayPassToken(token) {
        if (this.token === token)
            this.readToken();
    }
    assertVar() {
        if (this.token !== token_1.Token.VAR) {
            if (!(this.isSys === true && this.token === token_1.Token.DOLLARVAR)) {
                this.expect('变量名');
            }
        }
    }
    assertKey(key) {
        if (this.lowerVar !== key || this.varBrace === true)
            this.expect(key);
    }
    passVar(v) {
        if (this.token !== token_1.Token.VAR) {
            if (!(this.isSys === true && this.token === token_1.Token.DOLLARVAR)) {
                this.expect('变量名');
            }
        }
        let ret = this.lowerVar;
        if (v !== undefined) {
            if (ret !== v)
                this.expect(v);
        }
        this.readToken();
        return ret;
    }
    mayPassVar() {
        if (this.token !== token_1.Token.VAR && !(this.isSys === true && this.token === token_1.Token.DOLLARVAR))
            return;
        let ret = this.lowerVar;
        this.readToken();
        return ret;
    }
    passString() {
        if (this.token !== token_1.Token.STRING) {
            this.expectToken(token_1.Token.STRING);
        }
        let ret = this.text;
        this.readToken();
        return ret;
    }
    mayPassString() {
        if (this.token !== token_1.Token.STRING)
            return;
        let ret = this.text;
        this.readToken();
        return ret;
    }
    passKey(key) {
        if (this.token !== token_1.Token.VAR || this.varBrace === true) {
            if (key === undefined)
                return;
            this.expect(key !== null && key !== void 0 ? key : 'Bizscript keyword');
        }
        let ret = this.lowerVar;
        if (key !== undefined) {
            if (ret !== key)
                this.expect(key);
        }
        this.readToken();
        return ret;
    }
    advance() {
        this.cur = (this.p >= this.len) ? char_1.Char.NULL : this.buffer.charCodeAt(this.p++);
        switch (this.cur) {
            default:
                this.at++;
                break;
            case char_1.Char.ENTER:
                this.line++;
                this.at = 1;
                if (this.p < this.len && this.buffer.charCodeAt(this.p) === char_1.Char._R) {
                    ++this.p;
                    this.cur = char_1.Char.ENTER_R;
                }
                break;
            case char_1.Char._R:
                this.line++;
                this.at = 1;
                if (this.p < this.len && this.buffer.charCodeAt(this.p) === char_1.Char.ENTER) {
                    ++this.p;
                    this.cur = char_1.Char.R_ENTER;
                }
                break;
        }
    }
    get isKeywordToken() {
        return this.token === token_1.Token.VAR && this.varBrace === false;
    }
    isKeyword(key) {
        return this.token === token_1.Token.VAR
            && (this.lowerVar === key || key === undefined)
            && this.varBrace === false;
    }
    isKeywords(...keys) {
        if (this.varBrace === true)
            return false;
        return keys.indexOf(this.lowerVar) >= 0;
    }
    showToken() {
        return token_1.Token[this.token];
    }
    peekToken() {
        let prevToken = this.prevToken;
        let cur = this.cur;
        let _var = this._var;
        let savedLowerVar = this.lowerVar;
        let lastP = this.lastP;
        let lastLineNum = this.startLine;
        let lastChatAt = this.startAt;
        let token = this.token;
        let p = this.p;
        let lineNum = this.line;
        let charAt = this.at;
        this.readToken();
        let peekToken = this.token;
        let lowerVar = this.lowerVar;
        this.prevToken = prevToken;
        this.lastP = lastP;
        this.startLine = lastLineNum;
        this.startAt = lastChatAt;
        this.token = token;
        this._var = _var;
        this.lowerVar = savedLowerVar;
        this.p = p;
        this.line = lineNum;
        this.at = charAt;
        this.cur = cur;
        return { peekToken, lowerVar };
    }
    skipSpace(p) {
        const spaces = [char_1.Char.TAB, char_1.Char.SPACE, char_1.Char.USPACE, char_1.Char._R, char_1.Char.ENTER, char_1.Char.R_ENTER, char_1.Char.ENTER_R];
        let cur = this.buffer.charCodeAt(p);
        for (;;) {
            if (cur === char_1.Char.NULL)
                break;
            if (spaces.includes(cur) === false)
                break;
            ++p;
            cur = this.buffer.charCodeAt(p);
        }
        return p;
    }
    readToken() {
        this.prevToken = this.token;
        this.lastP = this.p;
        this.prevLine = this.startLine;
        this.prevAt = this.startAt;
        this.prevLowerVar = this.lowerVar;
        this.startLine = this.line;
        this.startAt = this.at;
        this._var = undefined;
        this.lowerVar = undefined;
        this.memo = undefined;
        for (;;) {
            switch (this.cur) {
                case char_1.Char.NULL:
                    this.token = token_1.Token._FINISHED;
                    this.lastP = this.len + 1;
                    break;
                case char_1.Char.TAB:
                case char_1.Char.SPACE:
                case char_1.Char.USPACE: // 中文空格
                case char_1.Char._R:
                case char_1.Char.ENTER:
                case char_1.Char.R_ENTER:
                case char_1.Char.ENTER_R:
                    this.advance();
                    this.startLine = this.line;
                    this.startAt = this.at;
                    this.lastP = this.p;
                    continue;
                case char_1.Char.PLUS:
                    this.token = token_1.Token.ADD;
                    this.advance();
                    if (this.cur === char_1.Char.EQU) {
                        this.token = token_1.Token.ADDEQU;
                        this.advance();
                    }
                    break;
                case char_1.Char.MINUS:
                    this.advance();
                    switch (this.cur) {
                        case char_1.Char.EQU:
                            this.token = token_1.Token.SUBEQU;
                            this.advance();
                            break;
                        case char_1.Char.GT:
                            this.token = token_1.Token.SubGT;
                            this.advance();
                            break;
                        case char_1.Char.MINUS:
                            this.readLineRemark();
                            continue;
                        default:
                            this.token = token_1.Token.SUB;
                            break;
                    }
                    break;
                case char_1.Char.STAR:
                    this.token = token_1.Token.MUL;
                    this.advance();
                    break;
                case char_1.Char.DOLLAR:
                    //this.advance();
                    this.readVar();
                    if (this._var === '$')
                        this.token = token_1.Token.DOLLAR;
                    else
                        this.token = token_1.Token.DOLLARVAR;
                    break;
                case char_1.Char.AT:
                    this.token = token_1.Token.AT;
                    this.advance();
                    break;
                case char_1.Char.Tilde:
                    this.token = token_1.Token.BITWISEINVERT;
                    this.advance();
                    break;
                case char_1.Char.SLASH:
                    this.advance();
                    switch (this.cur) {
                        case char_1.Char.SLASH:
                            this.readLineRemark();
                            continue;
                        case char_1.Char.STAR:
                            this.readRemark();
                            continue;
                        case char_1.Char.MINUS:
                            this.readInlineCode();
                            break;
                        default:
                            this.token = token_1.Token.DIV;
                            break;
                    }
                    break;
                case char_1.Char.PERCENT:
                    this.token = token_1.Token.MOD;
                    this.advance();
                    break;
                case char_1.Char.LParenthese:
                    this.token = token_1.Token.LPARENTHESE;
                    this.advance();
                    break;
                case char_1.Char.RParenthese:
                    this.token = token_1.Token.RPARENTHESE;
                    this.advance();
                    break;
                case char_1.Char.LBrace:
                    this.advance();
                    this.token = token_1.Token.LBRACE;
                    break;
                case char_1.Char.RBrace:
                    this.token = token_1.Token.RBRACE;
                    this.advance();
                    break;
                case char_1.Char.SHARP:
                    this.token = token_1.Token.SHARP;
                    this.advance();
                    break;
                case char_1.Char.DOT:
                    this.token = token_1.Token.DOT;
                    this.advance();
                    break;
                case char_1.Char.COMMA:
                    this.token = token_1.Token.COMMA;
                    this.advance();
                    break;
                case char_1.Char.SEMICOLON:
                    this.token = token_1.Token.SEMICOLON;
                    this.advance();
                    break;
                case char_1.Char.COLON:
                    this.advance();
                    if (this.cur === char_1.Char.EQU) {
                        this.token = token_1.Token.COLONEQU;
                        this.advance();
                    }
                    else {
                        this.token = token_1.Token.COLON;
                    }
                    break;
                case char_1.Char.TOPANGLE:
                    this.token = token_1.Token.XOR;
                    this.advance();
                    break;
                case char_1.Char.EQU:
                    this.advance();
                    switch (this.cur) {
                        case char_1.Char.GT:
                            this.token = token_1.Token.GE;
                            this.advance();
                            break;
                        case char_1.Char.LS:
                            this.token = token_1.Token.LE;
                            this.advance();
                            break;
                        default:
                            this.token = token_1.Token.EQU;
                            break;
                    }
                    break;
                case char_1.Char.GT:
                    this.advance();
                    switch (this.cur) {
                        case char_1.Char.EQU:
                            this.token = token_1.Token.GE;
                            this.advance();
                            break;
                        case char_1.Char.LS:
                            this.token = token_1.Token.NE;
                            this.advance();
                            break;
                        case char_1.Char.GT:
                            this.token = token_1.Token.DoubleGT;
                            this.advance();
                            break;
                        default:
                            this.token = token_1.Token.GT;
                            break;
                    }
                    break;
                case char_1.Char.LS:
                    this.advance();
                    switch (this.cur) {
                        case char_1.Char.EQU:
                            this.token = token_1.Token.LE;
                            this.advance();
                            break;
                        case char_1.Char.GT:
                            this.token = token_1.Token.NE;
                            this.advance();
                            break;
                        case char_1.Char.LS:
                            this.token = token_1.Token.DoubleLS;
                            this.advance();
                            break;
                        default:
                            this.token = token_1.Token.LT;
                            break;
                    }
                    break;
                case char_1.Char.AND:
                    this.advance();
                    this.token = token_1.Token.BITWISEAND;
                    break;
                case char_1.Char.OR:
                    this.advance();
                    this.token = token_1.Token.BITWISEOR;
                    break;
                case char_1.Char.LBracket:
                    if (this.bracket === true) {
                        this.token = token_1.Token.LBRACKET;
                        this.advance();
                        break;
                    }
                    this.readSquareVar();
                    break;
                case char_1.Char.RBracket:
                    if (this.bracket === true) {
                        this.token = token_1.Token.RBRACKET;
                        this.advance();
                        break;
                    }
                    this.error("unexpected ]");
                    break;
                case char_1.Char.Exclamation:
                    this.advance();
                    this.token = token_1.Token.Exclamation;
                    break;
                case char_1.Char.Apostrophe: // '
                    this.readString(char_1.Char.Apostrophe); // 字符串
                    break;
                case char_1.Char.QUOT: // "
                    this.readString(char_1.Char.QUOT); // 字符串
                    break;
                case char_1.Char.UNDERLINE: // _
                    this.readVar();
                    //this.FindToken(toFindKeyToken);
                    break;
                default:
                    if (this.cur >= char_1.Char.ZERO && this.cur <= char_1.Char.NINE)
                        this.readNumber(this.cur - char_1.Char.ZERO);
                    else if (this.cur >= char_1.Char.a && this.cur <= char_1.Char.z ||
                        this.cur >= char_1.Char.A && this.cur <= char_1.Char.Z ||
                        this.cur >= 0x100)
                        this.readVar();
                    else if (char_1.Char.isChinesePunctuation(this.cur) === true) {
                        this.advance();
                        this.token = token_1.Token.ChinsePunctuation;
                    }
                    else {
                        this.error("PARSE_UnexpectChar");
                    }
                    break;
            }
            return;
        }
    }
    readLineRemark() {
        let start = this.p;
        while (true) {
            let end = this.p;
            this.advance();
            switch (this.cur) {
                case char_1.Char._R:
                case char_1.Char.ENTER:
                case char_1.Char.R_ENTER:
                case char_1.Char.ENTER_R:
                case char_1.Char.NULL:
                    this.memo = this.buffer.substring(start, end);
                    return;
            }
        }
    }
    readInlineCode() {
        this.token = token_1.Token.CODE;
        let start = this.p;
        let end;
        while (true) {
            end = this.p;
            this.advance();
            if (this.cur === char_1.Char.NULL)
                break;
            if (this.cur === char_1.Char.MINUS) {
                this.advance();
                if (this.cur === char_1.Char.SLASH) {
                    this.advance();
                    break;
                }
            }
        }
        this.text = this.buffer.substring(start, end);
    }
    readRemark() {
        let start = this.p;
        this.advance();
        let end;
        while (true) {
            end = this.p;
            if (this.cur === char_1.Char.NULL)
                break;
            if (this.cur === char_1.Char.STAR) {
                this.advance();
                if (this.cur == char_1.Char.SLASH) {
                    this.advance();
                    break;
                }
            }
            else {
                this.advance();
            }
        }
        this.memo = this.buffer.substring(start, end);
    }
    readSquareVar() {
        let start = this.p;
        for (;;) {
            this.advance();
            switch (this.cur) {
                case char_1.Char.NULL:
                case char_1.Char._R:
                case char_1.Char.ENTER:
                case char_1.Char.R_ENTER:
                case char_1.Char.ENTER_R:
                    this.error("PARSE_UnexpectEndVar");
                    return;
                case char_1.Char.RBracket:
                    this.token = token_1.Token.VAR;
                    this.varBrace = true;
                    this._var = this.buffer.substring(start, this.p - 1);
                    this.lowerVar = this._var.toLowerCase();
                    this.advance();
                    return;
            }
        }
    }
    readNumber(firstDigit) {
        this.dec = firstDigit;
        this.isInteger = true;
        this.advance();
        if (firstDigit == 0 && (this.cur === char_1.Char.x || this.cur === char_1.Char.X)) {
            this.token = token_1.Token.HEX;
            this.advance();
            this.text = '';
            for (;;) {
                if (this.cur >= char_1.Char.ZERO && this.cur <= char_1.Char.NINE ||
                    this.cur >= char_1.Char.a && this.cur <= char_1.Char.f ||
                    this.cur >= char_1.Char.A && this.cur <= char_1.Char.F)
                    this.text += String.fromCharCode(this.cur);
                else
                    break;
                this.advance();
            }
            return;
        }
        this.token = token_1.Token.NUM;
        for (;;) {
            if (this.cur >= char_1.Char.ZERO && this.cur <= char_1.Char.NINE) {
                this.dec = this.dec * 10 + (this.cur - char_1.Char.ZERO);
            }
            else if (this.cur === char_1.Char.DOT) {
                this.isInteger = false;
                let rate = 0.1;
                for (;;) {
                    this.advance();
                    if (this.cur >= char_1.Char.ZERO && this.cur <= char_1.Char.NINE) {
                        this.dec = this.dec + (this.cur - char_1.Char.ZERO) * rate;
                        rate /= 10;
                    }
                    else
                        return;
                }
            }
            else
                break;
            this.advance();
        }
    }
    readString(quote) {
        this.token = token_1.Token.STRING;
        let start = this.p;
        //StringBuilder sb = new StringBuilder(100);
        this.advance();
        while (true) {
            if (this.cur == char_1.Char.NULL)
                return;
            if (this.cur == quote) {
                this.text = this.buffer.substring(start, this.p - 1);
                this.advance();
                return;
            }
            if (this.cur === char_1.Char.BACKSLASH) {
                this.advance();
                if (this.cur == quote) {
                    this.advance();
                    break;
                }
                /*
                switch (this.cur)
                {
                    case Char.BACKSLASH: sb.Append(Char.BACKSLASH); this.Advance(); break;
                    case Char.T: sb.Append(Char.TAB); this.Advance(); break;
                    case Char.R: sb.Append(Char._R); this.Advance(); break;
                    case Char.N: sb.Append(Char.ENTER); this.Advance(); break;
                    default: this.ThrowException("PARSE_UnknownEscape"); break;
                }*/
                continue;
            }
            this.advance();
        }
    }
    readVar() {
        let start = this.p - 1;
        let loop = true;
        while (loop) {
            this.advance();
            if (this.cur == char_1.Char.NULL) {
                this._var = this.buffer.substring(start, this.p);
                this.lowerVar = this._var.toLowerCase();
                this.varBrace = false;
                this.token = token_1.Token.VAR;
                return;
            }
            switch (this.cur) {
                case char_1.Char.UNDERLINE:
                    break;
                default:
                    if (this.cur >= char_1.Char.ZERO && this.cur <= char_1.Char.NINE ||
                        this.cur >= char_1.Char.a && this.cur <= char_1.Char.z ||
                        this.cur >= char_1.Char.A && this.cur <= char_1.Char.Z ||
                        this.cur >= 0x100)
                        continue;
                    loop = false;
                    break;
            }
        }
        this.token = token_1.Token.VAR;
        let pVarEnd = this.p - 1;
        switch (this.cur) {
            case char_1.Char.R_ENTER:
            case char_1.Char.ENTER_R:
                --pVarEnd;
                break;
        }
        this._var = this.buffer.substring(start, pVarEnd);
        this.lowerVar = this._var.toLowerCase();
        this.varBrace = false;
    }
}
exports.TokenStream = TokenStream;
//# sourceMappingURL=tokenStream.js.map