const fs = require('fs');
let code = fs.readFileSync('pages/HomePage.tsx', 'utf-8');

// The file is currently messed up with unclosed braces.
// Instead of trying to reverse my exact patches, I'll remove all the conditional logic I added 
// (which looks like `{(settings.homePreferences?... ?? true) && (` and `)}`)
// and re-apply them correctly.

// Strip out my additions
code = code.replace(/\{\(settings\.homePreferences\?\.[a-zA-Z]+ \?\? true\) && \(/g, '');
// For the PendingInvoices one, which is slightly different
code = code.replace(/\{\(settings\.homePreferences\?\.showPendingInvoices \?\? true\) && pendingInvoices\.length > 0 && \(/g, '{pendingInvoices.length > 0 && (');

// Remove all standalone `)}` that might be left over from my patching.
// This is risky if there are legitimate `)}` from other things (like `.map()`).
// Let's be very specific: remove `)}` that are between `</section>` and `<section`.

code = code.replace(/<\/section>\s*\)\}\s*<section/g, '</section>\n                <section');
// And between `</section>` and `</main>`
code = code.replace(/<\/section>\s*\)\}\s*<\/main>/g, '</section>\n            </main>');
code = code.replace(/<\/section>\s*\)\}\s*\)\}\s*<\/main>/g, '</section>\n            </main>');

// Now add the settings destructuring if missing
if (!code.includes('const { settings, clients')) {
    code = code.replace('const { clients', 'const { settings, clients');
}

// Now inject correctly by splitting the code at <section> boundaries.
let sections = code.split('<section');
// sections[0] is everything up to the first <section
// 1 = Revenue
// 2 = Income Trend
// 3 = Quick Actions
// 4 = Today's Schedule
// 5 = Recent Expenses
// 6 = Pending Invoices (conditional)

if (sections.length === 7) {
    sections[1] = `{(settings.homePreferences?.showRevenue ?? true) && (\n                <section` + sections[1].replace(/<\/section>\s*$/, '</section>\n                )}');
    sections[2] = `\n                {(settings.homePreferences?.showIncomeTrend ?? true) && (\n                <section` + sections[2].replace(/<\/section>\s*$/, '</section>\n                )}');
    sections[3] = `\n                {(settings.homePreferences?.showQuickActions ?? true) && (\n                <section` + sections[3].replace(/<\/section>\s*$/, '</section>\n                )}');
    sections[4] = `\n                {(settings.homePreferences?.showSchedule ?? true) && (\n                <section` + sections[4].replace(/<\/section>\s*$/, '</section>\n                )}');
    sections[5] = `\n                {(settings.homePreferences?.showExpenses ?? true) && (\n                <section` + sections[5].replace(/<\/section>\s*$/, '</section>\n                )}');
    
    // The 6th section already has a condition in the original: `{pendingInvoices.length > 0 && (`
    // Wait, let's look at sections[6]. It starts with `>` because we split by `<section`.
    // It's preceded by `{pendingInvoices.length > 0 && (` in `sections[5]`.
    // So sections[5] ends with `\n                {pendingInvoices.length > 0 && (`
    // No, we split by `<section`. So the `{pendingInvoices.length > 0 && (` is at the end of sections[5].
    sections[5] = sections[5].replace(/\{pendingInvoices\.length > 0 && \(\s*$/, '');
    
    // Now sections[6] just has `>...`
    sections[6] = `\n                {(settings.homePreferences?.showPendingInvoices ?? true) && pendingInvoices.length > 0 && (\n                <section` + sections[6];
    
    code = sections.join('');
    fs.writeFileSync('pages/HomePage.tsx', code);
    console.log("Success rewriting sections.");
} else {
    console.log("Section length mismatch: " + sections.length);
}

