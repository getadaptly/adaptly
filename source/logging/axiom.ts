import { getEnv } from '@adaptly/env';
import { Client } from '@axiomhq/axiom-node';

const axiom = new Client({
    token: getEnv('AXIOM_TOKEN'),
    orgId: getEnv('AXIOM_ORG_ID')
});

export { axiom };
