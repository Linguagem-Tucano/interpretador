import Environment from "./environment.ts";
import { BooleanVal, MK_NULL, ObjectVal, RuntimeVal } from "./values.ts";
import { Function } from "./function.ts";
import { ArgumentExpr } from "./ast.ts";
import { clearCanvas, drawImage, drawLine, drawText } from "./main.ts";
import { appendOutput } from "./interpreter.ts";

export function setupEnv(env: Environment) {
    env.declareVar("verdadeiro",{type:"BooleanVal",value:true} as BooleanVal,"BooleanVal");
    env.declareVar("falso",{type:"BooleanVal",value:false} as BooleanVal,"BooleanVal");
    env.declareVar("nulo",MK_NULL(),"NullVal");
    const nowClock = Date.now();
    const clockFn = new Function([],[]);
    clockFn.call = function(_env: Environment) {
        const ms = Date.now() - nowClock;
        return {type:"RealVal",value:ms/1000} as RuntimeVal;
    }
    env.functions.set("relogio",clockFn);

    const mathEnv = new Environment({} as Environment);
    mathEnv.declareVar("pi",{type:"RealVal",value:Math.PI} as RuntimeVal,"RealVal");
    mathEnv.declareVar("e",{type:"RealVal",value:Math.E} as RuntimeVal,"RealVal");
    
    const sqrtFn = new Function([],[{identifier:"x",type:"NullVal"} as ArgumentExpr]);
    sqrtFn.call = function(env: Environment) {
        const v = env.lookupVar("x");
        if (v.type!="RealVal" && v.type!="NumberVal") {
            throw `Função raiz quadrada espera um número, mas recebeu ${v.type}`;
        }
        return {type:"RealVal",value:Math.sqrt((v as RuntimeVal).value)} as RuntimeVal;
    }

    mathEnv.functions.set("raiz",sqrtFn);

    const math = {value:"Matemática", className:"Matemática", env:mathEnv} as ObjectVal;

    env.declareVar("mat",math,"ObjectVal");

    const arg = {kind:"ArgumentExpr",identifier:"text", type:"NullVal"} as ArgumentExpr;
    const escreva = new Function([],[arg]);
    escreva.call = function(_env: Environment) {
        const text = _env.lookupVar("text");
        appendOutput(text.value as string);
        return MK_NULL();
    }
    env.functions.set("escreva", escreva);
    const escreval = new Function([],[arg]);
    escreval.call = function(_env: Environment) {
        const text = _env.lookupVar("text");
        appendOutput(text.value as string + "\n");
        return MK_NULL();
    }
    env.functions.set("escreval", escreval);
    
    const leia = new Function([],[arg]);
    leia.call = function(_env: Environment) {
        const text = _env.lookupVar("text");
        const input = prompt(text.value as string);
        return {type:"StringVal",value:input} as RuntimeVal;
    }
    env.functions.set("leia", leia);



    const telaEnv = new Environment({} as Environment);

    const xarg = {kind:"ArgumentExpr",identifier:"x", type:"NullVal"} as ArgumentExpr;
    const yarg = {kind:"ArgumentExpr",identifier:"y", type:"NullVal"} as ArgumentExpr;
    const warg = {kind:"ArgumentExpr",identifier:"w", type:"NullVal"} as ArgumentExpr;
    const harg = {kind:"ArgumentExpr",identifier:"h", type:"NullVal"} as ArgumentExpr;
    const imgarg = {kind:"ArgumentExpr",identifier:"img", type:"NullVal"} as ArgumentExpr;
    const desenhar = new Function([],[xarg,yarg,warg,harg,imgarg]);
    desenhar.call = function(_env: Environment) {
        const x = _env.lookupVar("x");
        const y = _env.lookupVar("y");
        const w = _env.lookupVar("w");
        const h = _env.lookupVar("h");
        const img = _env.lookupVar("img");
        drawImage(x.value as number, y.value as number, w.value as number, h.value as number, img.value as string);
        return MK_NULL();
    }
    telaEnv.functions.set("desenhar", desenhar);

    const x1arg = {kind:"ArgumentExpr",identifier:"x1", type:"NullVal"} as ArgumentExpr;
    const y1arg = {kind:"ArgumentExpr",identifier:"y1", type:"NullVal"} as ArgumentExpr;
    const x2arg = {kind:"ArgumentExpr",identifier:"x2", type:"NullVal"} as ArgumentExpr;
    const y2arg = {kind:"ArgumentExpr",identifier:"y2", type:"NullVal"} as ArgumentExpr;
    const reta = new Function([],[x1arg,y1arg,x2arg,y2arg]);
    reta.call = function(_env: Environment) {
        const x1 = _env.lookupVar("x1");
        const y1 = _env.lookupVar("y1");
        const x2 = _env.lookupVar("x2");
        const y2 = _env.lookupVar("y2");
        drawLine(x1.value as number, y1.value as number, x2.value as number, y2.value as number);
        return MK_NULL();
    }
    telaEnv.functions.set("reta", reta);

    const limpar = new Function([],[]);
    limpar.call = function(_env: Environment) {
        clearCanvas();
        return MK_NULL();
    }
    telaEnv.functions.set("limpar", limpar);

    const imprima = new Function([],[xarg,yarg,arg,harg]);
    imprima.call = function(_env: Environment) {
        const text = _env.lookupVar("text");
        const x = _env.lookupVar("x");
        const y = _env.lookupVar("y");
        const size = _env.lookupVar("h");
        drawText(x.value as number, y.value as number, text.value as string, size.value as number);
        return MK_NULL();
    }
    telaEnv.functions.set("imprimir", imprima);

    const tela = {value:"Tela", className:"Tela", env:telaEnv} as ObjectVal;

    env.declareVar("tela",tela,"ObjectVal");
}