const fs = require('fs');

function processFile(p, replacers) {
  let c = fs.readFileSync(p, 'utf8');
  for (const [r, target] of replacers) {
    c = c.replace(r, target);
  }
  fs.writeFileSync(p, c, 'utf8');
}

// 1. Update index.tsx
processFile('v:/Expense tracker/mobile/app/(tabs)/index.tsx', [
  [/\${/g, '₹{'], // all interpolations start with ₹{
  [/\+\"\}\$/g, '+"}₹'], // Fix expense formatting +$ -> +₹
  [/\-\" \: \"\+\"\}\$/g, '\"-\" : \"+\"}₹'], // More robust fix for signs
  [
    /className=\"flex-1 rounded-2xl border border-white\/10 bg-white\/5 p-4\"/g, 
    'className="flex-1 rounded-2xl border border-blue-500/50 bg-slate-950 p-4 shadow-sm"'
  ],
  [/<Text className=\"text-xs text-white\\/70\">\\s*Today\\s*<\\/Text>/, '<Text className="text-xs font-medium text-purple-300">Today\\'s spend</Text>'],
  [/<Text className=\"text-xs text-white\/70\">\s*This month\s*<\/Text>/, '<Text className="text-xs font-medium text-indigo-300">This month</Text>'],
  [/className=\"mt-3 rounded-2xl border border-white\/10 bg-white\/5 p-4\"/, 'className="mt-3 rounded-2xl border border-emerald-500/50 bg-slate-950 p-4 shadow-sm"'],
  [/<Text className=\"text-xs text-white\/70\">\s*Budget\s*<\/Text>/, '<Text className="text-xs font-medium text-emerald-300">Budget</Text>'],
  [/className=\"mt-3 h-2 w-full overflow-hidden rounded-full bg-white\/10\"/, 'className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10"']
]);

// 2. Update expenses.tsx
processFile('v:/Expense tracker/mobile/app/(tabs)/expenses.tsx', [
  [/\${/g, '₹{'],
  [/\+\"\}\$/g, '+"}₹'],
  [
    /<View className=\"mt-4 rounded-2xl border border-white\/10 bg-white\/5 p-4\">/, 
    '<View className="mt-4 rounded-2xl border border-purple-500/50 bg-slate-950 p-4 shadow-sm">'
  ],
  [/<Text className=\"text-sm font-medium text-white\">\s*Add transaction\s*<\/Text>/, '<Text className="text-sm font-semibold text-purple-300">Add transaction</Text>']
]);

// 3. Update analytics.tsx
// wait, I don't have analytics.tsx replacements exactly yet, but I'll just change $ to ₹
processFile('v:/Expense tracker/mobile/app/(tabs)/analytics.tsx', [
  [/\${/g, '₹{'],
]);

console.log("Done");