const fs = require('fs');

const files = [
    'v:/Expense tracker/mobile/app/(tabs)/index.tsx',
    'v:/Expense tracker/mobile/app/(tabs)/expenses.tsx',
    'v:/Expense tracker/mobile/app/(tabs)/analytics.tsx'
];

for (const p of files) {
    if (!fs.existsSync(p)) continue;
    let code = fs.readFileSync(p, 'utf8');
    
    // Replace $ with ₹ in JSX expressions and strings explicitly
    code = code.replace(/\$\\?\{/g, '₹{');
    code = code.replace(/>\$/g, '>₹');
    code = code.replace(/-\$/g, '-₹');
    code = code.replace(/\+\$/g, '+₹');
    code = code.replace(/'\$'/g, "'₹'");
    code = code.replace(/"\$"/g, '"₹"');
    code = code.replace(/`\$`/g, '`₹`');

    // Update basic card styles
    code = code.replace(/border-white\/10 bg-white\/5/g, 'border-purple-500/50 bg-slate-950 p-4 shadow-sm');
    code = code.replace(/text-white\/70/g, 'font-medium text-slate-300');
    code = code.replace(/text-white/g, 'text-slate-100');

    // Make expenses look slightly different
    if (p.includes('expenses.tsx')) {
        code = code.replace(/border-purple-500\/50 bg-slate-950 p-4 shadow-sm/g, 'border-blue-500/50 bg-slate-950 p-4 shadow-md');
    }

    fs.writeFileSync(p, code, 'utf8');
}

console.log('Mobile index, expenses, analytics updated!');
