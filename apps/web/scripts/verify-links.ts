
import { scrapeUrl } from '../lib/scraper';
import { classifyContent } from '../lib/ai';
import * as fs from 'fs';
import * as path from 'path';

// Mock env for testing
process.env.ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || 'mock-key';

async function main() {
        const linksPath = path.join(process.cwd(), '../../LINKS.md');
        const linksContent = fs.readFileSync(linksPath, 'utf-8');
        const urls = linksContent.split('\n').filter(line => line.startsWith('http')).map(line => line.trim());

        console.log(`Analyzing ${urls.length} links from LINKS.md...`);
        const results = [];

        for (const url of urls) {
                console.log(`Processing: ${url}`);
                try {
                        const scraped = await scrapeUrl(url);
                        // Simulate AI classification (or run real if key exists)
                        const classification = await classifyContent(url, scraped.content, scraped.imageUrl);

                        results.push({
                                url,
                                title: scraped.title,
                                cleanContentPrefix: scraped.content.substring(0, 100).replace(/\n/g, ' '),
                                tags: classification.tags,
                                summary: classification.summary
                        });
                } catch (e) {
                        console.error(`Failed ${url}:`, e);
                        results.push({ url, error: e.message });
                }
        }

        console.table(results);

        // Output markdown report
        const report = `# Link Analysis Report
    
| URL | Title | Tags | Content Handling |
|-----|-------|------|------------------|
${results.map(r => r.error
                ? `| ${r.url} | ERROR | - | ${r.error} |`
                : `| ${r.url} | ${r.title} | ${r.tags.join(', ')} | ${r.cleanContentPrefix}... |`
        ).join('\n')}
`;

        fs.writeFileSync(path.join(process.cwd(), 'LINK_ANALYSIS.md'), report);
        console.log('Report saved to LINK_ANALYSIS.md');
}

main().catch(console.error);
