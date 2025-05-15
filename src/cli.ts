import {MystRegisterNodeService} from './services/myst-register-node.service';

async function main() {
    const [, , command] = process.argv;

    switch (command) {
        case 'register-node': {
            const service = new MystRegisterNodeService();
            try {
                const result = await service.run();
                console.log('Registration result:', result);
                process.exit(0);
            } catch (err) {
                console.error('Registration failed:', err);
                process.exit(1);
            }
            break;
        }
        case 'state-node': {
            const service = new MystRegisterNodeService();
            try {
                const state = await service.getNodeState();
                console.log('Node state:', JSON.stringify(state, null, 2));
                process.exit(0);
            } catch (err) {
                console.error('State fetch failed:', err);
                process.exit(1);
            }
            break;
        }
        case 'set-password-node': {
            const readline = await import('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question('Enter new password for node UI: ', async (password) => {
                rl.close();
                const service = new MystRegisterNodeService();
                try {
                    const ok = await service.setUiPassword('myst', 'mystberry', password);
                    if (ok) {
                        console.log('Password set successfully');
                        process.exit(0);
                    } else {
                        console.error('Failed to set password');
                        process.exit(1);
                    }
                } catch (err) {
                    console.error('Password set failed:', err);
                    process.exit(1);
                }
            });
            break;
        }
        default:
            console.log('Usage: node cli.js <command>');
            console.log('Available commands:');
            console.log('  register-node     Register node in Mysterium');
            console.log('  state-node        Print node state from Tequilapi');
            console.log('  set-password-node Set password for node UI');
            process.exit(1);
    }
}

main(); 