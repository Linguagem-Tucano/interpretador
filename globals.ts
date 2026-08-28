import Environment from './environment.ts';
import { BooleanVal, MK_NULL, ObjectVal, RuntimeVal } from './values.ts';
import { Function } from './function.ts';
import { ArgumentExpr, Body } from './ast.ts';
import { clearCanvas, drawImage, drawLine, drawRectangle, drawText, setColor, setLineWidth } from './main.ts';
import { appendOutput, clearOutputBuffer, flushOutputBuffer } from './interpreter.ts';

export function setupEnv(env: Environment) {
    env.declareVar('verdadeiro', { type: 'BooleanVal', value: true } as BooleanVal, 'BooleanVal');
    env.declareVar('falso', { type: 'BooleanVal', value: false } as BooleanVal, 'BooleanVal');
    env.declareVar('nulo', MK_NULL(), 'NullVal');
    const nowClock = Date.now();
    const clockFn = new Function({} as Body, []);
    clockFn.call = function (_env: Environment) {
        const ms = Date.now() - nowClock;
        return { type: 'NumberVal', value: ms / 1000 } as RuntimeVal;
    };
    env.functions.set('relogio', clockFn);

    const mathEnv = new Environment({} as Environment);
    mathEnv.declareVar('pi', { type: 'NumberVal', value: Math.PI } as RuntimeVal, 'NumberVal');
    mathEnv.declareVar('e', { type: 'NumberVal', value: Math.E } as RuntimeVal, 'NumberVal');

    const sqrtFn = new Function({} as Body, [{ identifier: 'x', type: 'NullVal' } as ArgumentExpr]);
    sqrtFn.call = function (env: Environment) {
        const v = env.lookupVar('x');
        if (v.type != 'NumberVal') {
            throw `Função raiz quadrada espera um número, mas recebeu ${v.type}`;
        }
        return { type: 'NumberVal', value: Math.sqrt((v as RuntimeVal).value) } as RuntimeVal;
    };

    mathEnv.functions.set('raiz', sqrtFn);

    const math = { value: 'Matemática', className: 'Matemática', env: mathEnv } as ObjectVal;

    env.declareVar('mat', math, 'ObjectVal');

    const arg = { kind: 'ArgumentExpr', identifier: 'text', type: 'NullVal' } as ArgumentExpr;
    const escreva = new Function({} as Body, [arg]);
    escreva.call = function (_env: Environment) {
        const text = _env.lookupVar('text');
        let v = text.value;
        if (text.type == 'BooleanVal') {
            v = text.value ? 'verdadeiro' : 'falso';
        }
        appendOutput(v as string);
        return MK_NULL();
    };

    const escreval = new Function({} as Body, [arg]);
    escreval.call = function (_env: Environment) {
        const text = _env.lookupVar('text');
        let v = text.value;
        if (text.type == 'BooleanVal') {
            v = text.value ? 'verdadeiro' : 'falso';
        }
        appendOutput((v as string) + '\n');
        flushOutputBuffer();
        return MK_NULL();
    };

    const novalinha = new Function({} as Body, []);
    novalinha.call = function (_env: Environment) {
        appendOutput('\n');
        return MK_NULL();
    };

    const limparterm = new Function({} as Body, []);
    limparterm.call = function (_env: Environment) {
        console.clear();
        clearOutputBuffer();
        return MK_NULL();
    };

    const leia = new Function({} as Body, []);
    leia.call = function (_env: Environment) {
        const input = prompt('');
        return { type: 'StringVal', value: input ?? '' } as RuntimeVal;
    };

    const pergunte = new Function({} as Body, [arg]);
    pergunte.call = function (_env: Environment) {
        const text = _env.lookupVar('text');
        const input = prompt(text.value as string);
        return { type: 'StringVal', value: input } as RuntimeVal;
    };

    const leiaNum = new Function({} as Body, [arg]);
    leiaNum.call = function (_env: Environment) {
        const text = _env.lookupVar('text');
        const input = prompt(text.value as string);
        const res = Number.parseFloat(input as string);
        if (Number.isNaN(res)) {
            throw `Valor ${input} não é um número válido`;
        }
        return { type: 'NumberVal', value: res } as RuntimeVal;
    };

    const entradaEnv = new Environment({} as Environment);
    entradaEnv.functions.set('leia', leia);
    entradaEnv.functions.set('leianum', leiaNum);
    entradaEnv.functions.set('pergunte', pergunte);

    env.declareVar('Entrada', { value: 'Entrada', className: 'Entrada', env: entradaEnv } as ObjectVal, 'ObjectVal');

    const saidaEnv = new Environment({} as Environment);
    saidaEnv.functions.set('escreva', escreva);
    saidaEnv.functions.set('escreval', escreval);
    saidaEnv.functions.set('novalinha', novalinha);
    saidaEnv.functions.set('limpar', limparterm);

    env.declareVar('Saida', { value: 'Saida', className: 'Saida', env: saidaEnv } as ObjectVal, 'ObjectVal');

    const telaEnv = new Environment({} as Environment);

    const xarg = { kind: 'ArgumentExpr', identifier: 'x', type: 'NullVal' } as ArgumentExpr;
    const yarg = { kind: 'ArgumentExpr', identifier: 'y', type: 'NullVal' } as ArgumentExpr;
    const warg = { kind: 'ArgumentExpr', identifier: 'w', type: 'NullVal' } as ArgumentExpr;
    const harg = { kind: 'ArgumentExpr', identifier: 'h', type: 'NullVal' } as ArgumentExpr;
    const imgarg = { kind: 'ArgumentExpr', identifier: 'img', type: 'NullVal' } as ArgumentExpr;
    const desenhar = new Function({} as Body, [xarg, yarg, warg, harg, imgarg]);
    desenhar.call = function (_env: Environment) {
        const x = _env.lookupVar('x');
        const y = _env.lookupVar('y');
        const w = _env.lookupVar('w');
        const h = _env.lookupVar('h');
        const img = _env.lookupVar('img');
        drawImage(x.value as number, y.value as number, w.value as number, h.value as number, img.value as string);
        return MK_NULL();
    };
    telaEnv.functions.set('desenhar', desenhar);

    const retangulo = new Function({} as Body, [xarg, yarg, warg, harg, imgarg]);
    retangulo.call = function (_env: Environment) {
        const x = _env.lookupVar('x');
        const y = _env.lookupVar('y');
        const w = _env.lookupVar('w');
        const h = _env.lookupVar('h');
        const fill = _env.lookupVar('img');
        drawRectangle(x.value as number, y.value as number, w.value as number, h.value as number, fill.value as string);
        return MK_NULL();
    };
    telaEnv.functions.set('retangulo', retangulo);

    const x1arg = { kind: 'ArgumentExpr', identifier: 'x1', type: 'NullVal' } as ArgumentExpr;
    const y1arg = { kind: 'ArgumentExpr', identifier: 'y1', type: 'NullVal' } as ArgumentExpr;
    const x2arg = { kind: 'ArgumentExpr', identifier: 'x2', type: 'NullVal' } as ArgumentExpr;
    const y2arg = { kind: 'ArgumentExpr', identifier: 'y2', type: 'NullVal' } as ArgumentExpr;
    const reta = new Function({} as Body, [x1arg, y1arg, x2arg, y2arg]);
    reta.call = function (_env: Environment) {
        const x1 = _env.lookupVar('x1');
        const y1 = _env.lookupVar('y1');
        const x2 = _env.lookupVar('x2');
        const y2 = _env.lookupVar('y2');
        drawLine(x1.value as number, y1.value as number, x2.value as number, y2.value as number);
        return MK_NULL();
    };
    telaEnv.functions.set('reta', reta);

    const larguraReta = new Function({} as Body, [warg]);
    larguraReta.call = function (_env: Environment) {
        setLineWidth(_env.lookupVar('w').value as number);
        return MK_NULL();
    };
    telaEnv.functions.set('larguraReta', larguraReta);

    const limpar = new Function({} as Body, []);
    limpar.call = function (_env: Environment) {
        clearCanvas();
        return MK_NULL();
    };
    telaEnv.functions.set('limpar', limpar);

    const imprima = new Function({} as Body, [xarg, yarg, arg, harg]);
    imprima.call = function (_env: Environment) {
        const text = _env.lookupVar('text');
        const x = _env.lookupVar('x');
        const y = _env.lookupVar('y');
        const size = _env.lookupVar('h');
        drawText(x.value as number, y.value as number, text.value as string, size.value as number);
        return MK_NULL();
    };
    telaEnv.functions.set('imprimir', imprima);

    const cor = new Function({} as Body, [arg]);
    cor.call = function (_env: Environment) {
        const text = _env.lookupVar('text');
        setColor(text.value as string);
        return MK_NULL();
    };
    telaEnv.functions.set('cor', cor);

    const tela = { value: 'Tela', className: 'Tela', env: telaEnv } as ObjectVal;

    env.declareVar('Tela', tela, 'ObjectVal');
}
