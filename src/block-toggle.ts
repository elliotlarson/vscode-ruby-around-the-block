export interface ToggledCode {
  replacementLines: string[];
  startLineNum: number;
  endLineNum: number;
}

type BlockMarker = 'doend' | 'brace';

interface BlockMarkerPosition {
  lineNum: number;
  columnNum: number;
  blockType: BlockMarker;
}

interface BlockMarkerSearch {
  markerRegex: RegExp;
  blockType: BlockMarker;
}

const START_DOEND_BLOCK_REGEXP = /do\b/;

const START_SEARCHES: BlockMarkerSearch[] = [
  { markerRegex: START_DOEND_BLOCK_REGEXP, blockType: 'doend' },
  { markerRegex: /[^#]({)/, blockType: 'brace' },
];

const END_DOEND_BLOCK_REGEXP = /end\b/;

const END_SEARCHES: BlockMarkerSearch[] = [
  { markerRegex: END_DOEND_BLOCK_REGEXP, blockType: 'doend' },
  { markerRegex: /}$/, blockType: 'brace' },
];

export function findBlockStart(
  lines: string[], currentLineNum: number
): BlockMarkerPosition {
  return findBlock(lines, currentLineNum, -1, START_SEARCHES);
}

export function findBlockEnd(
  lines: string[],
  currentLineNum: number,
  blockType: null | BlockMarker = null,
): BlockMarkerPosition {
  return findBlock(lines, currentLineNum, +1, END_SEARCHES, blockType);
}

function findBlock(
  lines: string[],
  currentLineNum: number,
  incrementor: number,
  blockMarkerSearches: BlockMarkerSearch[],
  blockType: null | BlockMarker = null,
): BlockMarkerPosition {
  const currentLine = rtrim(lines[currentLineNum]);
  for (let search of blockMarkerSearches) {
    const onlyFindingForSpecficType: boolean =
      blockType !== null && search.blockType !== blockType;
    if (onlyFindingForSpecficType) { continue; }
    let matches = search.markerRegex.exec(currentLine);
    if (matches === null) { continue; }
    let columnNum = matches.index;
    if (/.{/.test(matches[0])) {
      columnNum += 1;
    }
    return {
      lineNum: currentLineNum,
      columnNum: columnNum,
      blockType: search.blockType,
    };
  }
  const newLineNum = currentLineNum + incrementor;
  return findBlock(
    lines, newLineNum, incrementor, blockMarkerSearches, blockType
  );
}

function rtrim(str: string): string {
  return str.replace(/~+$/, '');
}

export interface CurrentBlockDescriptor {
  blockType: BlockMarker;
  startLineNum: number;
  startColumnNum: number;
  endLineNum: number;
  endColumnNum: number;
}

export function getCurrentBlockDescriptor(
  lines: string[], currentLineNum: number
): CurrentBlockDescriptor {
  const blockStart = findBlockStart(lines, currentLineNum);
  const blockEnd = findBlockEnd(lines, currentLineNum, blockStart.blockType);
  return {
    blockType: blockStart.blockType,
    startLineNum: blockStart.lineNum,
    startColumnNum: blockStart.columnNum,
    endLineNum: blockEnd.lineNum,
    endColumnNum: blockEnd.columnNum,
  };
}

export function getDoendReplacementBlockLines(
  lines: string[], currentBlockDescriptor: CurrentBlockDescriptor,
): string[] {
  let blockLines = lines.slice(
    currentBlockDescriptor.startLineNum,
    currentBlockDescriptor.endLineNum + 1,
  );

  const doLength = 2;
  const endLength = 3;

  let startIndex = currentBlockDescriptor.startColumnNum;
  let endIndex = startIndex + doLength;
  let lineIndex = 0;
  let line = blockLines[lineIndex].replace(START_DOEND_BLOCK_REGEXP, '{');
  blockLines[lineIndex] = line;

  startIndex = currentBlockDescriptor.endColumnNum;
  endIndex = startIndex + endLength;
  lineIndex = blockLines.length - 1;
  line = blockLines[lineIndex].replace(END_DOEND_BLOCK_REGEXP, '}');
  blockLines[lineIndex] = line;

  if (blockLines.length > 3) { return blockLines };

  const indentSpaces = /^\s*/.exec(blockLines[0]);
  const blockLinesStr = blockLines.join(' ')
    .replace(/\s+/g, ' ') // remove extra spaces
    .replace(/^\s*/, indentSpaces[0]); // add back indent spaces
  return [blockLinesStr];
}

export function getBraceReplacementBlockLines(
  lines: string[], currentBlockDescriptor: CurrentBlockDescriptor,
): string[] {
  let blockLines = lines.slice(
    currentBlockDescriptor.startLineNum,
    currentBlockDescriptor.endLineNum + 1,
  );
  const startCol = currentBlockDescriptor.startColumnNum;
  const endCol = currentBlockDescriptor.endColumnNum;

  let args = '';
  const argMatches = blockLines[0].match(/\|.*\|/);
  if (argMatches !== null) {
    args = ` ${argMatches[0]}`;
  }

  if (blockLines.length === 1) {
    const indent = blockLines[0].match(/^\s*/)[0];
    let braceLine = `${blockLines[0].substring(0, startCol)}do${args}`;
    let inBlock = blockLines[0].substring(startCol + 1, endCol).trim();
    if (argMatches !== null) {
      inBlock = inBlock.replace(argMatches[0], '').trim();
    }
    return [
      `${braceLine}`,
      `${indent}  ${inBlock}`,
      `${indent}end`,
    ];
  } else {
    blockLines[0] = `${blockLines[0].substring(0, startCol)}do${args}`;
    const lastInd = blockLines.length - 1;
    blockLines[lastInd] = `${blockLines[lastInd].substring(0, endCol)}end`;
    return blockLines;
  }
}

export function blockToggle(lines: string[], currentLineNum: number): ToggledCode {
  const currentBlockDescriptor = getCurrentBlockDescriptor(lines, currentLineNum);
  let replacementLines
  if (currentBlockDescriptor.blockType == 'doend') {
    replacementLines = getDoendReplacementBlockLines(lines, currentBlockDescriptor);
  } else {
    replacementLines = getBraceReplacementBlockLines(lines, currentBlockDescriptor);
  }
  return {
    replacementLines: replacementLines,
    startLineNum: currentBlockDescriptor.startLineNum,
    endLineNum: currentBlockDescriptor.endLineNum,
  };
}
