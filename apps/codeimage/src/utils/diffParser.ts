import type {DiffLine, DiffLineType} from '@codeimage/store/editor/model';

export interface ParsedDiff {
  leftCode: string;
  rightCode: string;
  diffLines: DiffLine[];
}

export function parseGitDiff(diffText: string): ParsedDiff {
  const lines = diffText.split('\n');
  const leftLines: string[] = [];
  const rightLines: string[] = [];
  const diffLines: DiffLine[] = [];

  let inHunk = false;
  let leftLineNum = 0;
  let rightLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('@@')) {
      inHunk = true;
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        leftLineNum = parseInt(match[1], 10) - 1;
        rightLineNum = parseInt(match[2], 10) - 1;
      }
      continue;
    }

    if (!inHunk) {
      continue;
    }

    if (line.startsWith('-')) {
      const content = line.slice(1);
      leftLines.push(content);
      leftLineNum++;
      diffLines.push({
        type: 'removed',
        content,
        lineNumber: {
          left: leftLineNum,
          right: null,
        },
      });
    } else if (line.startsWith('+')) {
      const content = line.slice(1);
      rightLines.push(content);
      rightLineNum++;
      diffLines.push({
        type: 'added',
        content,
        lineNumber: {
          left: null,
          right: rightLineNum,
        },
      });
    } else if (line.startsWith(' ')) {
      const content = line.slice(1);
      leftLines.push(content);
      rightLines.push(content);
      leftLineNum++;
      rightLineNum++;
      diffLines.push({
        type: 'unchanged',
        content,
        lineNumber: {
          left: leftLineNum,
          right: rightLineNum,
        },
      });
    } else if (line.startsWith('\\')) {
      continue;
    } else {
      inHunk = false;
    }
  }

  if (diffLines.length === 0) {
    return {
      leftCode: '',
      rightCode: '',
      diffLines: [],
    };
  }

  return {
    leftCode: leftLines.join('\n'),
    rightCode: rightLines.join('\n'),
    diffLines,
  };
}

export function computeDiffLines(
  leftCode: string,
  rightCode: string,
): DiffLine[] {
  const leftLines = leftCode.split('\n');
  const rightLines = rightCode.split('\n');
  const diffLines: DiffLine[] = [];

  const lcs = computeLCS(leftLines, rightLines);

  let i = 0;
  let j = 0;
  let k = 0;
  let leftLineNum = 0;
  let rightLineNum = 0;

  while (i < leftLines.length || j < rightLines.length) {
    if (k < lcs.length && leftLines[i] === lcs[k] && rightLines[j] === lcs[k]) {
      leftLineNum++;
      rightLineNum++;
      diffLines.push({
        type: 'unchanged',
        content: lcs[k],
        lineNumber: {
          left: leftLineNum,
          right: rightLineNum,
        },
      });
      i++;
      j++;
      k++;
    } else {
      const inLCS =
        k < lcs.length ? lcs.slice(k).includes(leftLines[i]) : false;

      if (i < leftLines.length && !inLCS) {
        leftLineNum++;
        diffLines.push({
          type: 'removed',
          content: leftLines[i],
          lineNumber: {
            left: leftLineNum,
            right: null,
          },
        });
        i++;
      } else if (j < rightLines.length) {
        rightLineNum++;
        diffLines.push({
          type: 'added',
          content: rightLines[j],
          lineNumber: {
            left: null,
            right: rightLineNum,
          },
        });
        j++;
      } else {
        break;
      }
    }
  }

  return mergeModifiedLines(diffLines);
}

function computeLCS(left: string[], right: string[]): string[] {
  const m = left.length;
  const n = right.length;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (left[i - 1] === right[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcs: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      lcs.unshift(left[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

function mergeModifiedLines(diffLines: DiffLine[]): DiffLine[] {
  const result: DiffLine[] = [];
  let i = 0;

  while (i < diffLines.length) {
    if (i + 1 < diffLines.length) {
      const current = diffLines[i];
      const next = diffLines[i + 1];

      if (
        (current.type === 'removed' && next.type === 'added') ||
        (current.type === 'added' && next.type === 'removed')
      ) {
        if (current.type === 'removed') {
          result.push({
            ...current,
            type: 'modified',
          });
          result.push({
            ...next,
            type: 'modified',
          });
        } else {
          result.push({
            ...next,
            type: 'modified',
          });
          result.push({
            ...current,
            type: 'modified',
          });
        }
        i += 2;
        continue;
      }
    }

    result.push(diffLines[i]);
    i++;
  }

  return result;
}

export function isGitDiffFormat(text: string): boolean {
  return (
    text.includes('diff --git') ||
    text.includes('--- ') ||
    text.includes('+++ ') ||
    text.startsWith('@@')
  );
}
