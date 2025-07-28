import Parser from "./parser.ts";
import { evaluate} from "./interpreter.ts";
import Environment from "./environment.ts";
import { StringVal } from "./values.ts";
import { Program } from "./ast.ts";

export function repl() {
    const parser = new Parser();
    const env = new Environment();
    console.log("Tucano interativo v0.1");
    console.log("Beta público.");
    console.log('Digite "sair" para sair');
    while (true) {
        const input = prompt("> ");

        if (!input || input=="sair") {
            Deno.exit(0);
        }

        let program = {} as Program;
        try {
            program = parser.produceAST(input);
            
        } catch (error) {
            console.error("Erro de sintaxe: " + error);
        }

        let result;
        try {
    
            result = evaluate(program,env);
        } catch (error) {
            console.error(error);
        }
        console.log((result as StringVal).value);
        //console.log(result);
    }
}

export function interpret(text:string) {
    const parser = new Parser();
    const env = new Environment();
    
    const code = text;
    let program;

    try {
        program = parser.produceAST(code);
        //console.log(program);
        try {
            return evaluate(program,env);
        } catch (error) {
            console.error(error);
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
    
}
try {
    if (Deno.args.length>=1) {
        // idk man just suck it up
    } else {
        repl();
    }
} catch(_error) {
    //Empty catch to avoid error when running in browser
}