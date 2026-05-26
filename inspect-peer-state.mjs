import fs from 'fs';
import path from 'path';

const PEER_STATE_PATH = 'I:/AEGIS-ADAM-ONE/AEGIS-DATAQUAD-PEER/adam-one-peer-project/data/peer/peer-state.json';

try {
    if (!fs.existsSync(PEER_STATE_PATH)) {
        console.error(`Error: File not found at ${PEER_STATE_PATH}`);
        process.exit(1);
    }
    
    console.log(`Reading ${PEER_STATE_PATH}...`);
    const stats = fs.statSync(PEER_STATE_PATH);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    const state = JSON.parse(fs.readFileSync(PEER_STATE_PATH, 'utf8'));
    
    console.log('\n=== STATE CLOCK ===');
    console.log(JSON.stringify(state.clock, null, 2));
    
    console.log('\n=== RECORD COUNTS ===');
    const counts = {};
    for (const tensor in state.records) {
        counts[tensor] = state.records[tensor]?.length || 0;
    }
    console.log(JSON.stringify(counts, null, 2));
    
    console.log('\n=== LATEST PEER RECORDS ===');
    const peerRecords = state.records?.PEER || [];
    console.log(`Total PEER records: ${peerRecords.length}`);
    if (peerRecords.length > 0) {
        const sortedPeer = [...peerRecords].sort((a, b) => (b.clock?.tick || 0) - (a.clock?.tick || 0));
        console.log(`Latest 5 PEER records:`);
        sortedPeer.slice(0, 5).forEach((r, idx) => {
            console.log(`  [${idx + 1}] ID: ${r.id}, Tick: ${r.clock?.tick || 0}, Timestamp: ${r.timestamp || r.createdAt || r.clock?.advancedAt}`);
            console.log(`      Facet: ${r.facetId || r.presentState?.facetId || r.sessionId}`);
            console.log(`      Summary: ${r.summary || r.presentState?.summary || 'No summary'}`);
            console.log(`      Content snippet: ${(r.content || r.presentState?.contentSnippet || r.distilledSummary || '').slice(0, 150)}...`);
        });
    }
    
    console.log('\n=== LATEST PCT RECORDS ===');
    const pctRecords = state.records?.PCT || [];
    console.log(`Total PCT records: ${pctRecords.length}`);
    if (pctRecords.length > 0) {
        const sortedPct = [...pctRecords].sort((a, b) => (b.clock?.tick || 0) - (a.clock?.tick || 0));
        console.log(`Latest 5 PCT records:`);
        sortedPct.slice(0, 5).forEach((r, idx) => {
            console.log(`  [${idx + 1}] ID: ${r.id}, Tick: ${r.clock?.tick || 0}, Timestamp: ${r.timestamp || r.createdAt || r.clock?.advancedAt}`);
            console.log(`      Facet: ${r.facetId || r.workingContext?.facetId || r.sessionId}`);
            console.log(`      Summary: ${r.summary || r.workingContext?.summary || 'No summary'}`);
            console.log(`      Content snippet: ${(r.content || r.workingContext?.contentSnippet || r.distilledSummary || '').slice(0, 150)}...`);
        });
    }
    
    console.log('\n=== LATEST NCT RECORDS ===');
    const nctRecords = state.records?.NCT || [];
    console.log(`Total NCT records: ${nctRecords.length}`);
    if (nctRecords.length > 0) {
        const sortedNct = [...nctRecords].sort((a, b) => (b.clock?.tick || 0) - (a.clock?.tick || 0));
        console.log(`Latest 3 NCT records:`);
        sortedNct.slice(0, 3).forEach((r, idx) => {
            console.log(`  [${idx + 1}] ID: ${r.id}, Tick: ${r.clock?.tick || 0}`);
            console.log(`      Summary: ${r.summary || 'No summary'}`);
        });
    }

    console.log('\n=== SEARCHING FOR LOOPS / REPEATED ADVOCATE SYNTHESIS ===');
    const summaries = {};
    pctRecords.slice(-100).forEach(r => {
        const sum = r.summary || r.workingContext?.summary || '';
        if (sum) {
            summaries[sum] = (summaries[sum] || 0) + 1;
        }
    });
    console.log("Recent PCT summaries frequency (most frequent first):");
    Object.entries(summaries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([sum, count]) => {
            if (count > 1) {
                console.log(`  [${count} times] "${sum.slice(0, 120)}..."`);
            }
        });

} catch (error) {
    console.error(`Inspection error: ${error.stack}`);
}
