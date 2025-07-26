import Parser from "./parser.ts";
import { evaluate, setRunningUnder } from "./interpreter.ts";
import Environment from "./environment.ts";
import { StringVal } from "./values.ts";
import { FuncDecl } from "./ast.ts";

//if (Deno.args.length>=1) {
//    main();
//} else {
//    repl();
//}

//repl();
//main();

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

        let program;
        program = parser.produceAST(input);

        let result;
        try {
            setRunningUnder("repl");
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
            setRunningUnder("website");
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
    } else {
        repl();
    }
} catch (error) {
}