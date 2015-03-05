
%{
  var VERTEX_TYPE = 'vertex';
  var EDGE_TYPE = 'edge';
  var INPUT_TYPE = 'input';
  var OUTPUT_TYPE = 'output';
  var CLASS_TYPE = 'class';
  var ATTRIBUTE_TYPE = 'attribute';

  var createVertex = function(id, expressionList) {
    var vertex = {
      'id': id,
      'classes': [],
      'metadata': {},
      'inputs': [],
      'outputs': [],
      'subGraph': {
        'vertices': [],
        'edges': []
      }
    };
    expressionList.forEach(function(expression) {
      switch (expression.type) {
        case CLASS_TYPE:
          vertex.classes.push(expression.value);
          break;
        case ATTRIBUTE_TYPE:
          vertex.metadata[expression.key] = expression.value;
          break;
        case INPUT_TYPE:
          vertex.inputs.push(expression.value);
          break;
        case OUTPUT_TYPE:
          vertex.outputs.push(expression.value);
          break;
        case VERTEX_TYPE:
          vertex.subGraph.vertices.push(expression.value);
          break;
        case EDGE_TYPE:
          vertex.subGraph.edges.push(expression.value);
          break;
      }
    });
    return {
      type: VERTEX_TYPE,
      value: vertex
    };
  };

  var createPort = function(portType, id, expressionList) {
    var port = {
      'id': id,
      'classes': [],
      'metadata': {}
    };
    expressionList.forEach(function(expression) {
      switch (expression.type) {
        case CLASS_TYPE:
          port.classes.push(expression.value);
          break;
        case ATTRIBUTE_TYPE:
          port.metadata[expression.key] = expression.value;
          break;
      }
    });
    return {
      type: portType,
      value: port
    };
  };

  var createEdge = function(id, source, target, expressionList) {
    var edge = {
      'id': id,
      'classes': [],
      'metadata': {},
      'source': source,
      'target': target
    };
    expressionList.forEach(function(expression) {
      switch (expression.type) {
        case CLASS_TYPE:
          port.classes.push(expression.value);
          break;
        case ATTRIBUTE_TYPE:
          port.metadata[expression.key] = expression.value;
          break;
      }
    });
    return {
      type: EDGE_TYPE,
      value: edge
    };
  };

  var prependListValue = function(list, value) {
    list.unshift(value);
    return list;
  };
%}

%ebnf

%nonassoc COLON_OP CONN_ARROW_OP
%left DOT_OP

%%

markup
    : definitions EOF
        {{
            $$ = $1;
            console.log( $$ );
        }}
    | EOF
        {{
            $$ = { "vertices": [], "edges": [] };
            console.log( $$ );
        }}
    ;

definitions
    : definition_expression definitions
        {{ $$ = prependListValue( $2, $1 ); }}
    | definition_expression
        {{ $$ = [$1]; }}
    ;

definition_expression
    : vertex
        {{ $$ = $1; }}
    | edge
        {{ $$ = $1; }}
    | template
        {{ $$ = $1; }}
    ;

vertex
    : VERTEX_DECL identifier apply_template vertex_body
      {{ $$ = createVertex($1, $3); }}
    ;

vertex_body
    : LBRACE vertex_expression_list RBRACE
      {{ $$ = vertex_expression_list; }}
    |
      {{ $$ = []; }}
    ;

vertex_expression_list
    : vertex_expression vertex_expression_list
        {{ $$ = prependListValue( $2, $1 ); }}
    |
        {{ $$ = []; }}
    ;

vertex_expression
    : vertex
    | edge
    | class
    | attribute
    | port
    ;

edge
    : EDGE_DECL identifier arrow_expression apply_template edge_body
      {{ $$ = createVertex($1, $2.source, $2.target, $4); }}
    ;

edge_body
    : LBRACE edge_expression_list RBRACE
      {{ $$ = edge_expression_list; }}
    |
      {{ $$ = []; }}
    ;

edge_expression_list
    : edge_expression edge_expression_list
        {{ $$ = prependListValue( $2, $1 ); }}
    |
        {{ $$ = []; }}
    ;

edge_expression
    : class
    | attribute
    ;

arrow_expression
    : port_selector CONN_ARROW_OP port_selector
    ;

port_selector
    : identifier DOT_OP identifier
    | identifier
    | SELF_REF DOT_OP identifier
    | SELF_REF
    ;

port
    : INPUT_DECL identifier apply_template port_body
      {{ $$ = createPort(INPUT_TYPE, $1, $3); }}
    | OUTPUT_DECL identifier apply_template port_body
      {{ $$ = createPort(OUTPUT_TYPE, $1, $3)}}
    ;

port_body
    : LBRACE port_expression_list RBRACE
      {{ $$ = port_expression_list; }}
    |
      {{ $$ = []; }}
    ;

port_expression_list
    : port_expression port_expression_list
       {{ $$ = prependListValue( $2, $1 ); }}
    |
       {{ $$ = []; }}
    ;

port_expression
    : class
    | attribute
    ;

template
    : TEMPLATE_DECL vertex_template
    | TEMPLATE_DECL edge_template
    | TEMPLATE_DECL port_template
    ;

vertex_template
    : VERTEX_DECL identifier vertex_body
    ;

edge_template
    : EDGE_DECL identifier edge_body
    ;

port_template
    : PORT_DECL identifier port_body
    ;

apply_template
    : IS_OP identifier
    |
    ;

class
    : CLASS_DECL string
        {{ $$ = { 'type': 'class', 'value': $2 }; }}
    ;

attribute
    : ATTR_DECL string ATTR_OP string
        {{ $$ = { 'type': 'attribute', 'key': $2, 'value': $4 }; }}
    ;

identifier
    : ID
        {{ $$ = $1; }}
    ;

string
    : STR_LITERAL
        {{ $$ = $1; }}
    ;
