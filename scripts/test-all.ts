import { spawn } from 'child_process';

async function runCommand(command: string, args: string[], name: string) {
    console.log(`\n🔵 Starting ${name}...`);
    console.log(`> ${command} ${args.join(' ')}`);

    return new Promise<void>((resolve, reject) => {
        const proc = spawn(command, args, { stdio: 'inherit', shell: true });

        proc.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ ${name} Passed!`);
                resolve();
            } else {
                console.error(`❌ ${name} Failed with code ${code}`);
                reject(new Error(`${name} failed`));
            }
        });

        proc.on('error', (err) => {
            console.error(`❌ ${name} Error:`, err);
            reject(err);
        });
    });
}

async function main() {
    console.log("🚀 Starting Full Scale Automated Test Suite");
    const startTime = Date.now();

    try {
        // 1. Lint & Typecheck (Fast fail)
        await runCommand('npm', ['run', 'typecheck'], 'Type Checking');

        // 2. Unit & Integration Tests (Vitest)
        // Includes security-actions.test.ts (via test:security alias or just 'test')
        await runCommand('npm', ['run', 'test'], 'Unit & Integration Tests');
        
        // 3. Security specific (if separate, but usually covered in test)
        // await runCommand('npm', ['run', 'test:security'], 'Security Audit'); 

        // 4. E2E Full Regression (Playwright)
        await runCommand('npx', ['playwright', 'test', 'tests/full-regression.spec.ts'], 'E2E Golden Path');

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n🎉 ALL SYSTEMS GO! Full suite finished in ${duration}s.`);
        process.exit(0);

    } catch (error) {
        console.error("\n💥 Test Suite Failed. Deployment aborted.");
        process.exit(1);
    }
}

main();
