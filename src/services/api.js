/**
 * API Client Service
 * Communicates with the DNA Genesis backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class APIClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.isAvailable = null;
    }

    async checkAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });

            if (response.ok) {
                const data = await response.json();
                this.isAvailable = data.database === 'loaded';
                return this.isAvailable;
            }
            this.isAvailable = false;
            return false;
        } catch (error) {
            this.isAvailable = false;
            return false;
        }
    }

    async getStats() {
        const response = await fetch(`${this.baseUrl}/api/stats`);
        if (!response.ok) throw new Error('Failed to get stats');
        return response.json();
    }

    async getSNP(rsid) {
        const response = await fetch(`${this.baseUrl}/api/snp/${encodeURIComponent(rsid)}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Failed to get SNP');
        }
        return response.json();
    }

    async searchSNPs(query, limit = 50) {
        const response = await fetch(
            `${this.baseUrl}/api/snp?q=${encodeURIComponent(query)}&limit=${limit}`
        );
        if (!response.ok) throw new Error('Failed to search SNPs');
        return response.json();
    }

    async analyzeFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/api/analyze`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Analysis failed');
        }

        return response.json();
    }
}

// Singleton instance
export const apiClient = new APIClient();
export default apiClient;
