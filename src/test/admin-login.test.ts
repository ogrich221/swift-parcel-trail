import {describe,expect,it} from 'vitest';
import {adminCredentials} from '@/lib/admin/login';

describe('passcode-only master sign-in',()=>{
  it('uses only the authorised master account as its implicit identity',()=>{
    expect(adminCredentials('test-only-passcode').email).toBe('ogrichindeed@gmail.com');
  });
  it('passes the entered credential unchanged for Cloud verification',()=>{
    expect(adminCredentials(' test-only-passcode ').password).toBe(' test-only-passcode ');
    expect(adminCredentials('').password).toBe('');
  });
});