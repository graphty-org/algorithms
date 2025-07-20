import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        ignores: [
            "**/dist/**",
            "**/dist/*",
            "dist/**",
            "dist/*",
            "coverage/**",
            "node_modules/**",
            "examples/**/*.js",
        ],
    },
    {
        languageOptions: {
            parserOptions: {
                sourceType: "module",
                globals: globals.browser,
                tsconfigRootDir: import.meta.dirname,
                projectService: {
                    allowDefaultProject: ["*.js", "*.mjs", "*.config.ts"],
                },
            },
        },
    },
    {
        plugins: {
            "@stylistic": stylistic,
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            /* *********************
             * MIGRATION
             **********************/
            // TODO: fix these!
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-non-null-assertion": "error",

            /* *********************
             * BASIC STYLE
             **********************/
            "camelcase": ["error", {properties: "always"}], // alwaysUseCamelCase
            "curly": ["error", "all"], // force using curly braces, even when they could be skipped
            "no-warning-comments": ["warn", {terms: ["TODO", "FIXME"]}], // warn on TODO and FIXME comments
            "one-var": ["error", "never"], // each variable declaration on it's own line
            "sort-vars": "error", // put variable declarations in alphabetical order
            "prefer-template": "error", // use template literals instead of string concatenation
            "no-var": "error", // use 'let' or 'const' instead of 'var
            "no-console": ["warn", {allow: ["warn", "error"]}], // warn on console junk in files
            "@stylistic/array-bracket-newline": ["error", "consistent"], // when to add newlines to long arrays
            "@stylistic/array-element-newline": ["error", "consistent"], // array members are either on the same line, or all on separate lines
            "@stylistic/brace-style": ["error", "1tbs"], // how the braces line up around code blocks
            "@stylistic/comma-dangle": ["error", "always-multiline"], // always use comma on final line to help with diff
            "@stylistic/eol-last": ["error", "always"], // end every file with an end-of-line ("\n")
            "@stylistic/function-call-argument-newline": ["error", "consistent"], // all function arguments on newlines or sameline
            "@stylistic/indent": ["error", 4], // indent 4 spaces
            "@stylistic/linebreak-style": ["error", "unix"], // always use \n
            "@stylistic/no-multiple-empty-lines": ["error", {max: 1, maxBOF: 0, maxEOF: 1}], // don't allow multiple empty lines in a row
            "@stylistic/no-tabs": "error", // always spaces, never tabs
            "@stylistic/nonblock-statement-body-position": ["error", "below"], // must have curly braces around 'if' body
            "@stylistic/operator-linebreak": ["error", "after"], // add line breaks after operators (+, -, etc) on long lines
            "@stylistic/padded-blocks": ["error", "never"], // don't add extra spacing inside code blocks
            "@stylistic/quotes": ["error", "double"], // always use ""
            "@stylistic/semi": ["error", "always"], // always use ;
            "@stylistic/member-delimiter-style": ["error", { // use ; after members of an interface definition
                multiline: {delimiter: "semi", requireLast: true},
                singleline: {delimiter: "comma", requireLast: false},
            }],
            "@typescript-eslint/explicit-function-return-type": ["error", {allowIIFEs: true, allowExpressions: true}],

            /* *********************
             * SPACING STYLE
             **********************/
            "@stylistic/array-bracket-spacing": ["error", "never"], // never put spaces inside array brackets
            "@stylistic/comma-spacing": ["error", {before: false, after: true}],
            "@stylistic/func-call-spacing": ["error", "never"], // foo (42)
            "@stylistic/key-spacing": ["error", {afterColon: true, beforeColon: false, mode: "strict"}], // put space after colon in dictionary keys
            "@stylistic/keyword-spacing": ["error", {before: true, after: true}], // make sure there are spaces around keywords
            "@stylistic/no-multi-spaces": "error", // don't allow multiple spaces in a row
            "@stylistic/no-trailing-spaces": "error", // strip off all trailing whitespace
            "@stylistic/no-whitespace-before-property": "error", // don't allow whitespace before .property
            "@stylistic/object-curly-spacing": ["error", "never"], // never put spaces inside curly braces
            "@stylistic/semi-spacing": ["error", {before: false}], // don't put spaces before semicolons
            "@stylistic/space-before-function-paren": ["error", "never"], // function foo ()
            "@stylistic/space-in-parens": ["error", "never"], // never put a space on the inside of parens (a + b)
            "@stylistic/space-infix-ops": ["error", {int32Hint: false}], // make sure there are spaces around operators
            "@stylistic/space-unary-ops": ["error", {words: true, nonwords: false}], // spacing around operators
            "@stylistic/spaced-comment": ["error", "always"], // ensure there is a space after a comment token
            "@stylistic/switch-colon-spacing": ["error", {after: true, before: false}], // in switch / case statements, the colon comes immediately after the case expression
            "@stylistic/template-curly-spacing": ["error", "never"], // never put spaces inside template curly braces
            "@stylistic/rest-spread-spacing": ["error", "always"], // always put spacing after ...

            /* *********************
             * ESOTERIC STYLE
             **********************/
            "default-case": "error", // require 'default' statement in switch / case statement
            "default-param-last": "error", // default parameters can only come at the end of a list of function arguments
            "dot-notation": "error", // always use obj.prop rather than obj["prop"]
            "no-else-return": "error", // don't include an else statement if everything is just going to return anyway
            "no-nested-ternary": "error", // nested ternaries are hard to read, don't do that
            "no-template-curly-in-string": "error", // prevent strings that should have been templates
            "no-unneeded-ternary": "error", // simplify ternary to just boolean assignment when possible
            "prefer-destructuring": ["error", {object: true, array: false}], // prefer destructuring assignment
            "prefer-rest-params": "error", // use ... instead of 'arguments'
            "prefer-spread": "error", // prefer ... instead of .call() or .apply()
            "yoda": ["error", "never"],
            "@stylistic/comma-style": ["error", "last"], // don't start your line with a comma
            "@stylistic/dot-location": ["error", "property"], // when chaining across lines, keep the dot with the property
            "@stylistic/new-parens": ["error", "always"], // require parens after new Class()
            "@stylistic/quote-props": ["error", "consistent-as-needed"], // add quotes around properties (e.g. "prop-name") when needed, consistently
            "@stylistic/semi-style": ["error", "last"], // semicolons go at the ends of lines, not at the beginning you psychopath
            "@stylistic/padding-line-between-statements": [ // control spacing around certain blocks of code
                "error",
                {blankLine: "always", prev: "*", next: "class"},
                {blankLine: "always", prev: "class", next: "*"},
                {blankLine: "always", prev: "if", next: "*"},
            ],
            "@stylistic/arrow-parens": ["error", "always"], // require parens around arrow function arguments
            "no-useless-rename": "error", // don't needlessly rename imports, exports, or properties
            "no-useless-constructor": "error", // don't add constructor to a class if it does the same as the default
            "no-useless-computed-key": "error", // don't compute object keys / properties if you don't have to

            /* *********************
             * IMPORTS
             **********************/
            "simple-import-sort/imports": "error", // sort imports
            "simple-import-sort/exports": "error", // sort exports
            "no-duplicate-imports": "error", // don't allow duplicate imports

            /* *********************
             * SAFETY
             **********************/
            "eqeqeq": "error", // use === instead of ==
            "consistent-return": "error", // either always return a value, or don't
            "@stylistic/wrap-iife": ["error", "inside"], // prevent weird IIFE errors
            "@stylistic/no-mixed-operators": ["error", {allowSamePrecedence: true}], // don't mix && and ||
        },
    },
    {
        files: ["**/*.test.ts", "test/**/*.ts"],
        rules: {
            "@typescript-eslint/unbound-method": "off", // Allow unbound methods in tests for mock assertions
            "@typescript-eslint/no-non-null-assertion": "off", // Allow non-null assertions in tests
            "no-console": "off", // Allow console in tests
        },
    },
);
