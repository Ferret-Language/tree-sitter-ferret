# Tree-sitter Grammar for Ferret

Tree-sitter parser implementation for the Ferret programming language.

## Building the Grammar

### Prerequisites

```bash
npm install
```

### Generate and Compile

```bash
# Generate parser from grammar.js
npx tree-sitter generate

# Compile the parser
npx tree-sitter build

# (Optional) Test the parser
npx tree-sitter test
```

### Watch Mode

```bash
# Auto-regenerate on grammar.js changes
npx tree-sitter generate --watch
```

## Testing

```bash
# Run all tests
npx tree-sitter test

# Parse a specific file
npx tree-sitter parse path/to/file.fer
```
