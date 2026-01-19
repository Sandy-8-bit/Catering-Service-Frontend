export interface LoginRequest {
 identifier: string;
 password: string;
}

export interface RegisterRequest {
 name: string;
 email: string;
 password: string;
 phone?: string;
 role?: string;
}

export interface Verify {

    identifier: string;
    code: number;
}

export interface AuthResponse {
    status: 'SUCCESS' | 'TOTP_REQUIRED' | 'FAILED';
    role: string;
    Id: number;
    message?: string;
    token?: string;
}

export interface VerifyResponse {
    role: string;
    Id: number;
    message?: string;
    token: string;
}
