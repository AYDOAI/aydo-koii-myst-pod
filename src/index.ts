import express, {Request, Response} from 'express';
import bodyParser from 'body-parser';
import {exec} from 'child_process';
import {promisify} from 'util';
import {MystCliService} from './services/myst-cli.service';
import {MystDiscoveryService} from './services/myst-discovery.service';
import {MystRegisterNodeService} from './services/myst-register-node.service';

const execAsync = promisify(exec);
const mystService = new MystCliService();
const discoveryService = new MystDiscoveryService();
const registerNodeService = new MystRegisterNodeService();

const app = express();
const port = 8080;

// Middleware
app.use(bodyParser.json());

// In-memory storage
const submissions = new Map<number, any>();

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Working');
});

app.post('/healthz', async (req: Request, res: Response) => {
    try {
        const {stdout: psOutput} = await execAsync('ps aux | grep "/usr/bin/myst" | grep -v grep');
        const isMystRunning = psOutput.trim().length > 0;

        const {stdout: netstatOutput} = await execAsync('netstat -tuln | grep 4449');
        const isPortListening = netstatOutput.trim().length > 0;

        const healthInfo = await mystService.getHealthInfo();
        const isHealthInfoValid = healthInfo.version && healthInfo.uptime;

        console.log('--------------------------------');
        console.log('healthInfo:', healthInfo);
        console.log('isMystRunning:', isMystRunning);
        console.log('isPortListening:', isPortListening);
        console.log('isHealthInfoValid:', isHealthInfoValid);
        console.log('--------------------------------');

        if (isMystRunning && isPortListening && isHealthInfoValid) {
            res.json('OK');
        } else {
            res.status(500).json({
                status: 'ERROR',
                details: {
                    isMystRunning,
                    isPortListening,
                    isHealthInfoValid,
                    healthInfo
                }
            });
        }
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'ERROR',
            error: 'Health check failed',
            details: error
        });
    }
});

app.post('/task/:roundNumber', async (req: Request, res: Response) => {
    const roundNumber = parseInt(req.params.roundNumber);

    console.log('--------------------------------');
    console.log(`Task started for round: ${roundNumber}`);

    try {
        const [providerId, services, healthInfo, nodeStatus, natInfo] = await Promise.all([
            mystService.getProviderId(),
            mystService.getRunningServices(),
            mystService.getHealthInfo(),
            mystService.getNodeStatus(),
            mystService.getNatInfo()
        ]);

        const submission = {
            providerId: providerId,
            services: services,
            uptime: healthInfo.uptime,
            version: healthInfo.version,
            location: nodeStatus.location,
            ip: nodeStatus.ip,
            monitoringStatus: natInfo.monitoringStatus,
            natType: natInfo.natType
        };

        console.log('roundNumber:', roundNumber);
        console.log('submission:', submission);

        submissions.set(roundNumber, submission);
        res.json({
            roundNumber: roundNumber,
            status: 'Task started'
        });
    } catch (error) {
        console.log(error);
        console.error('Error collecting node data:', error);
        res.status(500).json({error: 'Error collecting node data'});
    }

    console.log('--------------------------------');
});

app.get('/submission/:roundNumber', (req: Request, res: Response) => {
    const roundNumber = parseInt(req.params.roundNumber);
    console.log(`Fetching submission for round: ${roundNumber}`);

    try {
        const submission = submissions.get(roundNumber);
        if (submission) {
            res.json({
                message: submission
            });
        } else {
            res.status(404).send('Submission not found');
        }
    } catch (error) {
        res.status(500).json({error: 'Error fetching submission'});
    }
});

app.post('/audit', async (req: Request, res: Response) => {
    console.log('--------------------------------');
    console.log('Auditing submission');

    try {
        const submission = req.body.submission;
        if (!submission || !submission.providerId) {
            console.log('Invalid submission data');
            return res.json(false);
        }

        console.log('Submission data:', submission);

        const proposals = await discoveryService.getProposalsByProviderId(submission.providerId);
        console.log('Proposals from discovery:', proposals);

        if (!proposals || proposals.length === 0) {
            console.log('No proposals found for provider');
            return res.json(false);
        }

        const proposalServiceTypes = proposals.map(p => p.service_type);
        const allServicesMatch = submission.services.every((s: string) => proposalServiceTypes.includes(s));
        if (!allServicesMatch) {
            console.log('Not all services from submission found in proposals');
            return res.json(false);
        }

        const allProviderIdsMatch = proposals.every(p => p.provider_id === submission.providerId);
        if (!allProviderIdsMatch) {
            console.log('ProviderId mismatch in proposals');
            return res.json(false);
        }

        res.json(true);
    } catch (error) {
        console.error('Error during audit:', error);
        console.log('--------------------------------');
        res.json(false);
    }
});

let registrationTriggered = false;
let monitorInterval: NodeJS.Timeout | null = null;

async function monitorAndRegisterNode() {
    try {
        const identityId = await registerNodeService.getIdentityId();
        const state = await registerNodeService.getNodeState();

        const identities = state?.payload?.identities || [];
        const found = identities.find((i: any) => i.id === identityId);

        if (!found) {
            console.log(`[monitor] Identity ${identityId} not found in node state`);
            return;
        }

        console.log(`[monitor] Identity found:`, found);

        if (found.registration_status === 'Unregistered') {
            if (!registrationTriggered) {
                registrationTriggered = true;
                console.log(`[monitor] Identity ${identityId} is Unregistered, running registration...`);
                try {
                    const result = await registerNodeService.run();
                    console.log('[monitor] Registration result:', result);
                } catch (err) {
                    console.error('[monitor] Registration failed:', err);
                }
            } else {
                console.log('[monitor] Registration already triggered, skipping...');
            }
        } else if (
            found.registration_status === 'InProgress' ||
            found.registration_status === 'Registered'
        ) {
            console.log(`[monitor] Registration status is ${found.registration_status}, stopping monitor interval.`);
            if (monitorInterval) {
                clearInterval(monitorInterval);
                monitorInterval = null;
            }
        } else {
            console.log(`[monitor] Identity ${identityId} status: ${found.registration_status}`);
        }
    } catch (err) {
        console.error('[monitor] Error in monitorAndRegisterNode:', err);
    }
}

monitorInterval = setInterval(monitorAndRegisterNode, 60_000);
monitorAndRegisterNode();

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
}); 