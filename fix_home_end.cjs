const fs = require('fs');
let code = fs.readFileSync('pages/HomePage.tsx', 'utf-8');

code = code.replace(
`                    </section>
            </main>`,
`                    </section>
                )}
            </main>`
);

fs.writeFileSync('pages/HomePage.tsx', code);
