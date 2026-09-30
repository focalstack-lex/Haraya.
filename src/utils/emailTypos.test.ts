import { describe, expect, it } from 'vitest';
import { suggestEmail } from './emailTypos';

describe('suggestEmail', () => {
  it('corrects common misspellings of Gmail, whatever the case', () => {
    expect(suggestEmail('lex@gmial.com')).toBe('lex@gmail.com');
    expect(suggestEmail('lex@gmai.com')).toBe('lex@gmail.com');
    expect(suggestEmail('lex@gmail.con')).toBe('lex@gmail.com');
    expect(suggestEmail('lex@gmail.co')).toBe('lex@gmail.com');
    expect(suggestEmail(' Lex.M@GMAIL.COMM ')).toBe('lex.m@gmail.com');
    expect(suggestEmail('lex@gnail.com')).toBe('lex@gmail.com');
  });

  it('corrects the other big providers', () => {
    expect(suggestEmail('a@hotmial.com')).toBe('a@hotmail.com');
    expect(suggestEmail('a@yaho.com')).toBe('a@yahoo.com');
    expect(suggestEmail('a@outlok.com')).toBe('a@outlook.com');
    expect(suggestEmail('a@iclould.com')).toBe('a@icloud.com');
  });

  it('says nothing about a correct address', () => {
    for (const ok of ['lex@gmail.com', 'lex@yahoo.com', 'lex@outlook.com', 'lex@hotmail.com', 'lex@icloud.com']) {
      expect(suggestEmail(ok)).toBeNull();
    }
  });

  it('never flags an unusual domain such as a school or a company', () => {
    for (const ok of ['a@students.school.edu.ph', 'a@cjc.edu.ph', 'a@focalstack.dev', 'a@proton.me', 'a@live.com', 'a@ymail.com']) {
      expect(suggestEmail(ok)).toBeNull();
    }
  });

  it('ignores anything that is not an address yet', () => {
    expect(suggestEmail('')).toBeNull();
    expect(suggestEmail('lex')).toBeNull();
    expect(suggestEmail('@gmial.com')).toBeNull();
  });
});
