// Parser state class

'use strict';


function State(src, lexerBlock, lexerInline, renderer, tokens, options) {
  var ch, s, start, pos, len, indent, indent_found;

  // TODO: check if we can move string replaces to parser, to avoid
  // unnesessary call on shadow clone creation. Or check if we can do
  // cloning more effectively. Profile first.

  // Prepare string to parse:
  //
  // - replace tabs with spaces
  // - remove `\r` to simplify newlines check (???)

  this.src = src;

  // Shortcuts to simplify nested calls
  this.lexerBlock  = lexerBlock;
  this.lexerInline = lexerInline;
  this.renderer    = renderer;

  // TODO: (?) set directly for faster access.
  this.options = options;

  //
  // Internal state vartiables
  //

  this.tokens = tokens;

  this.bMarks = []; // line begin offsets for fast jumps
  this.eMarks = []; // line end offsets for fast jumps
  this.tShift = []; // indent for each line

  // Generate markers.
  s = this.src;
  indent = 0;
  indent_found = false;

  for (start = pos = indent = 0, len = s.length; pos < len; pos++) {
    ch = s.charCodeAt(pos);

    // TODO: check other spaces and tabs too or keep existing regexp replace ??
    if (!indent_found && ch === 0x20/* space */) {
      indent++;
    }
    if (!indent_found && ch !== 0x20/* space */) {
      this.tShift.push(indent);
      indent_found = true;
    }


    if (ch === 0x0D || ch === 0x0A) {
      this.bMarks.push(start);
      this.eMarks.push(pos);
      indent_found = false;
      indent = 0;
      start = pos + 1;
    }
    if (ch === 0x0D && pos < len && s.charCodeAt(pos) === 0x0A) {
      pos++;
      start++;
    }
  }
  if (ch !== 0x0D || ch !== 0x0A) {
    this.bMarks.push(start);
    this.eMarks.push(len);
    this.tShift.push(indent);
  }

  // inline lexer variables
  this.pos        = 0; // char index in src

  // block lexer variables
  this.blkLevel   = 0;
  this.blkIndent  = 0;
  this.line       = 0; // line index in src
  this.lineMax    = this.bMarks.length;
  this.tight      = false; // loose/tight mode for lists

  // renderer
  this.result = '';
}


// Create shadow clone of curent state with new input data
State.prototype.clone = function clone(src) {
  return new State(
    src,
    this.lexerBlock,
    this.lexerInline,
    this.renderer,
    this.tokens,
    this.options
  );
};

module.exports = State;