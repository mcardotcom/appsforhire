import { z } from 'zod';

interface CsvValidationOptions {
  delimiter?: string;
  hasHeader?: boolean;
  requiredColumns?: string[];
  validateData?: boolean;
  maxRows?: number;
  maxColumns?: number;
  strictMode?: boolean;
  allowEmptyValues?: boolean;
  inferDataTypes?: boolean;
  encoding?: string;
  quoteChar?: string;
  escapeChar?: string;
  maxFileSize?: number; // in bytes
  trimWhitespace?: boolean;
  nullValues?: string[]; // custom null representations
  returnObjects?: boolean;
}

interface CsvValidationContext {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  dataIssues: {
    missingValues: Array<{
      row: number;
      column: string;
      columnIndex: number;
    }>;
    malformedCells: Array<{
      row: number;
      column: string;
      columnIndex: number;
      value: any;
      issue: string;
    }>;
    encodingIssues: Array<{
      row: number;
      column: string;
      issue: string;
    }>;
    dataTypes: Record<string, string>;
    typeInconsistencies: Array<{
      column: string;
      columnIndex: number;
      inferredType: string;
      issues: Array<{
        row: number;
        value: any;
        actualType: string;
      }>;
    }>;
    columnStats: Record<string, {
      uniqueValues: number;
      nullCount: number;
      emptyStringCount: number;
      dataTypeConfidence: number;
      outliers?: number[];
      mostCommonValue?: any;
    }>;
  };
  rowIssues: {
    expectedColumnCount: number;
    totalRows: number;
    emptyRows: number[];
    rowsWithInconsistentColumns: Array<{
      row: number;
      expected: number;
      actual: number;
    }>;
    partiallyEmptyRows: Array<{
      row: number;
      emptyCells: number;
    }>;
    quotingIssues: Array<{
      row: number;
      issue: string;
    }>;
    lineEndingType: 'CRLF' | 'LF' | 'CR' | 'mixed';
    consistentColumnCount: boolean;
  };
  rowsProcessed: number;
  columnsProcessed: number;
  headerIssues: {
    hasHeaders: boolean;
    headerCount: number;
    duplicateHeaders: string[];
    emptyHeaders: number[];
    whitespaceOnlyHeaders: number[];
    invalidCharacterHeaders: string[];
    headers: string[];
    uniqueHeaders: boolean;
    suspiciousHeaders: string[];
  };
}

interface ValidationIssue {
  type: 'header' | 'row' | 'data' | 'structure' | 'encoding' | 'performance' | 'file';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    row?: number;
    column?: string | number;
    cell?: string;
  };
  suggestion?: string;
  code?: string; // Error code for programmatic handling
}

interface HeaderValidation {
  hasHeaders: boolean;
  headerCount: number;
  duplicateHeaders: string[];
  emptyHeaders: number[];
  whitespaceOnlyHeaders: number[];
  invalidCharacterHeaders: string[];
  headers: string[];
  uniqueHeaders: boolean;
  suspiciousHeaders: string[]; // Headers that might be data rows
}

interface RowValidation {
  totalRows: number;
  consistentColumnCount: boolean;
  rowsWithInconsistentColumns: Array<{ row: number; expected: number; actual: number }>;
  expectedColumnCount: number;
  emptyRows: number[];
  partiallyEmptyRows: Array<{ row: number; emptyCells: number }>;
  quotingIssues: Array<{ row: number; issue: string }>;
  lineEndingType: 'CRLF' | 'LF' | 'CR' | 'mixed';
}

interface DataValidation {
  missingValues: Array<{ row: number; column: string | number; columnIndex: number }>;
  typeInconsistencies: Array<{
    column: string;
    columnIndex: number;
    inferredType: string;
    issues: Array<{ row: number; value: any; actualType: string }>;
  }>;
  malformedCells: Array<{
    row: number;
    column: string | number;
    columnIndex: number;
    value: any;
    issue: string;
  }>;
  dataTypes: Record<string, string>;
  columnStats: Record<string, {
    uniqueValues: number;
    nullCount: number;
    emptyStringCount: number;
    mostCommonValue?: any;
    dataTypeConfidence: number;
    outliers?: any[];
  }>;
  encodingIssues: Array<{ row: number; column: string; issue: string }>;
}

// Type definitions
interface CsvValidationResult {
  isValid: boolean;
  data: any[];
  context: CsvValidationContext;
}

interface HeaderValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  headerIssues: {
    hasHeaders: boolean;
    headerCount: number;
    duplicateHeaders: string[];
    emptyHeaders: number[];
    whitespaceOnlyHeaders: number[];
    invalidCharacterHeaders: string[];
    headers: string[];
    uniqueHeaders: boolean;
    suspiciousHeaders: string[];
  };
}

// Enhanced delimiter detection with better heuristics
function detectDelimiter(lines: string[]): { delimiter: string; confidence: number } {
  const delimiters = [
    { char: ',', name: 'comma' },
    { char: ';', name: 'semicolon' },
    { char: '\t', name: 'tab' },
    { char: '|', name: 'pipe' },
    { char: ':', name: 'colon' }
  ];
  
  // Take more lines for better detection, but limit for performance
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  if (nonEmptyLines.length === 0) {
    return { delimiter: ',', confidence: 0 };
  }
  
  let bestDelimiter = ',';
  let maxScore = 0;
  
  for (const { char: delimiter } of delimiters) {
    let score = 0;
    const columnCounts: number[] = [];
    
    for (const line of nonEmptyLines) {
      // Handle quoted fields properly
      const parts = parseCSVLine(line, delimiter, '"');
      columnCounts.push(parts.length);
    }
    
    if (columnCounts.length === 0) continue;
    
    // Calculate consistency
    const avgCount = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
    const consistentRows = columnCounts.filter(count => count === Math.round(avgCount)).length;
    const consistency = consistentRows / columnCounts.length;
    
    // Bonus for having more than one column
    const columnBonus = avgCount > 1 ? 1 : 0;
    
    // Penalty for single column (likely wrong delimiter)
    const singleColumnPenalty = avgCount === 1 ? 0.5 : 0;
    
    score = consistency * columnBonus - singleColumnPenalty;
    
    if (score > maxScore) {
      maxScore = score;
      bestDelimiter = delimiter;
    }
  }
  
  return { delimiter: bestDelimiter, confidence: maxScore };
}

// Enhanced CSV line parser with proper quote handling
function parseCSVLine(line: string, delimiter: string, quoteChar: string = '"'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === quoteChar) {
      if (inQuotes && nextChar === quoteChar) {
        // Escaped quote
        current += quoteChar;
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
      i++;
      continue;
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current);
  return result;
}

// Enhanced line ending detection
function detectLineEnding(content: string): 'CRLF' | 'LF' | 'CR' | 'mixed' {
  const crlfCount = (content.match(/\r\n/g) || []).length;
  const lfCount = (content.match(/(?<!\r)\n/g) || []).length;
  const crCount = (content.match(/\r(?!\n)/g) || []).length;
  
  const total = crlfCount + lfCount + crCount;
  if (total === 0) return 'LF'; // Default
  
  if (crlfCount === total) return 'CRLF';
  if (lfCount === total) return 'LF';
  if (crCount === total) return 'CR';
  return 'mixed';
}

// Enhanced data type inference
function inferDataType(values: any[]): { type: string; confidence: number } {
  const nonEmptyValues = values.filter(v => 
    v !== null && 
    v !== undefined && 
    v !== '' && 
    !['null', 'NULL', 'n/a', 'N/A', 'na', 'NA', '-'].includes(String(v).trim())
  );
  
  if (nonEmptyValues.length === 0) return { type: 'empty', confidence: 1 };
  
  const typeChecks = {
    integer: (v: any) => {
      const num = Number(v);
      return Number.isInteger(num) && !isNaN(num) && isFinite(num) && String(v).trim() === String(num);
    },
    float: (v: any) => {
      const num = Number(v);
      return !isNaN(num) && isFinite(num) && !Number.isInteger(num) && String(v).includes('.');
    },
    percentage: (v: any) => {
      const str = String(v).trim();
      return str.endsWith('%') && !isNaN(Number(str.slice(0, -1)));
    },
    currency: (v: any) => {
      const str = String(v).trim();
      return /^[\$£€¥₹][\d,]+\.?\d*$/.test(str) || /^\d+\.?\d*[\$£€¥₹]$/.test(str);
    },
    boolean: (v: any) => {
      const str = String(v).toLowerCase().trim();
      return ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 't', 'f'].includes(str);
    },
    date: (v: any) => {
      const str = String(v).trim();
      if (!/\d/.test(str)) return false;
      const date = new Date(str);
      return !isNaN(date.getTime()) && 
             (str.match(/\d{4}/) || str.match(/\d{2}\/\d{2}\/\d{2,4}/) || str.match(/\d{1,2}-\d{1,2}-\d{2,4}/));
    },
    time: (v: any) => {
      const str = String(v).trim();
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?(\s?(AM|PM))?$/i.test(str);
    },
    email: (v: any) => {
      const str = String(v).trim();
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str);
    },
    url: (v: any) => {
      try { 
        const url = new URL(String(v).trim()); 
        return ['http:', 'https:', 'ftp:'].includes(url.protocol);
      } catch { 
        return false; 
      }
    },
    phone: (v: any) => {
      const str = String(v).replace(/[\s\-\(\)\.]/g, '');
      return /^[\+]?[1-9][\d]{7,14}$/.test(str);
    },
    ipAddress: (v: any) => {
      const str = String(v).trim();
      return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str);
    }
  };
  
  const typeScores: Record<string, number> = {};
  const totalValues = nonEmptyValues.length;
  
  for (const [type, check] of Object.entries(typeChecks)) {
    const matches = nonEmptyValues.filter(check).length;
    typeScores[type] = matches / totalValues;
  }
  
  // Find the type with highest confidence (>= 70% for strict, >= 50% for permissive)
  const sortedTypes = Object.entries(typeScores)
    .filter(([_, score]) => score >= 0.5)
    .sort(([, a], [, b]) => b - a);
  
  if (sortedTypes.length > 0) {
    const [bestType, confidence] = sortedTypes[0];
    return { type: bestType, confidence };
  }
  
  return { type: 'string', confidence: 1 };
}

// Enhanced header validation
function validateHeaders(headers: string[], options: CsvValidationOptions): HeaderValidationResult {
  const result: HeaderValidationResult = {
    errors: [],
    warnings: [],
    headerIssues: {
      hasHeaders: false,
      headerCount: 0,
      duplicateHeaders: [],
      emptyHeaders: [],
      whitespaceOnlyHeaders: [],
      invalidCharacterHeaders: [],
      headers: [],
      uniqueHeaders: true,
      suspiciousHeaders: []
    }
  };

  result.headerIssues.headers = headers;
  result.headerIssues.headerCount = headers.length;
  result.headerIssues.hasHeaders = headers.length > 0;
  
  // Check for duplicates (case-insensitive)
  const headerCounts = new Map<string, number>();
  const normalizedHeaders = new Map<string, string>();
  
  headers.forEach(header => {
    const normalized = header.toLowerCase().trim();
    headerCounts.set(normalized, (headerCounts.get(normalized) || 0) + 1);
    normalizedHeaders.set(normalized, header);
  });
  
  result.headerIssues.duplicateHeaders = Array.from(headerCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([normalized]) => normalizedHeaders.get(normalized)!);
  
  // Detect suspicious headers (might be data rows)
  result.headerIssues.suspiciousHeaders = headers.filter(header => {
    const trimmed = header.trim();
    // Check if header looks like data
    return (
      /^\d+$/.test(trimmed) || // Just numbers
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed) || // Date format
      /^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed) || // Time format
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed) // Email format
    );
  });
  
  // Validate each header
  headers.forEach((header: string, index: number) => {
    const trimmed = header.trim();
    
    if (header === '') {
      result.headerIssues.emptyHeaders.push(index);
      result.errors.push({
        type: 'header',
        severity: 'error',
        message: `Empty header at column ${index + 1}`,
        location: { column: index + 1 },
        suggestion: 'Provide a name for this column',
        code: 'EMPTY_HEADER'
      });
    } else if (trimmed === '') {
      result.headerIssues.whitespaceOnlyHeaders.push(index);
      result.warnings.push({
        type: 'header',
        severity: 'warning',
        message: `Header at column ${index + 1} contains only whitespace`,
        location: { column: index + 1 },
        suggestion: 'Remove whitespace or provide a meaningful name',
        code: 'WHITESPACE_ONLY_HEADER'
      });
    }
    
    // Check for problematic characters
    if (/[^\w\s\-_.]/.test(header)) {
      result.headerIssues.invalidCharacterHeaders.push(header);
      result.warnings.push({
        type: 'header',
        severity: 'warning',
        message: `Header "${header}" contains special characters`,
        location: { column: index + 1 },
        suggestion: 'Use only letters, numbers, spaces, hyphens, underscores, and periods',
        code: 'INVALID_HEADER_CHARS'
      });
    }
    
    // Check for very long headers
    if (header.length > 100) {
      result.warnings.push({
        type: 'header',
        severity: 'warning',
        message: `Header "${header}" is very long (${header.length} characters)`,
        location: { column: index + 1 },
        suggestion: 'Consider using a shorter, more concise header name',
        code: 'LONG_HEADER'
      });
    }
  });
  
  // Report duplicates
  result.headerIssues.duplicateHeaders.forEach((header: string) => {
    result.errors.push({
      type: 'header',
      severity: 'error',
      message: `Duplicate header "${header}" found`,
      suggestion: 'Make all column headers unique',
      code: 'DUPLICATE_HEADER'
    });
  });
  
  // Report suspicious headers
  if (result.headerIssues.suspiciousHeaders.length > 0) {
    result.warnings.push({
      type: 'header',
      severity: 'warning',
      message: `Found ${result.headerIssues.suspiciousHeaders.length} headers that look like data values`,
      suggestion: 'Verify that the first row contains column headers, not data',
      code: 'SUSPICIOUS_HEADERS'
    });
  }
  
  result.headerIssues.uniqueHeaders = result.headerIssues.duplicateHeaders.length === 0;
  return result;
}

// Enhanced row validation with better parsing
function validateRows(
  lines: string[], 
  headers: string[], 
  delimiter: string, 
  context: CsvValidationContext,
  options: CsvValidationOptions
): string[][] {
  const expectedColumnCount = headers.length;
  context.rowIssues.expectedColumnCount = expectedColumnCount;
  context.rowIssues.totalRows = lines.length;
  context.rowIssues.lineEndingType = detectLineEnding(lines.join('\n'));
  
  const parsedRows: string[][] = [];
  const quoteChar = options.quoteChar || '"';
  const trimWhitespace = options.trimWhitespace !== false;
  
  lines.forEach((line, index) => {
    const originalLine = line;
    
    if (line.trim() === '') {
      context.rowIssues.emptyRows.push(index);
      context.warnings.push({
        type: 'row',
        severity: 'warning',
        message: `Row ${index + 1} is empty`,
        location: { row: index + 1 },
        suggestion: 'Remove empty rows or fill with appropriate data',
        code: 'EMPTY_ROW'
      });
      return;
    }
    
    // Check for quoting issues
    const quoteCount = (line.match(new RegExp(quoteChar, 'g')) || []).length;
    if (quoteCount % 2 !== 0) {
      context.rowIssues.quotingIssues.push({
        row: index + 1,
        issue: 'Unmatched quotes detected'
      });
      context.errors.push({
        type: 'row',
        severity: 'error',
        message: `Row ${index + 1} has unmatched quotes`,
        location: { row: index + 1 },
        suggestion: 'Ensure all quotes are properly paired and escaped',
        code: 'UNMATCHED_QUOTES'
      });
    }
    
    try {
      let values = parseCSVLine(line, delimiter, quoteChar);
      
      if (trimWhitespace) {
        values = values.map(v => v.trim());
      }
      
      parsedRows.push(values);
      
      if (values.length !== expectedColumnCount) {
        context.rowIssues.rowsWithInconsistentColumns.push({
          row: index + 1,
          expected: expectedColumnCount,
          actual: values.length
        });
        
        const severity = Math.abs(values.length - expectedColumnCount) > 1 ? 'error' as const : 'warning' as const;
        
        context.errors.push({
          type: 'row',
          severity,
          message: `Row ${index + 1} has ${values.length} columns, expected ${expectedColumnCount}`,
          location: { row: index + 1 },
          suggestion: values.length < expectedColumnCount ? 
            'Add missing column values or check for missing delimiters' : 
            'Remove extra column values or check for extra delimiters',
          code: 'INCONSISTENT_COLUMNS'
        });
      }
      
      // Check for partially empty rows
      const nullValues = options.nullValues || ['', 'null', 'NULL', 'n/a', 'N/A', 'na', 'NA', '-'];
      const emptyCells = values.filter(v => nullValues.includes(v)).length;
      
      if (emptyCells > 0 && emptyCells < values.length) {
        context.rowIssues.partiallyEmptyRows.push({
          row: index + 1,
          emptyCells
        });
        
        if (emptyCells / values.length > 0.5) { // More than 50% empty
          context.warnings.push({
            type: 'row',
            severity: 'warning',
            message: `Row ${index + 1} has ${emptyCells} empty cells (${Math.round(emptyCells/values.length*100)}% of row)`,
            location: { row: index + 1 },
            suggestion: 'Consider if this row should be removed or if missing data should be filled',
            code: 'MOSTLY_EMPTY_ROW'
          });
        }
      }
      
    } catch (error) {
      context.errors.push({
        type: 'row',
        severity: 'error',
        message: `Failed to parse row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown parsing error'}`,
        location: { row: index + 1 },
        suggestion: 'Check row format and ensure proper quoting/escaping',
        code: 'PARSE_ERROR'
      });
    }
  });
  
  context.rowIssues.consistentColumnCount = context.rowIssues.rowsWithInconsistentColumns.length === 0;
  return parsedRows;
}

// Enhanced data validation with statistical analysis
function validateData(
  parsedRows: string[][], 
  headers: string[], 
  options: CsvValidationOptions, 
  context: CsvValidationContext
): void {
  if (!options.validateData) return;
  
  const nullValues = options.nullValues || ['', 'null', 'NULL', 'n/a', 'N/A', 'na', 'NA', '-'];
  
  // Initialize column stats
  headers.forEach(header => {
    context.dataIssues.columnStats[header] = {
      uniqueValues: 0,
      nullCount: 0,
      emptyStringCount: 0,
      dataTypeConfidence: 0,
      outliers: []
    };
  });
  
  // Collect all values by column for analysis
  const columnValues: Record<string, any[]> = {};
  headers.forEach(header => {
    columnValues[header] = [];
  });
  
  // Process each row with enhanced validation
  parsedRows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const columnName = headers[colIndex] || `Column_${colIndex}`;
      
      // Check encoding issues
      if (value && typeof value === 'string') {
        // Detect potential encoding issues
        if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(value)) {
          context.dataIssues.encodingIssues.push({
            row: rowIndex + 1,
            column: columnName,
            issue: 'Potential encoding issue detected'
          });
        }
        
        // Check for malformed cells
        if (value.includes('"') && !value.startsWith('"') && !value.endsWith('"')) {
          context.dataIssues.malformedCells.push({
            row: rowIndex + 1,
            column: columnName,
            columnIndex: colIndex,
            value,
            issue: 'Contains unescaped quotes'
          });
        }
        
        // Check for suspicious patterns
        if (value.length > 1000) {
          context.warnings.push({
            type: 'data',
            severity: 'warning',
            message: `Row ${rowIndex + 1}, column "${columnName}" contains very long text (${value.length} characters)`,
            location: { row: rowIndex + 1, column: columnName },
            suggestion: 'Verify if this is expected or if data might be corrupted',
            code: 'LONG_TEXT_VALUE'
          });
        }
      }
      
      if (nullValues.includes(value)) {
        context.dataIssues.missingValues.push({
          row: rowIndex + 1,
          column: columnName,
          columnIndex: colIndex
        });
        context.dataIssues.columnStats[columnName].nullCount++;
      } else if (value === '') {
        context.dataIssues.columnStats[columnName].emptyStringCount++;
      } else {
        columnValues[columnName].push(value);
      }
    });
  });
  
  // Enhanced type inference and validation
  if (options.inferDataTypes) {
    headers.forEach((header, colIndex) => {
      const values = columnValues[header];
      const { type: inferredType, confidence } = inferDataType(values);
      context.dataIssues.dataTypes[header] = inferredType;
      
      // Statistical analysis for numeric columns
      if (['integer', 'float', 'percentage', 'currency'].includes(inferredType)) {
        const numericValues = values
          .map(v => {
            let num = String(v).replace(/[,%$£€¥₹]/g, '');
            if (String(v).endsWith('%')) num = num.slice(0, -1);
            return Number(num);
          })
          .filter(n => !isNaN(n) && isFinite(n));
        
        if (numericValues.length > 0) {
          const sorted = numericValues.sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;
          
          const outliers = numericValues.filter(v => v < lowerBound || v > upperBound);
          context.dataIssues.columnStats[header].outliers = outliers;
          
          if (outliers.length > 0 && outliers.length / numericValues.length > 0.1) {
            context.warnings.push({
              type: 'data',
              severity: 'info',
              message: `Column "${header}" has ${outliers.length} potential outliers`,
              suggestion: 'Review outlier values to ensure data quality',
              code: 'OUTLIERS_DETECTED'
            });
          }
        }
      }
      
      // Type consistency checking
      const typeIssues: Array<{ row: number; value: any; actualType: string }> = [];
      
      parsedRows.forEach((row, rowIndex) => {
        const value = row[colIndex];
        if (value && !nullValues.includes(value)) {
          let hasIssue = false;
          let actualType = 'string';
          
          switch (inferredType) {
            case 'integer':
            case 'float':
              if (isNaN(Number(value)) || !isFinite(Number(value))) {
                actualType = 'non-numeric';
                hasIssue = true;
              }
              break;
            case 'date':
              if (isNaN(Date.parse(value))) {
                actualType = 'non-date';
                hasIssue = true;
              }
              break;
            case 'email':
              if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                actualType = 'non-email';
                hasIssue = true;
              }
              break;
            case 'boolean':
              const boolStr = String(value).toLowerCase().trim();
              if (!['true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 't', 'f'].includes(boolStr)) {
                actualType = 'non-boolean';
                hasIssue = true;
              }
              break;
          }
          
          if (hasIssue) {
            typeIssues.push({ row: rowIndex + 1, value, actualType });
          }
        }
      });
      
      if (typeIssues.length > 0) {
        context.dataIssues.typeInconsistencies.push({
          column: header,
          columnIndex: colIndex,
          inferredType,
          issues: typeIssues
        });
        
        const errorRate = typeIssues.length / values.length;
        const severity = errorRate > 0.1 ? 'warning' as const : 'info' as const;
        
        context.warnings.push({
          type: 'data',
          severity,
          message: `Column "${header}" has ${typeIssues.length} values inconsistent with inferred type "${inferredType}" (${Math.round(errorRate * 100)}% error rate)`,
          suggestion: `Ensure all values in column "${header}" are valid ${inferredType} values`,
          code: 'TYPE_INCONSISTENCY'
        });
      }
      
      // Update column stats
      const uniqueValues = new Set(values);
      context.dataIssues.columnStats[header].uniqueValues = uniqueValues.size;
      context.dataIssues.columnStats[header].dataTypeConfidence = confidence;
      
      if (uniqueValues.size > 0) {
        const valueCounts = new Map();
        values.forEach(v => valueCounts.set(v, (valueCounts.get(v) || 0) + 1));
        const mostCommon = Array.from(valueCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        context.dataIssues.columnStats[header].mostCommonValue = mostCommon[0];
      }
      
      // Check for suspiciously low cardinality
      if (values.length > 100 && uniqueValues.size === 1) {
        context.warnings.push({
          type: 'data',
          severity: 'info',
          message: `Column "${header}" has only one unique value across ${values.length} rows`,
          suggestion: 'Consider if this column is necessary or if there might be a data issue',
          code: 'LOW_CARDINALITY'
        });
      }
    });
  }
}

// Main validation function
export function validateCsv(
  csv: string,
  options: CsvValidationOptions = {}
): CsvValidationResult {
  const context: CsvValidationContext = {
    errors: [],
    warnings: [],
    dataIssues: {
      missingValues: [],
      malformedCells: [],
      encodingIssues: [],
      dataTypes: {},
      typeInconsistencies: [],
      columnStats: {}
    },
    rowIssues: {
      expectedColumnCount: 0,
      totalRows: 0,
      emptyRows: [],
      rowsWithInconsistentColumns: [],
      partiallyEmptyRows: [],
      quotingIssues: [],
      lineEndingType: 'LF',
      consistentColumnCount: true
    },
    rowsProcessed: 0,
    columnsProcessed: 0,
    headerIssues: {
      hasHeaders: false,
      headerCount: 0,
      duplicateHeaders: [],
      emptyHeaders: [],
      whitespaceOnlyHeaders: [],
      invalidCharacterHeaders: [],
      headers: [],
      uniqueHeaders: true,
      suspiciousHeaders: []
    }
  };

  try {
    // Split into lines and detect line endings
    const lines = csv.split(/\r\n|\r|\n/);
    context.rowIssues.lineEndingType = detectLineEnding(csv);
    
    if (lines.length === 0) {
      context.errors.push({
        type: 'structure',
        severity: 'error',
        message: 'File is empty',
        suggestion: 'Provide a non-empty CSV file',
        code: 'EMPTY_FILE'
      });
      return { isValid: false, data: [], context };
    }

    // Detect delimiter if not specified
    const delimiterResult = detectDelimiter(lines);
    const delimiter = options.delimiter || delimiterResult.delimiter;
    if (!delimiter) {
      context.errors.push({
        type: 'structure',
        severity: 'error',
        message: 'Could not detect CSV delimiter',
        suggestion: 'Specify a delimiter or ensure the file has a consistent structure',
        code: 'DELIMITER_DETECTION_FAILED'
      });
      return { isValid: false, data: [], context };
    }

    // Parse headers
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine, delimiter, options.quoteChar || '"')
      .map(h => options.trimWhitespace !== false ? h.trim() : h);

    // Validate headers
    const headerValidation = validateHeaders(headers, options);
    context.errors.push(...headerValidation.errors);
    context.warnings.push(...headerValidation.warnings);

    // Process data rows
    const dataLines = lines.slice(options.hasHeader ? 1 : 0);
    const parsedRows = validateRows(dataLines, headers, delimiter, context, options);
    
    // Update processed counts
    context.rowsProcessed = parsedRows.length;
    context.columnsProcessed = headers.length;
    
    // Validate data if requested
    if (options.validateData) {
      validateData(parsedRows, headers, options, context);
    }

    // Check for maximum rows/columns if specified
    if (options.maxRows && parsedRows.length > options.maxRows) {
      context.errors.push({
        type: 'structure',
        severity: 'error',
        message: `File exceeds maximum row limit of ${options.maxRows}`,
        suggestion: 'Split the file into smaller chunks or increase the limit',
        code: 'MAX_ROWS_EXCEEDED'
      });
    }

    if (options.maxColumns && headers.length > options.maxColumns) {
      context.errors.push({
        type: 'structure',
        severity: 'error',
        message: `File exceeds maximum column limit of ${options.maxColumns}`,
        suggestion: 'Split the file into multiple files or increase the limit',
        code: 'MAX_COLUMNS_EXCEEDED'
      });
    }

    // Convert to objects if requested
    const data = options.returnObjects ? 
      parsedRows.map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      }) : 
      parsedRows;

    return {
      isValid: context.errors.length === 0,
      data,
      context
    };

  } catch (error) {
    context.errors.push({
      type: 'structure',
      severity: 'error',
      message: `Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestion: 'Check file format and ensure it is a valid CSV',
      code: 'PROCESSING_ERROR'
    });
    return { isValid: false, data: [], context };
  }
}

// Tool type definitions
type CsvTool = {
  name: string;
  description: string;
  version: string;
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  handler: (input: z.infer<typeof checkCsvTool.inputSchema>) => Promise<z.infer<typeof checkCsvTool.outputSchema>>;
};

// Tool definition
export const checkCsvTool: CsvTool = {
  name: 'check-csv',
  description: 'Validates and analyzes CSV data with comprehensive checks',
  version: '1.0.0',
  inputSchema: z.object({
    csv: z.string().min(1, 'CSV content cannot be empty'),
    options: z.object({
      delimiter: z.string().length(1).optional(),
      hasHeader: z.boolean().default(true),
      requiredColumns: z.array(z.string()).optional(),
      maxRows: z.number().positive().optional(),
      maxColumns: z.number().positive().optional(),
      validateData: z.boolean().default(true),
      inferDataTypes: z.boolean().default(true),
      trimWhitespace: z.boolean().default(true),
      quoteChar: z.string().optional(),
      nullValues: z.array(z.string()).optional(),
      returnObjects: z.boolean().default(false)
    }).optional().default({})
  }),
  outputSchema: z.object({
    isValid: z.boolean(),
    data: z.array(z.any()),
    context: z.object({
      errors: z.array(z.object({
        type: z.string(),
        severity: z.string(),
        message: z.string(),
        location: z.object({
          row: z.number().optional(),
          column: z.union([z.string(), z.number()]).optional(),
          cell: z.string().optional()
        }).optional(),
        suggestion: z.string().optional(),
        code: z.string().optional()
      })),
      warnings: z.array(z.object({
        type: z.string(),
        severity: z.string(),
        message: z.string(),
        location: z.object({
          row: z.number().optional(),
          column: z.union([z.string(), z.number()]).optional(),
          cell: z.string().optional()
        }).optional(),
        suggestion: z.string().optional(),
        code: z.string().optional()
      })),
      dataIssues: z.object({
        missingValues: z.array(z.object({
          row: z.number(),
          column: z.string(),
          columnIndex: z.number()
        })),
        malformedCells: z.array(z.object({
          row: z.number(),
          column: z.string(),
          columnIndex: z.number(),
          value: z.any(),
          issue: z.string()
        })),
        encodingIssues: z.array(z.object({
          row: z.number(),
          column: z.string(),
          issue: z.string()
        })),
        dataTypes: z.record(z.string()),
        typeInconsistencies: z.array(z.object({
          column: z.string(),
          columnIndex: z.number(),
          inferredType: z.string(),
          issues: z.array(z.object({
            row: z.number(),
            value: z.any(),
            actualType: z.string()
          }))
        })),
        columnStats: z.record(z.object({
          uniqueValues: z.number(),
          nullCount: z.number(),
          emptyStringCount: z.number(),
          dataTypeConfidence: z.number(),
          outliers: z.array(z.number()).optional(),
          mostCommonValue: z.any().optional()
        }))
      }),
      rowIssues: z.object({
        expectedColumnCount: z.number(),
        totalRows: z.number(),
        emptyRows: z.array(z.number()),
        rowsWithInconsistentColumns: z.array(z.object({
          row: z.number(),
          expected: z.number(),
          actual: z.number()
        })),
        partiallyEmptyRows: z.array(z.object({
          row: z.number(),
          emptyCells: z.number()
        })),
        quotingIssues: z.array(z.object({
          row: z.number(),
          issue: z.string()
        })),
        lineEndingType: z.string(),
        consistentColumnCount: z.boolean()
      }),
      rowsProcessed: z.number(),
      columnsProcessed: z.number(),
      headerIssues: z.object({
        hasHeaders: z.boolean(),
        headerCount: z.number(),
        duplicateHeaders: z.array(z.string()),
        emptyHeaders: z.array(z.number()),
        whitespaceOnlyHeaders: z.array(z.number()),
        invalidCharacterHeaders: z.array(z.string()),
        headers: z.array(z.string()),
        uniqueHeaders: z.boolean(),
        suspiciousHeaders: z.array(z.string())
      })
    })
  }),
  handler: async (input: z.infer<typeof checkCsvTool.inputSchema>) => {
    return validateCsv(input.csv, input.options);
  }
}; 
