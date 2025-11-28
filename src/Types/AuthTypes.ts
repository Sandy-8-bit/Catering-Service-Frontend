export interface LoginRequest {
 identifier: string;
 password: string;
}

export interface RegisterRequest {
 name: string;
 email: string;
 password: string;
 phone?: string;
 roles?: string[];
}

export interface Verify {

    identifier: string;
    code: number;
}

export interface AuthResponse {
    status: 'SUCCESS' | 'TOTP_REQUIRED' | 'FAILED';
    roles: string[];
    userId: number;
    message?: string;
    token?: string;
}

export interface VerifyResponse {
  token: string;
}
