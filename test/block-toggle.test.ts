import {
  getCurrentBlockDescriptor,
  findBlockStart,
  findBlockEnd,
  CurrentBlockDescriptor,
  getDoendReplacementBlockLines,
  getBraceReplacementBlockLines,
  blockToggle,
} from '../src/block-toggle';
import { expect } from 'chai';
import 'mocha';

let doEndBlock = `
  describe 'my test' do
    let(:foo) do
      create(:foo)
    end
  end
  `;

let doEndBlockWithQuotedHashmark = `
within('#main_nav') do
  click_on('about us')
end
`;

let doEndBlockWithStringInterpolation = `
users.map do |user|
  "sello, #{user.full_name}!"
end
`;

let doEndBlockSingleLine = `
  describe 'my test' do
    let(:foo) do create(:foo) end
  end
  `;

let doEndBlockWithComment = `
  describe 'my test' do
    let(:foo) do
      # a comment
      create(:foo)
      # here's another comment
    end
  end
  `;

let bracesOneLineBlock = `
  describe 'my test' do
    let(:foo) { create(:foo) }
  end
  `;

let doEndBlockWithArgument = `
  def my_method(array_name_with_do_in_it)
    array_name_with_do_in_it.map do |item|
      item.upcase
    end
  end
  `;

let bracesBlockWithArgument = `
  def my_method(array_name_with_do_in_it)
    array_name_with_do_in_it.map { |item| item.upcase }
  end
  `;

let bracesBlockWithHash = `
  describe 'my test' do
    let(:foo) { { foo: 'bar' } }
  end
  `;

let doEndBlockWithHash = `
  describe 'my test' do
    let(:foo) do
      { foo: 'bar' }
    end
  end
  `;

let bracesBlockWithComment = `
  describe 'my test' do
    let(:foo) {
      # a comment
      create(:foo)
      # here's another comment
    }
  end
  `;

let bracesBlockWithMultipleLines = `
  describe 'my test' do
    let(:foo) {
      create(:foo)
    }
  end
  `;

describe('findBlockStart()', () => {
  const testCases = [
    {
      codeString: 'doEndBlock',
      cursorLine: 3,
      lineNum: 2,
      columnNum: 14,
      blockType: 'doend',
    },
    {
      codeString: 'doEndBlockWithQuotedHashmark',
      cursorLine: 2,
      lineNum: 1,
      columnNum: 20,
      blockType: 'doend',
    },
    {
      codeString: 'doEndBlockWithStringInterpolation',
      cursorLine: 2,
      lineNum: 1,
      columnNum: 10,
      blockType: 'doend'
    },
    {
      codeString: 'doEndBlockSingleLine',
      cursorLine: 2,
      lineNum: 2,
      columnNum: 14,
      blockType: 'doend',
    },
    {
      codeString: 'doEndBlock',
      cursorLine: 2,
      lineNum: 2,
      columnNum: 14,
      blockType: 'doend',
    },
    {
      codeString: 'bracesOneLineBlock',
      cursorLine: 2,
      lineNum: 2,
      columnNum: 14,
      blockType: 'brace',
    },
    {
      codeString: 'doEndBlockWithArgument',
      cursorLine: 3,
      lineNum: 2,
      columnNum: 33,
      blockType: 'doend',
    },
    {
      codeString: 'bracesBlockWithHash',
      cursorLine: 2,
      lineNum: 2,
      columnNum: 14,
      blockType: 'brace',
    },
  ];

  for (let testCase of testCases) {
    let codeString = testCase.codeString;
    let cursorLine = testCase.cursorLine;

    context(`${codeString} with cursor on line ${cursorLine}`, () => {
      let blockStart;

      beforeEach(() => {
        const codeLines = eval(testCase.codeString).split('\n');
        blockStart = findBlockStart(codeLines, testCase.cursorLine);
      });

      it('finds the correct block start line num', () => {
        expect(blockStart.lineNum).to.eq(testCase.lineNum);
      });

      it('finds the correct block start column num', () => {
        expect(blockStart.columnNum).to.eq(testCase.columnNum);
      });

      it('finds the correct block type', () => {
        expect(blockStart.blockType).to.eq(testCase.blockType);
      });
    });
  }
});

describe('findBlockEnd()', () => {
  const testCases = [
    {
      codeString: 'doEndBlock',
      cursorLine: 3,
      lineNum: 4,
      columnNum: 4,
      blockType: 'doend',
    },
    {
      codeString: 'doEndBlockSingleLine',
      cursorLine: 2,
      lineNum: 2,
      columnNum: 30,
      blockType: 'doend',
    },
    {
      codeString: 'doEndBlock',
      cursorLine: 2,
      lineNum: 4,
      columnNum: 4,
      blockType: 'doend',
    },
    {
      codeString: 'bracesOneLineBlock',
      cursorLine: 2,
      lineNum: 2,
      columnNum: 29,
      blockType: 'brace',
    },
    {
      codeString: 'doEndBlockWithComment',
      cursorLine: 4,
      lineNum: 6,
      columnNum: 4,
      blockType: 'doend',
    },
    {
      codeString: 'doEndBlockWithArgument',
      cursorLine: 3,
      lineNum: 4,
      columnNum: 4,
      blockType: 'doend',
    },
    {
      codeString: 'bracesBlockWithHash',
      cursorLine: 2,
      lineNum: 2,
      columnNum: 31,
      blockType: 'brace',
    },
  ];

  for (let testCase of testCases) {
    let codeString = testCase.codeString;
    let cursorLine = testCase.cursorLine;

    context(`${codeString} with cursor on line ${cursorLine}`, () => {
      let blockStart;

      beforeEach(() => {
        const codeLines = eval(testCase.codeString).split('\n');
        blockStart = findBlockEnd(codeLines, testCase.cursorLine);
      });

      it('finds the correct block start line num', () => {
        expect(blockStart.lineNum).to.eq(testCase.lineNum);
      });

      it('finds the correct block end column num', () => {
        expect(blockStart.columnNum).to.eq(testCase.columnNum);
      });

      it('finds the correct block type', () => {
        expect(blockStart.blockType).to.eq(testCase.blockType);
      });
    });
  }

  describe('defining a specific block end type', () => {
    context('doend block with a hash in it', () => {
      let blockEnd;
      const testCase = {
        codeString: 'doEndBlockWithHash',
        cursorLine: 2,
        lineNum: 4,
        columnNum: 4,
        blockType: 'doend',
      };

      beforeEach(() => {
        const codeLines = eval(testCase.codeString).split('\n');
        blockEnd = findBlockEnd(codeLines, testCase.cursorLine, 'doend');
      });

      it('finds the correct block end line num', () => {
        expect(blockEnd.lineNum).to.eq(testCase.lineNum);
      });

      it('finds the correct block end column num', () => {
        expect(blockEnd.columnNum).to.eq(testCase.columnNum);
      });

      it('finds the correct block type', () => {
        expect(blockEnd.blockType).to.eq(testCase.blockType);
      });
    });
  });

  context('a set of code lines that do not contain a block', () => {});
});

describe('currentBlock()', () => {
  context('with do end block', () => {
    let block;
    beforeEach(() => {
      const currentLineNum = 2;
      block = getCurrentBlockDescriptor(doEndBlock.split('\n'), currentLineNum);
    });

    it('returns the correct type of block', () => {
      expect(block.blockType).to.eq('doend');
    });

    it('returns the expected starting line', () => {
      expect(block.startLineNum).to.eq(2);
    });

    it('returns the expected starting column', () => {
      expect(block.startColumnNum).to.eq(14);
    });

    it('returns the correct end line', () => {
      expect(block.endLineNum).to.eq(4);
    });

    it('returns the correct end column', () => {
      expect(block.endColumnNum).to.eq(4);
    });
  })
});

describe('getDoendReplacementBlockLines()', () => {
  context('with do end block', () => {
    it('returns the expected replacement lines', () => {
      const currentBlockDescriptor: CurrentBlockDescriptor = {
        blockType: 'doend',
        startLineNum: 2,
        startColumnNum: 14,
        endLineNum: 4,
        endColumnNum: 4,
      };
      const lines = doEndBlock.split('\n');
      const expectedReplacementLines = [bracesOneLineBlock.split('\n')[2]];
      const replacementLines =
        getDoendReplacementBlockLines(lines, currentBlockDescriptor);
      expect(replacementLines).to.deep.eq(expectedReplacementLines);
    });
  });

  context('with single line doend block', () => {
    it('returns the expected replacement lines', () => {
      const currentBlockDescriptor: CurrentBlockDescriptor = {
        blockType: 'doend',
        startLineNum: 2,
        startColumnNum: 14,
        endLineNum: 2,
        endColumnNum: 30,
      };
      const lines = doEndBlockSingleLine.split('\n');
      const expectedReplacementLines = [bracesOneLineBlock.split('\n')[2]];
      const replacementLines =
        getDoendReplacementBlockLines(lines, currentBlockDescriptor);
      expect(replacementLines).to.deep.eq(expectedReplacementLines);
    });
  });

  context('doend block with arguments', () => {
    it('returns the expected replacement lines', () => {
      const currentBlockDescriptor: CurrentBlockDescriptor = {
        blockType: 'doend',
        startLineNum: 2,
        startColumnNum: 33,
        endLineNum: 4,
        endColumnNum: 4,
      };
      const lines = doEndBlockWithArgument.split('\n');
      const expectedReplacementLines = [bracesBlockWithArgument.split('\n')[2]];
      const replacementLines =
        getDoendReplacementBlockLines(lines, currentBlockDescriptor);
      expect(replacementLines).to.deep.eq(expectedReplacementLines);
    });
  });

  context('doend block with multiple lines', () => {
    it('returns the expected replacement lines', () => {
      const currentBlockDescriptor: CurrentBlockDescriptor = {
        blockType: 'doend',
        startLineNum: 2,
        startColumnNum: 14,
        endLineNum: 6,
        endColumnNum: 4,
      };
      const lines = doEndBlockWithComment.split('\n');
      const expectedReplacementLines =
        bracesBlockWithComment.split('\n').slice(2, 7);
      const replacementLines =
        getDoendReplacementBlockLines(lines, currentBlockDescriptor);
      expect(replacementLines).to.deep.eq(expectedReplacementLines);
    });
  });
});

describe('getBraceReplacementBlockLines()', () => {
  context('with single line brace block', () => {
    it('returns the expected replacement lines', () => {
      const currentBlockDescriptor: CurrentBlockDescriptor = {
        blockType: 'brace',
        startLineNum: 2,
        startColumnNum: 14,
        endLineNum: 2,
        endColumnNum: 29,
      };
      const lines = bracesOneLineBlock.split('\n');
      const expectedReplacementLines = doEndBlock.split('\n').slice(2, 5);
      const replacementLines =
        getBraceReplacementBlockLines(lines, currentBlockDescriptor);
      expect(replacementLines).to.deep.eq(expectedReplacementLines);
    });
  });

  context('with multi line brace block', () => {
    it('returns the expected replacement lines', () => {
      const currentBlockDescriptor: CurrentBlockDescriptor = {
        blockType: 'brace',
        startLineNum: 2,
        startColumnNum: 14,
        endLineNum: 4,
        endColumnNum: 4,
      };
      const lines = bracesBlockWithMultipleLines.split('\n');
      const expectedReplacementLines = doEndBlock.split('\n').slice(2, 5);
      const replacementLines =
        getBraceReplacementBlockLines(lines, currentBlockDescriptor);
      expect(replacementLines).to.deep.eq(expectedReplacementLines);
    });
  });

  context('single line brace block with argument block', () => {
    it('returns the expected replacement lines', () => {
      const currentBlockDescriptor: CurrentBlockDescriptor = {
        blockType: 'brace',
        startLineNum: 2,
        startColumnNum: 33,
        endLineNum: 2,
        endColumnNum: 54,
      };
      const lines = bracesBlockWithArgument.split('\n');
      const expectedReplacementLines = doEndBlockWithArgument.split('\n').slice(2, 5);
      const replacementLines =
        getBraceReplacementBlockLines(lines, currentBlockDescriptor);
      expect(replacementLines).to.deep.eq(expectedReplacementLines);
    });
  });
});

describe('blockToggle()', () => {
  let toggled;

  context('with a doEnd block', () => {
    const lines = doEndBlock.split('\n');
    const replacementLines = [bracesOneLineBlock.split('\n')[2]];

    beforeEach(() => {
      const currentLineNum = 2;
      toggled = blockToggle(lines, currentLineNum);
    });

    it('returns the expected lines', () => {
      expect(toggled.replacementLines).to.deep.eq(replacementLines);
    });

    it('returns the expected lineStart', () => {
      expect(toggled.startLineNum).to.eq(2);
    });

    it('returns the expected lineEnd', () => {
      expect(toggled.endLineNum).to.eq(4);
    });
  });

  context('with a brace block', () => {
    const lines = bracesOneLineBlock.split('\n');
    const replacementLines = doEndBlock.split('\n').slice(2, 5);

    beforeEach(() => {
      const currentLineNum = 2;
      toggled = blockToggle(lines, currentLineNum);
    });

    it('returns the expected lines', () => {
      expect(toggled.replacementLines).to.deep.eq(replacementLines);
    });

    it('returns the expected lineStart', () => {
      expect(toggled.startLineNum).to.eq(2);
    });

    it('returns the expected lineEnd', () => {
      expect(toggled.endLineNum).to.eq(2);
    });
  });
});
