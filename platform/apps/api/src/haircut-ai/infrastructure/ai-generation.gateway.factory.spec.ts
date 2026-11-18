import type { AiGenerationGateway } from '../domain/ports';
import { selectAiGenerationGateway } from './ai-generation.gateway.factory';

const fake = { name: 'fake' } as unknown as AiGenerationGateway;
const gemini = { name: 'gemini' } as unknown as AiGenerationGateway;

describe('selectAiGenerationGateway', () => {
  it('без AI_PROVIDER лишає фейк (CI)', () => {
    expect(selectAiGenerationGateway({}, fake, gemini)).toBe(fake);
  });

  it('AI_PROVIDER=fake лишає фейк', () => {
    expect(selectAiGenerationGateway({ AI_PROVIDER: 'fake' }, fake, gemini)).toBe(fake);
  });

  it('AI_PROVIDER=gemini обирає Gemini', () => {
    expect(selectAiGenerationGateway({ AI_PROVIDER: 'gemini' }, fake, gemini)).toBe(gemini);
  });
});
