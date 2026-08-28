export interface Token {
    type: TokenType;
    value: string;
    line: number;
}

export enum TokenType {
    Mais,
    Menos,
    Multiplicacao,
    Divisao,
    Modulo,
    DivisaoInteira,
    Exponenciacao,
    Concatenacao,

    Nao,

    ComparatorOperator,

    Assignment,

    Number,
    Identifier,
    StringLiteral,

    Whitespace,

    LParen, // (
    RParen, // )
    LColch, // [
    RColch, // ]
    LChave, // {
    RChave, // }

    DoisPontos,
    Virgula,
    Ponto,

    Aspas,

    EOL,
    EOF,

    Var,
    Int,
    Texto,
    RealWord,
    Logico,
    Se,
    Senao,
    Para,
    De,
    Faca,
    Enquanto,
    Repita,
    Ate,
    Funcao,
    Retorna,
    Classe,
    Construtor,
    Privado,
    Protegido,
    Publico,
    Novo,
    Converter,
    Extende,
    Global,
    Escolha,
    Caso,
}
const reservedWordsObj = {
    var: TokenType.Var,
    // int: TokenType.Int,
    // texto: TokenType.Texto,
    // real: TokenType.RealWord,
    // logico: TokenType.Logico,
    global: TokenType.Global,

    se: TokenType.Se,
    senao: TokenType.Senao,

    para: TokenType.Para,
    de: TokenType.De,
    faca: TokenType.Faca,
    faça: TokenType.Faca,

    enquanto: TokenType.Enquanto,
    repita: TokenType.Repita,
    ate: TokenType.Ate,
    até: TokenType.Ate,

    funcao: TokenType.Funcao,
    funçao: TokenType.Funcao,
    funcão: TokenType.Funcao,
    função: TokenType.Funcao,
    retorna: TokenType.Retorna,

    classe: TokenType.Classe,
    // "construtor": TokenType.Construtor,
    // "privado": TokenType.Privado,
    // "protegido": TokenType.Protegido,
    // "publico": TokenType.Publico,
    novo: TokenType.Novo,

    converta: TokenType.Converter,
    extende: TokenType.Extende,

    escolha: TokenType.Escolha,
    caso: TokenType.Caso,
};

export const reservedWords = new Map<string, TokenType>(Object.entries(reservedWordsObj));

const binOps = { '+': TokenType.Mais, '-': TokenType.Menos, '*': TokenType.Multiplicacao, '/': TokenType.Divisao, '%': TokenType.Modulo, '//': TokenType.DivisaoInteira, '^': TokenType.Exponenciacao, '..': TokenType.Concatenacao };

const binaryOperators = new Map<string, TokenType>(Object.entries(binOps));

const comparatorOperators = ['==', '>=', '<=', '>', '<', '~='];

const assign = '=';

const endOfLine = [';', '\n'];

const openAndClose: { [id: string]: TokenType } = { '(': TokenType.LParen, ')': TokenType.RParen, '[': TokenType.LColch, ']': TokenType.RColch, '{': TokenType.LChave, '}': TokenType.RChave, ':': TokenType.DoisPontos, ',': TokenType.Virgula };

const unaryOperators: { [id: string]: TokenType } = { '~': TokenType.Nao, '-': TokenType.Menos };

function isBinaryOperator(str: string): TokenType | undefined {
    return binaryOperators.get(str);
}

function isEndOfLine(str: string) {
    return endOfLine.includes(str);
}

function isAssign(str: string): boolean {
    return str == assign;
}

//I wanna rework this function to be in line with most lexers out there, I want it to take the array as a reference and make changes to it,
function checkForComparators(line: number) {
    const curr = current();
    const two = curr + peek();
    let discard = 0;
    for (const comparator of comparatorOperators) {
        if (two == comparator) {
            tokens.push(token(two, TokenType.ComparatorOperator, line));
            discard = 2;
            break;
        } else if (curr == comparator) {
            tokens.push(token(curr, TokenType.ComparatorOperator, line));
            discard = 1;
            break;
        }
    }
    shift(discard);
}

function isOpeningOrClosing(str: string) {
    return openAndClose[str] != null;
}

function isLetter(str: string): boolean {
    str = str.toLowerCase();
    return /[a-zA-Zçãé]/.test(str);
}

function isNumber(str: string): boolean {
    return /^\d+$/.test(str);
}

function isComentario(str: string): boolean {
    return '--'.includes(str);
}

function isPonto(str: string): boolean {
    return '.'.includes(str);
}

function isReal(str: string): boolean {
    return isNumber(str) || (str ? str.includes('.') : false);
}

function isAspas(str: string): boolean {
    return '"'.includes(str);
}

function isWhiteSpace(str: string): boolean {
    return /\s/.test(str);
}

function isReservedWord(str: string): boolean {
    return reservedWords.has(str.toLowerCase());
}

function token(value: string, type: TokenType, line: number): Token {
    return { value, type, line };
}

function current(): string {
    return src[0];
}

function peek(): string {
    return src[1];
}

function shift(n: number) {
    for (let i = 0; i < n; i++) {
        src.shift();
    }
}

export let src = [] as string[];
export let tokens = new Array<Token>();

export function tokenize(sourceCode: string): Token[] {
    src = sourceCode.split('');
    tokens = [];
    let lineNumber = 1;

    //run til end of source code
    while (src.length > 0) {
        let testStr = src[0];
        if (testStr == '/') {
            testStr += src[1];

            const binOp = isBinaryOperator(src[0]);
            if (isBinaryOperator(testStr)) {
                tokens.push(token(testStr, TokenType.DivisaoInteira, lineNumber));
                for (let i = 0; i < testStr.length; i++) {
                    src.shift();
                }
                continue;
            } else if (binOp) {
                tokens.push(token(src[0], binOp, lineNumber));
                src.shift();
                continue;
            }
        }
        if (isPonto(testStr)) {
            testStr += src[1];

            if (isBinaryOperator(testStr)) {
                tokens.push(token(testStr, TokenType.Concatenacao, lineNumber));
                src.shift();
                src.shift();
                continue;
            } else {
                tokens.push(token(testStr, TokenType.Ponto, lineNumber));
                src.shift();
                continue;
            }
        }
        if (testStr == '-') {
            testStr += src[1];
            if (isComentario(testStr)) {
                while (!isEndOfLine(src[0]) && src.length > 0) {
                    src.shift();
                }
                lineNumber++;
                src.shift();
                if (src.length > 0) {
                    continue;
                } else {
                    break;
                }
            }
        }

        const binOp = isBinaryOperator(testStr);
        if (binOp != undefined) {
            tokens.push(token(src[0], binOp, lineNumber));
            src.shift();
            continue;
        }

        if (isOpeningOrClosing(src[0])) {
            tokens.push(token(src[0], openAndClose[src[0]], lineNumber));
            src.shift();
            continue;
        }

        checkForComparators(lineNumber);

        const unOp = unaryOperators[src[0]];
        if (unOp) {
            tokens.push(token(src[0], unOp, lineNumber));
            src.shift();
            continue;
        }

        if (isAssign(src[0])) {
            tokens.push(token(src[0], TokenType.Assignment, lineNumber));
            src.shift();
            continue;
        }
        if (isEndOfLine(src[0])) {
            if (match('\n')) lineNumber++;
            tokens.push(token(src[0], TokenType.EOL, lineNumber));
            src.shift();
            continue;
        }
        if (isWhiteSpace(src[0])) {
            //tokens.push(token(src[0],TokenType.Whitespace));
            src.shift();
            continue;
        }
        //Time to deal with multichar things

        //deal with integer numbers and real numbers
        if (isReal(src[0])) {
            let number = '';
            while (src.length > 0 && isReal(src[0])) {
                number += src[0];
                src.shift();
            }
            let ttype = TokenType.Number;
            if (number.includes('.')) ttype = TokenType.Number;
            tokens.push(token(number, ttype, lineNumber));
            continue;
        }

        if (isAspas(src[0])) {
            let text = '';
            src.shift(); //eat the "
            while (src.length > 0 && !isAspas(src[0])) {
                text += src[0];
                src.shift();
            }
            if (src.length == 0) {
                throw { text: 'Aspas não fechadas', line: lineNumber } as lexerError;
            }
            src.shift(); //eat the last "
            tokens.push(token(text, TokenType.StringLiteral, lineNumber));
            continue;
        }

        //deal with string literal
        if (isLetter(src[0])) {
            let text = '';
            while (src.length > 0 && isLetter(src[0])) {
                text += src[0];
                src.shift();
            }
            if (isReservedWord(text)) {
                const type = reservedWords.get(text) as TokenType;
                tokens.push(token(text, type, lineNumber));
            } else if (text != '') {
                tokens.push(token(text, TokenType.Identifier, lineNumber));
            }
            continue;
        }
    }

    tokens.push(token('EOF', TokenType.EOF, lineNumber));
    return tokens;
}

function match(str: string): boolean {
    return current() == str;
}

export interface lexerError {
    text: string;
    line: number;
}
