
// This is a Vercel Serverless Function that acts as a simple API
// for reading and writing the application's data to Vercel Blob storage.

import { put, head } from '@vercel/blob';

// Ensure the ID provided by the client is safe and strictly used as a filename
async function sanitizeFilename(vaultId: string): Promise<string> {
    // The client sends a SHA-256 hash. We hash it again on the server for extra safety.
    const encoder = new TextEncoder();
    const data = encoder.encode(vaultId + "vercel_vault_salt");
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const finalHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `vault_${finalHash}.json`;
}

export default async function handler(req: any, res: any) {
    const vaultId = req.headers['x-vault-key'];
    const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

    if (!BLOB_TOKEN) {
        console.error("Missing BLOB_READ_WRITE_TOKEN");
        return res.status(500).json({ error: 'Storage not configured. Check Vercel Blob settings.' });
    }

    if (!vaultId) {
        return res.status(401).json({ error: 'Identification required' });
    }

    const filename = await sanitizeFilename(vaultId);
    const BLOB_STORE_URL = `https://blob.vercel-storage.com/${filename}`;
    const headers = {
        'Authorization': `Bearer ${BLOB_TOKEN}`,
    };

    // GET /api/data - Retrieve
    if (req.method === 'GET') {
        try {
            const blobResponse = await fetch(BLOB_STORE_URL, {
                method: 'GET',
                headers: headers,
            });

            if (blobResponse.status === 404) {
                return res.status(200).json({});
            }
            
            if (!blobResponse.ok) {
                 throw new Error(`Cloud storage error: ${blobResponse.statusText}`);
            }

            const data = await blobResponse.json();
            return res.status(200).json(data);

        } catch (error: any) {
            console.error('Retrieval error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // POST /api/data - Save
    if (req.method === 'POST') {
        try {
            const blobResponse = await fetch(BLOB_STORE_URL, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                    'x-add-random-suffix': 'false', 
                },
                body: JSON.stringify(req.body),
            });

            if (!blobResponse.ok) {
                throw new Error(`Upload error: ${blobResponse.statusText}`);
            }

            return res.status(200).json({ success: true });

        } catch (error: any) {
            console.error('Save error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
