const PREC = {
  catch: 1,
  coalesce: 2,
  or: 3,
  and: 4,
  equality: 5,
  comparison: 6,
  range: 6,
  sum: 7,
  product: 8,
  prefix: 9,
  postfix: 10,
};

const HEX_NUMBER = /0[xX][0-9A-Za-z](?:[0-9A-Za-z]|_[0-9A-Za-z])*/;
const OCT_NUMBER = /0[oO][0-9A-Za-z](?:[0-9A-Za-z]|_[0-9A-Za-z])*/;
const BIN_NUMBER = /0[bB][0-9A-Za-z](?:[0-9A-Za-z]|_[0-9A-Za-z])*/;
const DEC_NUMBER = /[0-9](?:[0-9]|_[0-9])*/;
const FLOAT_NUMBER =
  /[0-9](?:[0-9]|_[0-9])*(?:\.[0-9](?:[0-9]|_[0-9])*)?(?:[eE][+-]?[0-9](?:[0-9]|_[0-9])*)?/;
const IMAG_NUMBER =
  /[0-9](?:[0-9]|_[0-9])*(?:\.[0-9](?:[0-9]|_[0-9])*)?(?:[eE][+-]?[0-9](?:[0-9]|_[0-9])*)?i/;

module.exports = grammar({
  name: "ferret",

  word: ($) => $.identifier,

  extras: ($) => [/[\s\uFEFF\u2060\u200B]/, $.line_comment, $.block_comment],

  supertypes: ($) => [$.statement, $.expression, $.type],

  conflicts: ($) => [
    [$.expression, $.named_type],
    [$.expression, $.generic_type],
    [$.array_literal, $.slice_type],
    [$.expression, $.array_length],
    [$.expression, $.lambda_parameter],
    [$.expression, $.lambda_parameter, $.named_type],
    [$.type, $.function_type_parameter],
    [$.lambda_parameter, $.named_type],
    [$.lambda_parameter, $.type],
    [$.named_type, $.generic_type],
    [$.type_parameter, $.named_type],
    [$.generic_call_expression, $.binary_expression],
    [$.generic_call_expression, $.prefix_expression, $.binary_expression],
    [$.expression_statement, $.composite_item],
  ],

  rules: {
    source_file: ($) => repeat($.top_level_item),

    top_level_item: ($) =>
      choice(
        $.import_declaration,
        seq(repeat(field("attribute", $.attribute)), $.let_declaration),
        seq(repeat(field("attribute", $.attribute)), $.const_declaration),
        seq(repeat(field("attribute", $.attribute)), $.type_declaration),
        seq(repeat(field("attribute", $.attribute)), $.test_declaration),
        $.function_declaration,
      ),

    import_declaration: ($) =>
      seq(
        "import",
        field(
          "path",
          choice($.string_literal, $.identifier, $.scoped_identifier),
        ),
        optional(seq("as", field("alias", $.identifier))),
        optional(";"),
      ),

    let_declaration: ($) => seq($.let_clause, optional(";")),

    const_declaration: ($) =>
      seq(
        "const",
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        optional(seq("=", field("value", $.expression))),
        optional(";"),
      ),

    type_declaration: ($) =>
      seq(
        "type",
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameter_list)),
        optional($.move),
        field("value", $.type),
      ),

    attribute: ($) =>
      seq(
        "#",
        "[",
        field("name", $.identifier),
        optional(
          seq(
            "(",
            optional(
              commaSep1(
                choice(
                  field("string", $.string_literal),
                  field("arg", $.identifier),
                ),
              ),
            ),
            optional(","),
            ")",
          ),
        ),
        "]",
      ),

    function_declaration: ($) =>
      seq(
        repeat(field("attribute", $.attribute)),
        optional("unsafe"),
        "fn",
        choice(
          field("name", $.identifier),
          seq(
            field(
              "owner",
              choice($.identifier, $.scoped_identifier, $.generic_type),
            ),
            "::",
            field("name", $.identifier),
          ),
        ),
        optional(field("type_parameters", $.type_parameter_list)),
        field("parameters", $.parameter_list),
        optional(seq("->", field("result", $.type))),
        choice(field("body", $.block), ";"),
      ),

    test_declaration: ($) =>
      seq("test", field("name", $.string_literal), field("body", $.block)),

    type_parameter_list: ($) =>
      seq("<", commaSep1($.type_parameter), optional(","), ">"),

    type_parameter: ($) =>
      seq(field("name", $.identifier), optional(seq(":", $.constraint_term))),

    constraint_term: ($) =>
      choice(
        $.interface_type,
        $.union_type,
        $.generic_type,
        $.approx_type,
        $.named_type,
      ),

    parameter_list: ($) =>
      seq("(", optional(commaSep1($.parameter)), optional(","), ")"),

    parameter: ($) => choice($.self_parameter, $.typed_parameter),

    typed_parameter: ($) =>
      seq(
        optional("comptime"),
        optional("mut"),
        field("name", $.identifier),
        ":",
        field("type", $.type),
      ),

    self_parameter: ($) =>
      seq(
        optional("comptime"),
        optional("mut"),
        choice(
          "self",
          seq("self", ":", field("type", $.type)),
          seq("&", "self"),
          seq("&", "mut", "self"),
          seq("*", "self"),
        ),
      ),

    block: ($) => seq("{", repeat($.statement), "}"),

    statement: ($) =>
      choice(
        $.block,
        $.labeled_statement,
        $.let_statement,
        $.const_statement,
        $.return_statement,
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.defer_statement,
        $.release_statement,
        $.panic_statement,
        $.lock_statement,
        $.unsafe_statement,
        $.break_statement,
        $.continue_statement,
        $.assignment_statement,
        $.expression_statement,
      ),

    labeled_statement: ($) =>
      prec.right(
        seq(field("label", $.identifier), ":", field("statement", $.statement)),
      ),

    let_statement: ($) => seq($.let_clause, optional(";")),

    let_clause: ($) =>
      seq(
        "let",
        optional("mut"),
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        optional(seq("=", field("value", $.expression))),
      ),

    const_statement: ($) => seq($.const_clause, optional(";")),

    const_clause: ($) =>
      seq(
        "const",
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        optional(seq("=", field("value", $.expression))),
      ),

    return_statement: ($) =>
      prec.right(
        seq("return", optional(field("value", $.expression)), optional(";")),
      ),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        field("consequence", $.block),
        optional(
          seq("else", field("alternative", choice($.block, $.if_statement))),
        ),
      ),

    match_expression: ($) =>
      seq("match", field("value", $.expression), "{", repeat($.match_arm), "}"),

    match_arm: ($) =>
      seq(
        field("pattern", $.match_pattern),
        "=>",
        field("body", choice($.block, $.expression)),
      ),

    match_pattern: ($) =>
      choice("_", seq($.is, field("type", $.type)), $.expression),

    while_statement: ($) =>
      seq("while", field("condition", $.expression), field("body", $.block)),

    for_statement: ($) =>
      seq(
        "for",
        field("iterable", $.expression),
        "|",
        choice(
          seq(field("value", $.identifier), "|"),
          seq(
            field("index", $.identifier),
            ",",
            field("value", $.identifier),
            "|",
          ),
        ),
        field("body", $.block),
      ),

    defer_statement: ($) =>
      seq(
        "defer",
        field("value", choice($.block, $.release_clause, $.expression)),
        optional(";"),
      ),

    release_statement: ($) => seq($.release_clause, optional(";")),

    release_clause: ($) => seq("release", field("value", $.expression)),

    panic_statement: ($) =>
      prec.right(
        PREC.prefix + 1,
        seq("panic", field("value", $.expression), optional(";")),
      ),

    lock_statement: ($) =>
      seq(
        "lock",
        field("value", $.expression),
        "as",
        field("name", $.identifier),
        field("body", $.block),
      ),

    unsafe_statement: ($) => seq("unsafe", field("body", $.block)),

    break_statement: ($) =>
      prec.right(
        seq("break", optional(field("label", $.identifier)), optional(";")),
      ),

    continue_statement: ($) =>
      prec.right(
        seq("continue", optional(field("label", $.identifier)), optional(";")),
      ),

    assignment_statement: ($) => seq($.assignment_clause, optional(";")),

    assignment_clause: ($) =>
      seq(
        field("left", $.expression),
        field("operator", choice("=", "+=", "-=", "*=", "/=", "%=")),
        field("right", $.expression),
      ),

    expression_statement: ($) => seq($.expression, optional(";")),

    expression: ($) =>
      choice(
        $.match_expression,
        $.catch_expression,
        $.lambda_expression,
        $.range_expression,
        $.binary_expression,
        $.prefix_expression,
        $.postfix_expression,
        $.error_propagate_expression,
        $.spread_expression,
        $.cast_expression,
        $.index_expression,
        $.selector_expression,
        $.generic_call_expression,
        $.call_expression,
        $.parenthesized_expression,
        $.bracket_composite_literal,
        $.array_literal,
        $.composite_literal,
        $.typed_composite_literal,
        $.inferred_composite_literal,
        $.identifier,
        $.scoped_identifier,
        $.number_literal,
        $.string_literal,
        $.char_literal,
        $.byte_literal,
        $.boolean_literal,
        $.none_literal,
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    lambda_expression: ($) =>
      seq(
        field("parameters", $.lambda_parameter_list),
        "=>",
        field("body", choice($.block, $.expression)),
      ),

    lambda_parameter_list: ($) =>
      seq("(", optional(commaSep1($.lambda_parameter)), optional(","), ")"),

    lambda_parameter: ($) =>
      seq(
        optional("mut"),
        field("name", $.identifier),
        optional(seq(":", field("type", choice($.variadic_type, $.type)))),
      ),

    array_literal: ($) =>
      seq("[", optional(commaSep1($.expression)), optional(","), "]"),

    bracket_composite_literal: ($) =>
      seq(
        field("type", $.array_type),
        "{",
        optional(commaSep1(choice($.named_field_initializer, $.expression))),
        optional(","),
        "}",
      ),

    composite_literal: ($) =>
      seq(
        ".",
        optional(field("type", choice($.generic_type, $.named_type))),
        "{",
        optional(commaSep1(choice($.named_field_initializer, $.expression))),
        optional(","),
        "}",
      ),

    named_field_initializer: ($) =>
      seq(".", field("name", $.identifier), "=", field("value", $.expression)),

    map_entry: ($) =>
      seq(field("key", $.expression), "=>", field("value", $.expression)),

    composite_item: ($) =>
      choice($.named_field_initializer, $.map_entry, $.expression),

    typed_composite_literal: ($) =>
      seq(
        field("type", choice($.map_type, $.generic_type, $.named_type)),
        "{",
        optional(commaSep1($.composite_item)),
        optional(","),
        "}",
      ),

    inferred_composite_literal: ($) =>
      seq(
        "{",
        commaSep1($.composite_item),
        optional(","),
        "}",
      ),

    call_expression: ($) =>
      prec.left(
        PREC.postfix,
        seq(
          field("function", $.expression),
          field("arguments", $.argument_list),
        ),
      ),

    generic_call_expression: ($) =>
      prec.left(
        PREC.postfix,
        seq(
          field("function", $.expression),
          "<",
          field("type_arguments", commaSep1($.type)),
          optional(","),
          ">",
          field("arguments", $.argument_list),
        ),
      ),

    argument_list: ($) =>
      seq("(", optional(commaSep1($.expression)), optional(","), ")"),

    selector_expression: ($) =>
      prec.left(
        PREC.postfix,
        seq(field("value", $.expression), ".", field("field", $.identifier)),
      ),

    index_expression: ($) =>
      prec.left(
        PREC.postfix,
        seq(
          field("value", $.expression),
          "[",
          field("index", $.expression),
          "]",
        ),
      ),

    error_propagate_expression: ($) =>
      prec.left(PREC.postfix, seq(field("value", $.expression), "!!")),

    spread_expression: ($) =>
      prec.left(PREC.postfix, seq(field("value", $.expression), "...")),

    postfix_expression: ($) =>
      prec.left(
        PREC.postfix,
        seq(
          field("value", $.expression),
          field("operator", choice("++", "--")),
        ),
      ),

    cast_expression: ($) =>
      prec.left(
        PREC.postfix,
        seq(field("value", $.expression), "as", field("type", $.type)),
      ),

    prefix_expression: ($) =>
      prec.right(
        PREC.prefix,
        choice(
          seq("&", optional("mut"), field("value", $.expression)),
          seq(
            choice("*", "-", "!", "?", "take", "comptime", "copy"),
            field("value", $.expression),
          ),
        ),
      ),

    catch_expression: ($) =>
      prec.left(
        PREC.catch,
        seq(
          field("left", $.expression),
          "catch",
          choice(
            field("fallback", $.expression),
            seq(
              "|",
              field("payload", $.identifier),
              "|",
              field("handler", $.block),
            ),
          ),
        ),
      ),

    range_expression: ($) =>
      prec.left(
        PREC.range,
        seq(
          field("start", $.expression),
          field("operator", choice("..", "..=")),
          field("end", $.expression),
          optional(seq(":", field("step", $.expression))),
        ),
      ),

    binary_expression: ($) =>
      choice(
        prec.left(
          PREC.coalesce,
          seq(field("left", $.expression), "??", field("right", $.expression)),
        ),
        prec.left(
          PREC.or,
          seq(field("left", $.expression), "||", field("right", $.expression)),
        ),
        prec.left(
          PREC.and,
          seq(field("left", $.expression), "&&", field("right", $.expression)),
        ),
        prec.left(
          PREC.equality,
          seq(
            field("left", $.expression),
            choice("==", "!="),
            field("right", $.expression),
          ),
        ),
        prec.left(
          PREC.comparison,
          seq(field("left", $.expression), $.is, field("right", $.type)),
        ),
        prec.left(
          PREC.comparison,
          seq(
            field("left", $.expression),
            choice("<", "<=", ">", ">="),
            field("right", $.expression),
          ),
        ),
        prec.left(
          PREC.sum,
          seq(
            field("left", $.expression),
            choice("+", "-"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          PREC.product,
          seq(
            field("left", $.expression),
            choice("*", "/", "%"),
            field("right", $.expression),
          ),
        ),
      ),

    type: ($) =>
      choice(
        $.error_union_type,
        $.function_type,
        $.optional_type,
        $.pointer_type,
        $.ref_type,
        $.raw_pointer_type,
        $.approx_type,
        $.variadic_type,
        $.slice_type,
        $.array_type,
        $.map_type,
        $.tuple_type,
        $.struct_type,
        $.interface_type,
        $.enum_type,
        $.union_type,
        $.error_type,
        $.generic_type,
        $.named_type,
      ),

    move: () => "move",
    is: () => "is",
    map: () => "map",

    named_type: ($) => choice($.identifier, $.scoped_identifier),
    generic_type: ($) =>
      seq(
        field("name", choice($.identifier, $.scoped_identifier)),
        field("type_arguments", $.type_argument_list),
      ),

    function_type: ($) =>
      seq(
        "fn",
        "(",
        optional(commaSep1($.function_type_parameter)),
        optional(","),
        ")",
        optional(seq("->", field("result", $.type))),
      ),

    function_type_parameter: ($) =>
      seq(field("type", choice($.variadic_type, $.type))),

    type_argument_list: ($) =>
      seq("<", optional(commaSep1($.type)), optional(","), ">"),

    optional_type: ($) => seq("?", $.type),
    pointer_type: ($) => seq("*", $.type),
    ref_type: ($) => seq("&", optional("mut"), $.type),
    raw_pointer_type: ($) => seq("^", $.type),
    approx_type: ($) => seq("~", $.type),
    variadic_type: ($) => seq("...", $.type),
    slice_type: ($) => seq("[", "]", field("element", $.type)),
    array_type: ($) =>
      seq("[", field("size", $.array_length), "]", field("element", $.type)),
    array_length: ($) =>
      choice($.number_literal, $.identifier, $.scoped_identifier),
    map_type: ($) => seq($.map, "[", field("key", $.type), "]", field("value", $.type)),
    tuple_type: ($) => seq("(", commaSep1($.type), optional(","), ")"),
    error_union_type: ($) =>
      prec.right(
        1,
        seq(field("error", $.named_type), "!", field("value", $.type)),
      ),

    struct_type: ($) => seq("struct", "{", repeat($.field_declaration), "}"),
    field_declaration: ($) =>
      seq(
        field("name", $.identifier),
        ":",
        field("type", $.type),
        optional(seq("=", field("value", $.expression))),
        optional(";"),
      ),

    interface_type: ($) =>
      seq("interface", "{", repeat($.interface_method), "}"),
    interface_method: ($) =>
      prec.right(
        seq(
          field("name", $.identifier),
          field("parameters", $.parameter_list),
          optional(seq("->", field("result", $.type))),
          optional(";"),
        ),
      ),

    enum_type: ($) =>
      seq("enum", "{", optional(commaSep1($.identifier)), optional(","), "}"),
    union_type: ($) =>
      seq("union", "{", optional(commaSep1($.type)), optional(","), "}"),
    error_type: ($) =>
      seq("error", "{", optional(commaSep1($.identifier)), optional(","), "}"),

    scoped_identifier: ($) =>
      prec.left(
        seq(
          field(
            "scope",
            choice($.identifier, $.scoped_identifier, $.generic_type),
          ),
          "::",
          field("name", $.identifier),
        ),
      ),

    boolean_literal: ($) => choice("true", "false"),
    none_literal: ($) => "none",
    number_literal: ($) =>
      token(
        choice(HEX_NUMBER, OCT_NUMBER, BIN_NUMBER, IMAG_NUMBER, FLOAT_NUMBER),
      ),
    string_literal: ($) => token(/"(?:\\.|[^"\\\n])*"/),
    char_literal: ($) => token(/'(?:\\.|[^'\\\n])+'/),
    byte_literal: ($) => token(/b'(?:\\.|[^'\\\n])+'/),

    identifier: () => /[A-Za-z_][A-Za-z0-9_]*/,
    line_comment: () => token(/\/\/[^\n]*/),
    block_comment: () => token(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
