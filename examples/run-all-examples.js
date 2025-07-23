#!/usr/bin/env node

/**
 * Script to run all example programs in the examples directory
 * This helps verify that all examples are working correctly
 */

import { spawn } from 'child_process';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

/**
 * Run a single example file
 */
async function runExample(filename) {
    return new Promise((resolve) => {
        console.log(`\n${colors.bright}${colors.blue}Running: ${filename}${colors.reset}`);
        console.log(`${colors.gray}${'='.repeat(50)}${colors.reset}`);
        
        const startTime = Date.now();
        const extension = filename.endsWith('.ts') ? '.ts' : '.js';
        const command = extension === '.ts' ? join(__dirname, '..', 'node_modules', '.bin', 'tsx') : 'node';
        
        const child = spawn(command, [join(__dirname, filename)], {
            stdio: 'pipe',
            detached: false
        });
        
        let output = '';
        let errorOutput = '';
        
        child.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        });
        
        child.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            process.stderr.write(`${colors.red}${text}${colors.reset}`);
        });
        
        
        // Timeout after 30 seconds
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            console.log(`${colors.yellow}⚠ Timeout after 30 seconds${colors.reset}`);
            resolve({ 
                filename, 
                success: false, 
                error: 'Timeout after 30 seconds' 
            });
        }, 30000);
        
        // Clear timeout when process completes
        child.on('close', (code) => {
            clearTimeout(timeout);
            const duration = Date.now() - startTime;
            
            if (code === 0) {
                console.log(`${colors.gray}${'='.repeat(50)}${colors.reset}`);
                console.log(`${colors.green}✓ Completed successfully in ${duration}ms${colors.reset}`);
                resolve({ 
                    filename, 
                    success: true, 
                    duration,
                    output: output.slice(0, 200) // First 200 chars for summary
                });
            } else {
                console.log(`${colors.gray}${'='.repeat(50)}${colors.reset}`);
                console.log(`${colors.red}✗ Failed with exit code ${code} after ${duration}ms${colors.reset}`);
                resolve({ 
                    filename, 
                    success: false, 
                    exitCode: code,
                    duration,
                    error: errorOutput.slice(0, 200) // First 200 chars of error
                });
            }
        });
        
        child.on('error', (error) => {
            clearTimeout(timeout);
            console.log(`${colors.red}✗ Failed to start: ${error.message}${colors.reset}`);
            resolve({ 
                filename, 
                success: false, 
                error: error.message 
            });
        });
    });
}

/**
 * Main function to run all examples
 */
async function main() {
    console.log(`${colors.bright}${colors.blue}Graph Algorithms Examples Runner${colors.reset}`);
    console.log(`${colors.gray}Running all example files in the examples directory...${colors.reset}\n`);
    
    try {
        // Get all example files
        const files = await readdir(__dirname);
        const exampleFiles = files.filter(file => 
            (file.endsWith('.js') || file.endsWith('.ts')) && 
            file !== 'run-all-examples.js' &&
            !file.includes('.d.ts') &&
            !file.includes('.map')
        ).sort();
        
        console.log(`Found ${colors.yellow}${exampleFiles.length}${colors.reset} example files to run.\n`);
        
        // Run examples sequentially to avoid overwhelming the system
        const results = [];
        for (const file of exampleFiles) {
            const result = await runExample(file);
            results.push(result);
        }
        
        // Print summary
        console.log(`\n${colors.bright}${colors.blue}Summary${colors.reset}`);
        console.log(`${colors.gray}${'='.repeat(50)}${colors.reset}`);
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        console.log(`${colors.green}✓ Successful: ${successful.length}${colors.reset}`);
        console.log(`${colors.red}✗ Failed: ${failed.length}${colors.reset}`);
        
        if (failed.length > 0) {
            console.log(`\n${colors.red}Failed examples:${colors.reset}`);
            failed.forEach(result => {
                console.log(`  - ${result.filename}: ${result.error || `Exit code ${result.exitCode}`}`);
            });
        }
        
        // Calculate total time
        const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);
        console.log(`\n${colors.gray}Total execution time: ${totalTime}ms${colors.reset}`);
        
        // Exit with error code if any examples failed
        if (failed.length > 0) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run the main function
main().catch(error => {
    console.error(`${colors.red}Unhandled error: ${error}${colors.reset}`);
    process.exit(1);
});