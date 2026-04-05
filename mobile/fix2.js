const fs = require('fs');

const files = [
    'v:/Expense tracker/mobile/app/(tabs)/index.tsx',
    'v:/Expense tracker/mobile/app/(tabs)/expenses.tsx',
    'v:/Expense tracker/mobile/app/(tabs)/analytics.tsx'
];

for (const p of files) {
    if (!fs.existsSync(p)) continue;
    let code = fs.readFileSync(p, 'utf8');
    
    // fix template literals that got wrongly converted to ₹{
    code = code.replace(/`₹\{/g, '`${');
    code = code.replace(/className=\{?`([^`]+)`\}?/g, (match, inner) => {
        return match.replace(/₹\{/g, '${');
    });
    code = code.replace(/style=\{\{\s*width:\s*`([^`]+)\%`\s*\}\}/g, (match) => {
        return match.replace(/₹\{/g, '${');
    });

    if (p.includes('expenses.tsx')) {
        // Need to ensure expenses.tsx handles `date` properly as `string` since the TextInput takes a string. 
        // wait, `const [date, setDate] = useState(new Date())` was what it probably used to be.
        // It failed previously because I mistakenly replaced a `$`. Let's just fix `value={date}`
        if(!code.includes('value={date.toISOString()')) {
             code = code.replace('value={date}', 'value={typeof date === "string" ? date : (date instanceof Date ? date.toISOString().split("T")[0] : String(date))}');
             code = code.replace('onChangeText={setDate}', 'onChangeText={setDate as any}');
        }
    }
    
    fs.writeFileSync(p, code, 'utf8');
}
