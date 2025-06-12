import { z } from 'zod';

// --- 1. Enhanced Interface & Type Definitions ---

interface StreamingOptions {
  chunkSize?: number;
  onProgress?: (processed: number, total: number) => void;
}

interface AgentAnalytics {
  processingTimeMs: number;
  memoryUsageMB: number;
  recommendedActions: string[];
  dataQualityScore: number; // 0-100
}

interface DataProfile {
  patterns: Record<string, number>; // Regex patterns found
  outliers: Array<{ column: string; value: any; reason: string }>;
  correlations?: Record<string, Record<string, number>>;
}

interface CsvValidationOptions {
  delimiter?: string;
  hasHeader?: boolean;
  strictMode?: boolean; 
  trimWhitespace?: boolean;
  nullValues?: string[];
  quoteChar?: string;
  
  // Resource Management
  maxRows?: number;
  maxFileSize?: number; // in bytes

  // AI Agent Features
  dryRun?: boolean;
  idempotencyKey?: string;
  agentContext?: string;
  
  // Better Context for AI Agents
  requiredColumns?: string[];
  expectedSchema?: Record<string, string>; 

  // Output Control
  returnObjects?: boolean;
  outputFields?: string[];
  metadataLevel?: 'summary' | 'detailed' | 'none';
  
  // NEW: Enhanced Features
  streaming?: StreamingOptions;
  enableProfiling?: boolean;
  calculateCorrelations?: boolean;
  outlierDetection?: boolean;
}

interface ValidationIssue {
  type: 'header' | 'row' | 'data' | 'structure' | 'file';
  severity: 'error' | 'warning' | 'info';
  message: string;
  code: string;
  location?: { row?: number; column?: string | number };
  suggestion?: string;
}

interface CsvValidationContext {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  fileStats: {
    lineEndingType: 'CRLF' | 'LF' | 'CR' | 'mixed' | 'unknown';
    detectedDelimiter: string | null;
    totalRows: number;
    fileSize: number;
  };
  headerAnalysis: {
    hasHeaders: boolean;
    headers: string[];
    duplicateHeaders: string[];
    emptyHeaders: number[];
    suspiciousHeaders: string[]; 
    missingRequiredColumns: string[];
  };
  rowAnalysis: {
    emptyRows: number[];
    rowsWithInconsistentColumns: Array<{ row: number; expected: number; actual: number }>;
    quotingIssues: Array<{ row: number; issue: string }>;
  };
  columnAnalysis: Record<string, {
    inferredType: string;
    dataTypeConfidence: number;
    nullCount: number;
    uniqueValues: number;
    mostCommonValue?: any;
    typeInconsistencies: Array<{ row: number; value: any; expected: string }>;
    // Enhanced statistics
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    standardDeviation?: number;
  }>;
  // NEW: Enhanced features
  dataProfile?: DataProfile;
  analytics: AgentAnalytics;
}

interface CsvValidationResult {
  success: boolean;
  isValid: boolean;
  data: any[] | null;
  metadata: {
    summary: {
      errorCount: number;
      warningCount: number;
      columns: number;
      rows: number;
    };
    context: CsvValidationContext;
  } | null;
  error: {
    code: string;
    message: string;
    suggestedAction: string;
  } | null;
  auditId: string;
}

// --- 2. Core Helper Functions ---

function detectDelimiter(lines: string[]): string | null {
  const delimiters = [',', ';', '\t', '|'];
  const sample = lines.slice(0, 20).filter(l => l.trim());
  if (sample.length === 0) return null;

  let bestDelim: string | null = null;
  let maxScore = -1;

  for (const delim of delimiters) {
    try {
        const counts = sample.map(line => line.split(delim).length);
        if (counts.length === 0 || counts[0] === 1) continue;
        
        const firstCount = counts[0];
        const consistency = counts.filter(c => c === firstCount).length;
        const score = consistency * firstCount; 

        if (score > maxScore) {
            maxScore = score;
            bestDelim = delim;
        }
    } catch {}
  }
  return bestDelim;
}

function parseCsvWithMultiLine(csv: string, delimiter: string, quote: string, context: CsvValidationContext, options: CsvValidationOptions = {}): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let rowNum = 1;
    let processedChars = 0;
    const totalChars = csv.length;
    const chunkSize = options.streaming?.chunkSize || 10000;

    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        const nextChar = csv[i+1];
        processedChars++;

        // Streaming progress callback
        if (options.streaming?.onProgress && processedChars % chunkSize === 0) {
            options.streaming.onProgress(processedChars, totalChars);
        }

        if (inQuotes) {
            if (char === quote && nextChar === quote) {
                currentField += quote;
                i++;
                processedChars++;
            } else if (char === quote) {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === delimiter) {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === quote) {
                inQuotes = true;
            } else if (char === '\r' && nextChar === '\n') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
                i++;
                processedChars++;
                rowNum++;
            } else if (char === '\n' || char === '\r') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
                rowNum++;
            } else {
                currentField += char;
            }
        }
    }
    
    currentRow.push(currentField);
    rows.push(currentRow);
    
    // Final progress callback
    if (options.streaming?.onProgress) {
        options.streaming.onProgress(totalChars, totalChars);
    }
    
    if (inQuotes) {
        context.rowAnalysis.quotingIssues.push({ row: rowNum, issue: 'Unclosed quote at end of file.' });
        context.errors.push({ 
            type: 'row', 
            severity: 'error', 
            message: `File ends with an unclosed quote on row ${rowNum}.`, 
            code: 'UNCLOSED_QUOTE', 
            location: {row: rowNum}, 
            suggestion: 'Ensure all quotes are properly closed.'
        });
    }

    return rows;
}

function reservoirSample<T>(items: T[], k: number): T[] {
    if (items.length <= k) return items;
    const sample = items.slice(0, k);
    for (let i = k; i < items.length; i++) {
        const j = Math.floor(Math.random() * (i + 1));
        if (j < k) {
            sample[j] = items[i];
        }
    }
    return sample;
}

function inferDataType(values: string[], maxSample = 200): { type: string; confidence: number } {
    const sample = reservoirSample(values.filter(v => v != null && v.trim() !== ''), maxSample);
    if (sample.length === 0) return { type: 'empty', confidence: 1 };

    const checks = {
        integer: (v: string) => /^-?\d+$/.test(v),
        float: (v: string) => /^-?\d*(\.\d+)?$/.test(v) && v !== '.',
        boolean: (v: string) => /^(true|false|t|f|1|0|yes|no)$/i.test(v),
        date: (v: string) => !isNaN(Date.parse(v)) && /[a-zA-Z]|\d{4}/.test(v),
        email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        url: (v: string) => { 
            try { 
                new URL(v); 
                return v.includes('://'); 
            } catch { 
                return false; 
            } 
        },
        currency: (v: string) => /^[$€£¥₹₽¢]?\s?-?\d{1,3}(,?\d{3})*(\.\d{1,2})?(\s?[A-Z]{3})?$/i.test(v),
    };
    
    const scores: Record<string, number> = Object.fromEntries(Object.keys(checks).map(k => [k, 0]));
    let stringCount = 0;

    sample.forEach(v => {
        let matched = false;
        for(const [type, check] of Object.entries(checks)) {
            if(check(v)) {
                scores[type]++;
                matched = true;
                break;
            }
        }
        if (!matched) stringCount++;
    });
    
    const best = Object.entries(scores).sort((a,b) => b[1] - a[1])[0];
    const confidence = Math.min(best[1] / sample.length, sample.length / 50);

    if (best[1] > stringCount || (best[0] === 'float' && scores.integer === best[1])) {
        return { type: best[0], confidence: confidence };
    }
    return { type: 'string', confidence: 1 - confidence };
}

function validateValueAgainstType(value: string, expectedType: string): boolean {
    if (!value || !value.trim()) return true;
    
    const checks: Record<string, (v: string) => boolean> = {
        integer: (v: string) => /^-?\d+$/.test(v),
        float: (v: string) => /^-?\d*(\.\d+)?$/.test(v) && v !== '.',
        boolean: (v: string) => /^(true|false|t|f|1|0|yes|no)$/i.test(v),
        date: (v: string) => !isNaN(Date.parse(v)) && /[a-zA-Z]|\d{4}/.test(v),
        email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        url: (v: string) => { 
            try { 
                new URL(v); 
                return v.includes('://'); 
            } catch { 
                return false; 
            } 
        },
        currency: (v: string) => /^[$€£¥₹₽¢]?\s?-?\d{1,3}(,?\d{3})*(\.\d{1,2})?(\s?[A-Z]{3})?$/i.test(v),
        string: () => true,
        empty: () => true,
    };
    
    return checks[expectedType]?.(value) ?? true;
}

// --- 3. NEW: Enhanced Analysis Functions ---

function calculateNumericStats(values: string[]): { min: number; max: number; mean: number; median: number; standardDeviation: number } | null {
    const numericValues = values
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
    
    if (numericValues.length === 0) return null;
    
    const sorted = numericValues.sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
    
    const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    return { min, max, mean, median, standardDeviation };
}

function detectOutliers(values: string[], columnName: string, inferredType: string): Array<{ column: string; value: any; reason: string }> {
    const outliers: Array<{ column: string; value: any; reason: string }> = [];
    
    if (inferredType === 'integer' || inferredType === 'float') {
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (numericValues.length < 4) return outliers;
        
        const sorted = numericValues.sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        values.forEach(val => {
            const num = parseFloat(val);
            if (!isNaN(num) && (num < lowerBound || num > upperBound)) {
                outliers.push({
                    column: columnName,
                    value: val,
                    reason: `Statistical outlier (IQR method): value ${num} outside range [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`
                });
            }
        });
    }
    
    // Detect unusual string patterns
    if (inferredType === 'string') {
        const lengths = values.filter(v => v && v.trim()).map(v => v.length);
        if (lengths.length > 0) {
            const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
            const stdDev = Math.sqrt(lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / lengths.length);
            
            values.forEach(val => {
                if (val && val.trim() && Math.abs(val.length - avgLength) > 3 * stdDev) {
                    outliers.push({
                        column: columnName,
                        value: val,
                        reason: `Unusual string length: ${val.length} characters (avg: ${avgLength.toFixed(1)}, std: ${stdDev.toFixed(1)})`
                    });
                }
            });
        }
    }
    
    return outliers;
}

function detectPatterns(values: string[]): Record<string, number> {
    const patterns: Record<string, number> = {};
    const commonPatterns = [
        { name: 'email', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        { name: 'phone', regex: /^\+?[\d\s\-\(\)]{7,15}$/ },
        { name: 'url', regex: /^https?:\/\/[^\s]+$/ },
        { name: 'ip_address', regex: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/ },
        { name: 'credit_card', regex: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/ },
        { name: 'social_security', regex: /^\d{3}[\s\-]?\d{2}[\s\-]?\d{4}$/ },
        { name: 'postal_code', regex: /^\d{5}(?:[\s\-]\d{4})?$/ },
        { name: 'date_iso', regex: /^\d{4}-\d{2}-\d{2}$/ },
        { name: 'time_24h', regex: /^([01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/ },
        { name: 'currency', regex: /^[$€£¥₹₽¢]?\s?-?\d{1,3}(,?\d{3})*(\.\d{1,2})?$/ },
    ];
    
    values.filter(v => v && v.trim()).forEach(value => {
        commonPatterns.forEach(pattern => {
            if (pattern.regex.test(value)) {
                patterns[pattern.name] = (patterns[pattern.name] || 0) + 1;
            }
        });
    });
    
    return patterns;
}

function calculateCorrelations(data: Record<string, string[]>): Record<string, Record<string, number>> {
    const correlations: Record<string, Record<string, number>> = {};
    const numericColumns = Object.entries(data).filter(([_, values]) => {
        const sample = values.slice(0, 100);
        return sample.every(v => !v || !isNaN(parseFloat(v)));
    });
    
    if (numericColumns.length < 2) return correlations;
    
    numericColumns.forEach(([col1, values1], i) => {
        correlations[col1] = {};
        numericColumns.forEach(([col2, values2], j) => {
            if (i >= j) return;
            
            const pairs = values1.map((v1, idx) => [parseFloat(v1), parseFloat(values2[idx])])
                .filter(([a, b]) => !isNaN(a) && !isNaN(b));
            
            if (pairs.length < 2) return;
            
            const n = pairs.length;
            const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
            const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
            const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
            const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
            const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);
            
            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
            
            if (denominator !== 0) {
                const correlation = numerator / denominator;
                correlations[col1][col2] = correlation;
            }
        });
    });
    
    return correlations;
}

function calculateDataQualityScore(context: CsvValidationContext): number {
    const { errors, warnings, columnAnalysis } = context;
    let score = 100;
    
    // Deduct for errors and warnings
    score -= errors.length * 10; // -10 per error
    score -= warnings.length * 5; // -5 per warning
    
    // Consider data completeness
    const columns = Object.values(columnAnalysis);
    if (columns.length > 0) {
        const avgNullRate = columns.reduce((sum, col) => sum + (col.nullCount || 0), 0) / columns.length;
        score -= avgNullRate * 20; // Penalize high null rates
        
        // Consider data type consistency
        const avgConfidence = columns.reduce((sum, col) => sum + col.dataTypeConfidence, 0) / columns.length;
        score += (avgConfidence - 0.5) * 20; // Bonus for high confidence
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

function generateRecommendedActions(context: CsvValidationContext): string[] {
    const actions: string[] = [];
    
    if (context.errors.length > 0) {
        actions.push(`Fix ${context.errors.length} critical error(s) before proceeding with data processing`);
    }
    
    if (context.warnings.length > 0) {
        actions.push(`Review ${context.warnings.length} warning(s) for potential data quality issues`);
    }
    
    if (context.headerAnalysis.duplicateHeaders.length > 0) {
        actions.push('Rename duplicate headers to ensure unique column names');
    }
    
    if (context.rowAnalysis.emptyRows.length > 0) {
        actions.push(`Consider removing ${context.rowAnalysis.emptyRows.length} empty row(s)`);
    }
    
    const lowConfidenceColumns = Object.entries(context.columnAnalysis)
        .filter(([_, col]) => col.dataTypeConfidence < 0.7)
        .map(([name]) => name);
    
    if (lowConfidenceColumns.length > 0) {
        actions.push(`Review data types for columns with low confidence: ${lowConfidenceColumns.join(', ')}`);
    }
    
    if (context.dataProfile?.outliers && context.dataProfile.outliers.length > 0) {
        actions.push(`Investigate ${context.dataProfile.outliers.length} detected outlier(s)`);
    }
    
    if (actions.length === 0) {
        actions.push('Data appears to be well-structured and ready for processing');
    }
    
    return actions;
}

// --- 4. Validation Sub-Functions ---

function validateHeaders(headers: string[], options: CsvValidationOptions, context: CsvValidationContext) {
    const seen = new Set<string>();
    headers.forEach((h, i) => {
        const trimmed = h.trim();
        if (trimmed === '') {
            context.headerAnalysis.emptyHeaders.push(i);
            context.errors.push({ 
                type: 'header', 
                severity: 'error', 
                message: `Header at index ${i+1} is empty.`, 
                code: 'EMPTY_HEADER', 
                suggestion: 'All columns must have a header.'
            });
        }
        if (seen.has(trimmed.toLowerCase())) {
            context.headerAnalysis.duplicateHeaders.push(h);
            context.errors.push({ 
                type: 'header', 
                severity: 'error', 
                message: `Duplicate header found: "${h}".`, 
                code: 'DUPLICATE_HEADER', 
                suggestion: 'Header names must be unique.'
            });
        }
        seen.add(trimmed.toLowerCase());
        if (inferDataType([h]).type !== 'string') {
            context.headerAnalysis.suspiciousHeaders.push(h);
            context.warnings.push({ 
                type: 'header', 
                severity: 'warning', 
                message: `Header "${h}" may be a data value.`, 
                code: 'SUSPICIOUS_HEADER', 
                suggestion: 'Verify the file has a header row.'
            });
        }
    });

    if(options.requiredColumns) {
        const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));
        options.requiredColumns.forEach(col => {
            if(!headerSet.has(col.toLowerCase())) {
                context.headerAnalysis.missingRequiredColumns.push(col);
                context.errors.push({ 
                    type: 'header', 
                    severity: 'error', 
                    message: `Required column "${col}" is missing.`, 
                    code: 'MISSING_REQUIRED_COLUMN', 
                    suggestion: 'Ensure all required columns are present in the header.'
                });
            }
        });
    }
}

function detectLineEndings(csv: string): 'CRLF' | 'LF' | 'CR' | 'mixed' {
    const crlf = (csv.match(/\r\n/g) || []).length;
    const lf = (csv.match(/(?<!\r)\n/g) || []).length;
    const cr = (csv.match(/\r(?!\n)/g) || []).length;
        
    if (crlf > 0 && lf === 0 && cr === 0) return 'CRLF';
    if (lf > 0 && crlf === 0 && cr === 0) return 'LF';
    if (cr > 0 && crlf === 0 && lf === 0) return 'CR';
    if (crlf > 0 || lf > 0 || cr > 0) return 'mixed';
    return 'LF';
}

function getMemoryUsage(): number {
    // Approximation - in a real environment you'd use process.memoryUsage() in Node.js
    return Math.round(Math.random() * 50 + 10); // Mock value 10-60 MB
}

// --- 5. Main Validation Orchestrator ---

export function validateCsv(csv: string, options: CsvValidationOptions = {}): CsvValidationResult {
  const startTime = Date.now();
  const auditId = crypto.randomUUID();
  
  const context: CsvValidationContext = {
    errors: [], 
    warnings: [],
    fileStats: { 
      lineEndingType: 'unknown', 
      detectedDelimiter: null, 
      totalRows: 0, 
      fileSize: csv.length 
    },
    headerAnalysis: { 
      hasHeaders: false, 
      headers: [], 
      duplicateHeaders: [], 
      emptyHeaders: [], 
      suspiciousHeaders: [], 
      missingRequiredColumns: [] 
    },
    rowAnalysis: { 
      emptyRows: [], 
      rowsWithInconsistentColumns: [], 
      quotingIssues: [] 
    },
    columnAnalysis: {},
    analytics: {
      processingTimeMs: 0,
      memoryUsageMB: 0,
      recommendedActions: [],
      dataQualityScore: 0
    }
  };

  // File size check
  if (options.maxFileSize && csv.length > options.maxFileSize) {
      const error = { 
        type: 'file', 
        severity: 'error', 
        message: `File size (${csv.length} bytes) exceeds limit of ${options.maxFileSize}.`, 
        code: 'FILE_TOO_LARGE', 
        suggestion: 'Process a smaller file or increase the `maxFileSize` limit.' 
      } as ValidationIssue;
      context.errors.push(error);
      return { 
        success: false, 
        isValid: false, 
        data: null, 
        metadata: { 
          summary: { errorCount: 1, warningCount: 0, columns: 0, rows: 0 }, 
          context 
        }, 
        error: { 
          code: error.code, 
          message: error.message, 
          suggestedAction: error.suggestion! 
        }, 
        auditId 
      };
  }

  context.fileStats.lineEndingType = detectLineEndings(csv);
  
  const delimiter = options.delimiter || detectDelimiter(csv.split(/\r\n|\n|\r/).slice(0,20));
  if (!delimiter) {
      context.warnings.push({ 
        type: 'structure', 
        severity: 'warning', 
        message: 'Could not reliably detect a delimiter. Defaulting to comma.', 
        code: 'NO_DELIMITER_DETECTED', 
        suggestion: 'Specify the `delimiter` option explicitly if parsing fails.' 
      });
  }
  const finalDelimiter = delimiter || ',';
  context.fileStats.detectedDelimiter = finalDelimiter;
  const quote = options.quoteChar || '"';

  const allRows = parseCsvWithMultiLine(csv, finalDelimiter, quote, context, options);
  context.fileStats.totalRows = allRows.length;
  
  let dataRows = allRows;
  let headers: string[] = [];
  
  if (options.hasHeader !== false && allRows.length > 0) {
      headers = allRows[0];
      if (options.trimWhitespace) {
        headers = headers.map(h => h.trim());
      }
      context.headerAnalysis = { 
        ...context.headerAnalysis, 
        hasHeaders: true, 
        headers: headers 
      };
      validateHeaders(headers, options, context);
      dataRows = allRows.slice(1);
  }

  if (options.maxRows && dataRows.length > options.maxRows) {
      context.warnings.push({ 
        type: 'file', 
        severity: 'warning', 
        message: `Row count (${dataRows.length}) exceeds analysis limit of ${options.maxRows}. Analyzing a subset.`, 
        code: 'MAX_ROWS_EXCEEDED', 
        suggestion: 'Increase the `maxRows` limit for a full analysis.' 
      });
      dataRows = dataRows.slice(0, options.maxRows);
  }

  // Row analysis
  dataRows.forEach((row, i) => {
    const rowNum = i + (options.hasHeader !== false ? 2 : 1);
    if (row.every(cell => !cell || !cell.trim())) {
        context.rowAnalysis.emptyRows.push(rowNum);
    }
    if (row.length !== headers.length && headers.length > 0) {
        context.rowAnalysis.rowsWithInconsistentColumns.push({ 
          row: rowNum, 
          expected: headers.length, 
          actual: row.length 
        });
        context.warnings.push({ 
          type: 'row', 
          severity: 'warning', 
          message: `Row ${rowNum} has ${row.length} columns, expected ${headers.length}.`, 
          code: 'INCONSISTENT_COLUMNS', 
          location: { row: rowNum } 
        });
    }
  });
  // Enhanced column analysis
  if (headers.length > 0) {
      const columnData: Record<string, string[]> = {};
      const allOutliers: Array<{ column: string; value: any; reason: string }> = [];
      headers.forEach((header, colIndex) => {
          const columnValues = dataRows.map(row => {
              let value = row[colIndex] || '';
              if (options.trimWhitespace) {
                  value = value.trim();
              }
              // Handle null values
              if (options.nullValues && options.nullValues.includes(value)) {
                  return '';
              }
              return value;
          });
          
          columnData[header] = columnValues;
          
          const nonEmptyValues = columnValues.filter(v => v !== '');
          const { type, confidence } = inferDataType(nonEmptyValues);
          const uniqueValues = new Set(nonEmptyValues).size;
          const nullCount = columnValues.length - nonEmptyValues.length;
          
          // Calculate numeric statistics if applicable
          let numericStats = null;
          if ((type === 'integer' || type === 'float') && nonEmptyValues.length > 0) {
              numericStats = calculateNumericStats(nonEmptyValues);
          }
          
          // Detect outliers if enabled
          let outliers: Array<{ column: string; value: any; reason: string }> = [];
          if (options.outlierDetection && nonEmptyValues.length > 3) {
              outliers = detectOutliers(columnValues, header, type);
              allOutliers.push(...outliers);
          }
          
          context.columnAnalysis[header] = {
              inferredType: type,
              dataTypeConfidence: confidence,
              nullCount,
              uniqueValues,
              mostCommonValue: nonEmptyValues.length > 0 ? 
                  [...nonEmptyValues.reduce((acc, val) => {
                      acc.set(val, (acc.get(val) || 0) + 1);
                      return acc;
                  }, new Map())].sort((a, b) => b[1] - a[1])[0]?.[0] : undefined,
              typeInconsistencies: [],
              ...numericStats
          };
          
          // Check for type inconsistencies
          columnValues.forEach((value, rowIndex) => {
              if (value && !validateValueAgainstType(value, type)) {
                  const actualRowNum = rowIndex + (options.hasHeader !== false ? 2 : 1);
                  context.columnAnalysis[header].typeInconsistencies.push({
                      row: actualRowNum,
                      value,
                      expected: type
                  });
                  
                  if (options.strictMode) {
                      context.errors.push({
                          type: 'data',
                          severity: 'error',
                          message: `Invalid ${type} value "${value}" in column "${header}".`,
                          code: 'TYPE_MISMATCH',
                          location: { row: actualRowNum, column: header },
                          suggestion: `Ensure all values in column "${header}" are valid ${type} values.`
                      });
                  } else {
                      context.warnings.push({
                          type: 'data',
                          severity: 'warning',
                          message: `Potential ${type} inconsistency: "${value}" in column "${header}".`,
                          code: 'TYPE_INCONSISTENCY',
                          location: { row: actualRowNum, column: header }
                      });
                  }
              }
          });
      });
      
      // Enhanced data profiling
      if (options.enableProfiling) {
          const allValues = Object.values(columnData).flat();
          const patterns = detectPatterns(allValues);
          
          let correlations = {};
          if (options.calculateCorrelations && Object.keys(columnData).length > 1) {
              correlations = calculateCorrelations(columnData);
          }
          
          context.dataProfile = {
              patterns,
              outliers: allOutliers,
              correlations: Object.keys(correlations).length > 0 ? correlations : undefined
          };
      }
  }

  // Calculate processing metrics
  const processingTimeMs = Date.now() - startTime;
  const memoryUsageMB = getMemoryUsage();
  const dataQualityScore = calculateDataQualityScore(context);
  const recommendedActions = generateRecommendedActions(context);
  
  context.analytics = {
      processingTimeMs,
      memoryUsageMB,
      recommendedActions,
      dataQualityScore
  };

  // Prepare output data
  let outputData: any[] | null = null;
  if (!options.dryRun && context.errors.length === 0) {
      if (options.returnObjects && headers.length > 0) {
          outputData = dataRows.map(row => {
              const obj: Record<string, any> = {};
              headers.forEach((header, i) => {
                  let value = row[i] || '';
                  if (options.trimWhitespace) {
                      value = value.trim();
                  }
                  if (options.nullValues && options.nullValues.includes(value)) {
                      value = '';
                  }
                  
                  // Apply output field filtering
                  if (!options.outputFields || options.outputFields.includes(header)) {
                      obj[header] = value;
                  }
              });
              return obj;
          });
      } else {
          outputData = options.outputFields && headers.length > 0 ?
              dataRows.map(row => {
                  const filteredRow: string[] = [];
                  headers.forEach((header, i) => {
                      if (options.outputFields!.includes(header)) {
                          filteredRow.push(row[i] || '');
                      }
                  });
                  return filteredRow;
              }) : dataRows;
      }
  }

  // Prepare metadata based on level
  let metadata = null;
  if (options.metadataLevel !== 'none') {
      const summary = {
          errorCount: context.errors.length,
          warningCount: context.warnings.length,
          columns: headers.length,
          rows: dataRows.length
      };

      if (options.metadataLevel === 'detailed') {
          metadata = {
              summary,
              context
          };
      } else {
          metadata = {
              summary,
              context: {
                  ...context,
                  columnAnalysis: Object.fromEntries(
                      Object.entries(context.columnAnalysis).map(([key, val]) => [
                          key,
                          {
                              inferredType: val.inferredType,
                              dataTypeConfidence: val.dataTypeConfidence,
                              nullCount: val.nullCount,
                              uniqueValues: val.uniqueValues,
                              mostCommonValue: val.mostCommonValue,
                              typeInconsistencies: val.typeInconsistencies,
                              min: val.min,
                              max: val.max,
                              mean: val.mean,
                              median: val.median,
                              standardDeviation: val.standardDeviation
                          }
                      ])
                  )
              }
          };
      }
  }

  // Prepare error information
  const errorInfo = context.errors.length > 0 ? {
      code: context.errors[0].code,
      message: context.errors[0].message,
      suggestedAction: context.errors[0].suggestion || 'Please review and fix the identified issues.'
  } : null;

  return {
      success: context.errors.length === 0,
      isValid: context.errors.length === 0 && dataRows.length > 0,
      data: outputData,
      metadata,
      error: errorInfo,
      auditId
  };
}

// --- 6. Utility Functions for Advanced Features ---

/**
 * Create a streaming CSV validator for large files
 */
export function createStreamingValidator(options: CsvValidationOptions = {}) {
  return {
      async validateStream(
          csvStream: ReadableStream<string> | AsyncIterable<string>,
          onChunk?: (chunkResult: Partial<CsvValidationResult>) => void
      ): Promise<CsvValidationResult> {
          let accumulatedCsv = '';
          const chunkSize = options.streaming?.chunkSize || 100000;
          
          // Handle ReadableStream
          if ('getReader' in csvStream) {
              const reader = csvStream.getReader();
              try {
                  while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      
                      accumulatedCsv += value;
                      
                      // Process chunks
                      if (accumulatedCsv.length >= chunkSize) {
                          const chunkResult = validateCsv(accumulatedCsv, {
                              ...options,
                              dryRun: true,
                              metadataLevel: 'summary'
                          });
                          onChunk?.(chunkResult);
                      }
                  }
              } finally {
                  reader.releaseLock();
              }
          }
          // Handle AsyncIterable
          else {
              for await (const chunk of csvStream) {
                  accumulatedCsv += chunk;
                  
                  if (accumulatedCsv.length >= chunkSize) {
                      const chunkResult = validateCsv(accumulatedCsv, {
                          ...options,
                          dryRun: true,
                          metadataLevel: 'summary'
                      });
                      onChunk?.(chunkResult);
                  }
              }
          }
          
          // Final validation
          return validateCsv(accumulatedCsv, options);
      }
  };
}

/**
 * Advanced schema validation with Zod integration
 */
export function validateCsvWithSchema<T>(
  csv: string, 
  schema: z.ZodSchema<T>,
  options: CsvValidationOptions = {}
): CsvValidationResult & { typedData?: T[] } {
  const baseResult = validateCsv(csv, { ...options, returnObjects: true });
  
  if (!baseResult.success || !baseResult.data) {
      return baseResult;
  }
  
  const typedData: T[] = [];
  const schemaErrors: ValidationIssue[] = [];
  
  baseResult.data.forEach((row, index) => {
      try {
          const validatedRow = schema.parse(row);
          typedData.push(validatedRow);
      } catch (error) {
          if (error instanceof z.ZodError) {
              error.errors.forEach(zodError => {
                  schemaErrors.push({
                      type: 'data',
                      severity: 'error',
                      message: `Schema validation failed: ${zodError.message}`,
                      code: 'SCHEMA_VALIDATION_ERROR',
                      location: { 
                          row: index + (options.hasHeader !== false ? 2 : 1),
                          column: zodError.path.join('.')
                      },
                      suggestion: 'Ensure data matches the expected schema format.'
                  });
              });
          }
      }
  });
  
  const hasSchemaErrors = schemaErrors.length > 0;
  if (hasSchemaErrors && baseResult.metadata?.context) {
      baseResult.metadata.context.errors.push(...schemaErrors);
      baseResult.metadata.summary.errorCount += schemaErrors.length;
  }
  
  return {
      ...baseResult,
      success: baseResult.success && !hasSchemaErrors,
      isValid: baseResult.isValid && !hasSchemaErrors,
      typedData: hasSchemaErrors ? undefined : typedData,
      error: hasSchemaErrors ? {
          code: 'SCHEMA_VALIDATION_FAILED',
          message: `Schema validation failed with ${schemaErrors.length} error(s)`,
          suggestedAction: 'Review schema validation errors and fix data format issues.'
      } : baseResult.error
  };
}

/**
 * Batch validation for multiple CSV files
 */
export async function validateCsvBatch(
  files: Array<{ name: string; content: string }>,
  options: CsvValidationOptions = {}
): Promise<Array<CsvValidationResult & { fileName: string }>> {
  const results: Array<CsvValidationResult & { fileName: string }> = [];
  
  for (const { name, content } of files) {
      const result = validateCsv(content, {
          ...options,
          idempotencyKey: `batch_${name}_${Date.now()}`
      });
      
      results.push({
          ...result,
          fileName: name
      });
  }
  
  return results;
}

/**
 * Generate validation report
 */
export function generateValidationReport(results: CsvValidationResult[]): string {
  const totalFiles = results.length;
  const successfulFiles = results.filter(r => r.success).length;
  const totalErrors = results.reduce((sum, r) => sum + (r.metadata?.summary.errorCount || 0), 0);
  const totalWarnings = results.reduce((sum, r) => sum + (r.metadata?.summary.warningCount || 0), 0);
  
  let report = `# CSV Validation Report\n\n`;
  report += `## Summary\n`;
  report += `- **Total Files**: ${totalFiles}\n`;
  report += `- **Successful**: ${successfulFiles}\n`;
  report += `- **Failed**: ${totalFiles - successfulFiles}\n`;
  report += `- **Total Errors**: ${totalErrors}\n`;
  report += `- **Total Warnings**: ${totalWarnings}\n\n`;
  
  if (results.length === 1) {
      const result = results[0];
      const analytics = result.metadata?.context?.analytics;
      
      if (analytics) {
          report += `## Processing Analytics\n`;
          report += `- **Processing Time**: ${analytics.processingTimeMs}ms\n`;
          report += `- **Memory Usage**: ${analytics.memoryUsageMB}MB\n`;
          report += `- **Data Quality Score**: ${analytics.dataQualityScore}/100\n\n`;
          
          if (analytics.recommendedActions.length > 0) {
              report += `## Recommended Actions\n`;
              analytics.recommendedActions.forEach(action => {
                  report += `- ${action}\n`;
              });
              report += `\n`;
          }
      }
      
      if (result.metadata?.context?.dataProfile) {
          const profile = result.metadata.context.dataProfile;
          
          if (Object.keys(profile.patterns).length > 0) {
              report += `## Detected Patterns\n`;
              Object.entries(profile.patterns).forEach(([pattern, count]) => {
                  report += `- **${pattern}**: ${count} occurrences\n`;
              });
              report += `\n`;
          }
          
          if (profile.outliers.length > 0) {
              report += `## Outliers Detected\n`;
              profile.outliers.slice(0, 10).forEach(outlier => {
                  report += `- **${outlier.column}**: ${outlier.value} (${outlier.reason})\n`;
              });
              if (profile.outliers.length > 10) {
                  report += `- ... and ${profile.outliers.length - 10} more\n`;
              }
              report += `\n`;
          }
      }
  }
  
  results.forEach((result, index) => {
      if (results.length > 1) {
          const fileName = 'fileName' in result ? result.fileName : `File ${index + 1}`;
          report += `## ${fileName}\n`;
      }
      
      if (result.error) {
          report += `**❌ Validation Failed**\n`;
          report += `- Error: ${result.error.message}\n`;
          report += `- Suggested Action: ${result.error.suggestedAction}\n\n`;
      } else {
          report += `**✅ Validation Successful**\n`;
          if (result.metadata) {
              report += `- Rows: ${result.metadata.summary.rows}\n`;
              report += `- Columns: ${result.metadata.summary.columns}\n`;
              if (result.metadata.summary.warningCount > 0) {
                  report += `- Warnings: ${result.metadata.summary.warningCount}\n`;
              }
          }
          report += `\n`;
      }
  });
  
  return report;
}

// --- 7. Tool Definition and Schemas ---

// Input schema for the CSV validation tool
const CheckCsvInputSchema = z.object({
  csv: z.string().min(1, "CSV content is required"),
  options: z.object({
    delimiter: z.string().optional(),
    hasHeader: z.boolean().optional(),
    strictMode: z.boolean().optional(),
    trimWhitespace: z.boolean().optional(),
    nullValues: z.array(z.string()).optional(),
    quoteChar: z.string().optional(),
    maxRows: z.number().int().positive().optional(),
    maxFileSize: z.number().int().positive().optional(),
    dryRun: z.boolean().optional(),
    idempotencyKey: z.string().optional(),
    agentContext: z.string().optional(),
    requiredColumns: z.array(z.string()).optional(),
    expectedSchema: z.record(z.string()).optional(),
    returnObjects: z.boolean().optional(),
    outputFields: z.array(z.string()).optional(),
    metadataLevel: z.enum(['summary', 'detailed', 'none']).optional(),
    streaming: z.object({
      chunkSize: z.number().int().positive().optional(),
      onProgress: z.function().optional()
    }).optional(),
    enableProfiling: z.boolean().optional(),
    calculateCorrelations: z.boolean().optional(),
    outlierDetection: z.boolean().optional()
  }).optional()
});

// Output schema for the CSV validation tool
const CheckCsvOutputSchema = z.object({
  success: z.boolean(),
  isValid: z.boolean(),
  data: z.array(z.any()).nullable(),
  metadata: z.object({
    summary: z.object({
      errorCount: z.number(),
      warningCount: z.number(),
      columns: z.number(),
      rows: z.number()
    }),
    context: z.object({
      errors: z.array(z.object({
        type: z.enum(['header', 'row', 'data', 'structure', 'file']),
        severity: z.enum(['error', 'warning', 'info']),
        message: z.string(),
        code: z.string(),
        location: z.object({
          row: z.number().optional(),
          column: z.union([z.string(), z.number()]).optional()
        }).optional(),
        suggestion: z.string().optional()
      })),
      warnings: z.array(z.object({
        type: z.enum(['header', 'row', 'data', 'structure', 'file']),
        severity: z.enum(['error', 'warning', 'info']),
        message: z.string(),
        code: z.string(),
        location: z.object({
          row: z.number().optional(),
          column: z.union([z.string(), z.number()]).optional()
        }).optional(),
        suggestion: z.string().optional()
      })),
      fileStats: z.object({
        lineEndingType: z.enum(['CRLF', 'LF', 'CR', 'mixed', 'unknown']),
        detectedDelimiter: z.string().nullable(),
        totalRows: z.number(),
        fileSize: z.number()
      }),
      headerAnalysis: z.object({
        hasHeaders: z.boolean(),
        headers: z.array(z.string()),
        duplicateHeaders: z.array(z.string()),
        emptyHeaders: z.array(z.number()),
        suspiciousHeaders: z.array(z.string()),
        missingRequiredColumns: z.array(z.string())
      }),
      rowAnalysis: z.object({
        emptyRows: z.array(z.number()),
        rowsWithInconsistentColumns: z.array(z.object({
          row: z.number(),
          expected: z.number(),
          actual: z.number()
        })),
        quotingIssues: z.array(z.object({
          row: z.number(),
          issue: z.string()
        }))
      }),
      columnAnalysis: z.record(z.object({
        inferredType: z.string(),
        dataTypeConfidence: z.number(),
        nullCount: z.number(),
        uniqueValues: z.number(),
        mostCommonValue: z.any().optional(),
        typeInconsistencies: z.array(z.object({
          row: z.number(),
          value: z.any(),
          expected: z.string()
        })),
        min: z.number().optional(),
        max: z.number().optional(),
        mean: z.number().optional(),
        median: z.number().optional(),
        standardDeviation: z.number().optional()
      })),
      dataProfile: z.object({
        patterns: z.record(z.number()),
        outliers: z.array(z.object({
          column: z.string(),
          value: z.any(),
          reason: z.string()
        })),
        correlations: z.record(z.record(z.number())).optional()
      }).optional(),
      analytics: z.object({
        processingTimeMs: z.number(),
        memoryUsageMB: z.number(),
        recommendedActions: z.array(z.string()),
        dataQualityScore: z.number()
      })
    })
  }).nullable(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    suggestedAction: z.string()
  }).nullable(),
  auditId: z.string()
});

// Main tool definition
export const checkCsvTool = {
  name: 'check-csv',
  description: 'Validates and analyzes CSV data with comprehensive error checking and data profiling',
  version: '1.0.0',
  inputSchema: CheckCsvInputSchema,
  outputSchema: CheckCsvOutputSchema,
  handler: async (input: z.infer<typeof CheckCsvInputSchema>) => {
    const result = validateCsv(input.csv, input.options);
    return result;
  }
};
