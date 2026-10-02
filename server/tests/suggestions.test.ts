import test from 'node:test';
import assert from 'node:assert/strict';
import { personalSuggestions } from '../../client/src/services/PersonalSuggestions.js';

test('suggestions use supplied profile and memory without inventing personal details', () => {
  const memories = [{ id: '1', category: 'Eğitim', text: 'İktisat öğrencisiyim', updatedAt: 0 }];
  const student = personalSuggestions({ tone: 'dengeli', interests: ['Tasarım'], memories });
  assert.equal(student[0].id, 'education');
  assert.match(student[0].prompt, /İktisat öğrencisiyim/);
  assert.equal(student[1].title, 'Tasarım keşfet');
  const otherAccount = personalSuggestions({ tone: 'dengeli', interests: ['Futbol'] });
  assert.ok(otherAccount.every(item => !item.prompt.includes('İktisat')));
  assert.equal(otherAccount[0].title, 'Futbol keşfet');
  assert.ok(personalSuggestions({ tone: 'ekonomist' }).some(item => item.id === 'tax'));
  const sensitive = personalSuggestions({ tone: 'dengeli', memories: [{ ...memories[0], text: 'Şifrem abc123' }] });
  assert.ok(sensitive.every(item => !item.prompt.includes('abc123')));
  assert.equal(sensitive.length, 3);
});
