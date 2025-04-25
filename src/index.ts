import express, {Request, Response} from 'express';
import Database from 'better-sqlite3';
import bodyParser from 'body-parser';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

const app = express();
const port = 8080;
const DATABASE = "results.db";

// Middleware
app.use(bodyParser.json());

// Database setup
const db = new Database(DATABASE);

// Initialize database
db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
        roundNumber INTEGER PRIMARY KEY,
        submission TEXT
    )
`);

// Types
interface Submission {
    roundNumber: number;
    submission: string;
}

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Working');
});

app.post('/healthz', async (req: Request, res: Response) => {
    try {
        const {stdout: psOutput} = await execAsync('ps aux | grep "myst service" | grep -v grep');
        const isMystRunning = psOutput.trim().length > 0;

        const {stdout: netstatOutput} = await execAsync('netstat -tuln | grep 4449');
        const isPortListening = netstatOutput.trim().length > 0;

        if (isMystRunning && isPortListening) {
            res.send('OK');
        } else {
            res.status(500).send('Myst node is not running properly');
        }
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).send('Health check failed');
    }
});

app.post('/task/:roundNumber', (req: Request, res: Response) => {
    const roundNumber = parseInt(req.params.roundNumber);
    console.log(`Task started for round: ${roundNumber}`);

    try {
        const stmt = db.prepare('INSERT OR IGNORE INTO submissions (roundNumber, submission) VALUES (?, ?)');
        stmt.run(roundNumber, 'Hello World!');
        res.json({roundNumber, status: 'Task started'});
    } catch (error) {
        res.status(500).json({error: 'Database error'});
    }
});

app.get('/submission/:roundNumber', (req: Request, res: Response) => {
    const roundNumber = parseInt(req.params.roundNumber);
    console.log(`Fetching submission for round: ${roundNumber}`);

    try {
        const stmt = db.prepare('SELECT * FROM submissions WHERE roundNumber = ?');
        const result = stmt.get(roundNumber) as Submission | undefined;

        if (result) {
            res.json({message: result.submission});
        } else {
            res.status(404).send('Submission not found');
        }
    } catch (error) {
        res.status(500).json({error: 'Database error'});
    }
});

app.post('/audit', (req: Request, res: Response) => {
    console.log('Auditing submission');
    const auditResult = req.body.submission?.message === 'Hello World!';
    res.json(auditResult);
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
}); 