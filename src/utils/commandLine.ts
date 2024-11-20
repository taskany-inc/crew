import readline from 'readline';

export const askQuestion = async (query: string): Promise<string> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

export const askConfirmation = async (query: string): Promise<boolean> => {
    const answer = await askQuestion(`${query} y/N: `);
    return answer === 'Y' || answer === 'y';
};
