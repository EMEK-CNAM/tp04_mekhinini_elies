import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface AuthResponse {
    token: string;
    user: {
        id: string | number;
        nom: string;
        prenom: string;
        email: string;
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    nom: string;
    prenom: string;
    email: string;
    password: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'https://templateweb-latest-nzzn.onrender.com/api';

    constructor(private http: HttpClient) { }

    /**
     * Authentifie un utilisateur
     */
    login(credentials: LoginCredentials): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
            tap(response => {
                this.storeAuthData(response);
            }),
            catchError(error => {
                console.error('Login error:', error);
                throw error;
            })
        );
    }

    /**
     * Inscrit un nouvel utilisateur
     */
    register(data: RegisterData): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
            tap(response => {
                this.storeAuthData(response);
            }),
            catchError(error => {
                console.error('Register error:', error);
                throw error;
            })
        );
    }

    /**
     * Déconnecte l'utilisateur
     */
    logout(): void {
        localStorage.removeItem('app:token');
        localStorage.removeItem('app:user');
        localStorage.removeItem('app:isLoggedIn');
        localStorage.removeItem('app:username');
    }

    /**
     * Vérifie si l'utilisateur est authentifié
     */
    isAuthenticated(): boolean {
        const token = this.getToken();
        return !!token && !this.isTokenExpired(token);
    }

    /**
     * Récupère le token JWT
     */
    getToken(): string | null {
        return localStorage.getItem('app:token');
    }

    /**
     * Récupère les informations de l'utilisateur connecté
     */
    getCurrentUser(): any | null {
        const userStr = localStorage.getItem('app:user');
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Stocke les données d'authentification
     */
    private storeAuthData(response: AuthResponse): void {
        localStorage.setItem('app:token', response.token);
        localStorage.setItem('app:user', JSON.stringify(response.user));
        localStorage.setItem('app:isLoggedIn', 'true');
        localStorage.setItem('app:username', response.user.nom);
    }

    /**
     * Vérifie si le token JWT est expiré
     */
    private isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp;
            return expiry ? (Math.floor(new Date().getTime() / 1000)) >= expiry : false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Crée les headers avec le token JWT
     */
    getAuthHeaders(): HttpHeaders {
        const token = this.getToken();
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        });
    }
}
