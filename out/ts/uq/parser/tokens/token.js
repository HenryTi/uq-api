"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
var Token;
(function (Token) {
    Token[Token["NONE"] = -1] = "NONE";
    Token[Token["_FINISHED"] = 0] = "_FINISHED";
    Token[Token["ADD"] = 1] = "ADD";
    Token[Token["SUB"] = 2] = "SUB";
    Token[Token["MUL"] = 3] = "MUL";
    Token[Token["DIV"] = 4] = "DIV";
    Token[Token["MOD"] = 5] = "MOD";
    Token[Token["XOR"] = 6] = "XOR";
    Token[Token["BITWISEAND"] = 7] = "BITWISEAND";
    Token[Token["BITWISEOR"] = 8] = "BITWISEOR";
    Token[Token["OR"] = 9] = "OR";
    Token[Token["AND"] = 10] = "AND";
    Token[Token["NOT"] = 11] = "NOT";
    Token[Token["GT"] = 12] = "GT";
    Token[Token["GE"] = 13] = "GE";
    Token[Token["LT"] = 14] = "LT";
    Token[Token["LE"] = 15] = "LE";
    Token[Token["NE"] = 16] = "NE";
    Token[Token["EQU"] = 17] = "EQU";
    Token[Token["DOT"] = 18] = "DOT";
    Token[Token["COMMA"] = 19] = "COMMA";
    Token[Token["COLON"] = 20] = "COLON";
    Token[Token["SEMICOLON"] = 21] = "SEMICOLON";
    Token[Token["AT"] = 22] = "AT";
    Token[Token["DOLLAR"] = 23] = "DOLLAR";
    Token[Token["LPARENTHESE"] = 24] = "LPARENTHESE";
    Token[Token["RPARENTHESE"] = 25] = "RPARENTHESE";
    Token[Token["LBRACE"] = 26] = "LBRACE";
    Token[Token["RBRACE"] = 27] = "RBRACE";
    Token[Token["NUM"] = 28] = "NUM";
    Token[Token["VAR"] = 29] = "VAR";
    Token[Token["HEX"] = 30] = "HEX";
    Token[Token["REM"] = 31] = "REM";
    Token[Token["STRING"] = 32] = "STRING";
    Token[Token["ADDEQU"] = 33] = "ADDEQU";
    Token[Token["SUBEQU"] = 34] = "SUBEQU";
    Token[Token["LBRACKET"] = 35] = "LBRACKET";
    Token[Token["RBRACKET"] = 36] = "RBRACKET";
    Token[Token["SHARP"] = 37] = "SHARP";
    Token[Token["CODE"] = 38] = "CODE";
    Token[Token["DOLLARVAR"] = 39] = "DOLLARVAR";
    Token[Token["BITWISEINVERT"] = 40] = "BITWISEINVERT";
    Token[Token["DoubleGT"] = 41] = "DoubleGT";
    Token[Token["DoubleLS"] = 42] = "DoubleLS";
    Token[Token["QuestionEQU"] = 43] = "QuestionEQU";
    Token[Token["COLONEQU"] = 61] = "COLONEQU";
    Token[Token["SubGT"] = 62] = "SubGT";
    Token[Token["COLONCOLON"] = 63] = "COLONCOLON";
    Token[Token["Exclamation"] = 66] = "Exclamation";
    Token[Token["ChinsePunctuation"] = 98] = "ChinsePunctuation";
    Token[Token["Memo"] = 99] = "Memo";
})(Token || (exports.Token = Token = {}));
//# sourceMappingURL=token.js.map