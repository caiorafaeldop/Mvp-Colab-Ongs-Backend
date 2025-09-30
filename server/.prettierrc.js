/**
 * Configuração Prettier
 */

module.exports = {
  // Básico
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  
  // Quebras de linha
  printWidth: 100,
  endOfLine: 'lf',
  
  // Objetos e arrays
  bracketSpacing: true,
  arrowParens: 'always',
  
  // Arquivos específicos
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
      },
    },
  ],
};
