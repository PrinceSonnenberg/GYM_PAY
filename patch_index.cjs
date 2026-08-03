const fs = require('fs');
let code = fs.readFileSync('index.tsx', 'utf-8');
code = code.replace(`import { DataProvider } from './context/DataContext';`, `import { DataProvider } from './context/DataContext';\nimport { ThemeProvider } from './components/ThemeProvider';`);
code = code.replace(`<App />`, `<ThemeProvider><App /></ThemeProvider>`);
fs.writeFileSync('index.tsx', code);
