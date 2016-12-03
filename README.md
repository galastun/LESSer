# LESSer

LESSer was meant to be Dynamic Style Sheets but then I found out it would be extremely difficult, if not impossible, 
to bind the states of DOM elements with each other. 

That said, it is now just a CSS preprocessor that does only a very small portion of what others do (using variables). Hence
the name, LESSer.

Here is the BNF I was working from:

~~~~
<syntax>     ::= <varExp> <syntax> | <expression> <syntax> | EOF
<expression> ::= #<string> { <property> } | .<string> { <property> } | <string> { <property> }
<property>   ::= <string>: <string>; <property> | <string>: <variable>; <property> | epsilon
<varExp>     ::= <variable> = <string>;
<variable>   ::= @<string>
<string>     ::= a-zA-Z0-9 <string> | epsilon
~~~~

Here is a sample input file:

~~~~
// this is a comment -> it is ignored
// a variable is prefixed with @
@color = blue;

// the rest is just like CSS but with variables
#test {
  color: @color;
}

// this notation gives this class the same color #test has
// it is a hold over from when I wanted them to be dynamically 
// bound but that doesn't seem to be possible
.another-class {
  color: #test.color;
}
~~~~

LESSer was written using Node.js and requires the npm module readline located here 
[readline](https://www.npmjs.com/package/readline). [Node.js](https://nodejs.org/en/) and this package must be 
installed in order for this to be run!

Once the environment is setup, LESSer should be run in this way:

~~~~
node lesser.js <inputfile> <outputfile>

//example
bash-3.2$ node lesser.js client.js main.css
~~~~

The input file must be present or LESSer will alert you to pass in the input file. It will start by reading each character
of the input file line-by-line (ignoring comments). Any whitespace will be dropped. It then classifies each character and
places it into a token object which currently contains its type and value. These are not used at the moment but could be
useful for future iterations so they are retained.

Once the tokens are created, they are put into a parse tree based on whether they are a variable expression or a base expression.
From there, the parse tree is sent to the interpreter which builds the CSS file, inserting variable values where appropriate.

## Testing

So far, the only things that work or using variables or binding the value of one property to that of another selector. 
Something like this should work fine:

~~~~
// comment
@color = blue;
@height = 100px;

#id-selector {
  height: @height;
}

.class-selector {
  color: @color;
  height: #id-selector.height;
}
~~~~

This project acheives modularity, extensibility, and reusability by creating/using objects and injecting them into the 
main function. I use objects to wrap base types to add functionality like enumeration. Each function takes the objects as an
argument so more functions can easily be added to also act upon the same objects to add more steps in the process as it grows.






