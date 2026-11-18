/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email: string;
      name: string | null;
      role: string;
    };
    session?: {
      id: string;
      token: string;
      expiresAt: Date;
    };
  }
}
