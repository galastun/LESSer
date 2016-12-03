const parser = {};
const $_ =  parser;
const fs = require('fs');

/**
 * This is the base Tokens Object
 * 
 * @method add              Add a token to the the Object
 * @method value            Retrieve the token Object
 * @method getEnumerator    Gets a TokenEnumerator object
 */
$_.Tokens = function() {
    var tokens = [];
    
    return {
        add: function(type, value) {
            // may need to use type and value later
            // not used now
            tokens.push({
                type: type,
                value: value
            });
        },
        value: function() {
            return tokens;
        },
        getEnumerator: function() {
            return new $_.TokenEnumerator(tokens);
        }
    };
};

/**
 * This provides functionality for enumerating through a Token object
 * 
 * @method current          Returns the current token
 * @method next             Iterates the position within the token object
 * @method peek             Shows the next token object without moving the position
 * @method end              Returns true if the end is reached, false if not
 * @method length           Returns the length of the token object
 */
$_.TokenEnumerator = function(tokens) {
    const _tokens = tokens;
    var position = 0;

    return {
        current: function() {
            return _tokens[position];
        },
        next: function() {
            position++;
        },
        peek: function() {
            return _tokens[position + 1];
        },
        end: function() {
            return position === _tokens.length;
        },
        length: function() {
            return _tokens.length;
        }
    };
};

/**
 * This provides functionality for enumerating through an array of characters
 * 
 * @method init             Allows for adding a character array after initiation
 * @method next             Iterates the position within the character array
 * @method peek             Shows the next character without moving the position
 * @method current          Returns the current character
 * @method end              Returns true if the end is reached, false if not
 * @method length           Returns the length of the character array
 */
$_.FileCharacters = function(input) {
    var _input = input,
        position = 0;

    return {
        init: function(input) {
            _input = input;
            position = 0;
        },
        next: function() {
            position++;
        },
        peek: function() {
            return _input[position + 1];
        },
        current: function() {
            return _input[position];
        },
        length: function() {
            return _input.length;
        },
        end: function() {
            return position === _input.length;
        }
    };
}

// All return true if it is the specified type
$_.isComment = function(c) {
    return /\//.test(c);
};

$_.isOperator = function(c) {
    return /[:={}@;\.#]/.test(c);
};

$_.isDigit = function(c) {
    return /[0-9]/.test(c);
};

$_.isWhiteSpace = function(c) {
    return /\s/.test(c);
};

$_.isIdentifier = function(c) {
    return typeof c === "string" 
    && !$_.isOperator(c) 
    && !$_.isDigit(c) 
    && !$_.isWhiteSpace(c);
};

/**
 * This goes through each character and builds a token array for parsing.
 * 
 * @param input     A FileCharacters object
 * @param tokens    A Tokens object
 */
$_.lexer = function(input, tokens) {
    var c;
    while(!input.end()) {
        c = input.current();

        if($_.isComment(c) && $_.isComment(input.peek())) {
            input.next();
            break;
        }

        else if($_.isWhiteSpace(c)){
            input.next();
        }

        else if($_.isOperator(c)) {
            tokens.add(c, c);
            input.next();
        }

        else if($_.isDigit(c)) {
            let num = c;
            while($_.isDigit(input.next())) num += c;

            if(c === ".") {
                do num += c; while ($_.isDigit(input.next()));
            }

            num = parseFloat(num);
            tokens.add("number", num);
        }

        else if($_.isIdentifier(c)){
            let idn = c;

            while($_.isIdentifier(input.next())) {
                idn += c;
            }

            tokens.add("identifier", idn);
        }
        
        else throw "Unreconized Token";
    }
};

/**
 * This evaluates the syntax - it must either be a variable or 
 * an expression to be correct.
 * 
 * @param tokenEnum    A TokenEnumerator to evaluate
 */
$_.evaluateSyntax = function(tokenEnum) {
    var returnTree = {
            variableExpression: {},
            expression: []
        };
    while(!tokenEnum.end()) {
        if(tokenEnum.current().type === "@") {
            Object.assign(returnTree.variableExpression, ($_.evaluateVariableExp(tokenEnum)));
            continue;
        }

        else if(/[#\.a-zA-Z]/.test(tokenEnum.current())) {
            Object.assign(returnTree.expression, $_.evaluateExpression(tokenEnum));
            continue;
        }

        else {
            throw "Bad syntax: " + tokenEnum.current().value;
        }
    }

    return returnTree;
};

/**
 * This evaluates a variable expression.
 * 
 * @param tokenEnum    A TokenEnumerator to evaluate
 */
$_.evaluateVariableExp = function(tokenEnum) {
    var variableTree = {
        name: "",
        value: ""
    }, obj = {};

    while(tokenEnum.current().type !== "=") {
        variableTree.name += tokenEnum.current().value;
        tokenEnum.next();
    }

    tokenEnum.next(); // currently =

    while(tokenEnum.current().type !== ";") {
        variableTree.value += tokenEnum.current().value;
        tokenEnum.next();
    }

    tokenEnum.next();

    obj[variableTree.name] = variableTree.value;
    return obj;
};

/**
 * This evaluates an expression getting all the sub-properties.
 * 
 * @param tokenEnum    A TokenEnumerator to evaluate
 */
$_.evaluateExpression = function(tokenEnum) {
    var expressionTree = {
        name: "",
        sub: {}
    }, obj = {};



    while(tokenEnum.current().type !== "{") {
        expressionTree.name += tokenEnum.current().value;
        tokenEnum.next();
    }

    tokenEnum.next();
    while(tokenEnum.current().type !== "}") {
        Object.assign(expressionTree.sub, $_.evaluateProperty(tokenEnum));
    }

    tokenEnum.next();

    obj[expressionTree.name] = expressionTree.sub;
    return obj;
};

/**
 * This evaluates a property.
 * 
 * @param tokenEnum    A TokenEnumerator to evaluate
 */
$_.evaluateProperty = function(tokenEnum) {
    var propertyTree = {
        name: '',
        value: ''
    }, obj = {};

    while(tokenEnum.current().type !== ":") {
        propertyTree.name += tokenEnum.current().value;
        tokenEnum.next();
    }

    tokenEnum.next();

    while(tokenEnum.current().type !== ";") {
        propertyTree.value += tokenEnum.current().value;
        tokenEnum.next();
    }

    tokenEnum.next();
    obj[propertyTree.name] = propertyTree.value;

    
    return obj;
};

/**
 * This builds a parse tree to be evaluated.
 * 
 * @param tokens   A Tokens object 
 */
$_.parser = function(tokens) {
    var parseTree = {
        variableExpression: {},
        expression: {}
    }, tokenEnum = tokens.getEnumerator();

    while(!tokenEnum.end()) {
        Object.assign(parseTree, $_.evaluateSyntax(tokenEnum));
    }

    return parseTree;
};

/**
 * This evaluates a the parse tree and builds the output file
 * 
 * @param parseTree   The parse tree to build the file from
 */
$_.evaluate = function(parseTree) {
    let cssString = "",
        expression = parseTree.expression,
        variables = parseTree.variableExpression;

    for(var property in expression) {
        let str = property + "{",
            selector = expression[property];

        for(var prop in selector) {
            let value = selector[prop];

            if(/[\.#]/.test(expression[property][prop][0])) {
                let ref = selector[prop].split('.');
                value = expression[ref[0]][prop];
            }

            if(value[0] === "@") {
                value = variables[value];
            }

            str += prop + ":" + value + ";";
        }

        cssString += str + "}";
    }

    return cssString;
};

/**
 * This writes the evaluated parse tree to a file.
 * 
 * @param parseTree   A parse tree to create a file from
 * @param out         The name of the file to output to
 */
$_.interpret = function(parseTree, out) {
    var data = $_.evaluate(parseTree);
    fs.writeFile(out, data, function() {
        console.log("Output to " + out);
    });
};

/**
 * Reads the file line-by-line and builds an array of characters
 * to be evaluated.
 * 
 * @param file          The name of the file to be readline
 * @param out           The name of the output file
 * @param tokens        The Tokens object to be used
 * @param characters    The FileCharacters object to be used
 */
$_.readLine = function(file, out, tokens, characters) {
    const rl = require('readline').createInterface({
        input: require('fs').createReadStream(file)
    });

    rl.on('line', function (line) {
        characters.init(line.trim().split(''));
        $_.lexer(characters, tokens);
    })
    .on("close", function() {
        var parseTree = $_.parser(tokens);
        $_.interpret(parseTree, out);
    });

}

// main
let inputFile = process.argv[2] || undefined,
    outputFile = process.argv[3] || "main.css";

if(inputFile) {
    var $tokens = new $_.Tokens();
    var $characters = new $_.FileCharacters();
    $_.readLine(inputFile, outputFile, $tokens, $characters);
}

else {
    console.log("Please provide a file to read.");
}