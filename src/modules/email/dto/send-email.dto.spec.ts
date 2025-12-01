import { validate } from 'class-validator';
import { SendEmailDto } from './send-email.dto';

describe('SendEmailDto', () => {
  it('should fail if required fields are missing', async () => {
    const dto = new SendEmailDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if email is invalid', async () => {
    const dto = new SendEmailDto();
    dto.to = 'invalid-email';
    dto.subject = 'Test';
    dto.body = 'Test Body';
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'to');
    expect(emailError).toBeDefined();
  });

  it('should pass with valid data', async () => {
    const dto = new SendEmailDto();
    dto.to = 'test@cin.ufpe.br';
    dto.subject = 'Test';
    dto.body = 'Test Body';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
  
  it('should validate from field if provided', async () => {
      const dto = new SendEmailDto();
      dto.to = 'test@cin.ufpe.br';
      dto.from = 'invalid-email';
      dto.subject = 'Test';
      dto.body = 'Test Body';
      const errors = await validate(dto);
      const fromError = errors.find((e) => e.property === 'from');
      expect(fromError).toBeDefined();
  });

  it('should validate from field domain', async () => {
      const dto = new SendEmailDto();
      dto.to = 'test@cin.ufpe.br';
      dto.from = 'external@gmail.com'; // Should fail if we enforce @cin.ufpe.br
      dto.subject = 'Test';
      dto.body = 'Test Body';
      
      // Note: The regex requirement was mentioned in the plan.
      // We expect this to fail if we implement the regex.
      const errors = await validate(dto);
      // If we haven't implemented the regex yet, this test might fail (or pass incorrectly).
      // But we are writing the test first.
      // Let's assume we want to enforce it.
      const fromError = errors.find((e) => e.property === 'from');
      expect(fromError).toBeDefined();
  });
});
