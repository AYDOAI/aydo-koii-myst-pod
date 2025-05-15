import axios from 'axios';

const SENTINEL_LOGIN = process.env.SENTINEL_LOGIN;
const SENTINEL_PASSWORD = process.env.SENTINEL_PASSWORD;
const BENEFICIARY_WALLET = process.env.BENEFICIARY_WALLET;


export class MystRegisterNodeService {
    async getIdentityId(passphrase: string = ""): Promise<string> {
        const response = await axios.put(
            'http://localhost:4050/identities/current',
            {passphrase},
            {headers: {'Content-Type': 'application/json'}}
        );
        return response.data.id;
    }

    async getAuthToken(username: string, password: string, pool: string = "external"): Promise<string> {
        const response = await axios.post(
            'https://sentinel.mysterium.network/api/v1/auth/password',
            {username, password, pool},
            {headers: {'Content-Type': 'application/json'}}
        );
        return response.data.auth_token;
    }

    async registerIdentity(authToken: string, identityId: string): Promise<boolean> {
        const response = await axios.post(
            'https://affiliator.mysterium.network/api/v1/free-registration/partner',
            {identity: identityId},
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: () => true
            }
        );
        return response.status === 200;
    }

    async registerBeneficiary(identityId: string, beneficiary: string, stake: number = 0): Promise<boolean> {
        const response = await axios.post(
            `http://localhost:4050/identities/${identityId}/register`,
            {beneficiary, stake},
            {
                headers: {'Content-Type': 'application/json'},
                validateStatus: () => true
            }
        );
        return response.status === 202;
    }

    async setUiPassword(username: string, oldPassword: string, newPassword: string): Promise<boolean> {
        const response = await axios.put(
            'http://localhost:4050/auth/password',
            {
                username,
                old_password: oldPassword,
                new_password: newPassword
            },
            {
                headers: {'Content-Type': 'application/json'},
                validateStatus: () => true
            }
        );
        return response.status === 200;
    }

    async getNodeState(): Promise<any> {
        const response = await axios.get('http://localhost:4050/events/state', {
            responseType: 'stream',
            headers: {'Accept': 'text/event-stream'}
        });

        return new Promise((resolve, reject) => {
            response.data.on('data', (chunk: Buffer) => {
                const str = chunk.toString();
                const matches = str.match(/^data: (.*)$/gm);
                if (matches) {
                    for (const line of matches) {
                        const jsonStr = line.replace(/^data: /, '').trim();
                        if (!jsonStr) continue;
                        try {
                            const parsed = JSON.parse(jsonStr);
                            resolve(parsed);
                            response.data.destroy();
                            return;
                        } catch (e) {
                            continue;
                        }
                    }
                }
            });
            response.data.on('error', reject);
        });
    }

    async run(): Promise<{
        identityId: string,
        authToken: string,
        identityRegistered: boolean,
        beneficiaryRegistered: boolean
    }> {
        if (!SENTINEL_LOGIN || !SENTINEL_PASSWORD || !BENEFICIARY_WALLET) {
            throw new Error('Environment variables are not set');
        }

        const identityId = await this.getIdentityId();
        console.log('Identity ID:', identityId);

        const authToken = await this.getAuthToken(SENTINEL_LOGIN, SENTINEL_PASSWORD);
        console.log('Auth token:', authToken);

        const identityRegistered = await this.registerIdentity(authToken, identityId);
        console.log('Identity registered:', identityRegistered);

        const beneficiaryRegistered = await this.registerBeneficiary(identityId, BENEFICIARY_WALLET, 0);
        console.log('Beneficiary registered:', beneficiaryRegistered);

        return {
            identityId,
            authToken,
            identityRegistered,
            beneficiaryRegistered
        };
    }
}
